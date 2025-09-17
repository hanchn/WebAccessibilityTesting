class SEOChecker {
    constructor() {
        this.rules = {
            title: { min: 30, max: 60 },
            description: { min: 120, max: 160 },
            h1: { min: 1, max: 1 },
            keywords: { max: 10 }
        };
    }

    checkPage() {
        const results = {
            score: 0,
            issues: [],
            suggestions: [],
            details: {}
        };

        // 检查标题
        this.checkTitle(results);
        
        // 检查描述
        this.checkDescription(results);
        
        // 检查标题标签
        this.checkHeadings(results);
        
        // 检查图片alt属性
        this.checkImages(results);
        
        // 检查链接
        this.checkLinks(results);
        
        // 检查结构化数据
        this.checkStructuredData(results);
        
        // 检查页面加载速度相关因素
        this.checkPerformance(results);

        // 计算总分
        results.score = this.calculateScore(results);
        
        return results;
    }

    checkTitle(results) {
        const title = document.title;
        const titleLength = title.length;
        
        results.details.title = {
            content: title,
            length: titleLength,
            status: 'pass'
        };

        if (!title) {
            results.issues.push({
                type: 'error',
                category: 'title',
                message: '页面缺少标题标签',
                element: 'title',
                severity: 'high'
            });
            results.details.title.status = 'error';
        } else if (titleLength < this.rules.title.min) {
            results.issues.push({
                type: 'warning',
                category: 'title',
                message: `标题过短（${titleLength}字符），建议${this.rules.title.min}-${this.rules.title.max}字符`,
                element: 'title',
                severity: 'medium'
            });
            results.details.title.status = 'warning';
        } else if (titleLength > this.rules.title.max) {
            results.issues.push({
                type: 'warning',
                category: 'title',
                message: `标题过长（${titleLength}字符），建议${this.rules.title.min}-${this.rules.title.max}字符`,
                element: 'title',
                severity: 'medium'
            });
            results.details.title.status = 'warning';
        }
    }

    checkDescription(results) {
        const metaDesc = document.querySelector('meta[name="description"]');
        const description = metaDesc ? metaDesc.getAttribute('content') : '';
        const descLength = description.length;
        
        results.details.description = {
            content: description,
            length: descLength,
            status: 'pass'
        };

        if (!description) {
            results.issues.push({
                type: 'error',
                category: 'meta',
                message: '页面缺少meta description',
                element: 'meta[name="description"]',
                severity: 'high'
            });
            results.details.description.status = 'error';
        } else if (descLength < this.rules.description.min) {
            results.issues.push({
                type: 'warning',
                category: 'meta',
                message: `描述过短（${descLength}字符），建议${this.rules.description.min}-${this.rules.description.max}字符`,
                element: 'meta[name="description"]',
                severity: 'medium'
            });
            results.details.description.status = 'warning';
        } else if (descLength > this.rules.description.max) {
            results.issues.push({
                type: 'warning',
                category: 'meta',
                message: `描述过长（${descLength}字符），建议${this.rules.description.min}-${this.rules.description.max}字符`,
                element: 'meta[name="description"]',
                severity: 'medium'
            });
            results.details.description.status = 'warning';
        }
    }

    checkHeadings(results) {
        const h1Elements = document.querySelectorAll('h1');
        const h2Elements = document.querySelectorAll('h2');
        const h3Elements = document.querySelectorAll('h3');
        
        results.details.headings = {
            h1Count: h1Elements.length,
            h2Count: h2Elements.length,
            h3Count: h3Elements.length,
            structure: [],
            status: 'pass'
        };

        // 检查H1标签
        if (h1Elements.length === 0) {
            results.issues.push({
                type: 'error',
                category: 'headings',
                message: '页面缺少H1标签',
                element: 'h1',
                severity: 'high'
            });
            results.details.headings.status = 'error';
        } else if (h1Elements.length > 1) {
            results.issues.push({
                type: 'warning',
                category: 'headings',
                message: `页面有${h1Elements.length}个H1标签，建议只使用一个`,
                element: 'h1',
                severity: 'medium'
            });
            results.details.headings.status = 'warning';
        }

        // 检查标题层级结构
        const allHeadings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let prevLevel = 0;
        
        allHeadings.forEach((heading, index) => {
            const level = parseInt(heading.tagName.charAt(1));
            const text = heading.textContent.trim();
            
            results.details.headings.structure.push({
                level,
                text,
                element: heading
            });
            
            if (level > prevLevel + 1) {
                results.issues.push({
                    type: 'warning',
                    category: 'headings',
                    message: `标题层级跳跃：从H${prevLevel}直接跳到H${level}`,
                    element: heading,
                    severity: 'low'
                });
            }
            
            prevLevel = level;
        });
    }

    checkImages(results) {
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = [];
        const imagesWithEmptyAlt = [];
        
        results.details.images = {
            total: images.length,
            withoutAlt: 0,
            withEmptyAlt: 0,
            status: 'pass'
        };

        images.forEach(img => {
            const alt = img.getAttribute('alt');
            
            if (alt === null) {
                imagesWithoutAlt.push(img);
                results.details.images.withoutAlt++;
            } else if (alt.trim() === '') {
                imagesWithEmptyAlt.push(img);
                results.details.images.withEmptyAlt++;
            }
        });

        if (imagesWithoutAlt.length > 0) {
            results.issues.push({
                type: 'error',
                category: 'images',
                message: `${imagesWithoutAlt.length}张图片缺少alt属性`,
                elements: imagesWithoutAlt,
                severity: 'high'
            });
            results.details.images.status = 'error';
        }

        if (imagesWithEmptyAlt.length > 0) {
            results.issues.push({
                type: 'warning',
                category: 'images',
                message: `${imagesWithEmptyAlt.length}张图片alt属性为空`,
                elements: imagesWithEmptyAlt,
                severity: 'medium'
            });
            if (results.details.images.status === 'pass') {
                results.details.images.status = 'warning';
            }
        }
    }

    checkLinks(results) {
        const links = document.querySelectorAll('a');
        const linksWithoutText = [];
        const externalLinks = [];
        
        results.details.links = {
            total: links.length,
            withoutText: 0,
            external: 0,
            status: 'pass'
        };

        links.forEach(link => {
            const text = link.textContent.trim();
            const href = link.getAttribute('href');
            
            if (!text && !link.querySelector('img[alt]')) {
                linksWithoutText.push(link);
                results.details.links.withoutText++;
            }
            
            if (href && (href.startsWith('http') && !href.includes(window.location.hostname))) {
                externalLinks.push(link);
                results.details.links.external++;
            }
        });

        if (linksWithoutText.length > 0) {
            results.issues.push({
                type: 'warning',
                category: 'links',
                message: `${linksWithoutText.length}个链接缺少描述文本`,
                elements: linksWithoutText,
                severity: 'medium'
            });
            results.details.links.status = 'warning';
        }
    }

    checkStructuredData(results) {
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        const microdata = document.querySelectorAll('[itemscope]');
        
        results.details.structuredData = {
            jsonLd: jsonLdScripts.length,
            microdata: microdata.length,
            status: jsonLdScripts.length > 0 || microdata.length > 0 ? 'pass' : 'warning'
        };

        if (jsonLdScripts.length === 0 && microdata.length === 0) {
            results.suggestions.push({
                type: 'suggestion',
                category: 'structured-data',
                message: '建议添加结构化数据以提高搜索引擎理解',
                severity: 'low'
            });
        }
    }

    checkPerformance(results) {
        const scripts = document.querySelectorAll('script');
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        const inlineStyles = document.querySelectorAll('style');
        
        results.details.performance = {
            scripts: scripts.length,
            stylesheets: stylesheets.length,
            inlineStyles: inlineStyles.length,
            status: 'pass'
        };

        if (scripts.length > 10) {
            results.suggestions.push({
                type: 'suggestion',
                category: 'performance',
                message: `页面包含${scripts.length}个脚本文件，建议合并减少HTTP请求`,
                severity: 'low'
            });
        }

        if (stylesheets.length > 5) {
            results.suggestions.push({
                type: 'suggestion',
                category: 'performance',
                message: `页面包含${stylesheets.length}个CSS文件，建议合并减少HTTP请求`,
                severity: 'low'
            });
        }
    }

    calculateScore(results) {
        let score = 100;
        
        results.issues.forEach(issue => {
            switch (issue.severity) {
                case 'high':
                    score -= 15;
                    break;
                case 'medium':
                    score -= 10;
                    break;
                case 'low':
                    score -= 5;
                    break;
            }
        });
        
        results.suggestions.forEach(suggestion => {
            score -= 2;
        });
        
        return Math.max(0, score);
    }
}