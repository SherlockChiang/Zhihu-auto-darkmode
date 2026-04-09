# 知乎自动夜间模式 (Zhihu Auto Dark Mode)

一个轻量级的 Tampermonkey (油猴) 脚本，用于让 Web 版知乎（zhihu.com）的主题自动跟随你的操作系统深色模式进行切换。

## 核心特性
当系统切换为深色/浅色模式时，网页切换到知乎样式对应模式，完全无需重新刷新页面。

## 安装指南
### 第一步：安装脚本管理器
如果你还没有安装 Tampermonkey（油猴）扩展，请先在你的浏览器中安装

### 第二步：一键安装脚本
点击链接，Tampermonkey 会自动弹出安装界面：https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js

## 实现方式
监听系统深浅色状态，动态修改最外层 <html> 标签的 data-theme 属性实现无缝变色，并替换 <header> 的类名 css-13z3wib 和 css-iilrph。
