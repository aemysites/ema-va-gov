import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Columns News Promo block.
 * Content model: 1 row, 2 cells.
 *   Cell 1: promo image.
 *   Cell 2: eyebrow paragraph ("VA NEWS"), heading, body paragraph with inline
 *           link, closing paragraph with a "More news" link.
 * The image cell is detected by content, not position, so authors may swap the
 * cells or omit the image; extra rows are rendered as additional promos.
 */

function isImageCell(cell) {
  const pic = cell.querySelector('picture');
  if (!pic) return false;
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('picture').forEach((p) => p.remove());
  return !clone.textContent.trim();
}

function decorateText(cell) {
  cell.classList.add('columns-news-promo-body');
  const heading = cell.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.classList.add('columns-news-promo-heading');
    const prev = heading.previousElementSibling;
    if (prev && prev.tagName === 'P' && !prev.querySelector('a')) {
      prev.classList.add('columns-news-promo-eyebrow');
    }
  }
  const paragraphs = [...cell.querySelectorAll(':scope > p')];
  const last = paragraphs[paragraphs.length - 1];
  if (last && last !== paragraphs[0] && last.querySelector('a')
    && last.textContent.trim() === last.querySelector('a').textContent.trim()) {
    last.classList.add('columns-news-promo-more');
    last.querySelectorAll('a').forEach((a) => a.classList.remove('button'));
    last.classList.remove('button-container');
  }
}

export default function decorate(block) {
  [...block.children].forEach((row) => {
    row.classList.add('columns-news-promo-row');
    const cells = [...row.children].filter((cell) => cell.textContent.trim() || cell.querySelector('picture, img'));
    [...row.children].forEach((cell) => { if (!cells.includes(cell)) cell.remove(); });

    let hasImage = false;
    cells.forEach((cell) => {
      if (!hasImage && isImageCell(cell)) {
        hasImage = true;
        cell.className = 'columns-news-promo-image';
        cell.querySelectorAll('picture > img').forEach((img) => {
          img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ media: '(min-width: 900px)', width: '800' }, { width: '600' }]));
        });
      } else {
        cell.className = '';
        decorateText(cell);
      }
    });
    if (!hasImage) row.classList.add('columns-news-promo-no-image');
  });
}
