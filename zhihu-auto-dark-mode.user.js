// ==UserScript==
// @name         知乎自动夜间模式
// @namespace    https://github.com/SherlockChiang/Zhihu-auto-darkmode
// @version      1.2
// @description  根据系统深色模式自动切换知乎的黑夜/白天主题
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

    const DARK_HEADER_CLASS  = 'css-13z3wib';
    const LIGHT_HEADER_CLASS = 'css-iilrph';
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    // 1) 用 CSS 做兜底：即使哈希类名变了或没匹配上，header 颜色也会跟随 data-theme
    //    这样脚本即便 class 操作失败也不会出现"白头黑身"
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        html[data-theme="dark"]  header.AppHeader { background-color: #1a1a1a !important; color: #e6e6e6 !important; }
        html[data-theme="light"] header.AppHeader { background-color: #ffffff !important; color: #1a1a1a !important; }
    `;
    (document.head || document.documentElement).appendChild(styleEl);

    let cookieSet = false;
    function setThemeCookie(theme) {
        // cookie 内容只在切换时变化，没必要每次都写
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

        // 解绑→改→重绑，避免自激
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

    // 2) 不再监听整个 body。只在 header 丢失时短暂启用一次性查找
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

    // 3) 初始化（document-start 时 body 可能还不存在）
    applyTheme();

    mql.addEventListener('change', applyTheme);

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme();

        // 防止站点脚本反向把 data-theme 改回去
        new MutationObserver(() => setRootTheme(mql.matches ? 'dark' : 'light'))
            .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // 4) SPA 路由切换：history API 钩子（替代 body 全量监听）
        const reattach = () => {
            // 路由变了，header 可能被替换，重新查一次
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
