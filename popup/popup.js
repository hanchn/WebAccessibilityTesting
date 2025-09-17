class PopupController {
    constructor() {
        this.annotationEnabled = true;
        this.isScanning = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
        this.updateUI();
    }

    bindEvents() {
        // 检测按钮
        const scanBtn = document.getElementById('accessibilityScanBtn');
        if (scanBtn) {
            scanBtn.addEventListener('click', () => this.startScan());
        }

        // 标注开关
        const annotationToggle = document.getElementById('annotationToggle');
        if (annotationToggle) {
            annotationToggle.addEventListener('change', (e) => {
                this.toggleAnnotation(e.target.checked);
            });
        }

        // 清除标注按钮（如果存在）
        const clearBtn = document.getElementById('clearAnnotationsBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearAnnotations());
        }
    }

    async startScan() {
        if (this.isScanning) return;
        
        try {
            this.isScanning = true;
            this.showLoading(true);
            this.clearResults();
            
            console.log('发送检测消息...');
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            const response = await chrome.tabs.sendMessage(tab.id, { action: 'startScan' });
            
            if (response && response.success) {
                this.displayResults(response.data);
                console.log('检测完成:', response.data);
            } else {
                throw new Error(response?.error || '检测失败');
            }
            
        } catch (error) {
            console.error('检测失败:', error);
            this.showError('检测失败：' + (error.message || '请刷新页面后重试'));
        } finally {
            this.isScanning = false;
            this.showLoading(false);
        }
    }

    async toggleAnnotation(enabled) {
        try {
            this.annotationEnabled = enabled;
            await chrome.storage.local.set({ annotationEnabled: enabled });
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { 
                action: 'toggleAnnotation', 
                enabled: enabled 
            });
            
            console.log('标注状态已更新:', enabled);
        } catch (error) {
            console.error('切换标注失败:', error);
            // 恢复开关状态
            const toggle = document.getElementById('annotationToggle');
            if (toggle) {
                toggle.checked = !enabled;
            }
        }
    }

    async clearAnnotations() {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            await chrome.tabs.sendMessage(tab.id, { action: 'clearAnnotations' });
            console.log('标注已清除');
        } catch (error) {
            console.error('清除标注失败:', error);
        }
    }

    displayResults(results) {
        const resultsContainer = document.getElementById('results');
        const statsContainer = document.getElementById('stats');
        
        // 显示统计信息
        if (statsContainer) {
            const errorCount = results.issues.filter(issue => issue.severity === 'error').length;
            const warningCount = results.issues.filter(issue => issue.severity === 'warning').length;
            
            statsContainer.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-number">${results.total}</span>
                        <span class="stat-label">问题总数</span>
                    </div>
                    <div class="stat-item error">
                        <span class="stat-number">${errorCount}</span>
                        <span class="stat-label">错误</span>
                    </div>
                    <div class="stat-item warning">
                        <span class="stat-number">${warningCount}</span>
                        <span class="stat-label">警告</span>
                    </div>
                </div>
            `;
        }

        // 显示问题列表
        if (resultsContainer) {
            if (results.issues.length === 0) {
                resultsContainer.innerHTML = `
                    <div class="no-issues">
                        <div class="no-issues-icon">✅</div>
                        <div class="no-issues-text">未发现无障碍问题</div>
                        <div class="no-issues-subtitle">页面符合基本无障碍标准</div>
                    </div>
                `;
            } else {
                const groupedIssues = this.groupIssuesByCategory(results.issues);
                resultsContainer.innerHTML = this.renderGroupedIssues(groupedIssues);
            }
        }
    }

    groupIssuesByCategory(issues) {
        const groups = {};
        issues.forEach(issue => {
            const category = issue.category || 'other';
            if (!groups[category]) {
                groups[category] = [];
            }
            groups[category].push(issue);
        });
        return groups;
    }

    renderGroupedIssues(groupedIssues) {
        const categoryNames = {
            'images': '图片问题',
            'forms': '表单问题', 
            'structure': '结构问题',
            'color': '颜色对比度',
            'keyboard': '键盘导航',
            'other': '其他问题'
        };

        let html = '';
        Object.entries(groupedIssues).forEach(([category, issues]) => {
            html += `
                <div class="issue-category">
                    <div class="category-header">
                        <span class="category-name">${categoryNames[category] || category}</span>
                        <span class="category-count">${issues.length}</span>
                    </div>
                    <div class="category-issues">
            `;
            
            issues.forEach((issue, index) => {
                html += `
                    <div class="result-item severity-${issue.severity}">
                        <div class="result-indicator"></div>
                        <div class="result-content">
                            <div class="result-message">${issue.message}</div>
                            <div class="result-suggestion">${issue.suggestion}</div>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        });
        
        return html;
    }

    showLoading(show) {
        const scanBtn = document.getElementById('accessibilityScanBtn');
        const loadingIndicator = document.querySelector('.loading-indicator');
        
        if (scanBtn) {
            scanBtn.disabled = show;
            if (show) {
                scanBtn.innerHTML = `
                    <div class="loading-spinner"></div>
                    检测中...
                `;
            } else {
                scanBtn.innerHTML = `
                    <svg class="scan-icon" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    开始无障碍检测
                `;
            }
        }
    }

    showError(message) {
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div class="error-message">
                    <div class="error-icon">⚠️</div>
                    <div class="error-text">${message}</div>
                </div>
            `;
        }
    }

    clearResults() {
        const resultsContainer = document.getElementById('results');
        const statsContainer = document.getElementById('stats');
        
        if (resultsContainer) {
            resultsContainer.innerHTML = '';
        }
        if (statsContainer) {
            statsContainer.innerHTML = '';
        }
    }

    updateUI() {
        const toggle = document.getElementById('annotationToggle');
        if (toggle) {
            toggle.checked = this.annotationEnabled;
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['annotationEnabled']);
            this.annotationEnabled = result.annotationEnabled !== false;
            this.updateUI();
            console.log('Popup设置已加载:', { annotationEnabled: this.annotationEnabled });
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});