// 内容脚本 - 与网页交互的主要脚本
class ContentScript {
    constructor() {
        this.detector = new WebDetector();
        this.displayManager = new DisplayManager();
        this.settings = {
            displayMode: 'popup' // 'console', 'visual', 'popup'
        };
        this.init();
    }

    async init() {
        // 加载用户设置
        await this.loadSettings();
        
        // 设置显示模式
        this.displayManager.setMode(this.settings.displayMode);
        
        // 监听来自popup的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true; // 保持消息通道开放
        });

        // 页面加载完成后自动进行基础检测
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
                    await this.storeResults('accessibilityResults', accessibilityResults);
                    this.displayManager.displayResults(accessibilityResults);
                    sendResponse(accessibilityResults);
                    break;
                    
                case 'setDisplayMode':
                    this.settings.displayMode = request.mode;
                    this.displayManager.setMode(request.mode);
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
                        readyState: document.readyState,
                        displayMode: this.settings.displayMode
                    });
                    break;
                    
                default:
                    sendResponse({ error: '未知的操作类型' });
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
            sendResponse({ error: error.message });
        }
    }

    async onPageReady() {
        // 如果启用了自动扫描，进行无障碍检测
        if (this.settings.autoScan) {
            await this.runAutoScan();
        }
    }

    async runAutoScan() {
        try {
            const results = await this.detector.runAccessibilityCheck();
            await this.storeResults('accessibilityResults', results);
            
            // 如果有问题，显示结果
            if (results.issues.length > 0) {
                this.displayManager.displayResults(results);
            }
        } catch (error) {
            console.error('自动扫描失败:', error);
        }
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
        this.displayManager.setMode(this.settings.displayMode);
    }

    async storeResults(key, results) {
        try {
            await chrome.storage.local.set({ [key]: results });
        } catch (error) {
            console.error('存储结果失败:', error);
        }
    }
}

// 初始化内容脚本
new ContentScript();