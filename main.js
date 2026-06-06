var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => SuperZenPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var DEFAULT_SETTINGS = {
  keepDualPanes: false,
  verticalTabs: false,
  fixedRightTabs: false,
  hideProperties: true,
  splitTabs: false
};
var SuperZenPlugin = class extends import_obsidian.Plugin {
  constructor() {
    super(...arguments);
    this.isActive = false;
    this.targetLeaf = null;
    this.currentModeClass = null;
    this.fullscreenTimer = null;
    this.isHandlingFullscreen = false;
    this.escapeHandlersAttached = false;
    // --- 事件处理器 ---
    this.handleFullscreenChange = () => {
      if (this.isHandlingFullscreen || !this.isActive || activeDocument.fullscreenElement) return;
      this.isHandlingFullscreen = true;
      this.enterFullscreen();
      setTimeout(() => {
        this.isHandlingFullscreen = false;
      }, 200);
    };
    this.handleEscape = (e) => {
      if (this.isActive && e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
      }
    };
  }
  async onload() {
    await this.loadSettings();
    this.addSettingTab(new SuperZenSettingTab(this.app, this));
    this.addCommand({
      id: "toggle",
      name: "\u5F00\u542F/\u5173\u95ED \u5B9A\u5236\u7985\u6A21\u5F0F",
      callback: () => this.toggleZenMode()
    });
    this.addCommand({
      id: "toggle-dual-pane",
      name: "\u5207\u6362 \u5355\u5C4F/\u53CC\u5C4F \u5BF9\u7167\u6A21\u5F0F",
      callback: () => this.toggleDualPaneMode()
    });
    this.registerEvent(
      this.app.workspace.on("layout-change", () => {
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
  getLeafContainer(leaf) {
    return leaf?.containerEl ?? null;
  }
  getLeafRoot(leaf) {
    return leaf?.getRoot?.() ?? null;
  }
  isBaseView(leaf) {
    const view = leaf.view;
    if (!view) return false;
    const file = view?.file;
    if (file?.extension === "base") return true;
    return view.getViewType() === "base";
  }
  findActiveLeaf() {
    const domActive = activeDocument.querySelector(".workspace-leaf.mod-active");
    if (!domActive) return null;
    let found = null;
    this.app.workspace.iterateAllLeaves((leaf) => {
      const el = this.getLeafContainer(leaf);
      if (el === domActive || el?.contains(domActive)) {
        found = leaf;
      }
    });
    return found;
  }
  applyLeafTarget(leaf) {
    const old = this.targetLeaf ? this.getLeafContainer(this.targetLeaf) : null;
    if (old) old.classList.remove("superzen-target-leaf");
    this.targetLeaf = leaf;
    if (!leaf) return;
    const el = this.getLeafContainer(leaf);
    if (el) el.classList.add("superzen-target-leaf");
  }
  setNativeFullscreen(fullscreen) {
    try {
      const remote = require("@electron/remote");
      const win = remote?.getCurrentWindow?.();
      if (win?.setFullScreen) {
        win.setFullScreen(fullscreen);
        return true;
      }
    } catch {
    }
    try {
      const electron = require("electron");
      const win = electron?.remote?.getCurrentWindow?.();
      if (win?.setFullScreen) {
        win.setFullScreen(fullscreen);
        return true;
      }
    } catch {
    }
    return false;
  }
  requestFullscreenWithRetry(retries = 3, delay = 50) {
    if (!this.isActive || activeDocument.fullscreenElement) return;
    activeDocument.body.requestFullscreen().catch(() => {
      if (retries > 0 && this.isActive) {
        setTimeout(() => this.requestFullscreenWithRetry(retries - 1, delay * 2), delay);
      }
    });
  }
  enterFullscreen() {
    if (!this.setNativeFullscreen(true) && !activeDocument.fullscreenElement) {
      this.requestFullscreenWithRetry();
    }
  }
  exitFullscreen() {
    if (!this.setNativeFullscreen(false) && activeDocument.fullscreenElement) {
      activeDocument.exitFullscreen().catch(() => {
      });
    }
  }
  attachEscapeHandlers() {
    if (this.escapeHandlersAttached) return;
    activeDocument.addEventListener("keydown", this.handleEscape, true);
    activeDocument.addEventListener("keyup", this.handleEscape, true);
    activeDocument.addEventListener("fullscreenchange", this.handleFullscreenChange);
    this.escapeHandlersAttached = true;
  }
  detachEscapeHandlers() {
    if (!this.escapeHandlersAttached) return;
    activeDocument.removeEventListener("keydown", this.handleEscape, true);
    activeDocument.removeEventListener("keyup", this.handleEscape, true);
    activeDocument.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    this.escapeHandlersAttached = false;
  }
  startFullscreenWatch() {
    this.stopFullscreenWatch();
    this.fullscreenTimer = setInterval(() => {
      if (this.isActive && !activeDocument.fullscreenElement && !this.isHandlingFullscreen) {
        this.isHandlingFullscreen = true;
        this.enterFullscreen();
        setTimeout(() => {
          this.isHandlingFullscreen = false;
        }, 200);
      }
    }, 500);
  }
  stopFullscreenWatch() {
    if (this.fullscreenTimer) {
      clearInterval(this.fullscreenTimer);
      this.fullscreenTimer = null;
    }
  }
  // --- VTab 容器管理 ---
  updateVTabContainer() {
    activeDocument.querySelectorAll(".superzen-vtab-container").forEach((el) => {
      el.classList.remove("superzen-vtab-container", "superzen-vtab-left", "superzen-vtab-right");
    });
    if (!this.isActive || !this.targetLeaf) return;
    const rootTabs = activeDocument.querySelectorAll(".workspace-split.mod-root .workspace-tabs");
    if (rootTabs.length === 0) return;
    const isDual = activeDocument.body.classList.contains("superzen-dual-pane-mode");
    if (this.settings.splitTabs && isDual && rootTabs.length > 1) {
      rootTabs[0].classList.add("superzen-vtab-container", "superzen-vtab-left");
      rootTabs[rootTabs.length - 1].classList.add("superzen-vtab-container", "superzen-vtab-right");
    } else if (this.settings.fixedRightTabs && isDual) {
      rootTabs[rootTabs.length - 1]?.classList.add("superzen-vtab-container");
    } else {
      const container = this.getLeafContainer(this.targetLeaf)?.closest(".workspace-tabs");
      if (container) container.classList.add("superzen-vtab-container");
    }
  }
  // --- 禅模式切换 ---
  toggleZenMode() {
    this.isActive ? this.exitZenMode() : this.enterZenMode();
  }
  async toggleDualPaneMode() {
    this.settings.keepDualPanes = !this.settings.keepDualPanes;
    await this.saveSettings();
    const label = this.settings.keepDualPanes ? "\u5F00\u542F" : "\u5173\u95ED";
    if (!this.isActive || this.currentModeClass !== "superzen-mode-center-full") {
      new import_obsidian.Notice(`SuperZen: \u9ED8\u8BA4\u53CC\u5C4F\u72B6\u6001\u5DF2\u66F4\u6539\u4E3A\u3010${label}\u3011${this.isActive ? " (\u4EC5\u5728\u6B63\u6587\u5168\u5C4F\u751F\u6548)" : ""}`);
      return;
    }
    const body = activeDocument.body;
    if (this.settings.keepDualPanes) {
      body.classList.add("superzen-dual-pane-mode");
      new import_obsidian.Notice("SuperZen: \u5207\u6362\u81F3\u3010\u53CC\u5C4F\u5BF9\u7167\u3011");
    } else {
      const activeLeaf = this.findActiveLeaf();
      if (activeLeaf && activeLeaf !== this.targetLeaf) {
        this.applyLeafTarget(activeLeaf);
        if (this.isBaseView(activeLeaf)) {
          body.classList.add("superzen-is-base-target");
        } else {
          body.classList.remove("superzen-is-base-target");
        }
      }
      body.classList.remove("superzen-dual-pane-mode");
      new import_obsidian.Notice("SuperZen: \u5207\u6362\u81F3\u3010\u5355\u5C4F\u72EC\u5360\u3011");
    }
    this.updateVTabContainer();
  }
  enterZenMode() {
    const activeLeaf = this.findActiveLeaf();
    if (!activeLeaf) {
      new import_obsidian.Notice("SuperZen: \u672A\u627E\u5230\u53EF\u6FC0\u6D3B\u7684\u7A97\u53E3");
      return;
    }
    this.targetLeaf = activeLeaf;
    this.isActive = true;
    const body = activeDocument.body;
    const root = this.getLeafRoot(activeLeaf);
    const ws = this.app.workspace;
    const classes = ["superzen-is-active"];
    if (this.settings.hideProperties) classes.push("superzen-hide-properties");
    if (this.settings.verticalTabs) classes.push("superzen-vertical-tabs");
    if (this.settings.splitTabs) classes.push("superzen-split-tabs");
    const leafEl = this.getLeafContainer(activeLeaf);
    if (leafEl) leafEl.classList.add("superzen-target-leaf");
    if (this.isBaseView(activeLeaf)) classes.push("superzen-is-base-target");
    if (this.settings.keepDualPanes && root === ws.rootSplit) {
      classes.push("superzen-dual-pane-mode");
    }
    if (root === ws.rootSplit) {
      this.currentModeClass = "superzen-mode-center-full";
    } else if (root === ws.leftSplit) {
      this.currentModeClass = "superzen-mode-left-center";
    } else if (root === ws.rightSplit) {
      this.currentModeClass = this.isBaseView(activeLeaf) ? "superzen-mode-right-base-full" : "superzen-mode-right-center";
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
      "superzen-is-active",
      "superzen-is-base-target",
      "superzen-dual-pane-mode",
      "superzen-vertical-tabs",
      "superzen-hide-properties",
      "superzen-split-tabs"
    );
    if (this.currentModeClass) body.classList.remove(this.currentModeClass);
    const leafEl = this.targetLeaf ? this.getLeafContainer(this.targetLeaf) : null;
    if (leafEl) leafEl.classList.remove("superzen-target-leaf");
    activeDocument.querySelectorAll(".superzen-vtab-container").forEach((el) => {
      el.classList.remove("superzen-vtab-container", "superzen-vtab-left", "superzen-vtab-right");
    });
    this.stopFullscreenWatch();
    this.exitFullscreen();
    this.detachEscapeHandlers();
    this.isActive = false;
    this.targetLeaf = null;
    this.currentModeClass = null;
  }
};
var SuperZenSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("SuperZen \u5B9A\u5236\u7985\u6A21\u5F0F\u8BBE\u7F6E").setHeading();
    new import_obsidian.Setting(containerEl).setName("\u53CC\u5C4F\u6A21\u5F0F").setDesc("\u5F00\u542F\u540E\uFF0C\u8FDB\u5165\u7985\u6A21\u5F0F\u65F6\u5C06\u4FDD\u7559\u591A\u7A97\u683C\u540C\u5C4F\u5BF9\u7167\u3002").addToggle((t) => t.setValue(this.plugin.settings.keepDualPanes).onChange(async (v) => {
      this.plugin.settings.keepDualPanes = v;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9690\u85CF\u7B14\u8BB0\u5C5E\u6027\u533A\u57DF (Properties)").setDesc("\u5F00\u542F\u540E\uFF0C\u8FDB\u5165\u7985\u6A21\u5F0F\u5C06\u81EA\u52A8\u9690\u85CF\u6587\u6863\u9876\u90E8\u7684\u5C5E\u6027\u4FE1\u606F\u9762\u677F\uFF0C\u8BA9\u5199\u4F5C\u66F4\u6C89\u6D78\u3002").addToggle((t) => t.setValue(this.plugin.settings.hideProperties).onChange(async (v) => {
      this.plugin.settings.hideProperties = v;
      await this.plugin.saveSettings();
      if (this.plugin.isActive) {
        activeDocument.body.classList.toggle("superzen-hide-properties", v);
      }
    }));
    new import_obsidian.Setting(containerEl).setName("\u6781\u7B80\u60AC\u6D6E\u9009\u9879\u5361 (\u8FB9\u7F18\u60AC\u6D6E\u6587\u5B57)").setDesc("\u5F7B\u5E95\u53BB\u6846\u5316\uFF1A\u9009\u9879\u5361\u53D8\u4E3A\u7EAF\u7CB9\u6587\u5B57\u60AC\u6D6E\uFF0C\u89E3\u51B3\u6A2A\u5411\u6324\u538B\u53D8\u5F62\u95EE\u9898\u3002").addToggle((t) => t.setValue(this.plugin.settings.verticalTabs).onChange(async (v) => {
      this.plugin.settings.verticalTabs = v;
      await this.plugin.saveSettings();
      if (this.plugin.isActive) {
        activeDocument.body.classList.toggle("superzen-vertical-tabs", v);
      }
    }));
    new import_obsidian.Setting(containerEl).setName("\u56FA\u5B9A\u53F3\u5206\u5C4F\u6807\u7B7E (\u53CC\u5C4F\u6A21\u5F0F\u4E13\u7528)").setDesc("\u9ED8\u8BA4\u5173\u95ED(\u8DDF\u968F\u7126\u70B9\u7A97\u53E3)\u3002\u5F00\u542F\u540E\uFF1A\u5728\u53CC\u5C4F\u6A21\u5F0F\u4E0B\u6781\u7B80\u60AC\u6D6E\u9009\u9879\u5361\u59CB\u7EC8\u56FA\u5B9A\u5728\u53F3\u4FA7\u5206\u5C4F\u4E0A\u3002").addToggle((t) => t.setValue(this.plugin.settings.fixedRightTabs).onChange(async (v) => {
      this.plugin.settings.fixedRightTabs = v;
      await this.plugin.saveSettings();
      if (this.plugin.isActive) this.plugin.updateVTabContainer();
    }));
    new import_obsidian.Setting(containerEl).setName("\u5DE6\u53F3\u6807\u7B7E (\u53CC\u5C4F\u6A21\u5F0F\u4E13\u7528)").setDesc("\u5F00\u542F\u540E\uFF1A\u53CC\u5C4F\u5BF9\u7167\u65F6\uFF0C\u5DE6\u4FA7\u9009\u9879\u5361\u56FA\u5B9A\u5728\u5DE6\u8FB9\u7F18\uFF0C\u53F3\u4FA7\u9009\u9879\u5361\u56FA\u5B9A\u5728\u53F3\u8FB9\u7F18\u3002").addToggle((t) => t.setValue(this.plugin.settings.splitTabs).onChange(async (v) => {
      this.plugin.settings.splitTabs = v;
      await this.plugin.saveSettings();
      if (this.plugin.isActive) {
        activeDocument.body.classList.toggle("superzen-split-tabs", v);
        this.plugin.updateVTabContainer();
      }
    }));
  }
};
