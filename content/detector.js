class AccessibilityDetector {
    constructor() {
        this.issues = [];
    }

    async runCheck() {
        console.log('开始无障碍检测...');
        this.issues = [];
        
        // 执行各项检测
        this.checkMissingAlt();
        this.checkMissingLabels();
        this.checkHeadingStructure();
        this.checkContrast();
        this.checkKeyboardFocus();
        
        console.log(`检测完成，发现 ${this.issues.length} 个问题`);
        
        return {
            total: this.issues.length,
            issues: this.issues,
            timestamp: Date.now()
        };
    }

    checkMissingAlt() {
        const images = document.querySelectorAll('img');
        images.forEach((img, index) => {
            if (!img.alt || img.alt.trim() === '') {
                this.issues.push({
                    id: `alt-${index}`,
                    element: img,
                    message: '图片缺少alt属性',
                    suggestion: '为图片添加描述性的alt文本，帮助屏幕阅读器用户理解图片内容',
                    severity: 'error',
                    category: 'images'
                });
            }
        });
    }

    checkMissingLabels() {
        const inputs = document.querySelectorAll('input, textarea, select');
        inputs.forEach((input, index) => {
            // 跳过隐藏元素
            if (input.type === 'hidden') return;
            
            const hasLabel = input.labels && input.labels.length > 0;
            const hasAriaLabel = input.getAttribute('aria-label');
            const hasAriaLabelledby = input.getAttribute('aria-labelledby');
            const hasPlaceholder = input.placeholder;
            
            if (!hasLabel && !hasAriaLabel && !hasAriaLabelledby && !hasPlaceholder) {
                this.issues.push({
                    id: `label-${index}`,
                    element: input,
                    message: '表单元素缺少标签',
                    suggestion: '为表单元素添加label标签、aria-label属性或placeholder文本',
                    severity: 'error',
                    category: 'forms'
                });
            }
        });
    }

    checkHeadingStructure() {
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        let lastLevel = 0;
        let hasH1 = false;
        
        headings.forEach((heading, index) => {
            const currentLevel = parseInt(heading.tagName.charAt(1));
            
            // 检查是否有h1标题
            if (currentLevel === 1) {
                hasH1 = true;
            }
            
            // 检查标题层级跳跃
            if (lastLevel > 0 && currentLevel > lastLevel + 1) {
                this.issues.push({
                    id: `heading-skip-${index}`,
                    element: heading,
                    message: `标题层级跳跃：从h${lastLevel}直接跳到h${currentLevel}`,
                    suggestion: '标题应该按层级顺序使用，不要跳级',
                    severity: 'warning',
                    category: 'structure'
                });
            }
            
            // 检查空标题
            if (!heading.textContent.trim()) {
                this.issues.push({
                    id: `heading-empty-${index}`,
                    element: heading,
                    message: '标题内容为空',
                    suggestion: '为标题添加有意义的文本内容',
                    severity: 'error',
                    category: 'structure'
                });
            }
            
            lastLevel = currentLevel;
        });
        
        // 检查是否缺少h1标题
        if (headings.length > 0 && !hasH1) {
            this.issues.push({
                id: 'missing-h1',
                element: document.body,
                message: '页面缺少h1主标题',
                suggestion: '每个页面都应该有一个h1标题来描述页面主要内容',
                severity: 'warning',
                category: 'structure'
            });
        }
    }

    checkContrast() {
        const textElements = document.querySelectorAll('p, span, div, a, button, h1, h2, h3, h4, h5, h6, li, td, th');
        
        textElements.forEach((element, index) => {
            const text = element.textContent.trim();
            if (!text || text.length < 3) return;
            
            // 跳过包含其他文本元素的容器
            const hasTextChildren = Array.from(element.children).some(child => 
                ['P', 'SPAN', 'DIV', 'A', 'BUTTON', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6'].includes(child.tagName)
            );
            if (hasTextChildren) return;
            
            const style = window.getComputedStyle(element);
            const textColor = style.color;
            const bgColor = style.backgroundColor;
            const fontSize = parseFloat(style.fontSize);
            
            // 简化的对比度检查
            if (this.hasLowContrast(element, textColor, bgColor, fontSize)) {
                this.issues.push({
                    id: `contrast-${index}`,
                    element: element,
                    message: '文字对比度可能过低',
                    suggestion: '增加文字与背景的对比度，确保符合WCAG标准（正常文字4.5:1，大文字3:1）',
                    severity: 'warning',
                    category: 'color'
                });
            }
        });
    }

    checkKeyboardFocus() {
        const focusableElements = document.querySelectorAll(
            'a[href], button, input:not([type="hidden"]), textarea, select, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]'
        );
        
        focusableElements.forEach((element, index) => {
            const style = window.getComputedStyle(element);
            const outline = style.outline;
            const outlineWidth = style.outlineWidth;
            const boxShadow = style.boxShadow;
            
            // 检查是否有焦点样式
            const hasOutline = outline !== 'none' && outlineWidth !== '0px';
            const hasBoxShadow = boxShadow && boxShadow !== 'none';
            const hasBorder = style.border && style.border !== 'none';
            
            if (!hasOutline && !hasBoxShadow && !hasBorder) {
                this.issues.push({
                    id: `focus-${index}`,
                    element: element,
                    message: '可聚焦元素缺少明显的焦点样式',
                    suggestion: '为可聚焦元素添加outline、box-shadow或border等焦点样式',
                    severity: 'warning',
                    category: 'keyboard'
                });
            }
        });
    }

    hasLowContrast(element, textColor, bgColor, fontSize) {
        // 添加调试信息
        console.log('hasLowContrast called with:', {
            element: element,
            elementType: typeof element,
            isElement: element instanceof Element,
            textColor,
            bgColor,
            fontSize
        });
        
        // 简化的对比度检查逻辑
        if (!textColor || !bgColor) return false;
        if (bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') return false;
        
        try {
            // 解析颜色值
            const textRgb = this.parseColor(textColor);
            const bgRgb = this.parseColor(bgColor);
            
            if (!textRgb || !bgRgb) {
                console.warn('无法解析颜色值:', { textColor, bgColor });
                return false;
            }
            
            // 计算对比度
            const contrast = this.calculateContrast(textRgb, bgRgb);
            
            // WCAG标准：大文字(18pt+或14pt+粗体)需要3:1，普通文字需要4.5:1
            // 修复：确保传入element而不是textColor
            const isLargeText = fontSize >= 18 || (fontSize >= 14 && this.isBold(element));
            const requiredContrast = isLargeText ? 3 : 4.5;
            
            return contrast < requiredContrast;
        } catch (error) {
            console.error('hasLowContrast error:', error);
            return false;
        }
    }

    parseColor(color) {
        if (!color || color === 'transparent') return null;
        
        // 处理 rgb() 格式
        let rgb = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
        if (rgb) {
            return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
        }
        
        // 处理 rgba() 格式
        rgb = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/);
        if (rgb) {
            return [parseInt(rgb[1]), parseInt(rgb[2]), parseInt(rgb[3])];
        }
        
        // 处理十六进制格式
        rgb = color.match(/^#([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
        if (rgb) {
            return [parseInt(rgb[1], 16), parseInt(rgb[2], 16), parseInt(rgb[3], 16)];
        }
        
        // 处理简写十六进制格式
        rgb = color.match(/^#([a-f\d])([a-f\d])([a-f\d])$/i);
        if (rgb) {
            return [parseInt(rgb[1] + rgb[1], 16), parseInt(rgb[2] + rgb[2], 16), parseInt(rgb[3] + rgb[3], 16)];
        }
        
        // 处理常见颜色名称
        const colorMap = {
            'black': [0, 0, 0],
            'white': [255, 255, 255],
            'red': [255, 0, 0],
            'green': [0, 128, 0],
            'blue': [0, 0, 255],
            'yellow': [255, 255, 0],
            'cyan': [0, 255, 255],
            'magenta': [255, 0, 255],
            'gray': [128, 128, 128],
            'grey': [128, 128, 128]
        };
        
        return colorMap[color.toLowerCase()] || null;
    }

    calculateContrast(rgb1, rgb2) {
        // 计算相对亮度
        const l1 = this.getLuminance(rgb1);
        const l2 = this.getLuminance(rgb2);
        
        // 计算对比度
        const lighter = Math.max(l1, l2);
        const darker = Math.min(l1, l2);
        
        return (lighter + 0.05) / (darker + 0.05);
    }

    getLuminance([r, g, b]) {
        // 计算相对亮度
        const [rs, gs, bs] = [r, g, b].map(c => {
            c = c / 255;
            return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
        });
        
        return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    }

    isBold(element) {
        // 更强的参数验证
        if (!element) {
            console.warn('isBold: element is null or undefined');
            return false;
        }
        
        if (typeof element !== 'object') {
            console.warn('isBold: element is not an object, type:', typeof element, 'value:', element);
            return false;
        }
        
        if (!(element instanceof Element)) {
            console.warn('isBold: element is not an Element instance:', element);
            return false;
        }
        
        if (!element.isConnected) {
            console.warn('isBold: element is not connected to DOM');
            return false;
        }
        
        try {
            const style = window.getComputedStyle(element);
            const fontWeight = style.fontWeight;
            return fontWeight === 'bold' || parseInt(fontWeight) >= 600;
        } catch (error) {
            console.warn('获取元素样式失败:', error, 'element:', element);
            return false;
        }
    }
}