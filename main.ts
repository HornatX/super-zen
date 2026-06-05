/*
 * 全新定制禅模式插件 (SuperZen)
 * 专注解决三大场景：正文全屏、左侧+正文、右侧+正文 (Base文件独立全屏)
 * 新增特性：智能双屏模式（左侧单屏，右侧双屏），并支持快捷键动态切换单双屏
 * 高级特性：极简悬浮侧边选项卡（彻底修复竖排文字被挤压的Bug，极致纯粹）
 * 增强特性：固定右侧悬浮标签机制
 * 新增特性：可配置是否在禅模式下隐藏笔记属性区域 (Properties)
 * 新增特性：双屏模式下支持左右两侧独立显示悬浮标签 (左右标签)
 */

import { App, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, View } from 'obsidian';

// --- 类型接口定义 ---
interface SuperZenSettings {
    keepDualPanes: boolean;
    verticalTabs: boolean;
    fixedRightTabs: boolean;
    hideProperties: boolean; 
    splitTabs: boolean; // 【新增】左右标签模式
}

// --- 常量定义 ---
const STYLE_ID = "superzen-custom-style";

// 全局状态类
const BODY_ZEN_ACTIVE = "superzen-is-active";
const LEAF_TARGET = "superzen-target-leaf";
const BASE_TARGET = "superzen-is-base-target";
const SETTING_DUAL_PANE_CLASS = "superzen-dual-pane-mode";
const SETTING_VERTICAL_TABS_CLASS = "superzen-vertical-tabs";
const VTAB_CONTAINER = "superzen-vtab-container"; // 垂直标签的动态宿主
const SETTING_HIDE_PROPERTIES_CLASS = "superzen-hide-properties"; 
const SETTING_SPLIT_TABS_CLASS = "superzen-split-tabs"; // 【新增】左右标签控制类

// 三大场景模式类
const MODE_CENTER_FULL = "superzen-mode-center-full";
const MODE_LEFT_AND_CENTER = "superzen-mode-left-center";
const MODE_RIGHT_BASE_FULL = "superzen-mode-right-base-full";
const MODE_RIGHT_AND_CENTER = "superzen-mode-right-center";

// 默认设置
const DEFAULT_SETTINGS: SuperZenSettings = {
    keepDualPanes: false,
    verticalTabs: false,
    fixedRightTabs: false,
    hideProperties: true,
    splitTabs: false // 【新增】默认关闭，保持原来逻辑
};

