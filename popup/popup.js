class PopupController {
    constructor() {
        console.log('🚀 Popup 初始化');
        this.init();
    }

    async init() {
        try {
            // 绑定事件监听器
            this.bindEventListeners();
            
            // 自动开始检测
            await this.autoStartScan();
        } catch (error) {
            console.error('❌ Popup 初始化失败:', error);
        }
    }

    bindEventListeners() {
        // 标注开关
        const annotationToggle = document.getElementById('annotationToggle');
        if (annotationToggle) {
            annotationToggle.addEventListener('change', (e) => {
                this.toggleAnnotation(e.target.checked);
            });
        }
    }

    async autoStartScan() {
        console.log('🔄 自动开始检测...');
        
        try {
            // 显示加载状态
            this.showLoading(true);
            
            // 延迟500ms后开始检测，确保页面完全加载
            setTimeout(async () => {
                try {
                    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
                    
                    const response = await chrome.tabs.sendMessage(tab.id, {
                        action: 'startScan'
                    });
                    
                    if (response && response.success) {
                        console.log(`📊 检测完成，发现 ${response.results.length} 个问题`);
                        
                        // 默认开启标注
                        const annotationToggle = document.getElementById('annotationToggle');
                        if (annotationToggle) {
                            annotationToggle.checked = true;
                            await this.toggleAnnotation(true);
                        }
                    } else {
                        console.log('✅ 检测完成，未发现问题');
                    }
                } catch (error) {
                    console.error('❌ 自动检测失败:', error);
                } finally {
                    this.showLoading(false);
                }
            }, 500);
            
        } catch (error) {
            console.error('❌ 自动检测启动失败:', error);
            this.showLoading(false);
        }
    }

    async toggleAnnotation(enabled) {
        try {
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            
            await chrome.tabs.sendMessage(tab.id, {
                action: 'toggleAnnotation',
                enabled: enabled
            });
            
            console.log(`📍 标注${enabled ? '已开启' : '已关闭'}`);
        } catch (error) {
            console.error('❌ 切换标注失败:', error);
        }
    }

    showLoading(show) {
        const loadingIndicator = document.getElementById('loadingIndicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = show ? 'flex' : 'none';
        }
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new PopupController();
});