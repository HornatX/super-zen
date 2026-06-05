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
var BODY_ZEN_ACTIVE = "superzen-is-active";
var LEAF_TARGET = "superzen-target-leaf";
var BASE_TARGET = "superzen-is-base-target";
var SETTING_DUAL_PANE_CLASS = "superzen-dual-pane-mode";
var SETTING_VERTICAL_TABS_CLASS = "superzen-vertical-tabs";
var VTAB_CONTAINER = "superzen-vtab-container";
var SETTING_HIDE_PROPERTIES_CLASS = "superzen-hide-properties";
var SETTING_SPLIT_TABS_CLASS = "superzen-split-tabs";
var MODE_CENTER_FULL = "superzen-mode-center-full";
var MODE_LEFT_AND_CENTER = "superzen-mode-left-center";
var MODE_RIGHT_BASE_FULL = "superzen-mode-right-base-full";
var MODE_RIGHT_AND_CENTER = "superzen-mode-right-center";
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
    // 修复：采用箭头函数防丢失 this 上下文，处理 unbound method 报错
    this.handleFullscreenChange = () => {
      if (!activeDocument.fullscreenElement && this.isActive) {
        this.exitZenMode();
      }
    };
  }
  async onload() {
    this.isActive = false;
    this.targetLeaf = null;
    this.currentModeClass = null;
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
    activeDocument.querySelectorAll(`.${VTAB_CONTAINER}`).forEach((el) => {
      el.classList.remove(VTAB_CONTAINER);
      el.classList.remove("superzen-vtab-left");
      el.classList.remove("superzen-vtab-right");
    });
    if (!this.isActive || !this.targetLeaf) return;
    const rootTabs = activeDocument.querySelectorAll(".workspace-split.mod-root .workspace-tabs");
    if (rootTabs.length === 0) return;
    const isDualPaneActive = activeDocument.body.classList.contains(SETTING_DUAL_PANE_CLASS);
    if (this.settings.splitTabs && isDualPaneActive && rootTabs.length > 1) {
      const firstTab = rootTabs[0];
      firstTab.classList.add(VTAB_CONTAINER, "superzen-vtab-left");
      const lastTab = rootTabs[rootTabs.length - 1];
      lastTab.classList.add(VTAB_CONTAINER, "superzen-vtab-right");
    } else {
      if (this.settings.fixedRightTabs && isDualPaneActive) {
        const lastTab = rootTabs[rootTabs.length - 1];
        if (lastTab) {
          lastTab.classList.add(VTAB_CONTAINER);
        }
      } else {
        const targetContainer = this.targetLeaf.containerEl?.closest(".workspace-tabs");
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
    const statusStr = this.settings.keepDualPanes ? "\u5F00\u542F" : "\u5173\u95ED";
    if (this.isActive) {
      if (this.currentModeClass === MODE_CENTER_FULL) {
        const body = activeDocument.body;
        if (this.settings.keepDualPanes) {
          body.classList.add(SETTING_DUAL_PANE_CLASS);
          new import_obsidian.Notice("SuperZen: \u5207\u6362\u81F3\u3010\u53CC\u5C4F\u5BF9\u7167\u3011");
        } else {
          let activeLeaf = null;
          const domActive = activeDocument.querySelector(".workspace-leaf.mod-active");
          if (domActive) {
            this.app.workspace.iterateAllLeaves((leaf) => {
              const leafContainer = leaf.containerEl;
              if (leafContainer === domActive || leafContainer?.contains(domActive)) {
                activeLeaf = leaf;
              }
            });
          }
          if (activeLeaf && activeLeaf !== this.targetLeaf) {
            if (this.targetLeaf) {
              const oldContainer = this.targetLeaf.containerEl;
              if (oldContainer) {
                oldContainer.classList.remove(LEAF_TARGET);
              }
            }
            this.targetLeaf = activeLeaf;
            const newContainer = this.targetLeaf.containerEl;
            if (newContainer) {
              newContainer.classList.add(LEAF_TARGET);
            }
            let isBaseFile = false;
            const view = this.targetLeaf.view;
            if (view) {
              const file = view.file;
              if (file && file.extension === "base") {
                isBaseFile = true;
              } else if (view.getViewType() === "base") {
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
          new import_obsidian.Notice("SuperZen: \u5207\u6362\u81F3\u3010\u5355\u5C4F\u72EC\u5360\u3011");
        }
        this.updateVTabContainer();
      } else {
        new import_obsidian.Notice(`SuperZen: \u9ED8\u8BA4\u53CC\u5C4F\u72B6\u6001\u5DF2${statusStr} (\u4EC5\u5728\u6B63\u6587\u5168\u5C4F\u751F\u6548)`);
      }
    } else {
      new import_obsidian.Notice(`SuperZen: \u9ED8\u8BA4\u53CC\u5C4F\u72B6\u6001\u5DF2\u66F4\u6539\u4E3A\u3010${statusStr}\u3011`);
    }
  }
  enterZenMode() {
    let activeLeaf = null;
    const domActive = activeDocument.querySelector(".workspace-leaf.mod-active");
    if (domActive) {
      this.app.workspace.iterateAllLeaves((leaf) => {
        const leafContainer = leaf.containerEl;
        if (leafContainer === domActive || leafContainer?.contains(domActive)) {
          activeLeaf = leaf;
        }
      });
    }
    if (!activeLeaf) {
      new import_obsidian.Notice("SuperZen: \u672A\u627E\u5230\u53EF\u6FC0\u6D3B\u7684\u7A97\u53E3");
      return;
    }
    this.targetLeaf = activeLeaf;
    this.isActive = true;
    const root = this.targetLeaf.getRoot();
    const extWorkspace = this.app.workspace;
    const body = activeDocument.body;
    body.classList.add(BODY_ZEN_ACTIVE);
    if (this.settings.hideProperties) {
      body.classList.add(SETTING_HIDE_PROPERTIES_CLASS);
    }
    const containerEl = this.targetLeaf.containerEl;
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
      const file = view.file;
      if (file && file.extension === "base") {
        isBaseFile = true;
      } else if (view.getViewType() === "base") {
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
      activeDocument.body.requestFullscreen().catch((err) => {
        console.warn("SuperZen: \u8BF7\u6C42\u5168\u5C4F\u5931\u8D25, \u4F46\u7EE7\u7EED\u6267\u884C\u4E13\u6CE8\u6A21\u5F0F", err);
      });
    }
    activeDocument.addEventListener("fullscreenchange", this.handleFullscreenChange);
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
      const containerEl = this.targetLeaf.containerEl;
      if (containerEl) {
        containerEl.classList.remove(LEAF_TARGET);
      }
    }
    activeDocument.querySelectorAll(`.${VTAB_CONTAINER}`).forEach((el) => {
      el.classList.remove(VTAB_CONTAINER);
      el.classList.remove("superzen-vtab-left");
      el.classList.remove("superzen-vtab-right");
    });
    if (activeDocument.fullscreenElement) {
      activeDocument.exitFullscreen().catch(() => {
      });
    }
    activeDocument.removeEventListener("fullscreenchange", this.handleFullscreenChange);
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
    new import_obsidian.Setting(containerEl).setName("\u53CC\u5C4F\u6A21\u5F0F").setDesc("\u5F00\u542F\u540E\uFF0C\u8FDB\u5165\u7985\u6A21\u5F0F\u65F6\u5C06\u4FDD\u7559\u591A\u7A97\u683C\u540C\u5C4F\u5BF9\u7167\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.keepDualPanes).onChange(async (value) => {
      this.plugin.settings.keepDualPanes = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u9690\u85CF\u7B14\u8BB0\u5C5E\u6027\u533A\u57DF (Properties)").setDesc("\u5F00\u542F\u540E\uFF0C\u8FDB\u5165\u7985\u6A21\u5F0F\u5C06\u81EA\u52A8\u9690\u85CF\u6587\u6863\u9876\u90E8\u7684\u5C5E\u6027\u4FE1\u606F\u9762\u677F\uFF08YAML\u533A\u57DF\uFF09\uFF0C\u8BA9\u5199\u4F5C\u66F4\u6C89\u6D78\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.hideProperties).onChange(async (value) => {
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
    new import_obsidian.Setting(containerEl).setName("\u6781\u7B80\u60AC\u6D6E\u9009\u9879\u5361 (\u8FB9\u7F18\u60AC\u6D6E\u6587\u5B57)").setDesc("\u5F7B\u5E95\u53BB\u6846\u5316\uFF1A\u9009\u9879\u5361\u53D8\u4E3A\u7EAF\u7CB9\u6587\u5B57\u60AC\u6D6E\uFF0C\u89E3\u51B3\u6A2A\u5411\u6324\u538B\u53D8\u5F62\u95EE\u9898\u3002\u672A\u6FC0\u6D3B\u5448\u534A\u900F\u660E\u5E7D\u7075\u6001\uFF0C\u6FC0\u6D3B\u65F6\u5B57\u4F53\u70B9\u4EAE\u5E76\u5E26\u8FB9\u7F18\u7EBF\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.verticalTabs).onChange(async (value) => {
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
    new import_obsidian.Setting(containerEl).setName("\u56FA\u5B9A\u53F3\u5206\u5C4F\u6807\u7B7E (\u53CC\u5C4F\u6A21\u5F0F\u4E13\u7528)").setDesc("\u9ED8\u8BA4\u5173\u95ED(\u8DDF\u968F\u7126\u70B9\u7A97\u53E3)\u3002\u5F00\u542F\u540E\uFF1A\u5728\u53CC\u5C4F\u6A21\u5F0F\u4E0B\u65E0\u8BBA\u7126\u70B9\u5728\u54EA\uFF0C\u6781\u7B80\u60AC\u6D6E\u9009\u9879\u5361\u59CB\u7EC8\u56FA\u5B9A\u5728\u53F3\u4FA7\u7684\u5206\u5C4F\u4E0A\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.fixedRightTabs).onChange(async (value) => {
      this.plugin.settings.fixedRightTabs = value;
      await this.plugin.saveSettings();
      if (this.plugin.isActive) {
        this.plugin.updateVTabContainer();
      }
    }));
    new import_obsidian.Setting(containerEl).setName("\u5DE6\u53F3\u6807\u7B7E (\u53CC\u5C4F\u6A21\u5F0F\u4E13\u7528)").setDesc("\u5173\u95ED\u65F6\uFF0C\u4FDD\u6301\u5F53\u524D\u884C\u4E3A(\u4EC5\u5355\u4FA7\u663E\u793A\uFF0C\u8DDF\u968F\u7126\u70B9\u6216\u56FA\u5B9A\u53F3\u4FA7)\u3002\u5F00\u542F\u540E\uFF1A\u53CC\u5C4F\u5BF9\u7167\u65F6\uFF0C\u5DE6\u4FA7\u5C4F\u5E55\u7684\u9009\u9879\u5361\u56FA\u5B9A\u5728\u5DE6\u4FA7\u8FB9\u7F18\uFF0C\u53F3\u4FA7\u5C4F\u5E55\u7684\u9009\u9879\u5361\u56FA\u5B9A\u5728\u53F3\u4FA7\u8FB9\u7F18\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.splitTabs).onChange(async (value) => {
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
};
