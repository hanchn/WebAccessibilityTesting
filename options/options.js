class OptionsController {
    constructor() {
        this.defaultSettings = {
            displayMode: 'popup',
            autoScan: false,
            enableSEO: true,
            enableAccessibility: true,
            severityLevel: 'medium',
            includeScreenshots: false,
            reportFormat: 'html'
        };
        
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadSettings();
    }

    bindEvents() {
        document.getElementById('saveBtn').addEventListener('click', () => {
            this.saveSettings();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSettings();
        });
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('settings');
            const settings = result.settings || this.defaultSettings;
            
            // 更新UI
            document.getElementById('displayMode').value = settings.displayMode;
            document.getElementById('autoScan').checked = settings.autoScan;
            document.getElementById('enableSEO').checked = settings.enableSEO;
            document.getElementById('enableAccessibility').checked = settings.enableAccessibility;
            document.getElementById('severityLevel').value = settings.severityLevel;
            document.getElementById('includeScreenshots').checked = settings.includeScreenshots;
            document.getElementById('reportFormat').value = settings.reportFormat;
        } catch (error) {
            console.error('加载设置失败:', error);
            this.showStatus('加载设置失败', 'error');
        }
    }

    async saveSettings() {
        try {
            const settings = {
                displayMode: document.getElementById('displayMode').value,
                autoScan: document.getElementById('autoScan').checked,
                enableSEO: document.getElementById('enableSEO').checked,
                enableAccessibility: document.getElementById('enableAccessibility').checked,
                severityLevel: document.getElementById('severityLevel').value,
                includeScreenshots: document.getElementById('includeScreenshots').checked,
                reportFormat: document.getElementById('reportFormat').value
            };

            await chrome.storage.sync.set({ settings });
            this.showStatus('设置已保存', 'success');
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showStatus('保存设置失败', 'error');
        }
    }

    async resetSettings() {
        try {
            await chrome.storage.sync.set({ settings: this.defaultSettings });
            await this.loadSettings();
            this.showStatus('已重置为默认设置', 'success');
        } catch (error) {
            console.error('重置设置失败:', error);
            this.showStatus('重置设置失败', 'error');
        }
    }

    showStatus(message, type) {
        const statusEl = document.getElementById('status');
        statusEl.textContent = message;
        statusEl.className = `status-message ${type}`;
        
        setTimeout(() => {
            statusEl.textContent = '';
            statusEl.className = 'status-message';
        }, 3000);
    }
}

new OptionsController();