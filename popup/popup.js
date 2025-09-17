class PopupController {
    constructor() {
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
        // 扫描按钮
        document.getElementById('accessibilityScanBtn').addEventListener('click', () => {
            this.startAccessibilityScan();
        });
    
        // 标注开关
        document.getElementById('annotationToggle').addEventListener('change', (e) => {
            this.toggleAnnotation(e.target.checked);
        });
    
        // 显示模式选择
        document.getElementById('displayModeSelect').addEventListener('change', (e) => {
            this.setDisplayMode(e.target.value);
        });
    
        // 过滤按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterResults(e.target.dataset.filter);
            });
        });
    
        // 定位问题按钮
        document.getElementById('locateBtn').addEventListener('click', () => {
            this.locateIssues();
        });
    
        // 其他按钮事件
        document.getElementById('exportBtn').addEventListener('click', () => this.exportReport());
        document.getElementById('clearBtn').addEventListener('click', () => this.clearAnnotations());
        document.getElementById('refreshBtn').addEventListener('click', () => this.refreshAll());
        document.getElementById('settingsBtn').addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    async toggleAnnotation(enabled) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'toggleAnnotation',
                enabled: enabled
            });
        } catch (error) {
            console.error('切换标注失败:', error);
        }
    }

    filterResults(filter) {
        // 更新过滤按钮状态
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        // 过滤结果显示
        const items = document.querySelectorAll('.result-item');
        items.forEach(item => {
            if (filter === 'all' || item.classList.contains(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    async locateIssues() {
        if (!this.accessibilityResults || this.accessibilityResults.issues.length === 0) {
            alert('请先进行检测');
            return;
        }
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'setDisplayMode',
                mode: 'visual'
            });
            
            // 切换到页面标注模式
            document.getElementById('displayModeSelect').value = 'visual';
            document.getElementById('annotationToggle').checked = true;
            
            alert('已切换到页面标注模式，请查看页面上的红色标注');
        } catch (error) {
            console.error('定位问题失败:', error);
        }
    }

    displayAccessibilityResults(results) {
        const container = document.getElementById('accessibility-results');
        const countElement = document.getElementById('resultsCount');
    
        container.innerHTML = '';
    
        if (results.issues.length === 0) {
            container.innerHTML = '<div class="no-issues">✅ 未发现无障碍问题</div>';
            countElement.textContent = '未发现问题';
            return;
        }
    
        // 更新计数显示
        const errorCount = results.issues.filter(issue => issue.severity === 'error').length;
        const warningCount = results.issues.filter(issue => issue.severity === 'warning').length;
        countElement.innerHTML = `共发现 <span class="count-total">${results.issues.length}</span> 个问题 
            (<span class="count-error">${errorCount}</span> 错误, <span class="count-warning">${warningCount}</span> 警告)`;
    
        results.issues.forEach(issue => {
            const item = this.createEnhancedResultItem(issue);
            container.appendChild(item);
        });
    }

    createEnhancedResultItem(issue) {
        const item = document.createElement('div');
        item.className = `result-item ${issue.severity}`;
    
        item.innerHTML = `
            <div class="issue-header">
                <span class="severity-badge ${issue.severity}">${issue.severity.toUpperCase()}</span>
                <div class="issue-title">${issue.title}</div>
            </div>
            <div class="issue-description">${issue.description}</div>
            <div class="issue-meta">
                <span class="issue-category">${issue.category}</span>
                ${issue.element ? '<span class="has-element">🎯 可定位</span>' : ''}
            </div>
            ${issue.suggestion ? `<div class="issue-suggestion">💡 ${issue.suggestion}</div>` : ''}
            <div class="issue-actions">
                <button class="locate-btn" ${!issue.element ? 'disabled' : ''}>定位元素</button>
            </div>
        `;
    
        // 绑定定位按钮事件
        const locateBtn = item.querySelector('.locate-btn');
        if (issue.element && locateBtn) {
            locateBtn.addEventListener('click', async () => {
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    await chrome.tabs.sendMessage(tab.id, {
                        action: 'locateElement',
                        issueId: issue.id
                    });
                } catch (error) {
                    console.error('定位元素失败:', error);
                }
            });
        }
        
        return item;
    }

    showLoading(show) {
        document.getElementById('loading').classList.toggle('hidden', !show);
    }

    showError(message) {
        // 简单的错误显示
        alert(message);
    }

    async loadStoredResults() {
        try {
            const result = await chrome.storage.local.get(['accessibilityResults']);
            if (result.accessibilityResults) {
                this.accessibilityResults = result.accessibilityResults;
                this.displayAccessibilityResults(result.accessibilityResults);
            }
        } catch (error) {
            console.error('加载存储结果失败:', error);
        }
    }

    exportReport() {
        if (!this.accessibilityResults) {
            alert('请先进行检测');
            return;
        }

        const report = {
            title: '无障碍检测报告',
            url: this.accessibilityResults.url,
            timestamp: this.accessibilityResults.timestamp,
            summary: this.accessibilityResults.summary,
            issues: this.accessibilityResults.issues
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    async setDisplayMode(mode) {
        this.displayMode = mode;
        document.getElementById('displayModeSelect').value = mode;
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'setDisplayMode',
                mode: mode
            });
            
            await this.saveDisplayMode(mode);
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

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('settings');
            if (result.settings && result.settings.displayMode) {
                this.displayMode = result.settings.displayMode;
                document.getElementById('displayModeSelect').value = this.displayMode;
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
        this.accessibilityResults = null;
        document.getElementById('accessibility-results').innerHTML = '<div class="no-results">点击上方按钮开始检测</div>';
        this.clearAnnotations();
    }
}

new PopupController();