// --- 核心 CSS 样式 ---
const CSS_STYLES = `
/* ==========================================
   全局隐藏规则 
   ========================================== */
body.${BODY_ZEN_ACTIVE} .workspace-ribbon,
body.${BODY_ZEN_ACTIVE} .status-bar,
body.${BODY_ZEN_ACTIVE} .workspace-sidedock-vault-profile,
body.${BODY_ZEN_ACTIVE} .view-header,
body.${BODY_ZEN_ACTIVE} .nav-header,
body.${BODY_ZEN_ACTIVE} .search-header-container {
    display: none !important;
}

body.${BODY_ZEN_ACTIVE}.${SETTING_HIDE_PROPERTIES_CLASS} .metadata-container,
body.${BODY_ZEN_ACTIVE}.${SETTING_HIDE_PROPERTIES_CLASS} .metadata-properties-heading {
    display: none !important;
}

body.${BODY_ZEN_ACTIVE} .titlebar,
body.${BODY_ZEN_ACTIVE} .workspace-tab-header-container,
body.${BODY_ZEN_ACTIVE} .workspace-leaf.${LEAF_TARGET} .view-header {
    display: none !important;
}

body.${BODY_ZEN_ACTIVE} .floating-heading-container {
    display: none !important;
}

/* 拖拽条隐藏逻辑 */
body.${BODY_ZEN_ACTIVE} .workspace-split.mod-left-split > .workspace-leaf-resize-handle,
body.${BODY_ZEN_ACTIVE} .workspace-split.mod-right-split > .workspace-leaf-resize-handle {
    display: none !important;
}
body.${BODY_ZEN_ACTIVE}:not(.${SETTING_DUAL_PANE_CLASS}) .workspace-split.mod-root .workspace-leaf-resize-handle {
    display: none !important;
}

/* 逻辑一：正文全屏 */
body.${MODE_CENTER_FULL} .workspace-split.mod-left-split,
body.${MODE_CENTER_FULL} .workspace-split.mod-right-split {
    display: none !important;
}
body.${MODE_CENTER_FULL} .workspace-split.mod-root .workspace-tab-header-container {
    display: none !important;
}

/* 智能双屏逻辑 */
body.${MODE_CENTER_FULL}:not(.${SETTING_DUAL_PANE_CLASS}) .workspace-split.mod-root .workspace-leaf:not(.${LEAF_TARGET}),
body.${MODE_CENTER_FULL}:not(.${SETTING_DUAL_PANE_CLASS}) .workspace-split.mod-root .workspace-tabs:not(:has(.${LEAF_TARGET})),
body.${MODE_CENTER_FULL}:not(.${SETTING_DUAL_PANE_CLASS}) .workspace-split.mod-root .workspace-split:not(:has(.${LEAF_TARGET})) {
    display: none !important;
}

/* 逻辑二：左侧 + 正文 */
body.${MODE_LEFT_AND_CENTER} .workspace-split.mod-right-split {
    display: none !important;
}
body.${MODE_LEFT_AND_CENTER} .workspace-split.mod-left-split .workspace-tab-header-container,
body.${MODE_LEFT_AND_CENTER} .workspace-split.mod-root .workspace-tab-header-container {
    display: none !important;
}
body.${MODE_LEFT_AND_CENTER} .workspace-split.mod-left-split .workspace-leaf:not(.${LEAF_TARGET}),
body.${MODE_LEFT_AND_CENTER} .workspace-split.mod-left-split .workspace-tabs:not(:has(.${LEAF_TARGET})) {
    display: none !important;
}

/* 逻辑三 (A)：右侧 Base 文件全屏 */
body.${MODE_RIGHT_BASE_FULL} .workspace-split.mod-left-split,
body.${MODE_RIGHT_BASE_FULL} .workspace-split.mod-root {
    display: none !important;
}
body.${MODE_RIGHT_BASE_FULL} .workspace-split.mod-right-split .workspace-tab-header-container {
    display: none !important;
}
body.${MODE_RIGHT_BASE_FULL} .workspace-split.mod-right-split .workspace-leaf:not(.${LEAF_TARGET}),
body.${MODE_RIGHT_BASE_FULL} .workspace-split.mod-right-split .workspace-tabs:not(:has(.${LEAF_TARGET})),
body.${MODE_RIGHT_BASE_FULL} .workspace-split.mod-right-split .workspace-split:not(:has(.${LEAF_TARGET})) {
    display: none !important;
}
body.${MODE_RIGHT_BASE_FULL} .workspace-split.mod-right-split {
    width: 100% !important;
    max-width: none !important;
    flex-grow: 1 !important;
    border: none !important;
}

/* 逻辑三 (B)：右侧普通面板 + 正文 */
body.${MODE_RIGHT_AND_CENTER} .workspace-split.mod-left-split {
    display: none !important;
}
body.${MODE_RIGHT_AND_CENTER} .workspace-split.mod-right-split .workspace-tab-header-container,
body.${MODE_RIGHT_AND_CENTER} .workspace-split.mod-root .workspace-tab-header-container {
    display: none !important;
}
body.${MODE_RIGHT_AND_CENTER} .workspace-split.mod-right-split .workspace-leaf:not(.${LEAF_TARGET}),
body.${MODE_RIGHT_AND_CENTER} .workspace-split.mod-right-split .workspace-tabs:not(:has(.${LEAF_TARGET})) {
    display: none !important;
}

/* 全局 Base 留白规则 */
body.${BASE_TARGET} .workspace-leaf.${LEAF_TARGET} .view-content {
    padding-left: 15vw !important;
    padding-right: 15vw !important;
}

/* ==========================================
   ✨ 终极版：极简侧边悬浮字 (破除挤压限制) ✨
   ========================================== */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} {
    position: relative !important;
    overflow: visible !important;
}

/* 最外层容器：默认固定在右侧中间 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} > .workspace-tab-header-container {
    display: flex !important;
    position: absolute !important;
    right: 10px !important; 
    top: 50% !important;
    transform: translateY(-50%) !important; 
    width: 32px !important;
    height: auto !important;
    max-height: 90vh !important;
    flex-direction: column !important;
    background: transparent !important;
    border: none !important;
    box-shadow: none !important;
    z-index: 99 !important;
    pointer-events: none; 
    overflow: visible !important;
}

/* 🚀 强力清场 */
body.${SETTING_VERTICAL_TABS_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} > .workspace-tab-header-container > * {
    display: none !important;
}

/* 🛡️ 白名单放行 */
body.${SETTING_VERTICAL_TABS_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} > .workspace-tab-header-container > .workspace-tab-header-container-inner {
    display: flex !important;
}

/* 内部列表：纵向排列 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-container-inner {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important; 
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: auto;
    overflow: visible !important;
}

/* 单个选项卡的外部区块（极简透明） */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header {
    width: 32px !important;
    height: auto !important;
    min-height: 60px !important;
    padding: 8px 0 !important;
    margin: 0 !important;
    background-color: transparent !important; 
    border: none !important;
    border-right: 2px solid transparent !important; 
    border-radius: 0 !important; 
    opacity: 0.3 !important; 
    transition: all 0.3s ease !important;
    cursor: pointer !important;
    box-shadow: none !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    flex: none !important; 
}

/* 重塑内部排版结构 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    height: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
}

/* 🔥 核心修复：强行让文字竖起来并显示全 (接入补丁) 🔥 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-title {
    writing-mode: vertical-rl !important;
    text-orientation: upright !important;
    white-space: normal !important;
    word-break: keep-all !important;
    overflow: visible !important;
    text-overflow: clip !important;
    text-align: center !important;
    font-size: 20px !important;
    font-weight: 500 !important;
    letter-spacing: 4px !important;
    line-height: 1 !important;
    display: block !important;
    flex: none !important;
    transform: none !important;
    color: var(--text-normal) !important;
    padding: 0px 10px 0px 0px !important;
    /* 👇 加上下面这三行，防止鼠标焦点或光标残留 */
    user-select: none !important;
    -webkit-user-select: none !important;
    outline: none !important;
}

/* 🗡️ 彻底斩杀 Obsidian 原生的选项卡分隔线 (伪元素) 和残留阴影 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header::before,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header::after,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner::before,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner::after {
    display: none !important;
    content: none !important;
}

/* 清除可能存在的内边框和阴影 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner {
    box-shadow: none !important;
    border: none !important;
}

/* 极致干净：斩掉图标和关闭按钮 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-icon,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-close-button {
    display: none !important;
}

/* 激活态和悬浮态 (默认右侧效果) */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header:hover,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header.is-active {
    opacity: 1 !important;
    background-color: transparent !important;
    border-right: 2px solid var(--interactive-accent) !important; 
}

body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header.is-active .workspace-tab-header-inner-title {
    color: var(--interactive-accent) !important; 
}

/* 防止遮挡正文：只作用于拥有垂直选项卡的面板 (接入补丁，修改为 0px) */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-leaf .view-content {
    padding-right: 0px !important;
}

/* ==========================================
   🌟 新增特性：左右标签分离模式 
   ========================================== */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL}.${SETTING_SPLIT_TABS_CLASS} .workspace-split.mod-root .${VTAB_CONTAINER}.superzen-vtab-left > .workspace-tab-header-container {
    right: auto !important;
    left: -14px !important; /* 强制停靠左侧 */
    position: fixed !important; /* 💡 强烈建议加上这一行 */
}

/* 左侧标签的边框镜像反转 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL}.${SETTING_SPLIT_TABS_CLASS} .workspace-split.mod-root .${VTAB_CONTAINER}.superzen-vtab-left .workspace-tab-header {
    border-right: none !important;
    border-left: 2px solid transparent !important;
}

body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL}.${SETTING_SPLIT_TABS_CLASS} .workspace-split.mod-root .${VTAB_CONTAINER}.superzen-vtab-left .workspace-tab-header:hover,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL}.${SETTING_SPLIT_TABS_CLASS} .workspace-split.mod-root .${VTAB_CONTAINER}.superzen-vtab-left .workspace-tab-header.is-active {
    border-right: none !important;
    border-left: 2px solid var(--interactive-accent) !important; 
}

/* 左侧标签的内边距镜像反转 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL}.${SETTING_SPLIT_TABS_CLASS} .workspace-split.mod-root .${VTAB_CONTAINER}.superzen-vtab-left .workspace-tab-header-inner-title {
    padding: 0px 0px 0px 10px !important; 
}
`;

