// ADA合规性检测器 - 基于WCAG 2.1 AA标准
class AccessibilityChecker {
    constructor() {
        this.issues = [];
        this.adaRules = this.initializeADARules();
    }

    // 初始化ADA检测规则
    initializeADARules() {
        return {
            // WCAG 2.1 AA 级别规则
            colorContrast: {
                normalText: 4.5,
                largeText: 3.0,
                nonTextElements: 3.0
            },
            textSize: {
                minimum: 12,
                large: 18
            },
            focusIndicator: {
                minWidth: 2,
                minContrast: 3.0
            },
            touchTarget: {
                minSize: 44 // 44x44 pixels minimum
            }
        };
    }

    // 主要检测方法 - 图片无障碍
    async checkImages() {
        const issues = [];
        const images = document.querySelectorAll('img, area, input[type="image"]');
        
        images.forEach((img, index) => {
            // ADA要求：所有图片必须有alt属性
            if (!img.hasAttribute('alt')) {
                issues.push({
                    title: 'ADA违规：图片缺少alt属性',
                    description: '根据ADA标准，所有图片都必须提供替代文本以供屏幕阅读器使用',
                    element: img,
                    severity: 'error',
                    category: 'images',
                    adaRule: 'WCAG 2.1 - 1.1.1 Non-text Content (Level A)',
                    solution: '添加描述性的alt属性，如：<img src="..." alt="描述图片内容">',
                    impact: 'critical'
                });
            } else {
                const altText = img.getAttribute('alt').trim();
                
                // 检查alt文本质量
                if (altText === '') {
                    // 空alt可能是装饰性图片，但需要确认
                    if (!this.isDecorativeImage(img)) {
                        issues.push({
                            title: 'ADA警告：图片alt属性为空',
                            description: '如果图片传达重要信息，应提供描述性的alt文本',
                            element: img,
                            severity: 'warning',
                            category: 'images',
                            adaRule: 'WCAG 2.1 - 1.1.1 Non-text Content (Level A)',
                            solution: '为有意义的图片添加描述性alt文本，装饰性图片可保持alt=""',
                            impact: 'moderate'
                        });
                    }
                } else if (this.isInvalidAltText(altText)) {
                    issues.push({
                        title: 'ADA违规：alt文本质量不佳',
                        description: 'alt文本应该描述图片内容，而不是使用无意义的文本',
                        element: img,
                        severity: 'error',
                        category: 'images',
                        adaRule: 'WCAG 2.1 - 1.1.1 Non-text Content (Level A)',
                        solution: '使用描述性的alt文本，避免使用"图片"、"image"等无意义词汇',
                        impact: 'high'
                    });
                }
            }

            // 检查复杂图片是否有长描述
            if (this.isComplexImage(img) && !this.hasLongDescription(img)) {
                issues.push({
                    title: 'ADA建议：复杂图片需要详细描述',
                    description: '图表、流程图等复杂图片应提供详细的文本描述',
                    element: img,
                    severity: 'warning',
                    category: 'images',
                    adaRule: 'WCAG 2.1 - 1.1.1 Non-text Content (Level A)',
                    solution: '使用longdesc属性或在页面中提供详细的文本描述',
                    impact: 'moderate'
                });
            }
        });

        return issues;
    }

