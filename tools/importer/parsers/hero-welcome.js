/* eslint-disable */
/* global WebImporter */
/**
 * Parser for hero-welcome. Base: hero. Source: https://www.va.gov/
 * Generated: 2026-10-14
 *
 * Output (matches blocks/hero-welcome/hero-welcome.js): 1 row, 2 cells.
 *   Cell 1: H1 eyebrow ("Welcome to VA.gov"), H2 heading, intro paragraph,
 *           paragraph with the action link ("Get started with VA").
 *   Cell 2: callout card - sentence (H2), primary button link ("Create account"),
 *           secondary link ("Learn how an account helps you").
 *
 * VA.gov web components keep their visible label in attributes, so labels/hrefs
 * are read from `text`/`href`/`label` instead of textContent.
 * Source selectors (validated against block-context/hero-welcome/source.html):
 *   .homepage-hero__wrapper > .vads-grid-container > .vads-grid-row > .vads-grid-col-12 (x2)
 *   .homepage-hero__create-account (callout card)
 *   va-link-action, va-link, va-button
 * The "Create account" va-button opens a sign-in modal and has no href; a
 * stand-in link to https://www.va.gov/sign-in/ is emitted so the CTA survives.
 */
const SIGN_IN_URL = 'https://www.va.gov/sign-in/';

function wcLabel(el) {
  return (el.getAttribute('text') || el.getAttribute('label') || el.textContent || '').trim();
}

function makeLink(document, href, text) {
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

/** Returns a <p> holding a link built from a va-link / va-link-action / a element. */
function linkParagraph(document, el, { strong = false, fallbackHref = '' } = {}) {
  const text = wcLabel(el);
  const href = el.getAttribute('href') || fallbackHref;
  if (!text || !href) return null;
  const p = document.createElement('p');
  const a = makeLink(document, href, text);
  if (strong) {
    const s = document.createElement('strong');
    s.append(a);
    p.append(s);
  } else {
    p.append(a);
  }
  return p;
}

/** Converts the children of a column into clean block content. */
function collect(document, root, opts = {}) {
  const out = [];
  const nodes = root.querySelectorAll('h1, h2, h3, h4, h5, h6, p, va-link-action, va-link, va-button, a[href]');
  nodes.forEach((node) => {
    const tag = node.tagName.toLowerCase();
    // Skip nodes nested inside an already-handled container.
    if (node.parentElement && node.parentElement.closest('va-link-action, va-link, va-button, a[href], h1, h2, h3, h4, h5, h6')) return;
    if (/^h[1-6]$/.test(tag)) {
      if (!node.textContent.trim()) return;
      const h = document.createElement(tag);
      h.textContent = node.textContent.trim();
      out.push(h);
    } else if (tag === 'p') {
      // Paragraphs whose only content is a web-component link are handled by that link.
      const wc = node.querySelector('va-link, va-link-action, va-button, a[href]');
      if (wc) return;
      if (!node.textContent.trim()) return;
      const p = document.createElement('p');
      p.textContent = node.textContent.trim();
      out.push(p);
    } else if (tag === 'va-button') {
      const p = linkParagraph(document, node, { strong: true, fallbackHref: opts.buttonHref || SIGN_IN_URL });
      if (p) out.push(p);
    } else {
      const p = linkParagraph(document, node);
      if (p) out.push(p);
    }
  });
  return out;
}

export default function parse(element, { document }) {
  // Callout card (right column)
  const card = element.querySelector('.homepage-hero__create-account')
    || element.querySelector('[class*="create-account"]');

  // Content column (left): first grid column that does not contain the card.
  const columns = [...element.querySelectorAll('.vads-grid-row > [class*="vads-grid-col"]')];
  let contentCol = columns.find((col) => !card || !col.contains(card));
  if (!contentCol) contentCol = element;

  const contentCell = collect(document, contentCol);
  const calloutCell = card ? collect(document, card) : [];

  if (!contentCell.length && !calloutCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [[contentCell, calloutCell.length ? calloutCell : '']];
  const block = WebImporter.Blocks.createBlock(document, { name: 'hero-welcome', cells });
  element.replaceWith(block);
}
