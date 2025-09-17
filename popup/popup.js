class PopupController {
    constructor() {
        console.log('🚀 Popup 初始化');
        this.currentResults = null;
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

        // 导出按钮
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportReport();
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
                        this.currentResults = response.results;
                        this.displayStats(response.results);
                        
                        // 默认开启标注
                        const annotationToggle = document.getElementById('annotationToggle');
                        if (annotationToggle) {
                            annotationToggle.checked = true;
                            await this.toggleAnnotation(true);
                        }
                    } else {
                        console.warn('⚠️ 检测未返回有效结果');
                        this.displayStats([]);
                    }
                } catch (error) {
                    console.error('❌ 自动检测失败:', error);
                    this.displayStats([]);
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

    displayStats(results) {
        const statsContainer = document.getElementById('statsContainer');
        const actionsContainer = document.getElementById('actionsContainer');
        const totalIssuesElement = document.getElementById('totalIssues');
        
        if (results && results.length > 0) {
            // 显示统计信息
            if (totalIssuesElement) {
                totalIssuesElement.textContent = results.length;
            }
            
            if (statsContainer) {
                statsContainer.style.display = 'block';
            }
            
            if (actionsContainer) {
                actionsContainer.style.display = 'block';
            }
            
            console.log(`📊 检测完成，发现 ${results.length} 个问题`);
        } else {
            // 隐藏统计和操作区域
            if (statsContainer) {
                statsContainer.style.display = 'none';
            }
            
            if (actionsContainer) {
                actionsContainer.style.display = 'none';
            }
            
            console.log('✅ 检测完成，未发现问题');
        }
    }

    exportReport() {
        if (!this.currentResults || this.currentResults.length === 0) {
            alert('没有问题需要导出');
            return;
        }

        try {
            // 生成报告内容
            const reportContent = this.generateReportContent(this.currentResults);
            
            // 创建下载链接
            const blob = new Blob([reportContent], { type: 'text/plain;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `accessibility-report-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            
            URL.revokeObjectURL(url);
            
            console.log('📄 报告导出成功');
        } catch (error) {
            console.error('❌ 导出报告失败:', error);
            alert('导出失败，请重试');
        }
    }

    generateReportContent(results) {
        const timestamp = new Date().toLocaleString('zh-CN');
        let content = `无障碍检测报告\n生成时间: ${timestamp}\n\n`;
        content += `总计发现问题: ${results.length}\n\n`;
        content += '=' .repeat(50) + '\n\n';
        
        results.forEach((issue, index) => {
            content += `问题 ${index + 1}:\n`;
            content += `类型: ${issue.type}\n`;
            content += `描述: ${issue.message}\n`;
            content += `元素: ${issue.element}\n`;
            if (issue.suggestion) {
                content += `建议: ${issue.suggestion}\n`;
            }
            content += '-'.repeat(30) + '\n\n';
        });
        
        return content;
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