    // 表单无障碍检测
    async checkForms() {
        const issues = [];
        const formElements = document.querySelectorAll('input, select, textarea, button');
        
        formElements.forEach(element => {
            const tagName = element.tagName.toLowerCase();
            const type = element.type || '';
            
            // ADA要求：表单控件必须有标签
            if (this.needsLabel(element)) {
                const label = this.findLabel(element);
                if (!label) {
                    issues.push({
                        title: 'ADA违规：表单控件缺少标签',
                        description: '所有表单控件都必须有关联的标签以供屏幕阅读器识别',
                        element: element,
                        severity: 'error',
                        category: 'forms',
                        adaRule: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)',
                        solution: '使用<label>标签或aria-label属性为表单控件添加标签',
                        impact: 'critical'
                    });
                }
            }

            // 检查必填字段标识
            if (element.hasAttribute('required')) {
                if (!this.hasRequiredIndicator(element)) {
                    issues.push({
                        title: 'ADA违规：必填字段未明确标识',
                        description: '必填字段必须通过视觉和程序化方式明确标识',
                        element: element,
                        severity: 'error',
                        category: 'forms',
                        adaRule: 'WCAG 2.1 - 3.3.2 Labels or Instructions (Level A)',
                        solution: '在标签中添加"必填"文字或使用aria-required="true"',
                        impact: 'high'
                    });
                }
            }

            // 检查错误提示
            if (element.hasAttribute('aria-invalid') && element.getAttribute('aria-invalid') === 'true') {
                if (!this.hasErrorMessage(element)) {
                    issues.push({
                        title: 'ADA违规：错误字段缺少错误提示',
                        description: '标记为无效的字段必须提供具体的错误信息',
                        element: element,
                        severity: 'error',
                        category: 'forms',
                        adaRule: 'WCAG 2.1 - 3.3.1 Error Identification (Level A)',
                        solution: '使用aria-describedby关联错误消息',
                        impact: 'high'
                    });
                }
            }

            // 检查触摸目标大小（移动设备）
            if (this.isTouchTarget(element)) {
                const size = this.getTouchTargetSize(element);
                if (size.width < this.adaRules.touchTarget.minSize || size.height < this.adaRules.touchTarget.minSize) {
                    issues.push({
                        title: 'ADA违规：触摸目标过小',
                        description: '触摸目标应至少为44x44像素以确保易于点击',
                        element: element,
                        severity: 'error',
                        category: 'forms',
                        adaRule: 'WCAG 2.1 - 2.5.5 Target Size (Level AAA)',
                        solution: '增加按钮或链接的尺寸至少44x44像素',
                        impact: 'moderate'
                    });
                }
            }
        });

