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
var STYLE_ID = "superzen-custom-style";
var BODY_ZEN_ACTIVE = "superzen-is-active";
var LEAF_TARGET = "superzen-target-leaf";
var BASE_TARGET = "superzen-is-base-target";
var SETTING_DUAL_PANE_CLASS = "superzen-dual-pane-mode";
var SETTING_VERTICAL_TABS_CLASS = "superzen-vertical-tabs";
var VTAB_CONTAINER = "superzen-vtab-container";
var MODE_CENTER_FULL = "superzen-mode-center-full";
var MODE_LEFT_AND_CENTER = "superzen-mode-left-center";
var MODE_RIGHT_BASE_FULL = "superzen-mode-right-base-full";
var MODE_RIGHT_AND_CENTER = "superzen-mode-right-center";
var DEFAULT_SETTINGS = {
  keepDualPanes: false,
  verticalTabs: false,
  fixedRightTabs: false
};
var CSS_STYLES = `
/* ==========================================
   \u5168\u5C40\u9690\u85CF\u89C4\u5219 
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

/* \u62D6\u62FD\u6761\u9690\u85CF\u903B\u8F91 */
body.${BODY_ZEN_ACTIVE} .workspace-split.mod-left-split > .workspace-leaf-resize-handle,
body.${BODY_ZEN_ACTIVE} .workspace-split.mod-right-split > .workspace-leaf-resize-handle {
    display: none !important;
}
body.${BODY_ZEN_ACTIVE}:not(.${SETTING_DUAL_PANE_CLASS}) .workspace-split.mod-root .workspace-leaf-resize-handle {
    display: none !important;
}

/* \u903B\u8F91\u4E00\uFF1A\u6B63\u6587\u5168\u5C4F */
body.${MODE_CENTER_FULL} .workspace-split.mod-left-split,
body.${MODE_CENTER_FULL} .workspace-split.mod-right-split {
    display: none !important;
}
body.${MODE_CENTER_FULL} .workspace-split.mod-root .workspace-tab-header-container {
    display: none !important;
}

/* \u667A\u80FD\u53CC\u5C4F\u903B\u8F91 */
body.${MODE_CENTER_FULL}:not(.${SETTING_DUAL_PANE_CLASS}) .workspace-split.mod-root .workspace-leaf:not(.${LEAF_TARGET}),
body.${MODE_CENTER_FULL}:not(.${SETTING_DUAL_PANE_CLASS}) .workspace-split.mod-root .workspace-tabs:not(:has(.${LEAF_TARGET})),
body.${MODE_CENTER_FULL}:not(.${SETTING_DUAL_PANE_CLASS}) .workspace-split.mod-root .workspace-split:not(:has(.${LEAF_TARGET})) {
    display: none !important;
}

/* \u903B\u8F91\u4E8C\uFF1A\u5DE6\u4FA7 + \u6B63\u6587 */
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

/* \u903B\u8F91\u4E09 (A)\uFF1A\u53F3\u4FA7 Base \u6587\u4EF6\u5168\u5C4F */
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

/* \u903B\u8F91\u4E09 (B)\uFF1A\u53F3\u4FA7\u666E\u901A\u9762\u677F + \u6B63\u6587 */
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

/* \u5168\u5C40 Base \u7559\u767D\u89C4\u5219 */
body.${BASE_TARGET} .workspace-leaf.${LEAF_TARGET} .view-content {
    padding-left: 15vw !important;
    padding-right: 15vw !important;
}

/* ==========================================
   \u2728 \u7EC8\u6781\u7248\uFF1A\u6781\u7B80\u4FA7\u8FB9\u60AC\u6D6E\u5B57 (\u7834\u9664\u6324\u538B\u9650\u5236) \u2728
   \u6CE8\u610F\uFF1A\u5DF2\u5347\u7EA7\u4E3A\u52A8\u6001\u76D1\u542C ${VTAB_CONTAINER}
   ========================================== */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} {
    position: relative !important;
    overflow: visible !important;
}

/* \u6700\u5916\u5C42\u5BB9\u5668\uFF1A\u56FA\u5B9A\u5728\u53F3\u4FA7\u4E2D\u95F4 */
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
    pointer-events: none; /* \u9632\u6B62\u7A7A\u6C14\u5899\u6321\u4F4F\u6B63\u6587\u70B9\u51FB */
    overflow: visible !important;
}

/* \u{1F680} \u5F3A\u529B\u6E05\u573A\uFF1A\u4E00\u5200\u5207\u5E72\u6389\u6240\u6709\u6742\u9879\u6309\u94AE\uFF08\u52A0\u53F7\u3001\u4E0B\u62C9\u7BAD\u5934\u3001\u5206\u5C4F\u56FE\u6807\u7B49\uFF09 */
body.${SETTING_VERTICAL_TABS_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} > .workspace-tab-header-container > * {
    display: none !important;
}

/* \u{1F6E1}\uFE0F \u767D\u540D\u5355\u653E\u884C\uFF1A\u552F\u72EC\u53EA\u5141\u8BB8\u5305\u542B\u6587\u5B57\u9009\u9879\u5361\u7684\u6838\u5FC3\u5217\u8868\u5BB9\u5668\u663E\u793A */
body.${SETTING_VERTICAL_TABS_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} > .workspace-tab-header-container > .workspace-tab-header-container-inner {
    display: flex !important;
}

/* \u5185\u90E8\u5217\u8868\uFF1A\u7EB5\u5411\u6392\u5217 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-container-inner {
    display: flex !important;
    flex-direction: column !important;
    gap: 16px !important; /* \u9009\u9879\u5361\u4E4B\u95F4\u7684\u5782\u76F4\u8DDD\u79BB */
    margin: 0 !important;
    padding: 0 !important;
    pointer-events: auto;
    overflow: visible !important;
}

/* \u5355\u4E2A\u9009\u9879\u5361\u7684\u5916\u90E8\u533A\u5757\uFF08\u6781\u7B80\u900F\u660E\uFF09 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header {
    width: 32px !important;
    height: auto !important;
    min-height: 60px !important;
    padding: 8px 0 !important;
    margin: 0 !important;
    background-color: transparent !important; 
    border: none !important;
    border-right: 2px solid transparent !important; /* \u7ED9\u6FC0\u6D3B\u72B6\u6001\u7559\u7684\u4F4D\u7F6E */
    border-radius: 0 !important; 
    opacity: 0.3 !important; /* \u9ED8\u8BA4\u5E7D\u7075\u72B6\u6001 */
    transition: all 0.3s ease !important;
    cursor: pointer !important;
    box-shadow: none !important;
    display: flex !important;
    justify-content: center !important;
    align-items: center !important;
    flex: none !important; /* \u7EDD\u5BF9\u7981\u6B62\u88AB\u538B\u7F29 */
}

/* \u91CD\u5851\u5185\u90E8\u6392\u7248\u7ED3\u6784\uFF08\u6253\u788E Obsidian \u7684\u6A2A\u5411 Flex \u9650\u5236\uFF09 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner {
    display: flex !important;
    flex-direction: column !important;
    width: 100% !important;
    height: 100% !important;
    padding: 0 !important;
    margin: 0 !important;
    overflow: visible !important;
}

/* \u{1F525} \u6838\u5FC3\u4FEE\u590D\uFF1A\u5F3A\u884C\u8BA9\u6587\u5B57\u7AD6\u8D77\u6765\u5E76\u663E\u793A\u5168 \u{1F525} */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-title {
    
}

/* \u6781\u81F4\u5E72\u51C0\uFF1A\u65A9\u6389\u56FE\u6807\u548C\u5173\u95ED\u6309\u94AE\uFF08\u7528\u9F20\u6807\u4E2D\u952E\u5173\u7F51\u9875\uFF09 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-icon,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header-inner-close-button {
    display: none !important;
}

/* \u6FC0\u6D3B\u6001\u548C\u60AC\u6D6E\u6001\uFF1A\u6781\u7B80\u5FAE\u5149\uFF08\u53EA\u6709\u5B57\u53D8\u4EAE\uFF0C\u53F3\u4FA7\u4E00\u6761\u7EC6\u7EBF\uFF09 */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header:hover,
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header.is-active {
    opacity: 1 !important;
    background-color: transparent !important;
    border-right: 2px solid var(--interactive-accent) !important; /* \u6781\u7EC6\u7684\u9AD8\u4EAE\u6307\u793A\u7EBF */
}

body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-tab-header.is-active .workspace-tab-header-inner-title {
    color: var(--interactive-accent) !important; /* \u6FC0\u6D3B\u65F6\u5B57\u4F53\u989C\u8272\u53D8\u4E3A\u4E3B\u8272\u8C03 */
}

/* \u9632\u6B62\u906E\u6321\u6B63\u6587\uFF1A\u53EA\u4F5C\u7528\u4E8E\u62E5\u6709\u5782\u76F4\u9009\u9879\u5361\u7684\u9762\u677F */
body.${SETTING_VERTICAL_TABS_CLASS}.${SETTING_DUAL_PANE_CLASS}.${MODE_CENTER_FULL} .workspace-split.mod-root .${VTAB_CONTAINER} .workspace-leaf .view-content {
    padding-right: 60px !important;
}
`;
var SuperZenPlugin = class extends import_obsidian.Plugin {
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
      name: "\u5F00\u542F/\u5173\u95ED \u5B9A\u5236\u7985\u6A21\u5F0F",
      callback: () => this.toggleZenMode()
    });
    this.addCommand({
      id: "toggle-super-zen-dual-pane",
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
      this.styleEl = document.createElement("style");
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
    document.querySelectorAll(`.${VTAB_CONTAINER}`).forEach((el) => el.classList.remove(VTAB_CONTAINER));
    if (!this.isActive || !this.targetLeaf) return;
    const rootTabs = document.querySelectorAll(".workspace-split.mod-root .workspace-tabs");
    if (rootTabs.length === 0) return;
    const isDualPaneActive = document.body.classList.contains(SETTING_DUAL_PANE_CLASS);
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
        const body = document.body;
        if (this.settings.keepDualPanes) {
          body.classList.add(SETTING_DUAL_PANE_CLASS);
          new import_obsidian.Notice("SuperZen: \u5207\u6362\u81F3\u3010\u53CC\u5C4F\u5BF9\u7167\u3011");
        } else {
          let activeLeaf = this.app.workspace.activeLeaf;
          if (!activeLeaf) activeLeaf = this.app.workspace.getMostRecentLeaf();
          if (activeLeaf && activeLeaf !== this.targetLeaf) {
            if (this.targetLeaf && this.targetLeaf.containerEl) {
              this.targetLeaf.containerEl.classList.remove(LEAF_TARGET);
            }
            this.targetLeaf = activeLeaf;
            if (this.targetLeaf.containerEl) {
              this.targetLeaf.containerEl.classList.add(LEAF_TARGET);
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
    let activeLeaf = this.app.workspace.activeLeaf;
    if (!activeLeaf) {
      activeLeaf = this.app.workspace.getMostRecentLeaf();
    }
    if (!activeLeaf) {
      const domActive = document.querySelector(".workspace-leaf.mod-active");
      if (domActive) {
        this.app.workspace.iterateAllLeaves((leaf) => {
          const leafContainer = leaf.containerEl;
          if (leafContainer === domActive || leafContainer?.contains(domActive)) {
            activeLeaf = leaf;
          }
        });
      }
    }
    if (!activeLeaf) {
      new import_obsidian.Notice("SuperZen: \u672A\u627E\u5230\u53EF\u6FC0\u6D3B\u7684\u7A97\u53E3");
      return;
    }
    this.targetLeaf = activeLeaf;
    this.isActive = true;
    const root = this.targetLeaf.getRoot();
    const body = document.body;
    body.classList.add(BODY_ZEN_ACTIVE);
    const containerEl = this.targetLeaf.containerEl;
    if (containerEl) containerEl.classList.add(LEAF_TARGET);
    if (this.settings.verticalTabs) {
      body.classList.add(SETTING_VERTICAL_TABS_CLASS);
    }
    if (this.settings.keepDualPanes) {
      if (root === this.app.workspace.rootSplit) {
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
    if (root === this.app.workspace.rootSplit) {
      this.currentModeClass = MODE_CENTER_FULL;
      body.classList.add(MODE_CENTER_FULL);
    } else if (root === this.app.workspace.leftSplit) {
      this.currentModeClass = MODE_LEFT_AND_CENTER;
      body.classList.add(MODE_LEFT_AND_CENTER);
    } else if (root === this.app.workspace.rightSplit) {
      if (isBaseFile) {
        this.currentModeClass = MODE_RIGHT_BASE_FULL;
        body.classList.add(MODE_RIGHT_BASE_FULL);
      } else {
        this.currentModeClass = MODE_RIGHT_AND_CENTER;
        body.classList.add(MODE_RIGHT_AND_CENTER);
      }
    }
    if (!document.fullscreenElement) {
      document.body.requestFullscreen().catch((err) => {
        console.warn("SuperZen: \u8BF7\u6C42\u5168\u5C4F\u5931\u8D25, \u4F46\u7EE7\u7EED\u6267\u884C\u4E13\u6CE8\u6A21\u5F0F", err);
      });
    }
    document.addEventListener("fullscreenchange", this.handleFullscreenChange);
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
    if (this.targetLeaf && this.targetLeaf.containerEl) {
      this.targetLeaf.containerEl.classList.remove(LEAF_TARGET);
    }
    document.querySelectorAll(`.${VTAB_CONTAINER}`).forEach((el) => el.classList.remove(VTAB_CONTAINER));
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {
      });
    }
    document.removeEventListener("fullscreenchange", this.handleFullscreenChange);
    this.isActive = false;
    this.targetLeaf = null;
    this.currentModeClass = null;
  }
  handleFullscreenChange() {
    if (!document.fullscreenElement && this.isActive) {
      this.exitZenMode();
    }
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
    containerEl.createEl("h2", { text: "SuperZen \u5B9A\u5236\u7985\u6A21\u5F0F\u8BBE\u7F6E" });
    new import_obsidian.Setting(containerEl).setName("\u53CC\u5C4F\u6A21\u5F0F").setDesc("\u5F00\u542F\u540E\uFF0C\u8FDB\u5165\u7985\u6A21\u5F0F\u65F6\u5C06\u4FDD\u7559\u591A\u7A97\u683C\u540C\u5C4F\u5BF9\u7167\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.keepDualPanes).onChange(async (value) => {
      this.plugin.settings.keepDualPanes = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("\u6781\u7B80\u60AC\u6D6E\u9009\u9879\u5361 (\u8FB9\u7F18\u60AC\u6D6E\u6587\u5B57)").setDesc("\u5F7B\u5E95\u53BB\u6846\u5316\uFF1A\u9009\u9879\u5361\u53D8\u4E3A\u7EAF\u7CB9\u6587\u5B57\u60AC\u6D6E\uFF0C\u89E3\u51B3\u6A2A\u5411\u6324\u538B\u53D8\u5F62\u95EE\u9898\u3002\u672A\u6FC0\u6D3B\u5448\u534A\u900F\u660E\u5E7D\u7075\u6001\uFF0C\u6FC0\u6D3B\u65F6\u5B57\u4F53\u70B9\u4EAE\u5E76\u5E26\u8FB9\u7F18\u7EBF\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.verticalTabs).onChange(async (value) => {
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
    new import_obsidian.Setting(containerEl).setName("\u56FA\u5B9A\u53F3\u5206\u5C4F\u6807\u7B7E (\u53CC\u5C4F\u6A21\u5F0F\u4E13\u7528)").setDesc("\u9ED8\u8BA4\u5173\u95ED(\u8DDF\u968F\u7126\u70B9\u7A97\u53E3)\u3002\u5F00\u542F\u540E\uFF1A\u5728\u53CC\u5C4F\u6A21\u5F0F\u4E0B\u65E0\u8BBA\u7126\u70B9\u5728\u54EA\uFF0C\u6781\u7B80\u60AC\u6D6E\u9009\u9879\u5361\u59CB\u7EC8\u56FA\u5B9A\u5728\u53F3\u4FA7\u7684\u5206\u5C4F\u4E0A\u3002").addToggle((toggle) => toggle.setValue(this.plugin.settings.fixedRightTabs).onChange(async (value) => {
      this.plugin.settings.fixedRightTabs = value;
      await this.plugin.saveSettings();
      if (this.plugin.isActive) {
        this.plugin.updateVTabContainer();
      }
    }));
  }
};
