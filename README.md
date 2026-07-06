# 知乎自动夜间模式 (Zhihu Auto Dark Mode)

一个轻量级的 Tampermonkey (油猴) 脚本，用于让 Web 版知乎（zhihu.com）的主题自动跟随你的操作系统深色模式进行切换。

## 核心特性
当系统切换为深色/浅色模式时，网页切换到知乎样式对应模式，完全无需重新刷新页面。

修复知乎官方深色模式下因 React 类名哈希化导致的“白头黑身”、卡片发白等适配遗漏问题。

## 安装指南
### 第一步：安装脚本管理器
如果你还没有安装 Tampermonkey（油猴）扩展，请先在你的浏览器中安装

### 第二步：一键安装脚本
点击下方链接，Tampermonkey 会自动弹出安装界面：

https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js

## 实现方式
1. **DOM 属性切换**：监听系统深浅色状态 (`prefers-color-scheme`)，动态修改最外层 `<html>` 标签的 `data-theme` 属性，激活知乎的全局 CSS 变量。
2. **CSS 强制覆盖注入**：由于知乎使用 React + Emotion 渲染，导致某些组件类名硬编码了浅色背景。本脚本通过注入兜底 `<style>` 样式，精准覆盖顶栏、信息流卡片、侧边栏及评论区等核心容器，确保深色模式无死角。
3. **类名替换（渐进增强）**：动态替换 `<header>` 的哈希类名（如 `css-13z3wib` 与 `css-iilrph`）以及监听 SPA 路由跳转，进一步提升原生过渡体验。
