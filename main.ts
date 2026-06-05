/*
 * 全新定制禅模式插件 (SuperZen) - 优化版
 * 专注解决三大场景：正文全屏、左侧+正文、右侧+正文 (Base文件独立全屏)
 * 新增特性：智能双屏模式（左侧单屏，右侧双屏），并支持快捷键动态切换单双屏
 * 高级特性：极简悬浮侧边选项卡（彻底修复竖排文字被挤压的Bug，极致纯粹）
 * 增强特性：固定右侧悬浮标签机制
 * 新增特性：可配置是否在禅模式下隐藏笔记属性区域 (Properties)
 * 新增特性：双屏模式下支持左右两侧独立显示悬浮标签 (左右标签)
 * 优化：完全符合Obsidian插件审核要求
 */

import { App, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, View } from 'obsidian';

// --- 类型接口定义 ---
interface SuperZenSettings {
    keepDualPanes: boolean;
    verticalTabs: boolean;
    fixedRightTabs: boolean;
    hideProperties: boolean; 
    splitTabs: boolean;
}

// --- 类型安全扩展 ---
interface ExtendedWorkspaceLeaf extends WorkspaceLeaf {
    containerEl?: HTMLElement;
}

interface ExtendedWorkspace {
    rootSplit: any;
    leftSplit: any;
    rightSplit: any;
    getActiveViewOfType<T extends View>(type: new (...args: any[]) => T): T | null;
    getMostRecentLeaf(): ExtendedWorkspaceLeaf | null;
    getLeaf(newLeaf?: boolean): ExtendedWorkspaceLeaf;
}

// --- 常量定义 ---
// 全局状态类
const BODY_ZEN_ACTIVE = "superzen-is-active";
const LEAF_TARGET = "superzen-target-leaf";
const BASE_TARGET = "superzen-is-base-target";
const SETTING_DUAL_PANE_CLASS = "superzen-dual-pane-mode";
const SETTING_VERTICAL_TABS_CLASS = "superzen-vertical-tabs";
const VTAB_CONTAINER = "superzen-vtab-container";
const SETTING_HIDE_PROPERTIES_CLASS = "superzen-hide-properties"; 
const SETTING_SPLIT_TABS_CLASS = "superzen-split-tabs";

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
    splitTabs: false
};

export default class SuperZenPlugin extends Plugin {
    settings!: SuperZenSettings;
    isActive = false;
    targetLeaf: ExtendedWorkspaceLeaf | null = null;
    currentModeClass: string | null = null;