export default class SuperZenPlugin extends Plugin {
    settings: SuperZenSettings;
    isActive: boolean;
    targetLeaf: WorkspaceLeaf | null;
    currentModeClass: string | null;
    styleEl: HTMLStyleElement | null;

    async onload() {
        this.isActive = false;
        this.targetLeaf = null;
        this.currentModeClass = null;

        await this.loadSettings();

        this.handleFullscreenChange = this.handleFullscreenChange.bind(this);

        this.injectStyles();
        this.addSettingTab(new SuperZenSettingTab(this.app, this));

        this.addCommand({
            id: "toggle-super-zen",
            name: "开启/关闭 定制禅模式",
            callback: () => this.toggleZenMode()
        });

        this.addCommand({
            id: "toggle-super-zen-dual-pane",
            name: "切换 单屏/双屏 对照模式",
            callback: () => this.toggleDualPaneMode()
        });

        this.registerEvent(
            this.app.workspace.on("layout-change", () => {
                if (this.isActive) {
                    this.updateVTabContainer();
                }
            })
        );
    }

    onunload() {
        this.exitZenMode();
        this.removeStyles();
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    injectStyles() {
        if (!document.getElementById(STYLE_ID)) {
            this.styleEl = document.createElement('style');
            this.styleEl.id = STYLE_ID;
            this.styleEl.innerHTML = CSS_STYLES;
            document.head.appendChild(this.styleEl);
        }
    }

    removeStyles() {
        const styleEl = document.getElementById(STYLE_ID);
        if (styleEl) {
            styleEl.remove();
        }
    }

    updateVTabContainer() {
        // 先清理全局已挂载的类
        document.querySelectorAll(`.${VTAB_CONTAINER}`).forEach(el => {
            el.classList.remove(VTAB_CONTAINER);
            el.classList.remove('superzen-vtab-left');
            el.classList.remove('superzen-vtab-right');
        });

        if (!this.isActive || !this.targetLeaf) return;

        const rootTabs = document.querySelectorAll('.workspace-split.mod-root .workspace-tabs');
        if (rootTabs.length === 0) return;

        const isDualPaneActive = document.body.classList.contains(SETTING_DUAL_PANE_CLASS);

        // 新增的“左右标签”逻辑 (需至少两个面板才进行分列)
        if (this.settings.splitTabs && isDualPaneActive && rootTabs.length > 1) {
            // 第一个面板的标签挂在左边
            const firstTab = rootTabs[0];
            firstTab.classList.add(VTAB_CONTAINER, 'superzen-vtab-left');
            
            // 最后一个面板的标签挂在右边
            const lastTab = rootTabs[rootTabs.length - 1];
            lastTab.classList.add(VTAB_CONTAINER, 'superzen-vtab-right');
        } else {
            // 维持原来的处理逻辑（固定右侧 或 跟随焦点）
            if (this.settings.fixedRightTabs && isDualPaneActive) {
                const lastTab = rootTabs[rootTabs.length - 1];
                if (lastTab) {
                    lastTab.classList.add(VTAB_CONTAINER);
                }
            } else {
                const targetContainer = (this.targetLeaf as any).containerEl?.closest('.workspace-tabs');
                if (targetContainer) {
                    targetContainer.classList.add(VTAB_CONTAINER);
                }
            }
        }
    }

    toggleZenMode() {
        if (this.isActive) {
            this.exitZenMode();
        } else {
            this.enterZenMode();
        }
    }

    async toggleDualPaneMode() {
        this.settings.keepDualPanes = !this.settings.keepDualPanes;
        await this.saveSettings();

        const statusStr = this.settings.keepDualPanes ? "开启" : "关闭";

        if (this.isActive) {
            if (this.currentModeClass === MODE_CENTER_FULL) {
                const body = document.body;
                if (this.settings.keepDualPanes) {
                    body.classList.add(SETTING_DUAL_PANE_CLASS);
                    new Notice("SuperZen: 切换至【双屏对照】");
                } else {
                    let activeLeaf: WorkspaceLeaf | null = this.app.workspace.activeLeaf;
                    if (!activeLeaf) activeLeaf = this.app.workspace.getMostRecentLeaf();

                    if (activeLeaf && activeLeaf !== this.targetLeaf) {
                        if (this.targetLeaf && (this.targetLeaf as any).containerEl) {
                            (this.targetLeaf as any).containerEl.classList.remove(LEAF_TARGET);
                        }

                        this.targetLeaf = activeLeaf;

                        if ((this.targetLeaf as any).containerEl) {
                            (this.targetLeaf as any).containerEl.classList.add(LEAF_TARGET);
                        }

                        let isBaseFile = false;
                        const view: View = this.targetLeaf.view;
                        if (view) {
                            const file = (view as any).file;
                            if (file && file.extension === 'base') {
                                isBaseFile = true;
                            } else if (view.getViewType() === 'base') {
                                isBaseFile = true;
                            }
                        }

                        if (isBaseFile) {
                            body.classList.add(BASE_TARGET);
                        } else {
                            body.classList.remove(BASE_TARGET);
                        }
                    }

                    body.classList.remove(SETTING_DUAL_PANE_CLASS);
                    new Notice("SuperZen: 切换至【单屏独占】");
                }
                this.updateVTabContainer();
            } else {
                new Notice(`SuperZen: 默认双屏状态已${statusStr} (仅在正文全屏生效)`);
            }
        } else {
            new Notice(`SuperZen: 默认双屏状态已更改为【${statusStr}】`);
        }
    }

    enterZenMode() {
        let activeLeaf: WorkspaceLeaf | null = this.app.workspace.activeLeaf;
        if (!activeLeaf) {
            activeLeaf = this.app.workspace.getMostRecentLeaf();
        }

        if (!activeLeaf) {
            const domActive = document.querySelector('.workspace-leaf.mod-active');
            if (domActive) {
                this.app.workspace.iterateAllLeaves((leaf) => {
                    const leafContainer = (leaf as any).containerEl;
                    if (leafContainer === domActive || leafContainer?.contains(domActive)) {
                        activeLeaf = leaf;
                    }
                });
            }
        }

        if (!activeLeaf) {
            new Notice("SuperZen: 未找到可激活的窗口");
            return;
        }

        this.targetLeaf = activeLeaf;
        this.isActive = true;

        const root = (this.targetLeaf as any).getRoot();
        const body = document.body;

        body.classList.add(BODY_ZEN_ACTIVE);
        
        if (this.settings.hideProperties) {
            body.classList.add(SETTING_HIDE_PROPERTIES_CLASS);
        }

        const containerEl = (this.targetLeaf as any).containerEl;
        if (containerEl) containerEl.classList.add(LEAF_TARGET);

        if (this.settings.verticalTabs) {
            body.classList.add(SETTING_VERTICAL_TABS_CLASS);
        }

        // 应用左右标签专属类
        if (this.settings.splitTabs) {
            body.classList.add(SETTING_SPLIT_TABS_CLASS);
        }

        if (this.settings.keepDualPanes) {
            if (root === (this.app.workspace as any).rootSplit) {
                body.classList.add(SETTING_DUAL_PANE_CLASS);
            }
        }

        let isBaseFile = false;
        const view: View = this.targetLeaf.view;
        if (view) {
            const file = (view as any).file;
            if (file && file.extension === 'base') {
                isBaseFile = true;
            } else if (view.getViewType() === 'base') {
                isBaseFile = true;
            }
        }

        if (isBaseFile) {
            body.classList.add(BASE_TARGET);
        }

        if (root === (this.app.workspace as any).rootSplit) {
            this.currentModeClass = MODE_CENTER_FULL;
            body.classList.add(MODE_CENTER_FULL);
        } else if (root === (this.app.workspace as any).leftSplit) {
            this.currentModeClass = MODE_LEFT_AND_CENTER;
            body.classList.add(MODE_LEFT_AND_CENTER);
        } else if (root === (this.app.workspace as any).rightSplit) {
            if (isBaseFile) {
                this.currentModeClass = MODE_RIGHT_BASE_FULL;
                body.classList.add(MODE_RIGHT_BASE_FULL);
            } else {
                this.currentModeClass = MODE_RIGHT_AND_CENTER;
                body.classList.add(MODE_RIGHT_AND_CENTER);
            }
        }

        if (!document.fullscreenElement) {
            document.body.requestFullscreen().catch(err => {
                console.warn("SuperZen: 请求全屏失败, 但继续执行专注模式", err);
            });
        }

        document.addEventListener('fullscreenchange', this.handleFullscreenChange);
        this.updateVTabContainer();
    }

    exitZenMode() {
        if (!this.isActive) return;

        const body = document.body;
        body.classList.remove(BODY_ZEN_ACTIVE);
        body.classList.remove(BASE_TARGET);
        body.classList.remove(SETTING_DUAL_PANE_CLASS);
        body.classList.remove(SETTING_VERTICAL_TABS_CLASS);
        body.classList.remove(SETTING_HIDE_PROPERTIES_CLASS); 
        body.classList.remove(SETTING_SPLIT_TABS_CLASS); // 移除左右标签类

        if (this.currentModeClass) {
            body.classList.remove(this.currentModeClass);
        }

        if (this.targetLeaf && (this.targetLeaf as any).containerEl) {
            (this.targetLeaf as any).containerEl.classList.remove(LEAF_TARGET);
        }

        document.querySelectorAll(`.${VTAB_CONTAINER}`).forEach(el => {
            el.classList.remove(VTAB_CONTAINER);
            el.classList.remove('superzen-vtab-left');
            el.classList.remove('superzen-vtab-right');
        });

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(() => { });
        }

        document.removeEventListener('fullscreenchange', this.handleFullscreenChange);

        this.isActive = false;
        this.targetLeaf = null;
        this.currentModeClass = null;
    }

