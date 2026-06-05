import { App, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, View, Workspace } from 'obsidian';

// --- 严格的类型接口定义，杜绝 any 滥用报错 ---
interface SuperZenSettings {
    keepDualPanes: boolean;
    verticalTabs: boolean;
    fixedRightTabs: boolean;
    hideProperties: boolean; 
    splitTabs: boolean;
}

interface ExtendedLeaf extends WorkspaceLeaf {
    containerEl: HTMLElement;
    getRoot(): unknown;
}

interface ExtendedWorkspace extends Workspace {
    rootSplit: unknown;
    leftSplit: unknown;
    rightSplit: unknown;
}

interface ViewWithFile extends View {
    file?: { extension: string };
}

// --- 常量定义 ---
const BODY_ZEN_ACTIVE = "superzen-is-active";
const LEAF_TARGET = "superzen-target-leaf";
const BASE_TARGET = "superzen-is-base-target";
const SETTING_DUAL_PANE_CLASS = "superzen-dual-pane-mode";
const SETTING_VERTICAL_TABS_CLASS = "superzen-vertical-tabs";
const VTAB_CONTAINER = "superzen-vtab-container"; 
const SETTING_HIDE_PROPERTIES_CLASS = "superzen-hide-properties"; 
const SETTING_SPLIT_TABS_CLASS = "superzen-split-tabs"; 

const MODE_CENTER_FULL = "superzen-mode-center-full";
const MODE_LEFT_AND_CENTER = "superzen-mode-left-center";
const MODE_RIGHT_BASE_FULL = "superzen-mode-right-base-full";
const MODE_RIGHT_AND_CENTER = "superzen-mode-right-center";

const DEFAULT_SETTINGS: SuperZenSettings = {
    keepDualPanes: false,
    verticalTabs: false,
    fixedRightTabs: false,
    hideProperties: true,
    splitTabs: false
};

export default class SuperZenPlugin extends Plugin {
    settings: SuperZenSettings;
    isActive: boolean;
    targetLeaf: WorkspaceLeaf | null;
    currentModeClass: string | null;

