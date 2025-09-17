class OptionsController {
    constructor() {
        this.defaultSettings = {
            annotationEnabled: true,
            autoScan: false
        };
        this.init();
    }

    async init() {
        await this.loadSettings();
        this.bindEvents();
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
            
            document.getElementById('annotationEnabled').checked = settings.annotationEnabled;
            document.getElementById('autoScan').checked = settings.autoScan;
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async saveSettings() {
        try {
            const settings = {
                annotationEnabled: document.getElementById('annotationEnabled').checked,
                autoScan: document.getElementById('autoScan').checked
            };
            
            await chrome.storage.sync.set({ settings });
            
            // 显示保存成功提示
            const saveBtn = document.getElementById('saveBtn');
            const originalText = saveBtn.textContent;
            saveBtn.textContent = '已保存';
            saveBtn.disabled = true;
            
            setTimeout(() => {
                saveBtn.textContent = originalText;
                saveBtn.disabled = false;
            }, 2000);
            
        } catch (error) {
            console.error('保存设置失败:', error);
            alert('保存设置失败，请重试');
        }
    }

    async resetSettings() {
        if (confirm('确定要重置为默认设置吗？')) {
            try {
                await chrome.storage.sync.set({ settings: this.defaultSettings });
                await this.loadSettings();
                alert('设置已重置为默认值');
            } catch (error) {
                console.error('重置设置失败:', error);
                alert('重置设置失败，请重试');
            }
        }
    }
}

new OptionsController();