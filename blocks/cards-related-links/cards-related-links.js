/**
 * Cards Related Links block - boxed panel with an optional title and a
 * one-column list of link items (title link + short description, no images).
 *
 * Content model:
 *   Optional first row: a heading only (e.g. H2 "Help a Veteran find benefits"
 *     or "Other VA benefits and services") -> lifted out as the panel title.
 *   Each following row (1 or more cells, merged): a title link
 *     (<p><a>..</a></p>, optionally bold or inside a heading) followed by
 *     description paragraph(s).
 *
 * The title link does not need <strong>: the link is styled bold by CSS.
 * If authors do bold it, decorateButtons turns it into a button; those
 * classes are reverted here so items never render as buttons.
 * Authors may omit the title row, an item's description or its link.
 */

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

function isEmptyRow(row) {
  return !row.textContent.trim() && !row.querySelector('picture, img');
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

/** A row that contains only a heading (no link) is the panel title row. */
function titleHeadingOf(row) {
  const cells = [...row.children].filter((c) => c.textContent.trim());
  if (cells.length !== 1) return null;
  const elements = [...cells[0].children];
  if (elements.length !== 1) return null;
  const [el] = elements;
  if (!el.matches(HEADING_SELECTOR) || el.querySelector('a')) return null;
  return el;
}

function buildItem(row) {
  const li = document.createElement('li');
  li.className = 'cards-related-links-item';

  const body = document.createElement('div');
  body.className = 'cards-related-links-body';
  [...row.children].forEach((cell) => {
    // a cell may hold bare text (no wrapping <p>)
    if (!cell.children.length && cell.textContent.trim()) {
      const p = document.createElement('p');
      p.textContent = cell.textContent.trim();
      body.append(p);
      return;
    }
    while (cell.firstChild) body.append(cell.firstChild);
  });
  unbuttonize(body);

  // title: first heading, else the first paragraph containing a link
  const title = body.querySelector(`:scope > :is(${HEADING_SELECTOR})`)
    || [...body.querySelectorAll(':scope > p')].find((p) => p.querySelector('a'));

  if (title) {
    title.classList.add('cards-related-links-title');
    // drop bold wrappers so the link text renders consistently (CSS bolds it)
    title.querySelectorAll('strong, b').forEach((s) => {
      if (s.querySelector('a') || s.closest('a')) s.replaceWith(...s.childNodes);
    });
    const link = title.querySelector('a');
    if (link) link.classList.add('cards-related-links-link');
  } else {
    li.classList.add('cards-related-links-no-title');
  }

  [...body.children].forEach((el) => {
    if (el !== title && el.tagName === 'P') el.classList.add('cards-related-links-description');
  });

  li.append(body);
  return li;
}

export default function decorate(block) {
  const rows = [...block.children].filter((row) => !isEmptyRow(row));

  let heading = null;
  if (rows.length) {
    heading = titleHeadingOf(rows[0]);
    if (heading) rows.shift();
  }

  const ul = document.createElement('ul');
  ul.className = 'cards-related-links-list';
  rows.forEach((row) => ul.append(buildItem(row)));

  const children = [];
  if (heading) {
    heading.classList.add('cards-related-links-heading');
    children.push(heading);
  }
  if (ul.children.length) children.push(ul);
  block.replaceChildren(...children);
}
