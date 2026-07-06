// ==UserScript==
// @name         知乎自动夜间模式
// @namespace    https://github.com/SherlockChiang/Zhihu-auto-darkmode
// @version      2.0
// @description  根据系统深色模式自动切换知乎的主题，彻底修复白底漏网之鱼与顶栏图标问题
// @author       Uranium92
// @match        *://*.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=256&domain=https://www.zhihu.com/
// @updateURL    https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js
// @downloadURL  https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    // 1. 全局 CSS 注入：精准覆盖遗漏容器，修复图标颜色
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* --- 深色模式 (Dark) 强制样式 --- */
        /* 1.1 全局背景与外层包裹修复 */
        html[data-theme="dark"] body,
        html[data-theme="dark"] .Topstory-body,
        html[data-theme="dark"] .App-main {
            background-color: #121212 !important;
            color: #999 !important;
        }

        /* 1.2 核心容器强制深色化 */
        html[data-theme="dark"] header.AppHeader,
        html[data-theme="dark"] .AppHeader,
        html[data-theme="dark"] .Card,
        html[data-theme="dark"] .QuestionHeader,
        html[data-theme="dark"] .Question-sideColumn,
        html[data-theme="dark"] .Comments-container,
        html[data-theme="dark"] .ProfileMain,
        html[data-theme="dark"] .Post-content,
        html[data-theme="dark"] .HotSearchCard,
        html[data-theme="dark"] .KfeCollection-CreateSaltCard,
        html[data-theme="dark"] .CornerButton {
            background-color: #1e1e1e !important;
            color: #c2c6cf !important;
            border-color: #282b30 !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
        }

        /* 1.3 顶栏图标、链接及文字修复 */
        html[data-theme="dark"] .AppHeader button,
        html[data-theme="dark"] .AppHeader svg,
        html[data-theme="dark"] .AppHeader a {
            color: #c2c6cf !important;
            fill: currentColor !important;
        }

        /* 1.4 搜索框适配 */
        html[data-theme="dark"] .SearchBar-input {
            background-color: #121212 !important;
            color: #c2c6cf !important;
            border-color: #282b30 !important;
        }

        /* 1.5 消除部分嵌套元素的底层背景冲突 */
        html[data-theme="dark"] .QuestionHeader-main,
        html[data-theme="dark"] .QuestionHeader-footer {
            background-color: transparent !important;
        }

        /* --- 浅色模式 (Light) 恢复顶栏原生样式 --- */
        html[data-theme="light"] header.AppHeader,
        html[data-theme="light"] .AppHeader {
            background-color: #ffffff !important;
            color: #1a1a1a !important;
            border-bottom: 1px solid #f0f2f7 !important;
        }
        html[data-theme="light"] .AppHeader button,
        html[data-theme="light"] .AppHeader svg,
        html[data-theme="light"] .AppHeader a {
            color: #535861 !important;
            fill: currentColor !important;
        }
    `;
    (document.head || document.documentElement).appendChild(styleEl);

    // 2. Cookie 状态同步
    function setThemeCookie(theme) {
        document.cookie = `theme=${theme}; path=/; domain=.zhihu.com; max-age=31536000`;
    }

    // 3. 根节点主题属性切换
    function setRootTheme(theme) {
        const root = document.documentElement;
        if (root.getAttribute('data-theme') !== theme) {
            root.setAttribute('data-theme', theme);
        }
    }

    // 4. 核心调度
    function applyTheme() {
        const theme = mql.matches ? 'dark' : 'light';
        setRootTheme(theme);
        setThemeCookie(theme);
    }

    // 立即执行一次
    applyTheme();
    // 监听系统深浅色切换
    mql.addEventListener('change', applyTheme);

    // DOM 加载完后的操作
    document.addEventListener('DOMContentLoaded', () => {
        applyTheme();

        // 强力防御：防止知乎的原生 JS 加载后把 data-theme 强行覆盖回浅色
        new MutationObserver(() => setRootTheme(mql.matches ? 'dark' : 'light'))
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    });
})();
