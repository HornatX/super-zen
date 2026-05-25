/*
 * 全新定制禅模式插件 (SuperZen)
 * 专注解决三大场景：正文全屏、左侧+正文、右侧+正文 (Base文件独立全屏)
 * 新增特性：智能双屏模式（左侧单屏，右侧双屏），并支持快捷键动态切换单双屏
 * 高级特性：极简悬浮侧边选项卡（彻底修复竖排文字被挤压的Bug，极致纯粹）
 * 增强特性：固定右侧悬浮标签机制
 */

import { App, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, View } from 'obsidian';

// --- 类型接口定义 ---
interface SuperZenSettings {
    keepDualPanes: boolean;
    verticalTabs: boolean;
    fixedRightTabs: boolean;
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

// 三大场景模式类
const MODE_CENTER_FULL = "superzen-mode-center-full";
const MODE_LEFT_AND_CENTER = "superzen-mode-left-center";
const MODE_RIGHT_BASE_FULL = "superzen-mode-right-base-full";
const MODE_RIGHT_AND_CENTER = "superzen-mode-right-center";

// 默认设置
const DEFAULT_SETTINGS: SuperZenSettings = {
    keepDualPanes: false,
    verticalTabs: false,
    fixedRightTabs: false
};

// --- 核心 CSS 样式 ---
const CSS_STYLES = `
/* ==========================================
   全局隐藏规则 
   ========================================== */
body.${BODY_ZEN_ACTIVE} .workspace-ribbon,
body.${BODY_ZEN_ACTIVE} .status-bar,
body.${BODY_ZEN_ACTIVE} .workspace-sidedock-vault-profile,
body.${BODY_ZEN_ACTIVE} .metadata-container,
body.${BODY_ZEN_ACTIVE} .metadata-properties-heading,
body.${BODY_ZEN_ACTIVE} .view-header,
body.${BODY_ZEN_ACTIVE} .nav-header,
body.${BODY_ZEN_ACTIVE} .search-header-container {
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
   注意：已升级为动态监听 ${VTAB_CONTAINER}
   ========================================== */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} {
    position: relative !important;
    overflow: visible !important;
}

/* 最外层容器：固定在右侧中间 */
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
    pointer-events: none; /* 防止空气墙挡住正文点击 */
    overflow: visible !important;
}

/* 🚀 强力清场：一刀切干掉所有杂项按钮（加号、下拉箭头、分屏图标等） */
body.${SETTING_VERTICAL_TABS_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} > .workspace-tab-header-container > * {
    display: none !important;
}

/* 🛡️ 白名单放行：唯独只允许包含文字选项卡的核心列表容器显示 */
body.${SETTING_VERTICAL_TABS_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} > .workspace-tab-header-container > .workspace-tab-header-container-inner {
    display: flex !important;
}

/* 内部列表：纵向排列 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-container-inner {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important; /* 选项卡之间的垂直距离 */
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
    border-right: 2px solid transparent !important; /* 给激活状态留的位置 */
    border-radius: 0 !important; 
    opacity: 0.3 !important; /* 默认幽灵状态 */
    transition: all 0.3s ease !important;
    cursor: pointer !important;
    box-shadow: none !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    flex: none !important; /* 绝对禁止被压缩 */
}

/* 重塑内部排版结构（打碎 Obsidian 的横向 Flex 限制） */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    height: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
}

/* 🔥 核心修复：强行让文字竖起来并显示全 🔥 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-title {
    
}

/* 极致干净：斩掉图标和关闭按钮（用鼠标中键关网页） */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-icon,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-close-button {
    display: none !important;
}

/* 激活态和悬浮态：极简微光（只有字变亮，右侧一条细线） */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header:hover,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header.is-active {
    opacity: 1 !important;
    background-color: transparent !important;
    border-right: 2px solid var(--interactive-accent) !important; /* 极细的高亮指示线 */
}

body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header.is-active .workspace-tab-header-inner-title {
    color: var(--interactive-accent) !important; /* 激活时字体颜色变为主色调 */
}

/* 防止遮挡正文：只作用于拥有垂直选项卡的面板 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-leaf .view-content {
    padding-right: 60px !important;
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

        // 核心快捷键：开关禅模式
        this.addCommand({
            id: "toggle-super-zen",
            name: "开启/关闭 定制禅模式",
            callback: () => this.toggleZenMode()
        });

        // 快捷键：在单屏和双屏之间动态切换
        this.addCommand({
            id: "toggle-super-zen-dual-pane",
            name: "切换 单屏/双屏 对照模式",
            callback: () => this.toggleDualPaneMode()
        });

        // 新增监听：如果用户在禅模式下拖动分屏，智能重新计算垂直标签宿主
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

    // 动态计算并绑定垂直标签栏宿主
    updateVTabContainer() {
        // 先清理所有旧的宿主标记
        document.querySelectorAll(`.${VTAB_CONTAINER}`).forEach(el => el.classList.remove(VTAB_CONTAINER));

        if (!this.isActive || !this.targetLeaf) return;

        const rootTabs = document.querySelectorAll('.workspace-split.mod-root .workspace-tabs');
        if (rootTabs.length === 0) return;

        // 只有当处在双屏模式下，才去执行“强制固定右侧”的逻辑
        const isDualPaneActive = document.body.classList.contains(SETTING_DUAL_PANE_CLASS);

        if (this.settings.fixedRightTabs && isDualPaneActive) {
            // 固定右侧模式：强制将 DOM 中最后一个(即最右侧)的窗口设为宿主
            const lastTab = rootTabs[rootTabs.length - 1];
            if (lastTab) {
                lastTab.classList.add(VTAB_CONTAINER);
            }
        } else {
            // 默认模式/单屏模式：标签跟随当前激活的宿主
            const targetContainer = (this.targetLeaf as any).containerEl?.closest('.workspace-tabs');
            if (targetContainer) {
                targetContainer.classList.add(VTAB_CONTAINER);
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
                    // ==========================================
                    // ✨ 新增逻辑：从双屏切回单屏时，动态转移焦点窗口 ✨
                    // ==========================================
                    let activeLeaf: WorkspaceLeaf | null = this.app.workspace.activeLeaf;
                    if (!activeLeaf) activeLeaf = this.app.workspace.getMostRecentLeaf();

                    // 如果当前存在活跃窗口，且不是原本进入禅模式时的窗口
                    if (activeLeaf && activeLeaf !== this.targetLeaf) {
                        // 1. 移除旧窗口的标识
                        if (this.targetLeaf && (this.targetLeaf as any).containerEl) {
                            (this.targetLeaf as any).containerEl.classList.remove(LEAF_TARGET);
                        }

                        // 2. 更新插件的焦点窗口指向
                        this.targetLeaf = activeLeaf;

                        // 3. 给新窗口打上标识 (CSS 依赖这个 Class 来保持单屏显示)
                        if ((this.targetLeaf as any).containerEl) {
                            (this.targetLeaf as any).containerEl.classList.add(LEAF_TARGET);
                        }

                        // 4. 重新判断新窗口是不是 Base 文件 (防止边距排版错乱)
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
                    // ==========================================

                    body.classList.remove(SETTING_DUAL_PANE_CLASS);
                    new Notice("SuperZen: 切换至【单屏独占】");
                }
                // 每次切换单双屏，都需要重新计算标签栏归属
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

        // 使用 as any 是为了防止某些 Obsidian 内部 API 未在官方 obsidian.d.ts 声明中暴露的问题
        const root = (this.targetLeaf as any).getRoot();
        const body = document.body;

        body.classList.add(BODY_ZEN_ACTIVE);
        const containerEl = (this.targetLeaf as any).containerEl;
        if (containerEl) containerEl.classList.add(LEAF_TARGET);

        // 应用竖排选项卡状态
        if (this.settings.verticalTabs) {
            body.classList.add(SETTING_VERTICAL_TABS_CLASS);
        }

        // --- 核心：智能双屏判断逻辑 ---
        if (this.settings.keepDualPanes) {
            // 只要在主编辑区，且开启了双屏模式，无条件添加双屏 Class（修复左侧进入失效的 Bug）
            if (root === (this.app.workspace as any).rootSplit) {
                body.classList.add(SETTING_DUAL_PANE_CLASS);
            }
        }

        let isBaseFile = false;
        const view: View = this.targetLeaf.view;
        if (view) {
            // 类型保护，防止 TypeScript 报错
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

        // 新增：进入禅模式完毕后，触发一次标签宿主的计算
        this.updateVTabContainer();
    }

    exitZenMode() {
        if (!this.isActive) return;

        const body = document.body;
        body.classList.remove(BODY_ZEN_ACTIVE);
        body.classList.remove(BASE_TARGET);
        body.classList.remove(SETTING_DUAL_PANE_CLASS);
        body.classList.remove(SETTING_VERTICAL_TABS_CLASS);

        if (this.currentModeClass) {
            body.classList.remove(this.currentModeClass);
        }

        if (this.targetLeaf && (this.targetLeaf as any).containerEl) {
            (this.targetLeaf as any).containerEl.classList.remove(LEAF_TARGET);
        }

        // 新增：退出时清理动态绑定的宿主类名
        document.querySelectorAll(`.${VTAB_CONTAINER}`).forEach(el => el.classList.remove(VTAB_CONTAINER));

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

        // 极简侧边栏设置
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

        // 固定右分屏标签 设置
        new Setting(containerEl)
            .setName('固定右分屏标签 (双屏模式专用)')
            .setDesc('默认关闭(跟随焦点窗口)。开启后：在双屏模式下无论焦点在哪，极简悬浮选项卡始终固定在右侧的分屏上。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.fixedRightTabs)
                .onChange(async (value) => {
                    this.plugin.settings.fixedRightTabs = value;
                    await this.plugin.saveSettings();
                    // 实时反馈生效
                    if (this.plugin.isActive) {
                        this.plugin.updateVTabContainer();
                    }
                }));
    }
}