// ==UserScript==
// @name         知乎自动夜间模式
// @namespace    https://github.com/SherlockChiang/Zhihu-auto-darkmode
// @version      1.3
// @description  根据系统深色模式自动切换知乎的黑夜/白天主题，并修复 React 类名导致的白底问题
// @author       Uranium92 & Antigravity
// @match        *://*.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=256&domain=https://www.zhihu.com/
// @updateURL    https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js
// @downloadURL  https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    // 考虑到哈希类名易变，保留您的类名操作作为渐进增强，但不作为唯一依赖
    const DARK_HEADER_CLASS  = 'css-13z3wib';
    const LIGHT_HEADER_CLASS = 'css-iilrph';
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    // 1) 完整的 CSS 兜底与全局强制覆盖：
    // 当 html[data-theme="dark"] 激活时，强制覆盖知乎写死在浅色类名里的背景色和文字色
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        /* 1. Header 的保底覆盖（涵盖您的原本逻辑） */
        html[data-theme="dark"]  header.AppHeader,
        html[data-theme="dark"] .AppHeader { background-color: #1a1a1a !important; color: #e6e6e6 !important; border-bottom-color: #282b30 !important; }
        html[data-theme="light"] header.AppHeader,
        html[data-theme="light"] .AppHeader { background-color: #ffffff !important; color: #1a1a1a !important; }

        /* 2. 全局 Body 颜色修复 */
        html[data-theme="dark"] body {
            background-color: #121212 !important;
            color: #999 !important;
        }

        /* 3. 核心容器强制深色化 (信息流卡片, 问题详情头部, 右侧边栏, 评论区容器等) */
        html[data-theme="dark"] .Card,
        html[data-theme="dark"] .QuestionHeader,
        html[data-theme="dark"] .Question-sideColumn,
        html[data-theme="dark"] .Comments-container,
        html[data-theme="dark"] .ProfileMain,
        html[data-theme="dark"] .Post-content {
            background-color: #1e1e1e !important;
            color: #c2c6cf !important;
            border-color: #282b30 !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.3) !important;
        }

        /* 4. 去除部分嵌套元素的透明度/背景冲突 */
        html[data-theme="dark"] .QuestionHeader-main,
        html[data-theme="dark"] .QuestionHeader-footer {
            background-color: transparent !important;
        }

        /* 5. 顶栏内部元素的文字/图标颜色 */
        html[data-theme="dark"] .AppHeader-TabsLink,
        html[data-theme="dark"] .AppHeader-SearchBar input {
            color: #c2c6cf !important;
        }
    `;
    (document.head || document.documentElement).appendChild(styleEl);

    let cookieSet = false;
    function setThemeCookie(theme) {
        document.cookie = `theme=${theme}; path=/; domain=.zhihu.com; max-age=31536000`;
        cookieSet = true;
    }

    function setRootTheme(theme) {
        if (document.documentElement.getAttribute('data-theme') !== theme) {
            document.documentElement.setAttribute('data-theme', theme);
        }
    }

    let observedHeader = null;
    const headerObserver = new MutationObserver(() => enforceHeaderClass(observedHeader));

    function enforceHeaderClass(node) {
        if (!node) return;
        const dark = mql.matches;
        const want   = dark ? DARK_HEADER_CLASS  : LIGHT_HEADER_CLASS;
        const remove = dark ? LIGHT_HEADER_CLASS : DARK_HEADER_CLASS;
        if (node.classList.contains(want) && !node.classList.contains(remove)) return;

        headerObserver.disconnect();
        node.classList.remove(remove);
        node.classList.add(want);
        if (node === observedHeader) {
            headerObserver.observe(node, { attributes: true, attributeFilter: ['class'] });
        }
    }

    function bindHeader(header) {
        if (header === observedHeader) {
            enforceHeaderClass(header);
            return;
        }
        headerObserver.disconnect();
        observedHeader = header;
        enforceHeaderClass(header);
        headerObserver.observe(header, { attributes: true, attributeFilter: ['class'] });
    }

    // 2) 监听 Header 以执行额外的类名操作 (渐进增强)
    let bodyObserver = null;
    function ensureHeader() {
        const header = document.querySelector('header.AppHeader, .AppHeader');
        if (header) {
            bindHeader(header);
            if (bodyObserver) { bodyObserver.disconnect(); bodyObserver = null; }
            return true;
        }
        return false;
    }

    function watchForHeader() {
        if (ensureHeader() || bodyObserver) return;
        bodyObserver = new MutationObserver(() => ensureHeader());
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    }

    function applyTheme() {
        const theme = mql.matches ? 'dark' : 'light';
        setRootTheme(theme);
        setThemeCookie(theme);
        if (document.body) watchForHeader();
    }

    // 3) 初始化
    applyTheme();
    mql.addEventListener('change', applyTheme);

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme();

        // 防止站点脚本反向把 data-theme 改回去
        new MutationObserver(() => setRootTheme(mql.matches ? 'dark' : 'light'))
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // 4) SPA 路由切换：history API 钩子
        const reattach = () => {
            observedHeader = null;
            headerObserver.disconnect();
            watchForHeader();
        };
        const _push = history.pushState;
        const _replace = history.replaceState;
        history.pushState    = function () { _push.apply(this, arguments);    reattach(); };
        history.replaceState = function () { _replace.apply(this, arguments); reattach(); };
        window.addEventListener('popstate', reattach);
    });
})();
