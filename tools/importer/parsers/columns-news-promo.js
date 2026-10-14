/* eslint-disable */
/* global WebImporter */
/**
 * Parser for columns-news-promo. Base: columns. Source: https://www.va.gov/
 * Generated: 2026-10-14
 *
 * Output (matches blocks/columns-news-promo/columns-news-promo.js): 1 row, 2 cells.
 *   Cell 1: promo image.
 *   Cell 2: eyebrow paragraph ("VA NEWS"), heading (H3), body paragraph with inline
 *           "Read the full article" link, closing paragraph with only "More VA news" link.
 *
 * Source selectors (validated against block-context/columns-news-promo/source.html):
 *   .homepage-blog__image img        (image column)
 *   .homepage-blog .vads-grid-row > [class*="vads-grid-col"]  (text column = column without image)
 *   h2 (eyebrow), h3 (title), p, va-link (text + href attrs)
 */
function wcLink(document, el) {
  const href = el.getAttribute('href');
  const text = (el.getAttribute('text') || el.textContent || '').trim();
  if (!href || !text) return null;
  const a = document.createElement('a');
  a.href = href;
  a.textContent = text;
  return a;
}

export default function parse(element, { document }) {
  const img = element.querySelector('.homepage-blog__image img, picture img, img');

  const columns = [...element.querySelectorAll('.vads-grid-row > [class*="vads-grid-col"]')];
  const textCol = columns.find((col) => !img || !col.contains(img)) || element;

  const headings = [...textCol.querySelectorAll('h1, h2, h3, h4, h5, h6')].filter((h) => h.textContent.trim());
  const textCell = [];

  // Eyebrow: when two headings exist, the first ("VA NEWS") becomes a plain paragraph.
  let title = headings[0];
  if (headings.length > 1) {
    const eyebrow = document.createElement('p');
    eyebrow.textContent = headings[0].textContent.trim();
    textCell.push(eyebrow);
    [, title] = headings;
  }
  if (title) {
    const h = document.createElement(title.tagName.toLowerCase());
    h.textContent = title.textContent.trim();
    textCell.push(h);
  }

  [...textCol.querySelectorAll('p')].forEach((p) => {
    const out = document.createElement('p');
    p.childNodes.forEach((n) => {
      if (n.nodeType === 3) {
        out.append(document.createTextNode(n.textContent.replace(/\s+/g, ' ')));
      } else if (n.nodeType === 1) {
        const tag = n.tagName.toLowerCase();
        if (tag === 'va-link' || tag === 'va-link-action' || tag === 'a') {
          const a = wcLink(document, n);
          if (a) out.append(a);
        } else if (n.textContent.trim()) {
          out.append(document.createTextNode(n.textContent.replace(/\s+/g, ' ')));
        }
      }
    });
    // normalise whitespace at edges
    if (out.firstChild && out.firstChild.nodeType === 3) out.firstChild.textContent = out.firstChild.textContent.replace(/^\s+/, '');
    if (out.lastChild && out.lastChild.nodeType === 3) out.lastChild.textContent = out.lastChild.textContent.replace(/\s+$/, '');
    if (out.textContent.trim()) textCell.push(out);
  });

  if (!img && !textCell.length) {
    element.replaceWith(...element.childNodes);
    return;
  }

  const row = [];
  if (img) row.push(img);
  row.push(textCell);

  const block = WebImporter.Blocks.createBlock(document, { name: 'columns-news-promo', cells: [row] });
  element.replaceWith(block);
}
