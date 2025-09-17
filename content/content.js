class ContentScript {
    constructor() {
        this.detector = new AccessibilityDetector();
        this.annotator = new PageAnnotator();
        this.lastResults = null;
        this.init();
    }

    init() {
        console.log('Web Accessibility Tester - Content Script 已加载');
        
        // 监听来自popup的消息
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // 保持消息通道开放
        });
        
        // 加载设置
        this.loadSettings();
        
        // 全局引用，供标注器使用
        window.pageAnnotator = this.annotator;
    }

    async handleMessage(message, sender, sendResponse) {
        try {
            console.log('收到消息:', message);
            
            switch (message.action) {
                case 'startScan':
                    console.log('开始执行无障碍检测...');
                    const results = await this.detector.runCheck();
                    this.lastResults = results;
                    
                    // 如果标注功能开启，显示标注
                    if (this.annotator.enabled) {
                        this.annotator.showAnnotations(results.issues);
                    }
                    
                    console.log('检测完成，返回结果:', results);
                    sendResponse({
                        success: true,
                        data: results
                    });
                    break;
                    
                case 'toggleAnnotation':
                    console.log('切换标注状态:', message.enabled);
                    this.annotator.setEnabled(message.enabled);
                    await this.saveSettings({ annotationEnabled: message.enabled });
                    
                    // 如果开启标注且有检测结果，显示标注
                    if (message.enabled && this.lastResults) {
                        this.annotator.showAnnotations(this.lastResults.issues);
                    }
                    
                    sendResponse({ success: true });
                    break;
                    
                case 'clearAnnotations':
                    console.log('清除所有标注');
                    this.annotator.clearAnnotations();
                    sendResponse({ success: true });
                    break;
                    
                case 'getStatus':
                    sendResponse({
                        success: true,
                        data: {
                            annotationEnabled: this.annotator.enabled,
                            hasResults: !!this.lastResults,
                            issueCount: this.lastResults ? this.lastResults.total : 0
                        }
                    });
                    break;
                    
                default:
                    console.warn('未知的消息类型:', message.action);
                    sendResponse({ success: false, error: '未知的消息类型' });
            }
        } catch (error) {
            console.error('Content script 处理消息时出错:', error);
            sendResponse({ 
                success: false, 
                error: error.message || '处理消息时发生错误' 
            });
        }
    }

    async loadSettings() {
        try {
            const result = await chrome.storage.local.get(['annotationEnabled']);
            const enabled = result.annotationEnabled !== false; // 默认开启
            this.annotator.setEnabled(enabled);
            console.log('设置已加载，标注功能:', enabled ? '开启' : '关闭');
        } catch (error) {
            console.error('加载设置失败:', error);
            // 使用默认设置
            this.annotator.setEnabled(true);
        }
    }

    async saveSettings(settings) {
        try {
            await chrome.storage.local.set(settings);
            console.log('设置已保存:', settings);
        } catch (error) {
            console.error('保存设置失败:', error);
        }
    }
}

// 确保DOM加载完成后再初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new ContentScript();
    });
} else {
    new ContentScript();
}