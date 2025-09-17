// 可视化标注器 - 在页面上标注不合规元素
class VisualAnnotator {
    constructor() {
        this.annotations = new Map();
        this.overlayContainer = null;
        this.isEnabled = false;
        this.init();
    }

    init() {
        this.createOverlayContainer();
        this.addStyles();
    }

    createOverlayContainer() {
        // 创建覆盖层容器
        this.overlayContainer = document.createElement('div');
        this.overlayContainer.id = 'accessibility-overlay-container';
        this.overlayContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 999999;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        `;
        document.body.appendChild(this.overlayContainer);
    }

    addStyles() {
        const styleId = 'accessibility-annotator-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .accessibility-annotation {
                position: absolute;
                border: 3px solid #ef4444;
                border-radius: 8px;
                background: rgba(239, 68, 68, 0.1);
                pointer-events: none;
                animation: pulse-border 2s infinite;
                box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
            }

            .accessibility-annotation.warning {
                border-color: #f59e0b;
                background: rgba(245, 158, 11, 0.1);
                box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
            }

            .accessibility-annotation.info {
                border-color: #3b82f6;
                background: rgba(59, 130, 246, 0.1);
                box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
            }

            @keyframes pulse-border {
                0%, 100% { 
                    border-width: 3px;
                    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
                }
                50% { 
                    border-width: 5px;
                    box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.5);
                }
            }

            .accessibility-tooltip {
                position: absolute;
                background: #1f2937;
                color: white;
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                line-height: 1.4;
                max-width: 300px;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
                z-index: 1000000;
                pointer-events: auto;
                cursor: pointer;
                transform: translateY(-100%);
                margin-top: -8px;
            }

            .accessibility-tooltip::after {
                content: '';
                position: absolute;
                top: 100%;
                left: 20px;
                border: 6px solid transparent;
                border-top-color: #1f2937;
            }

            .accessibility-tooltip .tooltip-title {
                font-weight: 600;
                margin-bottom: 4px;
                color: #ef4444;
            }

            .accessibility-tooltip.warning .tooltip-title {
                color: #f59e0b;
            }

            .accessibility-tooltip.info .tooltip-title {
                color: #3b82f6;
            }

            .accessibility-tooltip .tooltip-description {
                margin-bottom: 8px;
                opacity: 0.9;
            }

            .accessibility-tooltip .tooltip-suggestion {
                font-size: 13px;
                color: #10b981;
                font-weight: 500;
            }

            .accessibility-tooltip .tooltip-close {
                position: absolute;
                top: 8px;
                right: 12px;
                background: none;
                border: none;
                color: #9ca3af;
                cursor: pointer;
                font-size: 16px;
                line-height: 1;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .accessibility-tooltip .tooltip-close:hover {
                color: white;
            }

            .accessibility-controls {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 8px;
                padding: 12px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
                z-index: 1000001;
                display: flex;
                gap: 8px;
                align-items: center;
            }

            .accessibility-controls button {
                background: #3b82f6;
                color: white;
                border: none;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 12px;
                cursor: pointer;
                transition: background-color 0.2s;
            }

            .accessibility-controls button:hover {
                background: #2563eb;
            }

            .accessibility-controls button.active {
                background: #10b981;
            }

            .accessibility-controls .control-label {
                font-size: 12px;
                color: #6b7280;
                font-weight: 500;
            }
        `;
        document.head.appendChild(style);
    }

    // 标注单个元素
    annotateElement(element, issue) {
        if (!element || !this.isEnabled) return;

        const rect = element.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    
        // 创建标注框
        const annotation = document.createElement('div');
        annotation.className = `accessibility-annotation ${issue.severity}`;
        annotation.style.cssText = `
            left: ${rect.left + scrollLeft - 5}px;
            top: ${rect.top + scrollTop - 5}px;
            width: ${rect.width + 10}px;
            height: ${rect.height + 10}px;
        `;
    
        // 创建增强的提示框
        const tooltip = this.createEnhancedTooltip(issue);
        tooltip.style.cssText = `
            left: ${rect.left + scrollLeft}px;
            top: ${rect.top + scrollTop - 10}px;
            transform: translateY(-100%);
        `;
    
        // 添加到容器
        this.overlayContainer.appendChild(annotation);
        this.overlayContainer.appendChild(tooltip);
    
        // 存储标注信息
        const annotationId = issue.id || `annotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        this.annotations.set(annotationId, {
            element,
            annotation,
            tooltip,
            issue
        });
    
        // 添加交互事件
        annotation.addEventListener('click', (e) => {
            e.stopPropagation();
            this.highlightElement(element);
            tooltip.classList.toggle('expanded');
        });
    
        return annotationId;
    }
    
    createEnhancedTooltip(issue) {
        const tooltip = document.createElement('div');
        tooltip.className = `accessibility-tooltip enhanced ${issue.severity}`;
        
        tooltip.innerHTML = `
            <div class="tooltip-header">
                <span class="severity-badge ${issue.severity}">${issue.severity.toUpperCase()}</span>
                <button class="tooltip-close" title="关闭">&times;</button>
            </div>
            <div class="tooltip-content">
                <div class="tooltip-title">${issue.title}</div>
                <div class="tooltip-description">${issue.description}</div>
                <div class="tooltip-category">分类: ${issue.category}</div>
                ${issue.suggestion ? `
                    <div class="tooltip-suggestion">
                        <strong>💡 解决方案:</strong>
                        <div class="suggestion-content">${issue.suggestion}</div>
                    </div>
                ` : ''}
                ${issue.element ? `
                    <div class="tooltip-element-info">
                        <strong>🎯 元素信息:</strong>
                        <div class="element-details">
                            <div>标签: ${issue.element.tagName.toLowerCase()}</div>
                            ${issue.element.className ? `<div>类名: ${issue.element.className}</div>` : ''}
                            ${issue.element.id ? `<div>ID: ${issue.element.id}</div>` : ''}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="tooltip-actions">
                <button class="action-btn highlight" title="高亮元素">🔍 定位</button>
                <button class="action-btn copy" title="复制问题信息">📋 复制</button>
            </div>
        `;
    
        // 绑定事件
        this.bindTooltipEvents(tooltip, issue);
    
        return tooltip;
    }
    
    bindTooltipEvents(tooltip, issue) {
        // 关闭按钮
        const closeBtn = tooltip.querySelector('.tooltip-close');
        closeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            tooltip.style.display = 'none';
        });
        
