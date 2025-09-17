class PopupController {
    constructor() {
        this.accessibilityResults = null;
        this.annotationEnabled = true;
        this.init();
    }

    init() {
        this.bindEvents();
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
    
        // 过滤按钮
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.filterResults(e.target.dataset.filter);
            });
        });
    
        // 其他按钮事件
        document.getElementById('exportBtn')?.addEventListener('click', () => this.exportReport());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearAnnotations());
        document.getElementById('refreshBtn')?.addEventListener('click', () => this.refreshAll());
        document.getElementById('settingsBtn')?.addEventListener('click', () => {
            chrome.runtime.openOptionsPage();
        });
    }

    async startAccessibilityScan() {
        this.showLoading(true);
        
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const response = await chrome.tabs.sendMessage(tab.id, {
                action: 'startAccessibilityScan'
            });
            
            if (response && response.issues) {
                this.accessibilityResults = response;
                this.displayAccessibilityResults(response);
                this.updateStats(response);
            } else {
                this.showError('检测失败，请刷新页面后重试');
            }
        } catch (error) {
            console.error('无障碍扫描失败:', error);
            this.showError('检测失败，请确保页面已完全加载');
        } finally {
            this.showLoading(false);
        }
    }

    async toggleAnnotation(enabled) {
        this.annotationEnabled = enabled;
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, {
                action: 'toggleAnnotation',
                enabled: enabled
            });
            
            await this.saveAnnotationSetting(enabled);
        } catch (error) {
            console.error('切换标注失败:', error);
        }
    }

    filterResults(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
        
        const items = document.querySelectorAll('.result-item');
        items.forEach(item => {
            if (filter === 'all' || item.classList.contains(filter)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    displayAccessibilityResults(results) {
        const container = document.getElementById('accessibility-results');
        if (!container) return;
    
        container.innerHTML = '';
    
        if (!results.issues || results.issues.length === 0) {
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
            <div class="result-header">
                <h4 class="result-title">${issue.title}</h4>
                <span class="severity-badge ${issue.severity}">${this.getSeverityText(issue.severity)}</span>
            </div>
            <p class="result-description">${issue.description}</p>
            ${issue.suggestion ? `<div class="result-suggestion">💡 ${issue.suggestion}</div>` : ''}
            ${issue.element ? `<div class="result-element">📍 ${issue.selector || issue.element.tagName}</div>` : ''}
        `;
    
        return item;
    }

    getSeverityText(severity) {
        const map = {
            'error': '错误',
            'warning': '警告',
            'info': '信息'
        };
        return map[severity] || severity;
    }

    updateStats(results) {
        const errorCount = results.issues.filter(issue => issue.severity === 'error').length;
        const warningCount = results.issues.filter(issue => issue.severity === 'warning').length;
        const totalCount = results.issues.length;

        document.getElementById('errorCount').textContent = errorCount;
        document.getElementById('warningCount').textContent = warningCount;
        document.getElementById('totalCount').textContent = totalCount;

        // 显示统计区域
        document.getElementById('statsSection').style.display = 'block';
        document.getElementById('filterSection').style.display = 'block';
    }

    showLoading(show) {
        const btn = document.getElementById('accessibilityScanBtn');
        if (show) {
            btn.disabled = true;
            btn.innerHTML = '<div class="loading-spinner"></div> 检测中...';
        } else {
            btn.disabled = false;
            btn.innerHTML = `
                <svg class="scan-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                开始无障碍检测
            `;
        }
    }

    showError(message) {
        const container = document.getElementById('accessibility-results');
        if (container) {
            container.innerHTML = `<div class="error-message">❌ ${message}</div>`;
        }
    }

    exportReport() {
        if (!this.accessibilityResults) {
            alert('请先进行检测');
            return;
        }

        const report = {
            url: window.location.href,
            timestamp: new Date().toISOString(),
            summary: this.accessibilityResults.summary,
            issues: this.accessibilityResults.issues
        };

        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `accessibility-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
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
            if (result.settings) {
                if (typeof result.settings.annotationEnabled !== 'undefined') {
                    this.annotationEnabled = result.settings.annotationEnabled;
                    document.getElementById('annotationToggle').checked = this.annotationEnabled;
                }
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async saveAnnotationSetting(enabled) {
        try {
            const result = await chrome.storage.sync.get('settings');
            const settings = result.settings || {};
            settings.annotationEnabled = enabled;
            await chrome.storage.sync.set({ settings });
        } catch (error) {
            console.error('保存标注设置失败:', error);
        }
    }

    refreshAll() {
        this.accessibilityResults = null;
        const container = document.getElementById('accessibility-results');
        if (container) {
            container.innerHTML = '<div class="no-results">点击上方按钮开始检测</div>';
        }
        
        // 隐藏统计区域
        document.getElementById('statsSection').style.display = 'none';
        document.getElementById('filterSection').style.display = 'none';
        
        this.clearAnnotations();
    }
}

new PopupController();