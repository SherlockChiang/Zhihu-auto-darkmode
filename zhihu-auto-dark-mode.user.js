// ==UserScript==
// @name         知乎自动夜间模式
// @namespace    https://github.com/SherlockChiang/Zhihu-auto-darkmode
// @version      2.2.1
// @description  根据系统深色模式加载知乎原生主题，并修复少量深色模式遗漏
// @author       Uranium92
// @match        https://www.zhihu.com/*
// @match        https://zhuanlan.zhihu.com/*
// @icon         https://www.google.com/s2/favicons?sz=256&domain=https://www.zhihu.com/
// @updateURL    https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js
// @downloadURL  https://raw.githubusercontent.com/SherlockChiang/Zhihu-auto-darkmode/main/zhihu-auto-dark-mode.user.js
// @grant        none
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
    'use strict';

    const STYLE_ID = 'zhihu-auto-dark-mode-style';
    const THEME_PARAM = 'theme';
    const VALID_THEMES = new Set(['light', 'dark']);
    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    const root = document.documentElement;

    function getPreferredTheme() {
        return mql.matches ? 'dark' : 'light';
    }

    function setThemeCookie(theme) {
        document.cookie = `theme=${theme}; Path=/; Domain=.zhihu.com; Max-Age=31536000; SameSite=Lax; Secure`;
    }

    function setRootTheme(theme) {
        if (root.getAttribute('data-theme') !== theme) {
            root.setAttribute('data-theme', theme);
        }
    }

    function getNativeThemeHint() {
        const queryTheme = new URL(location.href).searchParams.get(THEME_PARAM);
        return VALID_THEMES.has(queryTheme)
            ? queryTheme
            : root.getAttribute('data-theme');
    }

    function getThemeUrl(theme) {
        const url = new URL(location.href);
        url.searchParams.set(THEME_PARAM, theme);
        return url.href;
    }

    // data-theme 只能切换变量，无法让知乎重新生成 Emotion 的明暗哈希样式。
    // 首屏主题不一致时先校正 URL，让知乎从服务端开始就使用正确主题。
    function ensureNativeTheme(theme) {
        setThemeCookie(theme);

        if (getNativeThemeHint() !== theme) {
            location.replace(getThemeUrl(theme));
            return false;
        }

        setRootTheme(theme);
        return true;
    }

    function injectFallbackStyles() {
        if (document.getElementById(STYLE_ID)) {
            return;
        }

        const styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = `
            html[data-theme="dark"] {
                color-scheme: dark;
            }

            /* 只补齐仍使用固定浅色的业务组件，主页面结构交给知乎原生主题。 */
            html[data-theme="dark"] :where(
                .jumpThird-ad-tip, .Pc-feedAd-container--mobile,
                .Pc-feedAd-card-sign-popup, .Pc-feedAd-card-sign-popup-menu,
                .Pc-feedAd-card-content, .Pc-feedAd-new-card-content,
                .KfeCollection-CreateSaltCard, .KfeCollection-GoodsCardNew-wrapper,
                .KfeCollection-GoodsCardV2, .KfeCollection-PaidConsultCard-CardWrapper,
                .KfeCollection-PcCollegeCard-root, .KfeCollection-PcSaltBrandCard,
                .KfeCollection-PayModal-wrapper, .TooltipContent--white
            ) {
                background-color: var(--GBK99A, #191b1f) !important;
                border-color: var(--GBK09A, #282b30) !important;
                color: var(--GBK03A, #c2c6cf) !important;
            }

            html[data-theme="dark"] :where(.Pc-feedAd-card-title, .Pc-feedAd-new-title) {
                color: var(--GBK02A, #fff) !important;
            }

            html[data-theme="dark"] .KfeCollection-components-Toast {
                background-color: var(--GBK10C, #000) !important;
                color: var(--GBK03A, #c2c6cf) !important;
            }

            html[data-theme="dark"] :where(
                .NavigateToAppCheckCard-mask, .KfeCollection-TextLink-mask,
                .KfeCollection-PurchaseBtn-mask
            ) {
                background: linear-gradient(180deg, transparent, var(--GBK99A, #191b1f)) !important;
            }

            html[data-theme="dark"] .TooltipContent--white .TooltipContent-arrow::after {
                background-color: var(--GBK99A, #191b1f) !important;
            }

            html[data-theme="dark"] .SignContainer-content input:-webkit-autofill {
                -webkit-text-fill-color: var(--GBK03A, #c2c6cf) !important;
                -webkit-box-shadow: inset 0 0 0 1000px var(--GBK10A, #212429) !important;
            }

            html[data-theme="dark"] :where(
                .ModalWrap-itemBtn, .SearchSubTabs-item, .DraftHistory-revert,
                .Pc-feedAd-link-btn
            ):is(:hover, :focus-visible, .is-active) {
                color: var(--GBL01A, #558eff) !important;
            }

            html[data-theme="dark"] :where(
                .SearchTabs-customFilter .tag-selected, .highlight-wrap-checking
            ) {
                background-color: rgba(85, 142, 255, .1) !important;
            }

            html[data-theme="dark"] :where(
                .AnswerForm-fullscreenBackdrop, .ImageView.is-active, .ImageGallery.is-active
            ) {
                background-color: rgba(0, 0, 0, .65) !important;
            }
        `;
        (document.head || root).appendChild(styleEl);
    }

    function handleSystemThemeChange() {
        const theme = getPreferredTheme();
        const nextUrl = getThemeUrl(theme);

        setThemeCookie(theme);
        setRootTheme(theme);

        // 重新加载一次，使 Emotion 哈希类与新的系统主题保持一致。
        if (nextUrl === location.href) {
            location.reload();
        } else {
            location.replace(nextUrl);
        }
    }

    const initialTheme = getPreferredTheme();
    if (!ensureNativeTheme(initialTheme)) {
        return;
    }

    // 浅色页面完全使用知乎原生样式，不注入不会生效的深色补丁。
    if (initialTheme === 'dark') {
        injectFallbackStyles();
    }

    // 防止知乎初始化或 SPA 导航覆盖系统主题。
    new MutationObserver(() => setRootTheme(getPreferredTheme()))
        .observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    if (typeof mql.addEventListener === 'function') {
        mql.addEventListener('change', handleSystemThemeChange);
    } else {
        mql.addListener(handleSystemThemeChange);
    }
})();
