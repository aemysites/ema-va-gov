/* eslint-disable */
/* global WebImporter */

/**
 * Transformer: VA.gov site-wide cleanup.
 * All selectors verified in migration-work/cleaned.html.
 *
 * NOTE: VA.gov web components (va-link, va-button, va-icon, va-link-action,
 * va-text-input, va-search-input, ...) are intentionally NOT removed - block
 * parsers read their attributes (text, href, label, icon). Only the alert
 * banner web component (va-banner) and route announcer are stripped.
 */
const TransformHook = { beforeTransform: 'beforeTransform', afterTransform: 'afterTransform' };

export default function transform(hookName, element, payload) {
  if (hookName === TransformHook.beforeTransform) {
    // Overlays / widgets that could interfere with block parsing.
    WebImporter.DOMUtils.remove(element, [
      // Facility/status alert container: <div id="announcement-root">
      '#announcement-root',
      // Severe weather / facility status banner: <va-banner id="71421" class="hydrated">
      'va-banner',
      // Crisis line modal: <div id="modal-crisisline" class="va-overlay va-modal va-modal-large">
      '#modal-crisisline',
      '.va-overlay.va-modal',
      // Logout modal root: <div id="logout-modal-root">
      '#logout-modal-root',
      // Feedback (Medallia) survey button: <va-button id="mdFormButton"> inside <div class="last-updated">
      '#mdFormButton',
      '.last-updated',
    ]);

    // Remove the now-empty wrapper that held the feedback button:
    // <main id="content"> > <div class="vads-grid-container"> (div, not the <section> used by section 4)
    element.querySelectorAll('#content > div.vads-grid-container').forEach((el) => {
      if (!el.textContent.trim() && !el.querySelector('img, picture, va-link, va-button, va-link-action')) {
        el.remove();
      }
    });
  }

  if (hookName === TransformHook.afterTransform) {
    // Global chrome (header, footer, gov banner, nav, search, login).
    WebImporter.DOMUtils.remove(element, [
      // <header class="header"> containing #header-v2, #legacy-header, .usa-banner, #gov-banner,
      // .va-crisis-line-container, #va-header-logo-menu, #login-root, #mega-menu, #vetnav
      'header.header',
      '#header-v2',
      '#legacy-header',
      '.va-notice--banner',
      '.usa-banner',
      '#gov-banner',
      '#va-header-logo-menu',
      '#login-root',
      '#mega-menu',
      '#vetnav',
      'va-maintenance-banner',
      // <footer class="footer"> with <div id="footerNav">
      'footer.footer',
      '#footerNav',
      // Skip link: <a href="#content" class="show-on-focus">
      'a.show-on-focus',
      // Next.js route announcer: <next-route-announcer>
      'next-route-announcer',
      // Non-content elements
      'script',
      'noscript',
      'iframe',
      'link',
      'style',
    ]);
  }
}