        return issues;
    }

    // 标题结构检测
    async checkHeadings() {
        const issues = [];
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        
        if (headings.length === 0) {
            issues.push({
                title: 'ADA违规：页面缺少标题结构',
                description: '页面应该有清晰的标题层次结构以帮助用户导航',
                element: document.body,
                severity: 'error',
                category: 'structure',
                adaRule: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)',
                solution: '添加适当的标题标签(h1-h6)来构建页面结构',
                impact: 'high'
            });
            return issues;
        }

        // 检查H1标签
        const h1Elements = document.querySelectorAll('h1');
        if (h1Elements.length === 0) {
            issues.push({
                title: 'ADA违规：页面缺少主标题(H1)',
                description: '每个页面都应该有一个唯一的H1标题',
                element: document.body,
                severity: 'error',
                category: 'structure',
                adaRule: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)',
                solution: '添加一个描述页面主要内容的H1标题',
                impact: 'high'
            });
        } else if (h1Elements.length > 1) {
            issues.push({
                title: 'ADA警告：页面有多个H1标题',
                description: '建议每个页面只有一个H1标题以保持清晰的层次结构',
                element: h1Elements[1],
                severity: 'warning',
                category: 'structure',
                adaRule: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)',
                solution: '将额外的H1标题改为H2或其他适当级别',
                impact: 'moderate'
            });
        }

        // 检查标题层次跳跃
        let previousLevel = 0;
        headings.forEach((heading, index) => {
            const currentLevel = parseInt(heading.tagName.charAt(1));
            
            if (previousLevel > 0 && currentLevel > previousLevel + 1) {
                issues.push({
                    title: 'ADA违规：标题层次跳跃',
                    description: `标题从H${previousLevel}直接跳到H${currentLevel}，违反了层次结构`,
                    element: heading,
                    severity: 'error',
                    category: 'structure',
                    adaRule: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)',
                    solution: '按顺序使用标题级别，不要跳过中间级别',
                    impact: 'moderate'
                });
            }

            // 检查空标题
            if (!heading.textContent.trim()) {
                issues.push({
                    title: 'ADA违规：空标题',
                    description: '标题不能为空，必须包含描述性文本',
                    element: heading,
                    severity: 'error',
                    category: 'structure',
                    adaRule: 'WCAG 2.1 - 2.4.6 Headings and Labels (Level AA)',
                    solution: '为标题添加描述性文本',
                    impact: 'moderate'
                });
            }

            previousLevel = currentLevel;
        });

        return issues;
    }

    // 链接无障碍检测
    async checkLinks() {
        const issues = [];
        const links = document.querySelectorAll('a[href]');
        
        links.forEach(link => {
            const linkText = this.getLinkText(link);
            
            // 检查空链接文本
            if (!linkText) {
                issues.push({
                    title: 'ADA违规：链接缺少可访问的文本',
                    description: '链接必须有可被屏幕阅读器识别的文本',
                    element: link,
                    severity: 'error',
                    category: 'links',
                    adaRule: 'WCAG 2.1 - 2.4.4 Link Purpose (Level A)',
                    solution: '添加链接文本、aria-label或title属性',
                    impact: 'critical'
                });
            } else if (this.isGenericLinkText(linkText)) {
                issues.push({
                    title: 'ADA违规：链接文本不够描述性',
                    description: '链接文本应该清楚描述链接的目的或目标',
                    element: link,
                    severity: 'error',
                    category: 'links',
                    adaRule: 'WCAG 2.1 - 2.4.4 Link Purpose (Level A)',
                    solution: '使用描述性的链接文本，避免"点击这里"、"更多"等模糊文本',
                    impact: 'high'
                });
            }

            // 检查新窗口打开的链接
            if (link.target === '_blank' && !this.hasNewWindowIndicator(link)) {
                issues.push({
                    title: 'ADA违规：新窗口链接未提示',
                    description: '在新窗口打开的链接应该提前告知用户',
                    element: link,
                    severity: 'error',
                    category: 'links',
                    adaRule: 'WCAG 2.1 - 3.2.5 Change on Request (Level AAA)',
                    solution: '在链接文本中添加"(新窗口打开)"或使用aria-label说明',
                    impact: 'moderate'
                });
            }
        });

        return issues;
    }

    // ARIA属性检测
    async checkARIA() {
        const issues = [];
        const elementsWithAria = document.querySelectorAll('[aria-label], [aria-labelledby], [aria-describedby], [role]');
        
        elementsWithAria.forEach(element => {
            // 检查aria-labelledby引用
            const labelledBy = element.getAttribute('aria-labelledby');
            if (labelledBy) {
                const referencedElements = labelledBy.split(' ').map(id => document.getElementById(id));
                if (referencedElements.some(el => !el)) {
                    issues.push({
                        title: 'ADA违规：aria-labelledby引用无效ID',
                        description: 'aria-labelledby属性引用了不存在的元素ID',
                        element: element,
                        severity: 'error',
                        category: 'aria',
                        adaRule: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)',
                        solution: '确保aria-labelledby引用的ID存在于页面中',
                        impact: 'high'
                    });
                }
            }

            // 检查aria-describedby引用
            const describedBy = element.getAttribute('aria-describedby');
            if (describedBy) {
                const referencedElements = describedBy.split(' ').map(id => document.getElementById(id));
                if (referencedElements.some(el => !el)) {
                    issues.push({
                        title: 'ADA违规：aria-describedby引用无效ID',
                        description: 'aria-describedby属性引用了不存在的元素ID',
                        element: element,
                        severity: 'error',
                        category: 'aria',
                        adaRule: 'WCAG 2.1 - 1.3.1 Info and Relationships (Level A)',
                        solution: '确保aria-describedby引用的ID存在于页面中',
                        impact: 'high'
                    });
                }
            }

            // 检查role属性的有效性
            const role = element.getAttribute('role');
            if (role && !this.isValidAriaRole(role)) {
                issues.push({
                    title: 'ADA违规：无效的ARIA role',
                    description: `"${role}"不是有效的ARIA role值`,
                    element: element,
                    severity: 'error',
                    category: 'aria',
                    adaRule: 'WCAG 2.1 - 4.1.2 Name, Role, Value (Level A)',
                    solution: '使用有效的ARIA role值，参考ARIA规范',
                    impact: 'high'
                });
            }
        });

        return issues;
    }

    // 颜色对比度检测
    async checkColorContrast() {
        const issues = [];
        const textElements = document.querySelectorAll('p, span, div, h1, h2, h3, h4, h5, h6, a, button, label, li');
        
        for (const element of textElements) {
            if (!this.hasVisibleText(element)) continue;
            
            const styles = window.getComputedStyle(element);
            const fontSize = parseFloat(styles.fontSize);
            const fontWeight = styles.fontWeight;
            
            // 判断是否为大文本
            const isLargeText = fontSize >= this.adaRules.textSize.large || 
                              (fontSize >= 14 && (fontWeight === 'bold' || parseInt(fontWeight) >= 700));
            
            const requiredRatio = isLargeText ? 
                this.adaRules.colorContrast.largeText : 
                this.adaRules.colorContrast.normalText;
            
            const contrast = this.calculateContrastRatio(element);
            
            if (contrast < requiredRatio) {
                issues.push({
                    title: 'ADA违规：颜色对比度不足',
                    description: `文本对比度为${contrast.toFixed(2)}:1，低于ADA要求的${requiredRatio}:1`,
                    element: element,
                    severity: 'error',
                    category: 'color-contrast',
                    adaRule: 'WCAG 2.1 - 1.4.3 Contrast (Minimum) (Level AA)',
                    solution: '调整文本颜色或背景颜色以提高对比度',
                    impact: 'high',
                    details: {
                        currentRatio: contrast,
                        requiredRatio: requiredRatio,
                        isLargeText: isLargeText
                    }
                });
            }
        }

        return issues;
    }

    // 键盘导航检测
    async checkKeyboardNavigation() {
        const issues = [];
        const interactiveElements = document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex], [role="button"], [role="link"]'
        );
        
        interactiveElements.forEach(element => {
            // 检查tabindex值
            const tabindex = element.getAttribute('tabindex');
            if (tabindex && parseInt(tabindex) > 0) {
                issues.push({
                    title: 'ADA警告：使用了正数tabindex',
                    description: '正数tabindex会破坏自然的Tab键顺序，建议避免使用',
                    element: element,
                    severity: 'warning',
                    category: 'keyboard',
                    adaRule: 'WCAG 2.1 - 2.4.3 Focus Order (Level A)',
                    solution: '使用tabindex="0"或依赖自然的DOM顺序',
                    impact: 'moderate'
                });
            }

            // 检查不可访问的交互元素
            if (tabindex === '-1' && !this.isValidNegativeTabindex(element)) {
                issues.push({
                    title: 'ADA违规：交互元素不可键盘访问',
                    description: '交互元素设置了tabindex="-1"，无法通过键盘访问',
                    element: element,
                    severity: 'error',
                    category: 'keyboard',
                    adaRule: 'WCAG 2.1 - 2.1.1 Keyboard (Level A)',
                    solution: '移除tabindex="-1"或确保元素可通过其他方式键盘访问',
                    impact: 'high'
                });
            }
        });

        return issues;
    }

    // 焦点管理检测
    async checkFocus() {
        const issues = [];
        const focusableElements = document.querySelectorAll(
            'a[href], button, input, select, textarea, [tabindex="0"]'
        );
        
        focusableElements.forEach(element => {
            // 检查焦点指示器
            if (!this.hasFocusIndicator(element)) {
                issues.push({
                    title: 'ADA违规：缺少焦点指示器',
                    description: '可聚焦元素必须有清晰可见的焦点指示器',
                    element: element,
                    severity: 'error',
                    category: 'focus',
                    adaRule: 'WCAG 2.1 - 2.4.7 Focus Visible (Level AA)',
                    solution: '为元素添加:focus样式，确保焦点状态清晰可见',
                    impact: 'high'
                });
            }
        });

        return issues;
    }

    // 辅助方法：判断是否为装饰性图片
    isDecorativeImage(img) {
        // 检查常见的装饰性图片特征
        const src = img.src.toLowerCase();
        const decorativePatterns = ['decoration', 'border', 'spacer', 'bullet', 'icon'];
        return decorativePatterns.some(pattern => src.includes(pattern)) ||
               img.closest('.decoration, .border, .spacer');
    }

    // 辅助方法：检查无效的alt文本
    isInvalidAltText(altText) {
        const invalidPatterns = [
            /^(image|img|picture|photo|图片|图像)$/i,
            /^(graphic|chart|diagram)$/i,
            /^\s*$/,
            /^(untitled|无标题)$/i
        ];
        return invalidPatterns.some(pattern => pattern.test(altText));
    }

    // 辅助方法：判断是否为复杂图片
    isComplexImage(img) {
        const src = img.src.toLowerCase();
        const complexPatterns = ['chart', 'graph', 'diagram', 'flowchart', 'infographic'];
        return complexPatterns.some(pattern => src.includes(pattern)) ||
               img.closest('.chart, .graph, .diagram');
    }

    // 辅助方法：检查是否有长描述
    hasLongDescription(img) {
        return img.hasAttribute('longdesc') ||
               img.hasAttribute('aria-describedby') ||
               img.nextElementSibling?.classList.contains('long-description');
    }

    // 辅助方法：判断元素是否需要标签
    needsLabel(element) {
        const tagName = element.tagName.toLowerCase();
        const type = element.type || '';
        
        if (tagName === 'button') return false; // 按钮使用文本内容
        if (tagName === 'input' && ['submit', 'reset', 'button'].includes(type)) return false;
        
        return ['input', 'select', 'textarea'].includes(tagName);
    }

    // 辅助方法：查找关联的标签
    findLabel(element) {
        // 检查aria-label
        if (element.hasAttribute('aria-label')) return true;
        
        // 检查aria-labelledby
        if (element.hasAttribute('aria-labelledby')) return true;
        
        // 检查label标签
        const id = element.id;
        if (id) {
            const label = document.querySelector(`label[for="${id}"]`);
            if (label) return label;
        }
        
        // 检查包装的label
        const parentLabel = element.closest('label');
        return parentLabel;
    }

    // 辅助方法：检查必填字段指示器
    hasRequiredIndicator(element) {
        const label = this.findLabel(element);
        if (label && (label.textContent.includes('*') || label.textContent.includes('必填'))) {
            return true;
        }
        
        return element.hasAttribute('aria-required') ||
               element.hasAttribute('aria-label') && element.getAttribute('aria-label').includes('必填');
    }

    // 辅助方法：检查错误消息
    hasErrorMessage(element) {
        const describedBy = element.getAttribute('aria-describedby');
        if (describedBy) {
            const errorElement = document.getElementById(describedBy);
            return errorElement && errorElement.textContent.trim();
        }
        return false;
    }

    // 辅助方法：判断是否为触摸目标
    isTouchTarget(element) {
        const tagName = element.tagName.toLowerCase();
        return ['button', 'a', 'input'].includes(tagName) ||
               element.hasAttribute('onclick') ||
               element.getAttribute('role') === 'button';
    }

    // 辅助方法：获取触摸目标尺寸
    getTouchTargetSize(element) {
        const rect = element.getBoundingClientRect();
        return {
            width: rect.width,
            height: rect.height
        };
    }

    // 辅助方法：获取链接文本
    getLinkText(link) {
        // 优先级：aria-label > aria-labelledby > 文本内容 > title
        if (link.hasAttribute('aria-label')) {
            return link.getAttribute('aria-label').trim();
        }
        
        if (link.hasAttribute('aria-labelledby')) {
            const ids = link.getAttribute('aria-labelledby').split(' ');
            const texts = ids.map(id => {
                const element = document.getElementById(id);
                return element ? element.textContent.trim() : '';
            }).filter(text => text);
            if (texts.length > 0) return texts.join(' ');
        }
        
        const textContent = link.textContent.trim();
        if (textContent) return textContent;
        
        // 检查图片alt文本
        const img = link.querySelector('img[alt]');
        if (img) return img.getAttribute('alt').trim();
        
        return link.getAttribute('title') || '';
    }

    // 辅助方法：检查是否为通用链接文本
    isGenericLinkText(text) {
        const genericTexts = [
            '点击这里', 'click here', 'here', '更多', 'more', 'read more',
            '链接', 'link', '详情', 'details', '查看', 'view', '继续', 'continue'
        ];
        return genericTexts.includes(text.toLowerCase());
    }

    // 辅助方法：检查新窗口指示器
    hasNewWindowIndicator(link) {
        const text = this.getLinkText(link);
        return text.includes('新窗口') || text.includes('new window') ||
               link.hasAttribute('aria-label') && link.getAttribute('aria-label').includes('新窗口');
    }

    // 辅助方法：检查ARIA role有效性
    isValidAriaRole(role) {
        const validRoles = [
            'alert', 'alertdialog', 'application', 'article', 'banner', 'button',
            'cell', 'checkbox', 'columnheader', 'combobox', 'complementary',
            'contentinfo', 'definition', 'dialog', 'directory', 'document',
            'feed', 'figure', 'form', 'grid', 'gridcell', 'group', 'heading',
            'img', 'link', 'list', 'listbox', 'listitem', 'log', 'main',
            'marquee', 'math', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
            'menuitemradio', 'navigation', 'none', 'note', 'option', 'presentation',
            'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup',
            'rowheader', 'scrollbar', 'search', 'searchbox', 'separator',
            'slider', 'spinbutton', 'status', 'switch', 'tab', 'table',
            'tablist', 'tabpanel', 'term', 'textbox', 'timer', 'toolbar',
            'tooltip', 'tree', 'treegrid', 'treeitem'
        ];
        return validRoles.includes(role);
    }

    // 辅助方法：检查元素是否有可见文本
    hasVisibleText(element) {
        const text = element.textContent.trim();
        if (!text) return false;
        
        const styles = window.getComputedStyle(element);
        return styles.display !== 'none' && 
               styles.visibility !== 'hidden' && 
               styles.opacity !== '0';
    }

    // 辅助方法：计算颜色对比度
    calculateContrastRatio(element) {
        const styles = window.getComputedStyle(element);
        const color = this.parseColor(styles.color);
        const backgroundColor = this.getBackgroundColor(element);
        
        if (!color || !backgroundColor) return 21; // 假设最高对比度
        
        const l1 = this.getLuminance(color);
        const l2 = this.getLuminance(backgroundColor);
        
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    // 辅助方法：解析颜色
    parseColor(colorStr) {
        const div = document.createElement('div');
        div.style.color = colorStr;
        document.body.appendChild(div);
        const computed = window.getComputedStyle(div).color;
        document.body.removeChild(div);
        
        const match = computed.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (match) {
            return {
                r: parseInt(match[1]),
                g: parseInt(match[2]),
                b: parseInt(match[3])
            };
        }
        return null;
    }

    // 辅助方法：获取背景颜色
    getBackgroundColor(element) {
        let current = element;
        while (current && current !== document.body) {
            const styles = window.getComputedStyle(current);
            const bgColor = styles.backgroundColor;
            
            if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                return this.parseColor(bgColor);
            }
            current = current.parentElement;
        }
        
        // 默认白色背景
        return { r: 255, g: 255, b: 255 };
    }

    // 辅助方法：计算亮度
    getLuminance(color) {
        const { r, g, b } = color;
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    // 辅助方法：检查负数tabindex的有效性
    isValidNegativeTabindex(element) {
        // 某些情况下负数tabindex是合理的，比如模态框内的元素
        return element.closest('[role="dialog"], .modal, .popup') !== null;
    }

    // 辅助方法：检查焦点指示器
    hasFocusIndicator(element) {
        // 这里需要实际检查CSS样式，简化实现
        const styles = window.getComputedStyle(element, ':focus');
        return styles.outline !== 'none' || 
               styles.boxShadow !== 'none' ||
               styles.border !== styles.border; // 简化检查
    }
}