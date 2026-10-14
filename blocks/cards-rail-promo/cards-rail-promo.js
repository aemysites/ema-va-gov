import { createOptimizedPicture } from '../../scripts/aem.js';

/**
 * Cards Rail Promo block - promo card(s) for the page rail: image stacked
 * above a heading link and short text.
 *
 * Content model: one row per card (normally 1), 2 cells:
 *   [image | heading (H2 with link) + paragraph(s)]
 * Defensive handling: the image may sit in the same cell as the text, the
 * cells may be swapped, the image may be omitted, the heading may be a bold
 * link paragraph instead of a heading, and extra cells are merged into the
 * body. Button classes added by decorateButtons are reverted.
 */

function isImageOnly(cell) {
  const pic = cell.querySelector('picture, img');
  if (!pic) return false;
  const clone = cell.cloneNode(true);
  clone.querySelectorAll('picture, img').forEach((el) => el.remove());
  return !clone.textContent.trim();
}

function unbuttonize(root) {
  root.querySelectorAll('a.button').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    if (!a.className) a.removeAttribute('class');
  });
  root.querySelectorAll('.button-wrapper, .button-container').forEach((el) => {
    el.classList.remove('button-wrapper', 'button-container');
    if (!el.className) el.removeAttribute('class');
  });
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-rail-promo-card';

  const media = document.createElement('div');
  media.className = 'cards-rail-promo-image';
  const body = document.createElement('div');
  body.className = 'cards-rail-promo-body';

  [...row.children].forEach((cell) => {
    if (isImageOnly(cell)) {
      if (!media.querySelector('picture, img')) {
        const pic = cell.querySelector('picture') || cell.querySelector('img');
        media.append(pic);
      }
      return;
    }
    // image mixed in with text: lift the first one into the media slot
    const inline = cell.querySelector('picture') || cell.querySelector('img');
    if (inline && !media.querySelector('picture, img')) {
      const holder = inline.closest('p');
      media.append(inline);
      if (holder && !holder.textContent.trim() && !holder.querySelector('picture, img')) holder.remove();
    }
    if (!cell.children.length && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      body.append(p);
      return;
    }
    while (cell.firstChild) body.append(cell.firstChild);
  });

  unbuttonize(body);

  const title = body.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)')
    || [...body.querySelectorAll(':scope > p')].find((p) => p.querySelector('a'));
  if (title) {
    title.classList.add('cards-rail-promo-title');
    title.querySelectorAll('strong, b').forEach((s) => {
      if (s.querySelector('a')) s.replaceWith(...s.childNodes);
    });
  }

  if (media.querySelector('picture, img')) li.append(media);
  else li.classList.add('cards-rail-promo-no-image');
  if (body.children.length) li.append(body);
  return li;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-rail-promo-list';
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img')) return;
    ul.append(buildCard(row));
  });

  ul.querySelectorAll('.cards-rail-promo-image img').forEach((img) => {
    const optimized = createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]);
    const target = img.closest('picture') || img;
    target.replaceWith(optimized);
  });

  block.replaceChildren(ul);
}
