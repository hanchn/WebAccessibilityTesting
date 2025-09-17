// 检测器核心类 - 协调各种检测模块
class WebDetector {
    constructor() {
        this.seoChecker = new SEOChecker();
        this.accessibilityChecker = new AccessibilityChecker();
        this.utils = new Utils();
    }

    async runSEOCheck() {
        console.log('开始SEO检测...');
        
        const startTime = Date.now();
        const issues = [];
        let score = 100;

        try {
            // 基础SEO检测项目
            const checks = [
                () => this.seoChecker.checkTitle(),
                () => this.seoChecker.checkMetaDescription(),
                () => this.seoChecker.checkHeadings(),
                () => this.seoChecker.checkImages(),
                () => this.seoChecker.checkLinks(),
                () => this.seoChecker.checkCanonical(),
                () => this.seoChecker.checkOpenGraph(),
                () => this.seoChecker.checkStructuredData()
            ];

            for (const check of checks) {
                try {
                    const result = await check();
                    if (result && result.length > 0) {
                        issues.push(...result);
                    }
                } catch (error) {
                    console.error('SEO检测项目失败:', error);
                }
            }

            // 计算得分
            score = this.calculateScore(issues, 'seo');

        } catch (error) {
            console.error('SEO检测失败:', error);
            issues.push({
                title: 'SEO检测错误',
                description: '检测过程中发生错误: ' + error.message,
                severity: 'error',
                category: 'system'
            });
        }

        const endTime = Date.now();
        
        return {
            type: 'seo',
            score: score,
            issues: issues,
            summary: {
                total: issues.length,
                errors: issues.filter(i => i.severity === 'error').length,
                warnings: issues.filter(i => i.severity === 'warning').length,
                duration: endTime - startTime
            },
            timestamp: new Date().toISOString(),
            url: window.location.href
        };
    }

    // 检测器核心类 - 专注于无障碍检测
    class WebDetector {
        constructor() {
            this.accessibilityChecker = new AccessibilityChecker();
            this.utils = new Utils();
        }
    
        async runAccessibilityCheck() {
            console.log('开始无障碍检测...');
            
            const startTime = Date.now();
            const issues = [];
            const issueMap = new Map(); // 用于去重的问题映射
            
            try {
                // 收集所有检测结果
                const allChecks = [
                    () => this.accessibilityChecker.checkImages(),
                    () => this.accessibilityChecker.checkHeadings(),
                    () => this.accessibilityChecker.checkLinks(),
                    () => this.accessibilityChecker.checkForms(),
                    () => this.accessibilityChecker.checkColors(),
                    () => this.accessibilityChecker.checkKeyboard(),
                    () => this.accessibilityChecker.checkARIA(),
                    () => this.accessibilityChecker.checkTables()
                ];
                
                allChecks.forEach(checkFn => {
                    try {
                        const checkResults = checkFn();
                        checkResults.forEach(issue => {
                            // 为每个问题生成唯一标识符
                            const elementKey = issue.element ? 
                                `${issue.element.tagName}-${issue.element.className}-${issue.element.id || 'no-id'}` : 
                                issue.selector || 'no-element';
                            const issueKey = `${elementKey}-${issue.title}-${issue.category}`;
                            
                            // 去重：如果同一个元素的同一类问题已存在，则跳过
                            if (!issueMap.has(issueKey)) {
                                issueMap.set(issueKey, issue);
                                issues.push({
                                    ...issue,
                                    id: issueKey,
                                    timestamp: Date.now()
                                });
                            }
                        });
                    } catch (error) {
                        console.error('检测项目失败:', error);
                    }
                });
                
            } catch (error) {
                console.error('无障碍检测失败:', error);
                issues.push({
                    title: '检测错误',
                    description: '检测过程中发生错误: ' + error.message,
                    severity: 'error',
                    category: 'system'
                });
            }
    
            return {
                type: 'accessibility',
                url: window.location.href,
                timestamp: new Date().toISOString(),
                issues: issues,
                summary: {
                    total: issues.length,
                    errors: issues.filter(issue => issue.severity === 'error').length,
                    warnings: issues.filter(issue => issue.severity === 'warning').length,
                    duration: Date.now() - startTime
                }
            };
        }
    }

    calculateScore(issues, type) {
        let score = 100;
        
        issues.forEach(issue => {
            switch (issue.severity) {
                case 'error':
                    score -= 10;
                    break;
                case 'warning':
                    score -= 5;
                    break;
                case 'info':
                    score -= 1;
                    break;
            }
        });

        return Math.max(0, Math.min(100, score));
    }
}