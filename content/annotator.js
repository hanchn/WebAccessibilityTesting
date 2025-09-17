class PageAnnotator {
    constructor() {
        this.annotations = [];
        this.enabled = true;
        this.tooltipTimeout = null;
    }

    showAnnotations(issues) {
        if (!this.enabled) return;
        
        console.log(`显示 ${issues.length} 个标注`);
        this.clearAnnotations();
        
        issues.forEach((issue, index) => {
            this.createAnnotation(issue, index + 1);
        });
    }

    createAnnotation(issue, number) {
        const element = issue.element;
        if (!element || !document.body.contains(element)) return;

        // 创建标注容器
        const annotation = document.createElement('div');
        annotation.className = 'accessibility-annotation';
        annotation.setAttribute('data-issue-id', issue.id);
        annotation.setAttribute('data-severity', issue.severity);
        
        // 获取元素位置
        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        
        // 设置标注样式和位置
        const borderColor = issue.severity === 'error' ? '#ff4444' : '#ff8800';
        annotation.style.cssText = `
            position: absolute;
            top: ${rect.top + scrollTop - 2}px;
            left: ${rect.left + scrollLeft - 2}px;
            width: ${rect.width + 4}px;
            height: ${rect.height + 4}px;
            border: 2px solid ${borderColor};
            border-radius: 4px;
            pointer-events: none;
            z-index: 10000;
            box-sizing: border-box;
            animation: accessibility-pulse 2s ease-in-out;
        `;

        // 创建问题标签
        const label = document.createElement('div');
        label.className = 'accessibility-label';
        label.textContent = number;
        label.style.cssText = `
            position: absolute;
            top: -12px;
            left: -2px;
            background: ${borderColor};
            color: white;
            padding: 2px 6px;
            border-radius: 10px;
            font-size: 11px;
            font-weight: bold;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1;
            min-width: 16px;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3);
        `;

        // 创建提示框
        const tooltip = document.createElement('div');
        tooltip.className = 'accessibility-tooltip';
        tooltip.innerHTML = `
            <div class="tooltip-title">${issue.message}</div>
            <div class="tooltip-suggestion">${issue.suggestion}</div>
            <div class="tooltip-category">${this.getCategoryName(issue.category)} · ${this.getSeverityName(issue.severity)}</div>
        `;
        tooltip.style.cssText = `
            position: absolute;
            top: -80px;
            left: 0;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            white-space: nowrap;
            max-width: 300px;
            white-space: normal;
            z-index: 10001;
            opacity: 0;
            transform: translateY(5px);
            transition: all 0.2s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.4);
            pointer-events: auto;
        `;

        // 添加鼠标事件
        annotation.addEventListener('mouseenter', () => {
            clearTimeout(this.tooltipTimeout);
            tooltip.style.opacity = '1';
            tooltip.style.transform = 'translateY(0)';
        });

        annotation.addEventListener('mouseleave', () => {
            this.tooltipTimeout = setTimeout(() => {
                tooltip.style.opacity = '0';
                tooltip.style.transform = 'translateY(5px)';
            }, 100);
        });

        // 组装标注
        annotation.appendChild(label);
        annotation.appendChild(tooltip);
        document.body.appendChild(annotation);
        
        this.annotations.push(annotation);
        
        // 添加点击高亮效果
        this.addClickHighlight(element, annotation);
    }

    addClickHighlight(element, annotation) {
        const highlight = () => {
            element.style.transition = 'background-color 0.3s ease';
            const originalBg = element.style.backgroundColor;
            element.style.backgroundColor = 'rgba(255, 68, 68, 0.1)';
            
            setTimeout(() => {
                element.style.backgroundColor = originalBg;
            }, 1000);
        };

        annotation.addEventListener('click', highlight);
        element.addEventListener('click', highlight);
    }

    clearAnnotations() {
        this.annotations.forEach(annotation => {
            if (annotation.parentNode) {
                annotation.parentNode.removeChild(annotation);
            }
        });
        this.annotations = [];
    }

    setEnabled(enabled) {
        this.enabled = enabled;
        if (!enabled) {
            this.clearAnnotations();
        }
    }

    getCategoryName(category) {
        const categories = {
            'images': '图片',
            'forms': '表单',
            'structure': '结构',
            'color': '颜色',
            'keyboard': '键盘'
        };
        return categories[category] || category;
    }

    getSeverityName(severity) {
        const severities = {
            'error': '错误',
            'warning': '警告'
        };
        return severities[severity] || severity;
    }

    // 响应窗口大小变化，重新定位标注
    updateAnnotationPositions() {
        this.annotations.forEach(annotation => {
            const issueId = annotation.getAttribute('data-issue-id');
            const element = document.querySelector(`[data-issue-id="${issueId}"]`);
            
            if (element) {
                const rect = element.getBoundingClientRect();
                const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
                const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
                
                annotation.style.top = `${rect.top + scrollTop - 2}px`;
                annotation.style.left = `${rect.left + scrollLeft - 2}px`;
                annotation.style.width = `${rect.width + 4}px`;
                annotation.style.height = `${rect.height + 4}px`;
            }
        });
    }
}

// 监听窗口大小变化
window.addEventListener('resize', () => {
    if (window.pageAnnotator) {
        window.pageAnnotator.updateAnnotationPositions();
    }
});