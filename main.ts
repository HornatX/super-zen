import { App, Notice, Plugin, PluginSettingTab, Setting, WorkspaceLeaf, View, Workspace } from 'obsidian';

// Obsidian desktop (Electron) 环境下 require 可用
declare function require(moduleName: string): any;

interface SuperZenSettings {
    keepDualPanes: boolean;
    verticalTabs: boolean;
    fixedRightTabs: boolean;
    hideProperties: boolean;
    splitTabs: boolean;
}

const DEFAULT_SETTINGS: SuperZenSettings = {
    keepDualPanes: false,
    verticalTabs: false,
    fixedRightTabs: false,
    hideProperties: true,
    splitTabs: false,
};

export default class SuperZenPlugin extends Plugin {
    settings!: SuperZenSettings;
    isActive = false;
    targetLeaf: WorkspaceLeaf | null = null;
    currentModeClass: string | null = null;
    private fullscreenTimer: ReturnType<typeof setInterval> | null = null;
    private isHandlingFullscreen = false;
    private escapeHandlersAttached = false;

    async onload() {
        await this.loadSettings();
        this.addSettingTab(new SuperZenSettingTab(this.app, this));

        this.addCommand({
            id: 'toggle',
            name: '开启/关闭 定制禅模式',
            callback: () => this.toggleZenMode(),
        });

        this.addCommand({
            id: 'toggle-dual-pane',
            name: '切换 单屏/双屏 对照模式',
            callback: () => this.toggleDualPaneMode(),
        });

        this.registerEvent(
            this.app.workspace.on('layout-change', () => {
                if (this.isActive) this.updateVTabContainer();
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

    // --- 辅助方法 ---

    private getLeafContainer(leaf: WorkspaceLeaf): HTMLElement | null {
        return (leaf as any)?.containerEl ?? null;
    }

    private getLeafRoot(leaf: WorkspaceLeaf): unknown {
        return (leaf as any)?.getRoot?.() ?? null;
    }

    private isBaseView(leaf: WorkspaceLeaf): boolean {
        const view = leaf.view;
        if (!view) return false;
        const file = (view as any)?.file;
        if (file?.extension === 'base') return true;
        return view.getViewType() === 'base';
    }

    private findActiveLeaf(): WorkspaceLeaf | null {
        const domActive = activeDocument.querySelector('.workspace-leaf.mod-active');
        if (!domActive) return null;
        let found: WorkspaceLeaf | null = null;
        this.app.workspace.iterateAllLeaves((leaf) => {
            const el = this.getLeafContainer(leaf);
            if (el === domActive || el?.contains(domActive)) {
                found = leaf;
            }
        });
        return found;
    }

    private applyLeafTarget(leaf: WorkspaceLeaf | null) {
        const old = this.targetLeaf ? this.getLeafContainer(this.targetLeaf) : null;
        if (old) old.classList.remove('superzen-target-leaf');

        this.targetLeaf = leaf;
        if (!leaf) return;

        const el = this.getLeafContainer(leaf);
        if (el) el.classList.add('superzen-target-leaf');
    }

    private setNativeFullscreen(fullscreen: boolean): boolean {
        try {
            const remote = require('@electron/remote');
            const win = remote?.getCurrentWindow?.();
            if (win?.setFullScreen) {
                win.setFullScreen(fullscreen);
                return true;
            }
        } catch { /* 非 Electron 环境或模块不可用 */ }
        try {
            const electron = require('electron');
            const win = electron?.remote?.getCurrentWindow?.();
            if (win?.setFullScreen) {
                win.setFullScreen(fullscreen);
                return true;
            }
        } catch { /* 同上 */ }
        return false;
    }

    private requestFullscreenWithRetry(retries = 3, delay = 50): void {
        if (!this.isActive || activeDocument.fullscreenElement) return;
        activeDocument.body.requestFullscreen().catch(() => {
            if (retries > 0 && this.isActive) {
                setTimeout(() => this.requestFullscreenWithRetry(retries - 1, delay * 2), delay);
            }
        });
    }

    private enterFullscreen() {
        if (!this.setNativeFullscreen(true) && !activeDocument.fullscreenElement) {
            this.requestFullscreenWithRetry();
        }
    }

    private exitFullscreen() {
        if (!this.setNativeFullscreen(false) && activeDocument.fullscreenElement) {
            activeDocument.exitFullscreen().catch(() => {});
        }
    }

    private attachEscapeHandlers() {
        if (this.escapeHandlersAttached) return;
        activeDocument.addEventListener('keydown', this.handleEscape, true);
        activeDocument.addEventListener('keyup', this.handleEscape, true);
        activeDocument.addEventListener('fullscreenchange', this.handleFullscreenChange);
        this.escapeHandlersAttached = true;
    }

    private detachEscapeHandlers() {
        if (!this.escapeHandlersAttached) return;
        activeDocument.removeEventListener('keydown', this.handleEscape, true);
        activeDocument.removeEventListener('keyup', this.handleEscape, true);
        activeDocument.removeEventListener('fullscreenchange', this.handleFullscreenChange);
        this.escapeHandlersAttached = false;
    }

    private startFullscreenWatch() {
        this.stopFullscreenWatch();
        this.fullscreenTimer = setInterval(() => {
            if (this.isActive && !activeDocument.fullscreenElement && !this.isHandlingFullscreen) {
                this.isHandlingFullscreen = true;
                this.enterFullscreen();
                setTimeout(() => { this.isHandlingFullscreen = false; }, 200);
            }
        }, 500);
    }

    private stopFullscreenWatch() {
        if (this.fullscreenTimer) {
            clearInterval(this.fullscreenTimer);
            this.fullscreenTimer = null;
        }
    }

    // --- VTab 容器管理 ---

    updateVTabContainer() {
        activeDocument.querySelectorAll('.superzen-vtab-container').forEach((el) => {
            el.classList.remove('superzen-vtab-container', 'superzen-vtab-left', 'superzen-vtab-right');
        });

        if (!this.isActive || !this.targetLeaf) return;

        const rootTabs = activeDocument.querySelectorAll('.workspace-split.mod-root .workspace-tabs');
        if (rootTabs.length === 0) return;

        const isDual = activeDocument.body.classList.contains('superzen-dual-pane-mode');

        if (this.settings.splitTabs && isDual && rootTabs.length > 1) {
            rootTabs[0].classList.add('superzen-vtab-container', 'superzen-vtab-left');
            rootTabs[rootTabs.length - 1].classList.add('superzen-vtab-container', 'superzen-vtab-right');
        } else if (this.settings.fixedRightTabs && isDual) {
            rootTabs[rootTabs.length - 1]?.classList.add('superzen-vtab-container');
        } else {
            const container = this.getLeafContainer(this.targetLeaf)?.closest('.workspace-tabs');
            if (container) container.classList.add('superzen-vtab-container');
        }
    }

    // --- 禅模式切换 ---

    toggleZenMode() {
        this.isActive ? this.exitZenMode() : this.enterZenMode();
    }

    async toggleDualPaneMode() {
        this.settings.keepDualPanes = !this.settings.keepDualPanes;
        await this.saveSettings();
        const label = this.settings.keepDualPanes ? '开启' : '关闭';

        if (!this.isActive || this.currentModeClass !== 'superzen-mode-center-full') {
            new Notice(`SuperZen: 默认双屏状态已更改为【${label}】${this.isActive ? ' (仅在正文全屏生效)' : ''}`);
            return;
        }

        const body = activeDocument.body;
        if (this.settings.keepDualPanes) {
            body.classList.add('superzen-dual-pane-mode');
            new Notice('SuperZen: 切换至【双屏对照】');
        } else {
            const activeLeaf = this.findActiveLeaf();
            if (activeLeaf && activeLeaf !== this.targetLeaf) {
                this.applyLeafTarget(activeLeaf);
                if (this.isBaseView(activeLeaf)) {
                    body.classList.add('superzen-is-base-target');
                } else {
                    body.classList.remove('superzen-is-base-target');
                }
            }
            body.classList.remove('superzen-dual-pane-mode');
            new Notice('SuperZen: 切换至【单屏独占】');
        }
        this.updateVTabContainer();
    }

    enterZenMode() {
        const activeLeaf = this.findActiveLeaf();
        if (!activeLeaf) {
            new Notice('SuperZen: 未找到可激活的窗口');
            return;
        }

        this.targetLeaf = activeLeaf;
        this.isActive = true;

        const body = activeDocument.body;
        const root = this.getLeafRoot(activeLeaf);
        const ws = this.app.workspace as any;

        // CSS 类名映射
        const classes: string[] = ['superzen-is-active'];

        if (this.settings.hideProperties) classes.push('superzen-hide-properties');
        if (this.settings.verticalTabs) classes.push('superzen-vertical-tabs');
        if (this.settings.splitTabs) classes.push('superzen-split-tabs');

        const leafEl = this.getLeafContainer(activeLeaf);
        if (leafEl) leafEl.classList.add('superzen-target-leaf');

        if (this.isBaseView(activeLeaf)) classes.push('superzen-is-base-target');

        if (this.settings.keepDualPanes && root === ws.rootSplit) {
            classes.push('superzen-dual-pane-mode');
        }

        // 确定模式
        if (root === ws.rootSplit) {
            this.currentModeClass = 'superzen-mode-center-full';
        } else if (root === ws.leftSplit) {
            this.currentModeClass = 'superzen-mode-left-center';
        } else if (root === ws.rightSplit) {
            this.currentModeClass = this.isBaseView(activeLeaf)
                ? 'superzen-mode-right-base-full'
                : 'superzen-mode-right-center';
        }

        if (this.currentModeClass) classes.push(this.currentModeClass);
        body.classList.add(...classes);

        this.enterFullscreen();
        this.attachEscapeHandlers();
        this.startFullscreenWatch();
        this.updateVTabContainer();
    }

    exitZenMode() {
        if (!this.isActive) return;

        const body = activeDocument.body;
        body.classList.remove(
            'superzen-is-active', 'superzen-is-base-target', 'superzen-dual-pane-mode',
            'superzen-vertical-tabs', 'superzen-hide-properties', 'superzen-split-tabs',
        );
        if (this.currentModeClass) body.classList.remove(this.currentModeClass);

        const leafEl = this.targetLeaf ? this.getLeafContainer(this.targetLeaf) : null;
        if (leafEl) leafEl.classList.remove('superzen-target-leaf');

        activeDocument.querySelectorAll('.superzen-vtab-container').forEach((el) => {
            el.classList.remove('superzen-vtab-container', 'superzen-vtab-left', 'superzen-vtab-right');
        });

        this.stopFullscreenWatch();
        this.exitFullscreen();
        this.detachEscapeHandlers();

        this.isActive = false;
        this.targetLeaf = null;
        this.currentModeClass = null;
    }

    // --- 事件处理器 ---

    private handleFullscreenChange = () => {
        if (this.isHandlingFullscreen || !this.isActive || activeDocument.fullscreenElement) return;
        this.isHandlingFullscreen = true;
        this.enterFullscreen();
        setTimeout(() => { this.isHandlingFullscreen = false; }, 200);
    };

    private handleEscape = (e: KeyboardEvent) => {
        if (this.isActive && e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
        }
    };
}

// 设置面板
class SuperZenSettingTab extends PluginSettingTab {
    private plugin: SuperZenPlugin;

    constructor(app: App, plugin: SuperZenPlugin) {
        super(app, plugin);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        new Setting(containerEl).setName('SuperZen 定制禅模式设置').setHeading();

        new Setting(containerEl)
            .setName('双屏模式')
            .setDesc('开启后，进入禅模式时将保留多窗格同屏对照。')
            .addToggle((t) => t
                .setValue(this.plugin.settings.keepDualPanes)
                .onChange(async (v) => { this.plugin.settings.keepDualPanes = v; await this.plugin.saveSettings(); }));

        new Setting(containerEl)
            .setName('隐藏笔记属性区域 (Properties)')
            .setDesc('开启后，进入禅模式将自动隐藏文档顶部的属性信息面板，让写作更沉浸。')
            .addToggle((t) => t
                .setValue(this.plugin.settings.hideProperties)
                .onChange(async (v) => {
                    this.plugin.settings.hideProperties = v;
                    await this.plugin.saveSettings();
                    if (this.plugin.isActive) {
                        activeDocument.body.classList.toggle('superzen-hide-properties', v);
                    }
                }));

        new Setting(containerEl)
            .setName('极简悬浮选项卡 (边缘悬浮文字)')
            .setDesc('彻底去框化：选项卡变为纯粹文字悬浮，解决横向挤压变形问题。')
            .addToggle((t) => t
                .setValue(this.plugin.settings.verticalTabs)
                .onChange(async (v) => {
                    this.plugin.settings.verticalTabs = v;
                    await this.plugin.saveSettings();
                    if (this.plugin.isActive) {
                        activeDocument.body.classList.toggle('superzen-vertical-tabs', v);
                    }
                }));

        new Setting(containerEl)
            .setName('固定右分屏标签 (双屏模式专用)')
            .setDesc('默认关闭(跟随焦点窗口)。开启后：在双屏模式下极简悬浮选项卡始终固定在右侧分屏上。')
            .addToggle((t) => t
                .setValue(this.plugin.settings.fixedRightTabs)
                .onChange(async (v) => {
                    this.plugin.settings.fixedRightTabs = v;
                    await this.plugin.saveSettings();
                    if (this.plugin.isActive) this.plugin.updateVTabContainer();
                }));

        new Setting(containerEl)
            .setName('左右标签 (双屏模式专用)')
            .setDesc('开启后：双屏对照时，左侧选项卡固定在左边缘，右侧选项卡固定在右边缘。')
            .addToggle((t) => t
                .setValue(this.plugin.settings.splitTabs)
                .onChange(async (v) => {
                    this.plugin.settings.splitTabs = v;
                    await this.plugin.saveSettings();
                    if (this.plugin.isActive) {
                        activeDocument.body.classList.toggle('superzen-split-tabs', v);
                        this.plugin.updateVTabContainer();
                    }
                }));
    }
}
