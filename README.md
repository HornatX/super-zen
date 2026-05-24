# SuperZen

SuperZen is an ultimate focus (Zen) mode plugin for Obsidian. It goes beyond simple distraction-free editing by completely striping away standard UI clutter and introducing innovative **edge-floating vertical text tabs** and **smart dual-pane split-screen comparison** for deep focus sessions.

插件还在测试当中,如果有bug或错误,加群讨论
QQ交流群:599796635

[简体中文说明](#简体中文)

---

## 🌟 Key Features

### 1. Zero-Clutter Zen Focus Mode
- **Full Immersion**: Hide the ribbon, status bar, title bars, file navigation header, search bars, file metadata properties, tab header containers, and split-screen resize handles instantly.
- **Auto Fullscreen**: Toggling Zen Mode automatically requests native borderless fullscreen (and exits cleanly when Zen Mode is turned off).

### 2. Smart Dual-Pane Comparison (Split Screen)
- Keep side-by-side split screens active even in Zen Mode. If you focus on a split pane and activate SuperZen, it automatically hides side docks but keeps both panes visible for seamless reference, reading, and writing.

### 3. Edge-Floating Vertical Text Tabs (V-Tabs)
- **Extreme De-cluttering**: Transforming noisy horizontal tab headers into pure, borderless vertical text floating elegantly on the right edge of the screen (`writing-mode: vertical-rl`).
- **Ghost Transparency**: Unfocused tabs appear as faint, semi-transparent text to eliminate cognitive load. Active or hovered tabs light up with a subtle edge highlight and dynamic brand-accent colors.
- **Clean Layout**: Hides close buttons, file icons, and new tab buttons for a clean, typographic reading experience.

### 4. Optimized Focus Margins for `.base` Files
- Specifically designed to handle database or `.base` extension view files. Activates custom focus paddings (`padding: 0 15vw`) to center database tables beautifully on widescreen displays.

---

## ⚙️ Settings

- **Smart Multi-Pane Comparison (keepDualPanes)**: Toggle whether to keep the left pane visible for dual-pane comparison when activating Zen Mode on the right split.
- **Minimalist Floating Tabs (verticalTabs)**: Turn standard tab headers into vertical floating text labels along the pane edge, solving horizontal squeeze/clutter.
- **Fixed Right Split Tabs (fixedRightTabs)**: When in dual-pane mode, lock the vertical floating tabs to the right pane instead of letting them shift focus.

---

## ⌨️ Command Shortcuts

Open the **Command Palette** (`Ctrl/Cmd + P`) and search for:
- `SuperZen: Toggle Custom Zen Mode` (开启/关闭 定制禅模式)
- `SuperZen: Toggle Single/Dual Pane Comparison` (切换 单屏/双屏 对照模式)

---

## 📥 Installation

### Method 1: Community Plugins (Recommended)
Once listed on the community store, you can install it directly:
1. Go to **Settings** > **Community plugins** > **Browse**.
2. Search for `SuperZen`.
3. Click **Install**, then **Enable**.

### Method 2: Manual Installation
1. Download the latest release (`main.js`, `manifest.json`, and `styles.css`) from the [Releases](https://github.com/hornatx/superzen/releases) page.
2. Open your Obsidian vault directory in your file manager.
3. Move the files to `<your-vault>/.obsidian/plugins/superzen/`.
4. Open Obsidian **Settings** > **Community plugins**, and turn on **SuperZen**.

---

## 简体中文

**SuperZen** 是一款为 Obsidian 打造的极致沉浸式“禅模式（专注模式）”插件。它不仅能帮您全局隐藏所有的系统边框与干扰元素，更独创了**“边缘悬浮纵向文本标签”**与**“智能双栏对照模式”**，让您的双眸回归创作本身。

---

## 🌟 核心功能

### 1. 极致无缝的专注禅模式
- **全面屏蔽干扰**：一键隐藏左侧工具栏（Ribbon）、底部状态栏（Status Bar）、窗口标题栏、文档元数据（Properties）、标签页栏、搜素组件头部以及分屏拖拽条。
- **自动全屏切换**：开启专注模式时，自动发起系统级无边框全屏，退出时自动恢复窗口大小，带来一体化的沉浸体验。

### 2. 智能多窗格对照（双屏模式）
- 在专注模式下支持智能分屏对照。当您聚焦于右侧视口开启 SuperZen 时，左侧的对照参考文档将继续保持，在屏蔽两侧面板干扰的同时保留高效的左读右写体验。

### 3. 边缘悬浮纵向选项卡（纯字侧悬浮）
- **彻底去框化**：摒弃传统横向标签页对屏幕空间的挤压，将选项卡重塑为悬浮在视口右侧的“纵向排版文字”（`writing-mode: vertical-rl`）。
- **幽灵半透状态**：非活动标签呈现低对比度的淡光透明态，降低视觉噪音；鼠标悬浮或标签激活时，字体温和点亮并辅以极细的侧边缘指示线。
- **极简无图设计**：隐藏选项卡关闭按钮、文件图标和加号，防止操作分心。

### 4. `.base` 数据库文件专属优雅留白
- 特别针对 `.base` 后缀的文件或数据库视图设计。当在禅模式下阅读数据库时，自动在两侧开启 `15vw` 的视口留白，让大屏显示器上的表格排版更符合人类视觉焦点。

---

## ⚙️ 插件设置

- **智能多窗格对照 (keepDualPanes)**：开启后，当您聚焦于右侧分屏开启禅模式时，将为您保留左侧分屏作为参考同屏对照。
- **极简悬浮选项卡 (verticalTabs)**：彻底将传统的横向选项卡重塑为右侧边缘纵向悬浮文本，防止选项卡横向挤压变形。
- **固定右分屏标签 (fixedRightTabs)**：双屏模式专用。开启后，极简悬浮选项卡将始终固定展示在最右侧的分屏上，不再跟随焦点窗口晃动。

---

## ⌨️ 快捷命令

按下 `Ctrl/Cmd + P` 打开**命令面板**，搜索并运行：
- `SuperZen: 开启/关闭 定制禅模式`
- `SuperZen: 切换 单屏/双屏 对照模式`

---

## 📥 安装方法

### 方法一：社区插件安装（推荐）
待插件正式上架后，您可以在 Obsidian 软件内一键安装：
1. 前往 **设置** > **社区插件** > **浏览**。
2. 搜索并选择 `SuperZen`。
3. 点击 **安装** 并 **启用**。

### 方法二：手动安装
1. 从 [Releases](https://github.com/hornatx/superzen/releases) 页面下载 `main.js`、`manifest.json` 和 `styles.css` 文件。
2. 打开您的本地库，进入目录 `.obsidian/plugins/`，并创建一个名为 `superzen` 的文件夹。
3. 将下载的文件放入该文件夹。
4. 在 Obsidian **设置** > **社区插件** 中重新加载并开启该插件。