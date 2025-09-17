// 内容脚本 - 与网页交互的主要脚本
class ContentScript {
    constructor() {
        this.detector = new WebDetector();
        this.displayManager = new DisplayManager();
        this.settings = {
            annotationEnabled: true
        };
        this.init();
    }

    async init() {
        // 加载用户设置
        await this.loadSettings();
        
        // 监听来自popup的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        // 页面加载完成后的处理
        if (document.readyState === 'complete') {
            this.onPageReady();
        } else {
            window.addEventListener('load', () => this.onPageReady());
        }

        // 监听设置变化
        chrome.storage.onChanged.addListener((changes, namespace) => {
            if (namespace === 'sync' && changes.settings) {
                this.onSettingsChanged(changes.settings.newValue);
            }
        });
    }

    async handleMessage(request, sender, sendResponse) {
        try {
            switch (request.action) {
                case 'startAccessibilityScan':
                    const accessibilityResults = await this.detector.runAccessibilityCheck();
                    this.displayManager.displayResults(accessibilityResults);
                    sendResponse(accessibilityResults);
                    break;
                    
                case 'toggleAnnotation':
                    this.settings.annotationEnabled = request.enabled;
                    this.displayManager.visualAnnotator.setEnabled(request.enabled);
                    await this.saveSettings();
                    sendResponse({ success: true });
                    break;
                    
                case 'clearAnnotations':
                    this.displayManager.clear();
                    sendResponse({ success: true });
                    break;
                    
                case 'getPageInfo':
                    sendResponse({
                        url: window.location.href,
                        title: document.title,
                        readyState: document.readyState
                    });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown action: ' + request.action });
            }
        } catch (error) {
            console.error('处理消息失败:', error);
            sendResponse({ error: error.message });
        }
    }

    async onPageReady() {
        console.log('页面加载完成，无障碍检测器已就绪');
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.sync.get('settings');
            if (result.settings) {
                this.settings = { ...this.settings, ...result.settings };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
    }

    async saveSettings() {
        try {
            await chrome.storage.sync.set({ settings: this.settings });
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }

    onSettingsChanged(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        this.displayManager.visualAnnotator.setEnabled(this.settings.annotationEnabled);
    }
}

new ContentScript();