    handleFullscreenChange() {
        if (!document.fullscreenElement && this.isActive) {
            this.exitZenMode();
        }
    }
}

// 设置面板
class SuperZenSettingTab extends PluginSettingTab {
    plugin: SuperZenPlugin;

    constructor(app: App, plugin: SuperZenPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        containerEl.createEl('h2', { text: 'SuperZen 定制禅模式设置' });

        new Setting(containerEl)
            .setName('双屏模式')
            .setDesc('开启后，进入禅模式时将保留多窗格同屏对照。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.keepDualPanes)
                .onChange(async (value) => {
                    this.plugin.settings.keepDualPanes = value;
                    await this.plugin.saveSettings();
                }));

        new Setting(containerEl)
            .setName('隐藏笔记属性区域 (Properties)')
            .setDesc('开启后，进入禅模式将自动隐藏文档顶部的属性信息面板（YAML区域），让写作更沉浸。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.hideProperties)
                .onChange(async (value) => {
                    this.plugin.settings.hideProperties = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.isActive) {
                        if (value) {
                            document.body.classList.add(SETTING_HIDE_PROPERTIES_CLASS);
                        } else {
                            document.body.classList.remove(SETTING_HIDE_PROPERTIES_CLASS);
                        }
                    }
                }));

        new Setting(containerEl)
            .setName('极简悬浮选项卡 (边缘悬浮文字)')
            .setDesc('彻底去框化：选项卡变为纯粹文字悬浮，解决横向挤压变形问题。未激活呈半透明幽灵态，激活时字体点亮并带边缘线。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.verticalTabs)
                .onChange(async (value) => {
                    this.plugin.settings.verticalTabs = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.isActive) {
                        if (value) {
                            document.body.classList.add(SETTING_VERTICAL_TABS_CLASS);
                        } else {
                            document.body.classList.remove(SETTING_VERTICAL_TABS_CLASS);
                        }
                    }
                }));

        new Setting(containerEl)
            .setName('固定右分屏标签 (双屏模式专用)')
            .setDesc('默认关闭(跟随焦点窗口)。开启后：在双屏模式下无论焦点在哪，极简悬浮选项卡始终固定在右侧的分屏上。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.fixedRightTabs)
                .onChange(async (value) => {
                    this.plugin.settings.fixedRightTabs = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.isActive) {
                        this.plugin.updateVTabContainer();
                    }
                }));

        // 【新增】左右标签开关
        new Setting(containerEl)
            .setName('左右标签 (双屏模式专用)')
            .setDesc('关闭时，保持当前行为(仅单侧显示，跟随焦点或固定右侧)。开启后：双屏对照时，左侧屏幕的选项卡固定在左侧边缘，右侧屏幕的选项卡固定在右侧边缘。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.splitTabs)
                .onChange(async (value) => {
                    this.plugin.settings.splitTabs = value;
                    await this.plugin.saveSettings();
                    // 支持禅模式下实时生效
                    if (this.plugin.isActive) {
                        if (value) {
                            document.body.classList.add(SETTING_SPLIT_TABS_CLASS);
                        } else {
                            document.body.classList.remove(SETTING_SPLIT_TABS_CLASS);
                        }
                        this.plugin.updateVTabContainer();
                    }
                }));
    }
}