        // 高亮按钮
        const highlightBtn = tooltip.querySelector('.action-btn.highlight');
        highlightBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (issue.element) {
                this.highlightElement(issue.element);
            }
        });
        
        // 复制按钮
        const copyBtn = tooltip.querySelector('.action-btn.copy');
        copyBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const issueText = `问题: ${issue.title}\n描述: ${issue.description}\n${issue.suggestion ? `解决方案: ${issue.suggestion}` : ''}`;
            navigator.clipboard.writeText(issueText).then(() => {
                copyBtn.textContent = '✅ 已复制';
                setTimeout(() => {
                    copyBtn.innerHTML = '📋 复制';
                }, 2000);
            });
        });
    }

    // 批量标注元素
    annotateIssues(issues) {
        this.clearAnnotations();
        
        issues.forEach(issue => {
            if (issue.element) {
                this.annotateElement(issue.element, issue);
            } else if (issue.selector) {
                const elements = document.querySelectorAll(issue.selector);
                elements.forEach(element => {
                    this.annotateElement(element, issue);
                });
            }
        });
    }

    // 高亮元素
    highlightElement(element) {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
        });
        
        // 临时高亮效果
        const originalStyle = element.style.cssText;
        element.style.cssText += `
            outline: 3px solid #10b981 !important;
            outline-offset: 2px !important;
            background: rgba(16, 185, 129, 0.1) !important;
        `;
        
        setTimeout(() => {
            element.style.cssText = originalStyle;
        }, 2000);
    }

    // 清除所有标注
    clearAnnotations() {
        this.annotations.forEach(({ annotation, tooltip }) => {
            if (annotation.parentNode) {
                annotation.parentNode.removeChild(annotation);
            }
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        this.annotations.clear();
    }

    // 启用/禁用标注
    setEnabled(enabled) {
        this.isEnabled = enabled;
        if (!enabled) {
            this.clearAnnotations();
        }
        this.overlayContainer.style.display = enabled ? 'block' : 'none';
    }

    // 创建控制面板
    createControls() {
        const controls = document.createElement('div');
        controls.className = 'accessibility-controls';
        controls.innerHTML = `
            <span class="control-label">可视化标注:</span>
            <button id="toggle-annotations" class="${this.isEnabled ? 'active' : ''}">
                ${this.isEnabled ? '关闭' : '开启'}
            </button>
            <button id="clear-annotations">清除</button>
        `;

        // 绑定事件
        const toggleBtn = controls.querySelector('#toggle-annotations');
        const clearBtn = controls.querySelector('#clear-annotations');

        toggleBtn.addEventListener('click', () => {
            this.isEnabled = !this.isEnabled;
            this.setEnabled(this.isEnabled);
            toggleBtn.textContent = this.isEnabled ? '关闭' : '开启';
            toggleBtn.classList.toggle('active', this.isEnabled);
        });

        clearBtn.addEventListener('click', () => {
            this.clearAnnotations();
        });

        document.body.appendChild(controls);
        return controls;
    }

    // 销毁标注器
    destroy() {
        this.clearAnnotations();
        if (this.overlayContainer && this.overlayContainer.parentNode) {
            this.overlayContainer.parentNode.removeChild(this.overlayContainer);
        }
        
        const style = document.getElementById('accessibility-annotator-styles');
        if (style) {
            style.remove();
        }
        
        const controls = document.querySelector('.accessibility-controls');
        if (controls) {
            controls.remove();
        }
    }
}