    async onload() {
        await this.loadSettings();
        
        this.handleFullscreenChange = this.handleFullscreenChange.bind(this);

        this.addSettingTab(new SuperZenSettingTab(this.app, this));

        // 修正：command ID 不包含插件ID
        this.addCommand({
            id: "toggle-zen-mode",
            name: "开启/关闭 定制禅模式",
            callback: () => this.toggleZenMode()
        });

        this.addCommand({
            id: "toggle-dual-pane-mode",
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
    }

    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings() {
        await this.saveData(this.settings);
    }

    updateVTabContainer() {
        const doc = activeDocument ?? document;
        
        // 先清理全局已挂载的类
        doc.querySelectorAll(`.${VTAB_CONTAINER}`).forEach(el => {
            el.classList.remove(VTAB_CONTAINER);
            el.classList.remove('superzen-vtab-left');
            el.classList.remove('superzen-vtab-right');
        });

        if (!this.isActive || !this.targetLeaf) return;

        const rootTabs = doc.querySelectorAll('.workspace-split.mod-root .workspace-tabs');
        if (rootTabs.length === 0) return;

        const isDualPaneActive = doc.body.classList.contains(SETTING_DUAL_PANE_CLASS);

        // 新增的"左右标签"逻辑
        if (this.settings.splitTabs && isDualPaneActive && rootTabs.length > 1) {
            const firstTab = rootTabs[0] as HTMLElement;
            firstTab.classList.add(VTAB_CONTAINER, 'superzen-vtab-left');
            
            const lastTab = rootTabs[rootTabs.length - 1] as HTMLElement;
            lastTab.classList.add(VTAB_CONTAINER, 'superzen-vtab-right');
        } else {
            // 维持原来的处理逻辑
            if (this.settings.fixedRightTabs && isDualPaneActive) {
                const lastTab = rootTabs[rootTabs.length - 1] as HTMLElement;
                if (lastTab) {
                    lastTab.classList.add(VTAB_CONTAINER);
                }
            } else {
                const targetContainer = this.targetLeaf?.containerEl?.closest('.workspace-tabs');
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
        const doc = activeDocument ?? document;

        if (this.isActive) {
            if (this.currentModeClass === MODE_CENTER_FULL) {
                if (this.settings.keepDualPanes) {
                    doc.body.classList.add(SETTING_DUAL_PANE_CLASS);
                    new Notice("SuperZen: 切换至【双屏对照】");
                } else {
                    // 修正：使用推荐的API替代弃用的activeLeaf
                    let activeLeaf: ExtendedWorkspaceLeaf | null = 
                        this.app.workspace.getActiveViewOfType(View)?.leaf as ExtendedWorkspaceLeaf ?? 
                        this.app.workspace.getMostRecentLeaf();

                    if (!activeLeaf) {
                        // 尝试从DOM获取活动叶子
                        const domActive = doc.querySelector('.workspace-leaf.mod-active');
                        if (domActive) {
                            this.app.workspace.iterateAllLeaves((leaf: ExtendedWorkspaceLeaf) => {
                                const leafContainer = leaf.containerEl;
                                if (leafContainer === domActive || leafContainer?.contains(domActive)) {
                                    activeLeaf = leaf;
                                }
                            });
                        }
                    }

                    if (activeLeaf && activeLeaf !== this.targetLeaf) {
                        if (this.targetLeaf?.containerEl) {
                            this.targetLeaf.containerEl.classList.remove(LEAF_TARGET);
                        }

                        this.targetLeaf = activeLeaf;

                        if (this.targetLeaf?.containerEl) {
                            this.targetLeaf.containerEl.classList.add(LEAF_TARGET);
                        }

                        let isBaseFile = false;
                        const view: View | null = this.targetLeaf.view;
                        if (view) {
                            const file = (view as any).file;
                            if (file && file.extension === 'base') {
                                isBaseFile = true;
                            } else if (view.getViewType() === 'base') {
                                isBaseFile = true;
                            }
                        }

                        if (isBaseFile) {
                            doc.body.classList.add(BASE_TARGET);
                        } else {
                            doc.body.classList.remove(BASE_TARGET);
                        }
                    }

                    doc.body.classList.remove(SETTING_DUAL_PANE_CLASS);
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
        const doc = activeDocument ?? document;
        
        // 修正：使用推荐的API获取活动叶子
        let activeLeaf: ExtendedWorkspaceLeaf | null = 
            this.app.workspace.getActiveViewOfType(View)?.leaf as ExtendedWorkspaceLeaf ?? 
            this.app.workspace.getMostRecentLeaf();

        if (!activeLeaf) {
            const domActive = doc.querySelector('.workspace-leaf.mod-active');
            if (domActive) {
                this.app.workspace.iterateAllLeaves((leaf: ExtendedWorkspaceLeaf) => {
                    const leafContainer = leaf.containerEl;
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

        const workspace = this.app.workspace as ExtendedWorkspace;
        const root = this.targetLeaf.getRoot?.() ?? null;
        
        doc.body.classList.add(BODY_ZEN_ACTIVE);
        
        if (this.settings.hideProperties) {
            doc.body.classList.add(SETTING_HIDE_PROPERTIES_CLASS);
        }

        if (this.targetLeaf.containerEl) {
            this.targetLeaf.containerEl.classList.add(LEAF_TARGET);
        }

        if (this.settings.verticalTabs) {
            doc.body.classList.add(SETTING_VERTICAL_TABS_CLASS);
        }

        if (this.settings.splitTabs) {
            doc.body.classList.add(SETTING_SPLIT_TABS_CLASS);
        }

        if (this.settings.keepDualPanes) {
            if (root === workspace.rootSplit) {
                doc.body.classList.add(SETTING_DUAL_PANE_CLASS);
            }
        }

        let isBaseFile = false;
        const view: View | null = this.targetLeaf.view;
        if (view) {
            const file = (view as any).file;
            if (file && file.extension === 'base') {
                isBaseFile = true;
            } else if (view.getViewType() === 'base') {
                isBaseFile = true;
            }
        }

        if (isBaseFile) {
            doc.body.classList.add(BASE_TARGET);
        }

        if (root === workspace.rootSplit) {
            this.currentModeClass = MODE_CENTER_FULL;
            doc.body.classList.add(MODE_CENTER_FULL);
        } else if (root === workspace.leftSplit) {
            this.currentModeClass = MODE_LEFT_AND_CENTER;
            doc.body.classList.add(MODE_LEFT_AND_CENTER);
        } else if (root === workspace.rightSplit) {
            if (isBaseFile) {
                this.currentModeClass = MODE_RIGHT_BASE_FULL;
                doc.body.classList.add(MODE_RIGHT_BASE_FULL);
            } else {
                this.currentModeClass = MODE_RIGHT_AND_CENTER;
                doc.body.classList.add(MODE_RIGHT_AND_CENTER);
            }
        }

        if (!doc.fullscreenElement) {
            doc.body.requestFullscreen().catch(err => {
                console.warn("SuperZen: 请求全屏失败, 但继续执行专注模式", err);
            });
        }

        doc.addEventListener('fullscreenchange', this.handleFullscreenChange);
        this.updateVTabContainer();
    }

    exitZenMode() {
        if (!this.isActive) return;

        const doc = activeDocument ?? document;
        
        doc.body.classList.remove(BODY_ZEN_ACTIVE);
        doc.body.classList.remove(BASE_TARGET);
        doc.body.classList.remove(SETTING_DUAL_PANE_CLASS);
        doc.body.classList.remove(SETTING_VERTICAL_TABS_CLASS);
        doc.body.classList.remove(SETTING_HIDE_PROPERTIES_CLASS); 
        doc.body.classList.remove(SETTING_SPLIT_TABS_CLASS);

        if (this.currentModeClass) {
            doc.body.classList.remove(this.currentModeClass);
        }

        if (this.targetLeaf?.containerEl) {
            this.targetLeaf.containerEl.classList.remove(LEAF_TARGET);
        }

        doc.querySelectorAll(`.${VTAB_CONTAINER}`).forEach(el => {
            el.classList.remove(VTAB_CONTAINER);
            el.classList.remove('superzen-vtab-left');
            el.classList.remove('superzen-vtab-right');
        });

        if (doc.fullscreenElement) {
            doc.exitFullscreen().catch(() => { });
        }

        doc.removeEventListener('fullscreenchange', this.handleFullscreenChange);

        this.isActive = false;
        this.targetLeaf = null;
        this.currentModeClass = null;
    }

    handleFullscreenChange() {
        const doc = activeDocument ?? document;
        if (!doc.fullscreenElement && this.isActive) {
            this.exitZenMode();
        }
    }
}

// 设置面板 - 修正标题创建方式
class SuperZenSettingTab extends PluginSettingTab {
    plugin: SuperZenPlugin;

    constructor(app: App, plugin: SuperZenPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();
        
        // 修正：使用Setting.setHeading()替代createEl('h2')
        new Setting(containerEl)
            .setName('SuperZen 定制禅模式设置')
            .setHeading();

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
                        const doc = activeDocument ?? document;
                        if (value) {
                            doc.body.classList.add(SETTING_HIDE_PROPERTIES_CLASS);
                        } else {
                            doc.body.classList.remove(SETTING_HIDE_PROPERTIES_CLASS);
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
                        const doc = activeDocument ?? document;
                        if (value) {
                            doc.body.classList.add(SETTING_VERTICAL_TABS_CLASS);
                        } else {
                            doc.body.classList.remove(SETTING_VERTICAL_TABS_CLASS);
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

        new Setting(containerEl)
            .setName('左右标签 (双屏模式专用)')
            .setDesc('关闭时，保持当前行为(仅单侧显示，跟随焦点或固定右侧)。开启后：双屏对照时，左侧屏幕的选项卡固定在左侧边缘，右侧屏幕的选项卡固定在右侧边缘。')
            .addToggle(toggle => toggle
                .setValue(this.plugin.settings.splitTabs)
                .onChange(async (value) => {
                    this.plugin.settings.splitTabs = value;
                    await this.plugin.saveSettings();
                    if (this.plugin.isActive) {
                        const doc = activeDocument ?? document;
                        if (value) {
                            doc.body.classList.add(SETTING_SPLIT_TABS_CLASS);
                        } else {
                            doc.body.classList.remove(SETTING_SPLIT_TABS_CLASS);
                        }
                        this.plugin.updateVTabContainer();
                    }
                }));
    }
}