    async onload() {
        this.isActive = false;
        this.targetLeaf = null;
        this.currentModeClass = null;

        await this.loadSettings();

        this.addSettingTab(new SuperZenSettingTab(this.app, this));

        // 修复：剥离了前缀，防止被 Obsidian 二次嵌套前缀报错
        this.addCommand({
            id: "toggle",
            name: "开启/关闭 定制禅模式",
            callback: () => this.toggleZenMode()
        });

        this.addCommand({
            id: "toggle-dual-pane",
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
        // 修复：兼容悬浮独立窗口的 activeDocument 抓取
        activeDocument.querySelectorAll(`.${VTAB_CONTAINER}`).forEach(el => {
            el.classList.remove(VTAB_CONTAINER);
            el.classList.remove('superzen-vtab-left');
            el.classList.remove('superzen-vtab-right');
        });

        if (!this.isActive || !this.targetLeaf) return;

        const rootTabs = activeDocument.querySelectorAll('.workspace-split.mod-root .workspace-tabs');
        if (rootTabs.length === 0) return;

        const isDualPaneActive = activeDocument.body.classList.contains(SETTING_DUAL_PANE_CLASS);

        if (this.settings.splitTabs && isDualPaneActive && rootTabs.length > 1) {
            const firstTab = rootTabs[0];
            firstTab.classList.add(VTAB_CONTAINER, 'superzen-vtab-left');
            
            const lastTab = rootTabs[rootTabs.length - 1];
            lastTab.classList.add(VTAB_CONTAINER, 'superzen-vtab-right');
        } else {
            if (this.settings.fixedRightTabs && isDualPaneActive) {
                const lastTab = rootTabs[rootTabs.length - 1];
                if (lastTab) {
                    lastTab.classList.add(VTAB_CONTAINER);
                }
            } else {
                const targetContainer = (this.targetLeaf as unknown as ExtendedLeaf).containerEl?.closest('.workspace-tabs');
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
                const body = activeDocument.body;
                if (this.settings.keepDualPanes) {
                    body.classList.add(SETTING_DUAL_PANE_CLASS);
                    new Notice("SuperZen: 切换至【双屏对照】");
                } else {
                    // 修复：通过标准 DOM 巡检解决 activeLeaf 弃用问题，彻底兼容最新版本 API
                    let activeLeaf: WorkspaceLeaf | null = null;
                    const domActive = activeDocument.querySelector('.workspace-leaf.mod-active');
                    if (domActive) {
                        this.app.workspace.iterateAllLeaves((leaf) => {
                            const leafContainer = (leaf as unknown as ExtendedLeaf).containerEl;
                            if (leafContainer === domActive || leafContainer?.contains(domActive)) {
                                activeLeaf = leaf;
                            }
                        });
                    }

                    if (activeLeaf && activeLeaf !== this.targetLeaf) {
                        if (this.targetLeaf) {
                            const oldContainer = (this.targetLeaf as unknown as ExtendedLeaf).containerEl;
                            if (oldContainer) {
                                oldContainer.classList.remove(LEAF_TARGET);
                            }
                        }

                        this.targetLeaf = activeLeaf;

                        const newContainer = (this.targetLeaf as unknown as ExtendedLeaf).containerEl;
                        if (newContainer) {
                            newContainer.classList.add(LEAF_TARGET);
                        }

                        let isBaseFile = false;
                        const view = this.targetLeaf.view;
                        if (view) {
                            const file = (view as ViewWithFile).file;
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
        let activeLeaf: WorkspaceLeaf | null = null;
        const domActive = activeDocument.querySelector('.workspace-leaf.mod-active');
        if (domActive) {
            this.app.workspace.iterateAllLeaves((leaf) => {
                const leafContainer = (leaf as unknown as ExtendedLeaf).containerEl;
                if (leafContainer === domActive || leafContainer?.contains(domActive)) {
                    activeLeaf = leaf;
                }
            });
        }

        if (!activeLeaf) {
            new Notice("SuperZen: 未找到可激活的窗口");
            return;
        }

        this.targetLeaf = activeLeaf;
        this.isActive = true;

        const root = (this.targetLeaf as unknown as ExtendedLeaf).getRoot();
        const extWorkspace = this.app.workspace as unknown as ExtendedWorkspace;
        const body = activeDocument.body;

        body.classList.add(BODY_ZEN_ACTIVE);
        
        if (this.settings.hideProperties) {
            body.classList.add(SETTING_HIDE_PROPERTIES_CLASS);
        }

        const containerEl = (this.targetLeaf as unknown as ExtendedLeaf).containerEl;
        if (containerEl) containerEl.classList.add(LEAF_TARGET);

        if (this.settings.verticalTabs) {
            body.classList.add(SETTING_VERTICAL_TABS_CLASS);
        }

        if (this.settings.splitTabs) {
            body.classList.add(SETTING_SPLIT_TABS_CLASS);
        }

        if (this.settings.keepDualPanes) {
            if (root === extWorkspace.rootSplit) {
                body.classList.add(SETTING_DUAL_PANE_CLASS);
            }
        }

        let isBaseFile = false;
        const view = this.targetLeaf.view;
        if (view) {
            const file = (view as ViewWithFile).file;
            if (file && file.extension === 'base') {
                isBaseFile = true;
            } else if (view.getViewType() === 'base') {
                isBaseFile = true;
            }
        }

        if (isBaseFile) {
            body.classList.add(BASE_TARGET);
        }

        if (root === extWorkspace.rootSplit) {
            this.currentModeClass = MODE_CENTER_FULL;
            body.classList.add(MODE_CENTER_FULL);
        } else if (root === extWorkspace.leftSplit) {
            this.currentModeClass = MODE_LEFT_AND_CENTER;
            body.classList.add(MODE_LEFT_AND_CENTER);
        } else if (root === extWorkspace.rightSplit) {
            if (isBaseFile) {
                this.currentModeClass = MODE_RIGHT_BASE_FULL;
                body.classList.add(MODE_RIGHT_BASE_FULL);
            } else {
                this.currentModeClass = MODE_RIGHT_AND_CENTER;
                body.classList.add(MODE_RIGHT_AND_CENTER);
            }
        }

        if (!activeDocument.fullscreenElement) {
            activeDocument.body.requestFullscreen().catch((err: unknown) => {
                console.warn("SuperZen: 请求全屏失败, 但继续执行专注模式", err);
            });
        }

        activeDocument.addEventListener('fullscreenchange', this.handleFullscreenChange);
        this.updateVTabContainer();
    }

    exitZenMode() {
        if (!this.isActive) return;

        const body = activeDocument.body;
        body.classList.remove(BODY_ZEN_ACTIVE);
        body.classList.remove(BASE_TARGET);
        body.classList.remove(SETTING_DUAL_PANE_CLASS);
        body.classList.remove(SETTING_VERTICAL_TABS_CLASS);
        body.classList.remove(SETTING_HIDE_PROPERTIES_CLASS); 
        body.classList.remove(SETTING_SPLIT_TABS_CLASS); 

        if (this.currentModeClass) {
            body.classList.remove(this.currentModeClass);
        }

        if (this.targetLeaf) {
            const containerEl = (this.targetLeaf as unknown as ExtendedLeaf).containerEl;
            if (containerEl) {
                containerEl.classList.remove(LEAF_TARGET);
            }
        }

        activeDocument.querySelectorAll(`.${VTAB_CONTAINER}`).forEach(el => {
            el.classList.remove(VTAB_CONTAINER);
            el.classList.remove('superzen-vtab-left');
            el.classList.remove('superzen-vtab-right');
        });

        if (activeDocument.fullscreenElement) {
            activeDocument.exitFullscreen().catch(() => { });
        }

        activeDocument.removeEventListener('fullscreenchange', this.handleFullscreenChange);

        this.isActive = false;
        this.targetLeaf = null;
        this.currentModeClass = null;
    }

    // 修复：采用箭头函数防丢失 this 上下文，处理 unbound method 报错
    private handleFullscreenChange = () => {
        if (!activeDocument.fullscreenElement && this.isActive) {
            this.exitZenMode();
        }
    };
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
        
        // 修复：采用标准官方组件设置标题，而非 createEl
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
                        if (value) {
                            activeDocument.body.classList.add(SETTING_HIDE_PROPERTIES_CLASS);
                        } else {
                            activeDocument.body.classList.remove(SETTING_HIDE_PROPERTIES_CLASS);
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
                            activeDocument.body.classList.add(SETTING_VERTICAL_TABS_CLASS);
                        } else {
                            activeDocument.body.classList.remove(SETTING_VERTICAL_TABS_CLASS);
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
                        if (value) {
                            activeDocument.body.classList.add(SETTING_SPLIT_TABS_CLASS);
                        } else {
                            activeDocument.body.classList.remove(SETTING_SPLIT_TABS_CLASS);
                        }
                        this.plugin.updateVTabContainer();
                    }
                }));
    }
}