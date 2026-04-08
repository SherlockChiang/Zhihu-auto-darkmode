// ==UserScript==
// @name         知乎自动夜间模式
// @namespace    https://github.com/SherlockChiang/Zhihu-auto-darkmode
// @version      1.0
// @description  根据系统深色模式自动切换知乎的黑夜/白天主题，无缝不刷新
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

    function autoToggleDarkMode() {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        const targetElement = document.documentElement;

        if (isSystemDark) {
            if (targetElement.getAttribute('data-theme') !== 'dark') {
                targetElement.setAttribute('data-theme', 'dark');
                document.cookie = "theme=dark; path=/; domain=.zhihu.com; max-age=31536000";
            }
        } else {
            if (targetElement.getAttribute('data-theme') !== 'light') {
                targetElement.setAttribute('data-theme', 'light');
                document.cookie = "theme=light; path=/; domain=.zhihu.com; max-age=31536000";
            }
        }
    }

    autoToggleDarkMode();

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', autoToggleDarkMode);

    const observer = new MutationObserver((mutations) => {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        const targetElement = document.documentElement;

        if (isSystemDark && targetElement.getAttribute('data-theme') !== 'dark') {
            targetElement.setAttribute('data-theme', 'dark');
        } else if (!isSystemDark && targetElement.getAttribute('data-theme') !== 'light') {
            targetElement.setAttribute('data-theme', 'light');
        }
    });

    document.addEventListener('DOMContentLoaded', () => {
        autoToggleDarkMode(); // 页面加载完再巩固一次
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    });

})();
