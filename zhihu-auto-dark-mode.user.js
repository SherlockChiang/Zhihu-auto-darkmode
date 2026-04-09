// ==UserScript==
// @name         知乎自动夜间模式
// @namespace    https://github.com/SherlockChiang/Zhihu-auto-darkmode
// @version      1.1
// @description  根据系统深色模式自动切换知乎的黑夜/白天主题
// @author       Uranium92
// @match        *://*.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=256&domain=https://www.zhihu.com/
// @updateURL    https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js
// @downloadURL  https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    const DARK_HEADER_CLASS = 'css-13z3wib'; 
    const LIGHT_HEADER_CLASS = 'css-iilrph';  

    function isSystemDark() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    function applyTheme() {
        const dark = isSystemDark();
        const themeStr = dark ? 'dark' : 'light';

        if (document.documentElement.getAttribute('data-theme') !== themeStr) {
            document.documentElement.setAttribute('data-theme', themeStr);
        }

        document.cookie = `theme=${themeStr}; path=/; domain=.zhihu.com; max-age=31536000`;

        checkAndBindHeader();
    }

    let observedHeaderNode = null;

    const headerObserver = new MutationObserver(() => {
        if (observedHeaderNode) {
            enforceHeaderClass(observedHeaderNode);
        }
    });

    function enforceHeaderClass(headerNode) {
        const dark = isSystemDark();

        if (dark) {
            if (headerNode.classList.contains(LIGHT_HEADER_CLASS)) {
                headerNode.classList.remove(LIGHT_HEADER_CLASS);
            }
            if (!headerNode.classList.contains(DARK_HEADER_CLASS)) {
                headerNode.classList.add(DARK_HEADER_CLASS);
            }
        } else {
            if (headerNode.classList.contains(DARK_HEADER_CLASS)) {
                headerNode.classList.remove(DARK_HEADER_CLASS);
            }
            if (!headerNode.classList.contains(LIGHT_HEADER_CLASS)) {
                headerNode.classList.add(LIGHT_HEADER_CLASS);
            }
        }
    }

    function checkAndBindHeader() {
        const header = document.querySelector('header.AppHeader') || document.querySelector('.AppHeader');

        if (header) {
            enforceHeaderClass(header);

            if (header !== observedHeaderNode) {
                headerObserver.disconnect();
                observedHeaderNode = header;
                headerObserver.observe(header, { attributes: true, attributeFilter: ['class'] });
            }
        }
    }

    applyTheme();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyTheme);

    document.addEventListener('DOMContentLoaded', () => {
        applyTheme();

        const htmlObserver = new MutationObserver(() => {
            const themeStr = isSystemDark() ? 'dark' : 'light';
            if (document.documentElement.getAttribute('data-theme') !== themeStr) {
                document.documentElement.setAttribute('data-theme', themeStr);
            }
        });
        htmlObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        const bodyObserver = new MutationObserver(() => {
            checkAndBindHeader();
        });
        bodyObserver.observe(document.body, { childList: true, subtree: true });
    });

})();
