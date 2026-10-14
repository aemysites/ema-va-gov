import { decorateIcons } from '../../scripts/aem.js';

/**
 * Accordion Contact block - rail accordion whose items are open by default,
 * with "Expand all" / "Collapse all" controls above the items.
 *
 * Content model: one row per item, 2 cells: [title | content]
 *   e.g. 'Ask questions' | H3 'Message us' + ul of links, H3 'Call us' + ul of tel links
 *        'Connect with us' | H3 'Get updates' + ':mail: link',
 *                            H3 'Follow us' + ul of ':x: link' ...
 *        'Not a Veteran or family member?' | H3 'Get information for:' + ul of links
 * Icon tokens (":mail:", ":x:", ":facebook:", ":youtube:", ":instagram:") at the
 * start of a paragraph or list item become span.icon (rendered from /icons/NAME.svg).
 *
 * Defensive handling: item count varies (2-3 per page); a single-cell row uses its
 * first heading (or first line) as the title and the rest as content; extra cells
 * are merged into the content; empty rows are ignored; button classes added by
 * decorateButtons are reverted.
 */

const ICON_TOKEN = /^\s*:([a-z0-9-]+):\s*/i;

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

/** Converts a leading ":name:" text token in el into <span class="icon icon-name">. */
function convertIconToken(el) {
  if (el.querySelector(':scope > span.icon, :scope > a > span.icon')) return;
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
}

function decorateIconItems(body) {
  body.querySelectorAll('p, li').forEach((el) => {
    convertIconToken(el);
    if (el.querySelector('span.icon')) el.classList.add('accordion-contact-icon-item');
  });
}

function splitSingleCell(cell) {
  const heading = cell.querySelector(':scope > :is(h1, h2, h3, h4, h5, h6)')
    || cell.querySelector(':scope > p');
  const label = document.createElement('div');
  if (heading) {
    label.textContent = heading.textContent.trim();
    heading.remove();
  } else {
    // bare text cell: the whole cell is the title
    label.textContent = cell.textContent.trim();
    cell.textContent = '';
  }
  return { label, bodyCells: [cell] };
}

let idCounter = 0;

function buildItem(row) {
  const cells = [...row.children].filter(
    (c) => c.textContent.trim() || c.querySelector('picture, img, span.icon'),
  );
  if (!cells.length) return null;

  let label;
  let bodyCells;
  if (cells.length === 1) {
    ({ label, bodyCells } = splitSingleCell(cells[0]));
  } else {
    [label, ...bodyCells] = cells;
  }

  idCounter += 1;
  const details = document.createElement('details');
  details.className = 'accordion-contact-item';
  details.open = true;

  const summary = document.createElement('summary');
  summary.className = 'accordion-contact-item-label';
  const labelText = document.createElement('span');
  labelText.className = 'accordion-contact-item-title';
  labelText.textContent = label.textContent.replace(/\s+/g, ' ').trim();
  summary.append(labelText);

  const body = document.createElement('div');
  body.className = 'accordion-contact-item-body';
  body.id = `accordion-contact-body-${idCounter}`;
  bodyCells.forEach((cell) => {
    if (!cell.children.length && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      body.append(p);
      return;
    }
    while (cell.firstChild) body.append(cell.firstChild);
  });

  unbuttonize(body);
  decorateIconItems(body);

  details.append(summary, body);
  return details;
}

function buildControls(items) {
  const controls = document.createElement('div');
  controls.className = 'accordion-contact-controls';

  const make = (text, cls, open) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `accordion-contact-control ${cls}`;
    button.textContent = text;
    button.setAttribute('aria-controls', items.map((d) => d.querySelector('.accordion-contact-item-body').id).join(' '));
    button.addEventListener('click', () => {
      items.forEach((d) => { d.open = open; });
    });
    return button;
  };

  controls.append(
    make('Expand all', 'accordion-contact-expand-all', true),
    make('Collapse all', 'accordion-contact-collapse-all', false),
  );
  return controls;
}

export default function decorate(block) {
  const items = [...block.children].map(buildItem).filter(Boolean);
  const list = document.createElement('div');
  list.className = 'accordion-contact-items';
  list.append(...items);

  const children = [];
  if (items.length > 1) children.push(buildControls(items));
  children.push(list);
  block.replaceChildren(...children);

  decorateIcons(block);
}
