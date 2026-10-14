/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-search-tools. Base: columns. Source: https://www.va.gov/
 * Generated: 2026-10-14
 *
 * Output (matches blocks/columns-search-tools/columns-search-tools.js): 1 row, 2 cells.
 *   Cell 1: H2 "Search", standalone paragraph link to https://www.va.gov/search/
 *           (decorated into a search form; link text = input label),
 *           H3 "Other search tools", UL of action links.
 *   Cell 2: H2 "Top pages", UL of links.
 *
 * Source selectors (validated against block-context/columns-search-tools/source.html):
 *   [class*="__columnLeft"], [class*="__columnRight"]  (CSS-module hashed class names)
 *   fallback: .vads-grid-row > [class*="vads-grid-col"]
 *   va-search-input (label attr), va-link-action / va-link (text + href attrs)
 */
const SEARCH_URL = 'https://www.va.gov/search/';

function wcLabel(el) {
  return (el.getAttribute('text') || el.getAttribute('label') || el.textContent || '').trim();
}

function toLink(document, el) {
  const href = el.getAttribute('href');
  const text = wcLabel(el);
  if (!href || !text) return null;
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

function buildColumn(document, col) {
  const out = [];
  const nodes = col.querySelectorAll('h1, h2, h3, h4, h5, h6, va-search-input, form[role="search"], ul, ol');
  nodes.forEach((node) => {
    const tag = node.tagName.toLowerCase();
    if (node.parentElement && node.parentElement.closest('ul, ol, h1, h2, h3, h4, h5, h6, va-search-input')) return;
    if (/^h[1-6]$/.test(tag)) {
      if (!node.textContent.trim()) return;
      const h = document.createElement(tag);
      h.textContent = node.textContent.trim();
      out.push(h);
    } else if (tag === 'va-search-input' || tag === 'form') {
      // Search widget -> plain link to the site search page (block turns it into a form).
      const p = document.createElement('p');
      const a = document.createElement('a');
      a.href = SEARCH_URL;
      a.textContent = (node.getAttribute('label') || '').trim() || 'Search VA.gov';
      p.append(a);
      out.push(p);
    } else {
      const list = document.createElement(tag);
      [...node.querySelectorAll(':scope > li')].forEach((li) => {
        const src = li.querySelector('va-link-action, va-link, a[href]');
        const item = document.createElement('li');
        const a = src ? toLink(document, src) : null;
        if (a) item.append(a);
        else if (li.textContent.trim()) item.textContent = li.textContent.trim();
        else return;
        list.append(item);
      });
      if (list.children.length) out.push(list);
    }
  });
  return out;
}

export default function parse(element, { document }) {
  let columns = [
    element.querySelector('[class*="__columnLeft"]'),
    element.querySelector('[class*="__columnRight"]'),
  ].filter(Boolean);
  if (columns.length < 2) {
    columns = [...element.querySelectorAll('.vads-grid-row > [class*="vads-grid-col"]')];
  }
  if (!columns.length) columns = [element];

  const row = columns.map((col) => buildColumn(document, col)).filter((c) => c.length);
  if (!row.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const cells = [row];
  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-search-tools', cells });
  element.replaceWith(block);
}
