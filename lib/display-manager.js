// 显示模式管理器 - 管理控制台输出和页面展示两种模式
class DisplayManager {
    constructor() {
        this.mode = 'popup'; // 'console', 'visual', 'popup'
        this.visualAnnotator = new VisualAnnotator();
        this.consoleGroup = null;
    }

    // 设置显示模式
    setMode(mode) {
        this.mode = mode;
        
        switch (mode) {
            case 'console':
                this.visualAnnotator.setEnabled(false);
                break;
            case 'visual':
                this.visualAnnotator.setEnabled(true);
                this.visualAnnotator.createControls();
                break;
            case 'popup':
                this.visualAnnotator.setEnabled(false);
                break;
        }
    }

    // 显示检测结果
    displayResults(results) {
        switch (this.mode) {
            case 'console':
                this.displayInConsole(results);
                break;
            case 'visual':
                this.displayVisually(results);
                break;
            case 'popup':
                // 弹窗模式由popup.js处理
                break;
        }
    }

    // 控制台输出模式
    displayInConsole(results) {
        // 结束之前的分组
        if (this.consoleGroup) {
            console.groupEnd();
        }

        const timestamp = new Date().toLocaleTimeString();
        const groupTitle = `🔍 ${results.type === 'seo' ? 'SEO' : '无障碍'}检测结果 (${timestamp}) - 得分: ${results.score}/100`;
        
        console.group(groupTitle);
        this.consoleGroup = groupTitle;

        // 显示总览信息
        console.log(`📊 检测总览:`, {
            '总问题数': results.summary.total,
            '错误': results.summary.errors,
            '警告': results.summary.warnings,
            '检测耗时': `${results.summary.duration}ms`,
            '页面URL': results.url
        });

        if (results.issues.length === 0) {
            console.log('🎉 恭喜！未发现任何问题。');
            console.groupEnd();
            return;
        }

        // 按严重程度分组显示
        const groupedIssues = this.groupIssuesBySeverity(results.issues);
        
        Object.entries(groupedIssues).forEach(([severity, issues]) => {
            if (issues.length === 0) return;
            
            const severityIcon = {
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            }[severity];
            
            const severityName = {
                'error': '错误',
                'warning': '警告', 
                'info': '信息'
            }[severity];

            console.group(`${severityIcon} ${severityName} (${issues.length}个)`);
            
            issues.forEach((issue, index) => {
                console.group(`${index + 1}. ${issue.title}`);
                console.log('📝 描述:', issue.description);
                
                if (issue.suggestion) {
                    console.log('💡 建议:', issue.suggestion);
                }
                
                if (issue.element) {
                    console.log('🎯 元素:', issue.element);
                } else if (issue.selector) {
                    console.log('🎯 选择器:', issue.selector);
                    const elements = document.querySelectorAll(issue.selector);
                    if (elements.length > 0) {
                        console.log('🎯 匹配元素:', elements);
                    }
                }
                
                if (issue.category) {
                    console.log('📂 分类:', issue.category);
                }
                
                console.groupEnd();
            });
            
            console.groupEnd();
        });

        // 显示修复建议总结
        this.displayFixSuggestions(results.issues);
        
        console.groupEnd();
    }

    // 可视化显示模式
    displayVisually(results) {
        // 准备用于可视化标注的问题列表
        const visualIssues = results.issues.map(issue => {
            // 如果问题有关联的元素或选择器，添加到可视化列表
            if (issue.element || issue.selector) {
                return {
                    ...issue,
                    element: issue.element || document.querySelector(issue.selector)
                };
            }
            return null;
        }).filter(Boolean);

        // 执行可视化标注
        this.visualAnnotator.annotateIssues(visualIssues);

        // 同时在控制台输出简要信息
        console.log(`🔍 ${results.type === 'seo' ? 'SEO' : '无障碍'}检测完成`, {
            '得分': `${results.score}/100`,
            '问题总数': results.summary.total,
            '可视化标注': visualIssues.length,
            '查看详情': '点击页面上的红色标注查看具体问题'
        });
    }

    // 按严重程度分组问题
    groupIssuesBySeverity(issues) {
        return {
            error: issues.filter(issue => issue.severity === 'error'),
            warning: issues.filter(issue => issue.severity === 'warning'),
            info: issues.filter(issue => issue.severity === 'info')
        };
    }

    // 显示修复建议总结
    displayFixSuggestions(issues) {
        const suggestions = issues
            .filter(issue => issue.suggestion)
            .map(issue => issue.suggestion);
            
        if (suggestions.length > 0) {
            console.group('🛠️ 修复建议总结');
            suggestions.forEach((suggestion, index) => {
                console.log(`${index + 1}. ${suggestion}`);
            });
            console.groupEnd();
        }
    }

    // 清除显示内容
    clear() {
        this.visualAnnotator.clearAnnotations();
        if (this.consoleGroup) {
            console.groupEnd();
            this.consoleGroup = null;
        }
    }

    // 销毁显示管理器
    destroy() {
        this.visualAnnotator.destroy();
        this.clear();
    }
}