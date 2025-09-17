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
        // 检测按钮
        document.getElementById('accessibilityScanBtn').addEventListener('click', () => {
            this.startAccessibilityScan();
        });

        // 显示模式选择
        document.getElementById('displayModeSelect').addEventListener('change', (e) => {
            this.setDisplayMode(e.target.value);
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

        document.getElementById('clearBtn').addEventListener('click', () => {
            this.clearAnnotations();
        });
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
            
        } catch (error) {
            console.error('无障碍扫描失败:', error);
            this.showError('无障碍检测失败，请刷新页面后重试');
        } finally {
            this.showLoading(false);
        }
    }

    displayAccessibilityResults(results) {
        const container = document.getElementById('accessibility-results');
        container.innerHTML = '';

        if (results.issues.length === 0) {
            container.innerHTML = '<div class="no-issues">✅ 未发现无障碍问题</div>';
            return;
        }

        results.issues.forEach(issue => {
            const item = this.createResultItem(issue);
            container.appendChild(item);
        });
    }

    createResultItem(issue) {
        const item = document.createElement('div');
        item.className = `result-item ${issue.severity}`;
        
        item.innerHTML = `
            <div class="issue-title">${issue.title}</div>
            <div class="issue-description">${issue.description}</div>
            <div class="issue-category">${issue.category}</div>
        `;
        
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