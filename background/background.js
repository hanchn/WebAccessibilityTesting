// 后台脚本 - 处理插件生命周期和跨标签页通信
class BackgroundScript {
    constructor() {
        this.init();
    }

    init() {
        // 插件安装时的处理
        chrome.runtime.onInstalled.addListener((details) => {
            this.onInstalled(details);
        });

        // 监听来自content script和popup的消息
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            this.handleMessage(request, sender, sendResponse);
            return true;
        });

        // 标签页更新时的处理
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            this.onTabUpdated(tabId, changeInfo, tab);
        });
    }

    onInstalled(details) {
        console.log('Web Accessibility Tester 已安装');
        
        if (details.reason === 'install') {
            // 首次安装
            this.setDefaultSettings();
            chrome.tabs.create({ url: chrome.runtime.getURL('options/options.html') });
        } else if (details.reason === 'update') {
            // 更新版本
            console.log('插件已更新到版本:', chrome.runtime.getManifest().version);
        }
    }

    async setDefaultSettings() {
        const defaultSettings = {
            autoScan: false,
            scanDelay: 2000,
            enabledChecks: {
                seo: {
                    title: true,
                    metaDescription: true,
                    headings: true,
                    images: true,
                    links: true,
                    canonical: true,
                    openGraph: true,
                    structuredData: true
                },
                accessibility: {
                    images: true,
                    forms: true,
                    headings: true,
                    links: true,
                    aria: true,
                    colorContrast: true,
                    keyboardNavigation: true,
                    focus: true
                }
            },
            reportFormat: 'json',
            theme: 'light'
        };

        try {
            await chrome.storage.sync.set({ settings: defaultSettings });
            console.log('默认设置已保存');
        } catch (error) {
            console.error('保存默认设置失败:', error);
        }
    }

    handleMessage(request, sender, sendResponse) {
        switch (request.action) {
            case 'getSettings':
                this.getSettings().then(sendResponse);
                break;
                
            case 'saveSettings':
                this.saveSettings(request.settings).then(sendResponse);
                break;
                
            case 'exportReport':
                this.exportReport(request.data).then(sendResponse);
                break;
                
            default:
                sendResponse({ error: '未知的操作类型' });
        }
    }

    async getSettings() {
        try {
            const result = await chrome.storage.sync.get('settings');
            return result.settings || {};
        } catch (error) {
            console.error('获取设置失败:', error);
            return {};
        }
    }

    async saveSettings(settings) {
        try {
            await chrome.storage.sync.set({ settings });
            return { success: true };
        } catch (error) {
            console.error('保存设置失败:', error);
            return { error: error.message };
        }
    }

    onTabUpdated(tabId, changeInfo, tab) {
        // 当标签页完成加载时，可以进行一些处理
        if (changeInfo.status === 'complete' && tab.url) {
            // 这里可以添加自动扫描逻辑
            this.checkAutoScan(tabId, tab);
        }
    }

    async checkAutoScan(tabId, tab) {
        try {
            const settings = await this.getSettings();
            if (settings.autoScan && this.shouldScanUrl(tab.url)) {
                // 延迟执行自动扫描
                setTimeout(() => {
                    chrome.tabs.sendMessage(tabId, { action: 'autoScan' });
                }, settings.scanDelay || 2000);
            }
        } catch (error) {
            console.error('自动扫描检查失败:', error);
        }
    }

    shouldScanUrl(url) {
        // 判断是否应该扫描该URL
        if (!url) return false;
        
        const excludePatterns = [
            /^chrome:/,
            /^chrome-extension:/,
            /^moz-extension:/,
            /^about:/,
            /^file:/
        ];
        
        return !excludePatterns.some(pattern => pattern.test(url));
    }

    async exportReport(data) {
        // 处理报告导出
        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { 
                type: 'application/json' 
            });
            
            const url = URL.createObjectURL(blob);
            const filename = `accessibility-report-${Date.now()}.json`;
            
            await chrome.downloads.download({
                url: url,
                filename: filename,
                saveAs: true
            });
            
            return { success: true, filename };
        } catch (error) {
            console.error('导出报告失败:', error);
            return { error: error.message };
        }
    }
}

// 初始化后台脚本
new BackgroundScript();