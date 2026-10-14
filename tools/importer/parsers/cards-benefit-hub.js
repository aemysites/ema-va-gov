/* eslint-disable */
/* global WebImporter */
/**
 * Parser for cards-benefit-hub. Base: cards. Source: https://www.va.gov/
 * Generated: 2026-10-14
 *
 * Output (matches blocks/cards-benefit-hub/cards-benefit-hub.js): one row per
 * benefit hub, 1 cell each:
 *   H3 ":icon-name: " + link (e.g. ":medical-services: Health care" -> /health-care),
 *   followed by the description paragraph.
 *
 * The page-templates instance selector
 *   "#content > section.vads-grid-container > div.vads-grid-row"
 * matches each of the 4 grid rows (3 cards each). All 12 cards belong to ONE
 * block, so the parser consumes every sibling grid row on the first call and
 * removes the others; later calls on already-removed rows are no-ops.
 *
 * Iteration key: the card column wrappers (div[class*="vads-grid-col"]) - block
 * level divs, no nested interactive elements (structure.json: no warnings).
 * va-icon `icon` / va-link `text` + `href` attributes carry the visible data.
 */

// VA Design System icon name -> icon token recognised by the block CSS.
const ICON_MAP = {
  identification: 'id-card',
  location_city: 'account-balance',
};

function iconToken(name) {
  if (!name) return '';
  const n = name.trim();
  return ICON_MAP[n] || n.replace(/_/g, '-').toLowerCase();
}

function buildCard(document, col) {
  const heading = col.querySelector('h1, h2, h3, h4, h5, h6');
  const linkEl = col.querySelector('va-link, va-link-action, a[href]');
  const iconEl = col.querySelector('va-icon');
  const desc = [...col.querySelectorAll('p')].find((p) => p.textContent.trim() && !p.querySelector('va-link, a[href]'));

  const href = linkEl ? linkEl.getAttribute('href') : '';
  const text = linkEl
    ? (linkEl.getAttribute('text') || linkEl.textContent || '').trim()
    : (heading ? heading.textContent.trim() : '');
  if (!text && !desc) return null;

  const h3 = document.createElement('h3');
  const token = iconToken(iconEl ? iconEl.getAttribute('icon') : '');
  if (token) h3.append(document.createTextNode(`:${token}: `));
  if (href) {
    const a = document.createElement('a');
    a.href = href;
    a.textContent = text;
    h3.append(a);
  } else {
    h3.append(document.createTextNode(text));
  }

  const content = [h3];
  if (desc) {
    const p = document.createElement('p');
    p.textContent = desc.textContent.trim();
    content.push(p);
  }
  return content;
}

export default function parse(element, { document }) {
  // Already consumed by the parse of a sibling grid row.
  if (!element.parentElement || element.dataset.cardsBenefitHubConsumed) return;

  const parent = element.parentElement;
  let rows = [...parent.children].filter((el) => el.matches('div.vads-grid-row'));
  if (!rows.includes(element)) rows = [element];

  const cells = [];
  rows.forEach((row) => {
    let cols = [...row.querySelectorAll(':scope > div[class*="vads-grid-col"]')];
    if (!cols.length) cols = [...row.children].filter((c) => c.querySelector('h1, h2, h3, h4, h5, h6, va-link, a[href]'));
    cols.forEach((col) => {
      const card = buildCard(document, col);
      if (card) cells.push([card]);
    });
  });

  if (!cells.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  rows.forEach((row) => {
    if (row !== element) {
      row.dataset.cardsBenefitHubConsumed = 'true';
      row.remove();
    }
  });

  const block = WebImporter.Blocks.createBlock(document, { name: 'cards-benefit-hub', cells });
  element.replaceWith(block);
}
