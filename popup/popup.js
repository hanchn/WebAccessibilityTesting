class PopupController {
    constructor() {
        this.annotationEnabled = true;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
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
    }

    async startScan() {
        try {
            this.showLoading(true);
            
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            const results = await chrome.tabs.sendMessage(tab.id, { action: 'startScan' });
            
            this.displayResults(results);
            this.showLoading(false);
        } catch (error) {
            console.error('Scan failed:', error);
            this.showError('检测失败，请刷新页面后重试');
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
        } catch (error) {
            console.error('Toggle annotation failed:', error);
        }
    }

    displayResults(results) {
        const resultsContainer = document.getElementById('results');
        const statsContainer = document.getElementById('stats');
        
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="stat-item">
                    <span class="stat-number">${results.total}</span>
                    <span class="stat-label">问题总数</span>
                </div>
            `;
        }

        if (resultsContainer) {
            if (results.issues.length === 0) {
                resultsContainer.innerHTML = '<div class="no-issues">未发现无障碍问题</div>';
            } else {
                resultsContainer.innerHTML = results.issues.map((issue, index) => `
                    <div class="result-item severity-${issue.severity}">
                        <div class="result-number">${index + 1}</div>
                        <div class="result-content">
                            <div class="result-message">${issue.message}</div>
                            <div class="result-suggestion">${issue.suggestion}</div>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    showLoading(show) {
        const scanBtn = document.getElementById('accessibilityScanBtn');
        if (scanBtn) {
            scanBtn.disabled = show;
            scanBtn.textContent = show ? '检测中...' : '开始无障碍检测';
        }
    }

    showError(message) {
        const resultsContainer = document.getElementById('results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `<div class="error">${message}</div>`;
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['annotationEnabled']);
            this.annotationEnabled = result.annotationEnabled !== false;
            
            const toggle = document.getElementById('annotationToggle');
            if (toggle) {
                toggle.checked = this.annotationEnabled;
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        }
    }
}

new PopupController();