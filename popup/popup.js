class PopupController {
    constructor() {
        this.currentTab = 'seo';
        this.seoResults = null;
        this.accessibilityResults = null;
        this.displayMode = 'popup';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadStoredResults();
        this.loadSettings();
    }

    bindEvents() {
        // 标签页切换
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // 检测按钮
        document.getElementById('seoScanBtn').addEventListener('click', () => {
            this.startSEOScan();
        });

        document.getElementById('accessibilityScanBtn').addEventListener('click', () => {
            this.startAccessibilityScan();
        });

        // 其他按钮
        document.getElementById('settingsBtn').addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });

        document.getElementById('exportBtn').addEventListener('click', () => {
            this.exportReport();
        });

        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.refreshAll();
        });
    }

    switchTab(tabName) {
        // 更新标签按钮状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });

        // 更新面板显示
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `${tabName}-panel`);
        });

        this.currentTab = tabName;
    }

    async startSEOScan() {
        this.showLoading(true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const results = await chrome.tabs.sendMessage(tab.id, {
                action: 'startSEOScan'
            });
            
            this.seoResults = results;
            this.displaySEOResults(results);
            this.updateSummary();
            
        } catch (error) {
            console.error('SEO扫描失败:', error);
            this.showError('SEO检测失败，请刷新页面后重试');
        } finally {
            this.showLoading(false);
        }
    }

    async startAccessibilityScan() {
        this.showLoading(true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const results = await chrome.tabs.sendMessage(tab.id, {
                action: 'startAccessibilityScan'
            });
            
            this.accessibilityResults = results;
            this.displayAccessibilityResults(results);
            this.updateSummary();
            
        } catch (error) {
            console.error('无障碍扫描失败:', error);
            this.showError('无障碍检测失败，请刷新页面后重试');
        } finally {
            this.showLoading(false);
        }
    }

    displaySEOResults(results) {
        const container = document.getElementById('seo-results');
        container.innerHTML = '';

        results.issues.forEach(issue => {
            const item = this.createResultItem(issue);
            container.appendChild(item);
        });

        if (results.issues.length === 0) {
            container.innerHTML = '<div class="no-issues">🎉 未发现SEO问题！</div>';
        }
    }

    displayAccessibilityResults(results) {
        const container = document.getElementById('accessibility-results');
        container.innerHTML = '';

        results.issues.forEach(issue => {
            const item = this.createResultItem(issue);
            container.appendChild(item);
        });

        if (results.issues.length === 0) {
            container.innerHTML = '<div class="no-issues">🎉 未发现无障碍问题！</div>';
        }
    }

    createResultItem(issue) {
        const item = document.createElement('div');
        item.className = `result-item ${issue.severity}`;
        
        item.innerHTML = `
            <div class="result-title">${issue.title}</div>
            <div class="result-description">${issue.description}</div>
            ${issue.suggestion ? `<div class="result-suggestion">💡 ${issue.suggestion}</div>` : ''}
        `;
        
        return item;
    }

    updateSummary() {
        if (this.seoResults) {
            document.getElementById('seo-score').textContent = this.seoResults.score;
        }
        
        if (this.accessibilityResults) {
            document.getElementById('accessibility-score').textContent = this.accessibilityResults.score;
        }
        
        if (this.seoResults && this.accessibilityResults) {
            const overallScore = Math.round((this.seoResults.score + this.accessibilityResults.score) / 2);
            const grade = this.getGrade(overallScore);
            document.getElementById('overall-grade').textContent = grade;
        }
    }

    getGrade(score) {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        if (score >= 60) return 'D';
        return 'F';
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        loading.classList.toggle('hidden', !show);
    }

    showError(message) {
        // 实现错误显示逻辑
        console.error(message);
    }

    async loadStoredResults() {
        // 从存储中加载之前的检测结果
        try {
            const stored = await chrome.storage.local.get(['seoResults', 'accessibilityResults']);
            if (stored.seoResults) {
                this.seoResults = stored.seoResults;
                this.displaySEOResults(stored.seoResults);
            }
            if (stored.accessibilityResults) {
                this.accessibilityResults = stored.accessibilityResults;
                this.displayAccessibilityResults(stored.accessibilityResults);
            }
            this.updateSummary();
        } catch (error) {
            console.error('加载存储结果失败:', error);
        }
    }

    exportReport() {
        // 导出检测报告
        const report = {
            timestamp: new Date().toISOString(),
            url: window.location.href,
            seo: this.seoResults,
            accessibility: this.accessibilityResults
        };
        
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessibility-report-${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    async setDisplayMode(mode) {
        this.displayMode = mode;
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'setDisplayMode',
                mode: mode
            });
            
            // 保存设置
            await this.saveDisplayMode(mode);
            
            // 更新UI
            this.updateDisplayModeUI(mode);
            
        } catch (error) {
            console.error('设置显示模式失败:', error);
        }
    }

    async clearAnnotations() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'clearAnnotations'
            });
        } catch (error) {
            console.error('清除标注失败:', error);
        }
    }

    updateDisplayModeUI(mode) {
        const select = document.getElementById('displayModeSelect');
        select.value = mode;
        
        const clearBtn = document.getElementById('clearAnnotationsBtn');
        clearBtn.style.display = mode === 'visual' ? 'block' : 'none';
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('settings');
            if (result.settings && result.settings.displayMode) {
                this.displayMode = result.settings.displayMode;
                this.updateDisplayModeUI(this.displayMode);
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async saveDisplayMode(mode) {
        try {
            const result = await chrome.storage.sync.get('settings');
            const settings = result.settings || {};
            settings.displayMode = mode;
            await chrome.storage.sync.set({ settings });
        } catch (error) {
            console.error('保存显示模式失败:', error);
        }
    }

    refreshAll() {
        this.seoResults = null;
        this.accessibilityResults = null;
        document.getElementById('seo-results').innerHTML = '';
        document.getElementById('accessibility-results').innerHTML = '';
        document.getElementById('seo-score').textContent = '--';
        document.getElementById('accessibility-score').textContent = '--';
        document.getElementById('overall-grade').textContent = '--';
    }
}

// 初始化弹窗控制器
new PopupController();