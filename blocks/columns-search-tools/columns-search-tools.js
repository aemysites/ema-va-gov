/**
 * Columns Search Tools block.
 * Content model: 1 row, 2 cells.
 *   Cell 1: H2 "Search", a link to the site search page (decorated into a search
 *           form), H3 "Other search tools", list of action links.
 *   Cell 2: H2 "Top pages", list of links (rendered in two sub-columns).
 * Extra rows are flattened into the same two-column layout; a missing search
 * link simply leaves the cell as authored content.
 */

let searchCount = 0;

/**
 * Finds the authored search link: a standalone (non-list) link pointing at a
 * search page.
 * @param {Element} cell
 * @returns {HTMLAnchorElement|null}
 */
function findSearchLink(cell) {
  return [...cell.querySelectorAll('a[href]')].find((a) => {
    if (a.closest('li')) return false;
    try {
      const { pathname } = new URL(a.href, window.location.href);
      return /\/search\/?$/.test(pathname);
    } catch (e) {
      return false;
    }
  }) || null;
}

/**
 * Replaces the search link (and its wrapping paragraph) with a GET search form.
 * @param {HTMLAnchorElement} link
 */
function buildSearchForm(link) {
  searchCount += 1;
  const id = `columns-search-tools-query-${searchCount}`;
  const url = new URL(link.href, window.location.href);
  const labelText = link.textContent.trim() || 'Search';

  const form = document.createElement('form');
  form.className = 'columns-search-tools-form';
  form.setAttribute('role', 'search');
  form.method = 'get';
  form.action = `${url.origin}${url.pathname}`;

  const label = document.createElement('label');
  label.className = 'columns-search-tools-label';
  label.htmlFor = id;
  label.textContent = labelText;

  const input = document.createElement('input');
  input.type = 'search';
  input.id = id;
  input.name = url.searchParams.get('param') || 'query';
  input.autocomplete = 'off';

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'columns-search-tools-submit';
  const buttonText = document.createElement('span');
  buttonText.className = 'columns-search-tools-submit-text';
  buttonText.textContent = 'Search';
  const buttonIcon = document.createElement('span');
  buttonIcon.className = 'columns-search-tools-submit-icon';
  buttonIcon.setAttribute('aria-hidden', 'true');
  button.append(buttonText, buttonIcon);

  form.append(label, input, button);

  const wrapper = link.closest('p') || link;
  const onlyChild = wrapper !== link && wrapper.textContent.trim() === link.textContent.trim();
  if (onlyChild) wrapper.replaceWith(form);
  else link.replaceWith(form);
}

export default function decorate(block) {
  const cells = [...block.children].flatMap((row) => [...row.children]);
  const grid = document.createElement('div');
  grid.className = 'columns-search-tools-grid';

  cells.forEach((cell, i) => {
    if (!cell.textContent.trim() && !cell.querySelector('picture, img')) return;
    cell.className = 'columns-search-tools-col';
    const link = findSearchLink(cell);
    if (link) {
      cell.classList.add('columns-search-tools-search');
      buildSearchForm(link);
    } else if (i > 0) {
      cell.classList.add('columns-search-tools-links');
    }
    cell.querySelectorAll('ul, ol').forEach((list) => list.classList.add('columns-search-tools-list'));
    grid.append(cell);
  });

  block.replaceChildren(grid);
}
