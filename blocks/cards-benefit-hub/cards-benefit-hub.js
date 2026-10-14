import { createOptimizedPicture, decorateIcons } from '../../scripts/aem.js';

const ICON_TOKEN = /^\s*:([a-z0-9-]+):\s*/i;

/**
 * Converts a leading ":icon-name:" text token (left unconverted when the content
 * did not go through the EDS pipeline, e.g. local .plain.html) into
 * <span class="icon icon-NAME"><img src="/icons/NAME.svg"></span>.
 * No-op when the heading already contains a span.icon.
 * @param {Element} el heading / paragraph element
 */
function convertIconToken(el) {
  if (!el || el.querySelector('span.icon')) return;
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent.trim()) node = walker.nextNode();
  if (!node) return;
  const match = node.textContent.match(ICON_TOKEN);
  if (!match) return;
  const span = document.createElement('span');
  span.className = `icon icon-${match[1].toLowerCase()}`;
  node.textContent = node.textContent.slice(match[0].length);
  node.before(span);
  decorateIcons(el);
}

/**
 * Cards Benefit Hub block.
 * Content model: one row per benefit hub, 1 cell each:
 *   H3 containing an icon token and a link (e.g. ":medical-services: Health care"
 *   linked to /health-care), followed by a description paragraph.
 * The icon token is rendered by EDS as <span class="icon icon-NAME">; a small
 * image placed in the heading/cell is also accepted as the icon. Authors may
 * omit the icon, the link or the description, or split content across extra
 * cells - all cells of a row are merged into one card.
 */

function iconNameOf(iconEl) {
  if (!iconEl) return '';
  const token = [...iconEl.classList].find((c) => c.startsWith('icon-'));
  return token ? token.substring(5) : '';
}

function buildCard(row) {
  const li = document.createElement('li');
  li.className = 'cards-benefit-hub-card';

  const body = document.createElement('div');
  body.className = 'cards-benefit-hub-body';
  [...row.children].forEach((cell) => {
    while (cell.firstChild) body.append(cell.firstChild);
  });

  // Title: first heading, else first paragraph that contains a link.
  let title = body.querySelector('h1, h2, h3, h4, h5, h6');
  if (!title) {
    title = [...body.querySelectorAll(':scope > p')].find((p) => p.querySelector('a'));
  }
  convertIconToken(title);

  const iconEl = body.querySelector('span.icon') || body.querySelector('picture, img');
  const iconWrap = document.createElement('span');
  iconWrap.className = 'cards-benefit-hub-icon';
  iconWrap.setAttribute('aria-hidden', 'true');

  if (iconEl) {
    const name = iconNameOf(iconEl);
    if (name) {
      li.dataset.icon = name;
      iconWrap.classList.add(`cards-benefit-hub-icon-${name}`);
    }
    const holder = iconEl.closest('p');
    iconWrap.append(iconEl);
    // remove a paragraph that only held the icon
    if (holder && !holder.textContent.trim() && !holder.children.length) holder.remove();
    const img = iconWrap.querySelector('img');
    if (img) {
      const markMissing = () => iconWrap.classList.add('cards-benefit-hub-icon-missing');
      if (img.complete && img.naturalWidth === 0 && img.src) markMissing();
      img.addEventListener('error', markMissing, { once: true });
    }
  } else {
    li.classList.add('cards-benefit-hub-no-icon');
  }

  if (title) {
    title.classList.add('cards-benefit-hub-title');
    // remove button styling applied by decorateButtons to standalone links
    title.querySelectorAll('a.button').forEach((a) => a.classList.remove('button', 'primary', 'secondary'));
    title.classList.remove('button-container');
    // strip the trailing space left behind by the icon token
    if (title.firstChild && title.firstChild.nodeType === Node.TEXT_NODE) {
      title.firstChild.textContent = title.firstChild.textContent.replace(/^\s+/, '');
    }
    if (iconEl) title.prepend(iconWrap);
  } else if (iconEl) {
    body.prepend(iconWrap);
  }

  li.append(body);
  return li;
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  ul.className = 'cards-benefit-hub-list';
  [...block.children].forEach((row) => {
    if (!row.textContent.trim() && !row.querySelector('picture, img, span.icon')) return;
    ul.append(buildCard(row));
  });

  ul.querySelectorAll('picture > img').forEach((img) => {
    img.closest('picture').replaceWith(createOptimizedPicture(img.src, img.alt, false, [{ width: '96' }]));
  });

  block.replaceChildren(ul);
}
