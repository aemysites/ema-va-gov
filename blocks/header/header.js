/*
 * Header block
 * Renders the site header from the authored nav fragment (nav.plain.html).
 * All copy, links and images come from the fragment; this file only builds
 * interactive controls (buttons, search form, dialog) and wires behaviour.
 */

const DESKTOP = window.matchMedia('(width >= 900px)');

let uid = 0;
function nextId(prefix) {
  uid += 1;
  return `${prefix}-${uid}`;
}

function el(tag, className, attrs = {}) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, v));
  return node;
}

/**
 * Fetches the nav fragment. Metadata-independent dual fetch:
 * /content/nav.plain.html (local preview) then /nav.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchNav() {
  let resp = await fetch('/content/nav.plain.html');
  if (!resp.ok) resp = await fetch('/nav.plain.html');
  if (!resp.ok) return null;
  const html = await resp.text();
  const container = document.createElement('div');
  container.innerHTML = html;
  // resolve relative image paths against the fragment location
  container.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|data:|\/)/.test(src)) {
      img.setAttribute('src', new URL(src, resp.url).pathname);
    }
    img.loading = 'eager';
  });
  return container;
}

/** text of a node excluding nested lists */
function ownText(li) {
  return [...li.childNodes]
    .filter((n) => n.nodeType === Node.TEXT_NODE || (n.nodeType === Node.ELEMENT_NODE && !['UL', 'OL'].includes(n.tagName)))
    .map((n) => n.textContent)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** moves all child nodes of `from` into `to` */
function moveChildren(from, to) {
  while (from.firstChild) to.append(from.firstChild);
  return to;
}

/* ---------------------------------------------------------------------------
 * Section classification (generic, content-driven)
 * ------------------------------------------------------------------------- */

function classifySections(sections) {
  const result = {
    banner: null, alert: null, brand: null, primary: null, labels: [], menus: new Map(),
  };
  sections.forEach((section) => {
    const heading = section.querySelector(':scope > h2');
    if (heading && section.querySelector(':scope > ul')) {
      result.menus.set(heading.textContent.trim(), section);
    } else if (!result.brand && section.querySelector(':scope > p > a[href="/"] img')) {
      result.brand = section;
    } else if (!result.banner && section.querySelector(':scope > p > img') && !section.querySelector(':scope > p > a')) {
      result.banner = section;
    } else if (!result.alert && section.querySelector(':scope > p:first-child > a > img')) {
      result.alert = section;
    } else if (!result.primary && section.querySelector(':scope > ul')) {
      result.primary = section;
    } else if (!section.querySelector('a, img, ul') && section.querySelector(':scope > p')) {
      // control labels (e.g. Menu / Close / Back to menu) used by the small-screen menu
      result.labels = [...section.querySelectorAll(':scope > p')].map((p) => p.textContent.trim());
    }
  });
  return result;
}

/* ---------------------------------------------------------------------------
 * Official banner ("Here's how you know")
 * ------------------------------------------------------------------------- */

function buildBanner(section) {
  const wrap = el('div', 'header-banner');
  const inner = el('div', 'header-banner-inner');
  const [textP, toggleP] = section.querySelectorAll(':scope > p');
  const list = section.querySelector(':scope > ul');

  if (textP) {
    const text = el('p', 'header-banner-text');
    moveChildren(textP, text);
    inner.append(text);
  }
  if (toggleP && list) {
    const contentId = nextId('header-banner-content');
    const toggle = el('button', 'header-banner-toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': contentId });
    toggle.textContent = toggleP.textContent.trim();
    inner.append(toggle);

    const content = el('div', 'header-banner-content', { id: contentId });
    content.hidden = true;
    [...list.children].forEach((li) => {
      const item = el('div', 'header-banner-guidance');
      const img = li.querySelector(':scope > img');
      if (img) item.append(img);
      const body = el('p', 'header-banner-guidance-body');
      moveChildren(li, body);
      item.append(body);
      content.append(item);
    });

    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', open);
      content.hidden = !open;
    });
    wrap.append(inner, content);
  } else {
    wrap.append(inner);
  }
  return wrap;
}

/* ---------------------------------------------------------------------------
 * Alert trigger + dialog (e.g. Veterans Crisis Line)
 * ------------------------------------------------------------------------- */

function buildAlert(section) {
  const wrap = el('div', 'header-crisis');
  const triggerP = section.querySelector(':scope > p:first-child');
  const link = triggerP.querySelector('a');

  const button = el('button', 'header-crisis-button', { type: 'button', 'aria-haspopup': 'dialog' });
  const imgs = [...link.querySelectorAll('img')];
  const icon = el('span', 'header-crisis-icon', { 'aria-hidden': 'true' });
  if (imgs[0]) icon.append(imgs[0]);
  const arrow = imgs.length > 1 ? imgs[imgs.length - 1] : null;
  if (arrow) arrow.remove();
  const text = el('span', 'header-crisis-text');
  moveChildren(link, text);
  button.append(icon, text);
  if (arrow) {
    arrow.className = 'header-crisis-arrow';
    button.append(arrow);
  }
  wrap.append(button);
  triggerP.remove();

  // remaining section content forms the dialog body
  const dialog = el('dialog', 'header-crisis-dialog');
  const body = el('div', 'header-crisis-dialog-body');
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    const headingId = nextId('header-crisis-title');
    heading.id = headingId;
    dialog.setAttribute('aria-labelledby', headingId);
  }
  moveChildren(section, body);
  body.querySelectorAll('ul > li').forEach((li) => {
    li.classList.add('header-crisis-dialog-item');
    const itemIcon = li.querySelector(':scope > img');
    if (itemIcon) itemIcon.classList.add('header-crisis-item-icon');
  });
  body.querySelectorAll('a').forEach((a) => a.classList.add('header-crisis-dialog-link'));
  const titleIcon = heading && heading.querySelector('img');
  if (titleIcon) titleIcon.classList.add('header-crisis-title-icon');
  const close = el('button', 'header-crisis-dialog-close', { type: 'button', 'aria-label': 'Close' });
  dialog.append(close, body);

  button.addEventListener('click', () => {
    dialog.showModal();
    close.focus();
  });
  close.addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) dialog.close();
  });
  wrap.append(dialog);
  return wrap;
}

/* ---------------------------------------------------------------------------
 * Brand row: logo + utility tools (search dropdown, links, CTA)
 * ------------------------------------------------------------------------- */

function buildSearchForm(href, text) {
  const form = el('form', 'header-search-form', { action: href, method: 'get', role: 'search' });
  const inputId = nextId('header-search-input');
  const label = el('label', 'header-search-label', { for: inputId });
  label.textContent = text;
  const input = el('input', 'header-search-input', {
    id: inputId, type: 'text', name: 'query', autocomplete: 'off',
  });
  const submit = el('button', 'header-search-submit', { type: 'submit' });
  const submitLabel = el('span', 'header-search-submit-label');
  submitLabel.textContent = text;
  submit.append(submitLabel);
  form.append(label, input, submit);
  return form;
}

function buildSearch(link, closeOthers) {
  const wrap = el('div', 'header-search');
  const dropdownId = nextId('header-search-dropdown');
  const toggle = el('button', 'header-search-toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': dropdownId });
  toggle.textContent = link.textContent.trim();

  const dropdown = el('div', 'header-search-dropdown', { id: dropdownId });
  dropdown.hidden = true;
  const form = buildSearchForm(link.href, link.textContent.trim());
  const input = form.querySelector('input');
  dropdown.append(form);

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', open);
    dropdown.hidden = !open;
    wrap.classList.toggle('is-open', open);
  };
  toggle.addEventListener('click', () => {
    const open = toggle.getAttribute('aria-expanded') !== 'true';
    if (open) closeOthers(wrap);
    setOpen(open);
    if (open) input.focus();
  });
  wrap.close = () => setOpen(false);
  wrap.append(toggle, dropdown);
  return wrap;
}

function buildBrand(section, closeOthers) {
  const row = el('div', 'header-main-row');
  const logoLink = section.querySelector(':scope > p > a');
  const logo = el('div', 'header-logo');
  if (logoLink) {
    const imgs = [...logoLink.querySelectorAll('img')];
    if (imgs[0]) imgs[0].classList.add('header-logo-full');
    if (imgs[1]) imgs[1].classList.add('header-logo-compact');
    logo.append(logoLink);
  }
  row.append(logo);

  const tools = el('div', 'header-utility');
  const items = [...section.querySelectorAll(':scope > ul > li')];
  items.forEach((li, i) => {
    const a = li.querySelector('a');
    if (!a) return;
    let path = '';
    try {
      path = new URL(a.href, window.location.href).pathname;
    } catch (e) {
      path = '';
    }
    if (/\/search\/?$/.test(path)) {
      tools.append(buildSearch(a, closeOthers));
    } else {
      a.className = i === items.length - 1 ? 'header-utility-cta' : 'header-utility-link';
      tools.append(a);
    }
  });
  row.append(tools);
  return row;
}

/* ---------------------------------------------------------------------------
 * Megamenu panels
 * ------------------------------------------------------------------------- */

/**
 * Small-screen drill-down state: selecting a category (or a column on
 * column-style panels) replaces the open menu with that item's links.
 * `ctx` carries the block, the back-button label and the reset hooks.
 */
function setDrill(ctx, target, on) {
  const parent = target.closest('.header-primary-item');
  ctx.block.classList.toggle('is-drilled', on);
  if (parent) parent.classList.toggle('is-drill-parent', on);
  if (!on) return;
  const back = target.querySelector('.header-mm-back');
  if (back) back.focus();
}

function buildBackButton(ctx, onBack) {
  const back = el('button', 'header-mm-back', { type: 'button' });
  back.textContent = ctx.backLabel;
  back.addEventListener('click', onBack);
  return back;
}

/** builds the inner content (link row, columns, promo card) from a list */
function buildMenuContent(ul, container, ctx, columnToggles) {
  [...ul.children].forEach((li) => {
    const nested = li.querySelector(':scope > ul');
    const img = li.querySelector('img');
    if (nested) {
      const column = el('div', 'header-mm-column');
      const title = el('h3', 'header-mm-column-title');
      const list = el('ul', 'header-mm-links');
      [...nested.children].forEach((child) => {
        const a = child.querySelector('a');
        if (!a) return;
        const item = el('li');
        a.className = 'header-mm-link';
        item.append(a);
        list.append(item);
      });
      if (columnToggles) {
        // the column title doubles as a drill-down trigger on small screens
        const listId = nextId('header-mm-links');
        list.id = listId;
        const toggle = el('button', 'header-mm-column-toggle', { type: 'button', 'aria-controls': listId });
        toggle.textContent = ownText(li);
        title.append(toggle);
        const close = () => {
          column.classList.remove('is-selected');
          setDrill(ctx, column, false);
          toggle.focus();
        };
        toggle.addEventListener('click', () => {
          if (DESKTOP.matches) return;
          column.classList.add('is-selected');
          setDrill(ctx, column, true);
        });
        column.append(buildBackButton(ctx, close));
      } else {
        title.textContent = ownText(li);
      }
      column.append(title, list);
      container.append(column);
    } else if (img) {
      const column = el('div', 'header-mm-column header-mm-column-promo');
      const card = el('div', 'header-mm-promo');
      const text = el('div', 'header-mm-promo-text');
      card.append(img);
      li.querySelectorAll('p').forEach((p) => {
        const a = p.querySelector('a');
        if (a && p.textContent.trim() === a.textContent.trim()) {
          a.className = 'header-mm-promo-link';
          text.append(a);
        } else if (p.textContent.trim()) {
          const desc = el('p', 'header-mm-promo-desc');
          moveChildren(p, desc);
          text.append(desc);
        }
      });
      card.append(text);
      column.append(card);
      container.append(column);
    } else {
      const a = li.querySelector('a');
      if (!a) return;
      const row = el('p', 'header-mm-all');
      a.className = 'header-mm-all-link';
      row.append(a);
      const back = container.querySelector(':scope > .header-mm-back');
      if (back) back.after(row);
      else container.prepend(row);
    }
  });
}

function selectCategory(panel, item, open) {
  panel.querySelectorAll('.header-mm-sidebar-item.is-selected').forEach((other) => {
    if (other !== item) {
      other.classList.remove('is-selected');
      other.querySelector('.header-mm-category').setAttribute('aria-expanded', 'false');
    }
  });
  item.classList.toggle('is-selected', open);
  item.querySelector('.header-mm-category').setAttribute('aria-expanded', open);
  panel.classList.toggle('has-selection', open);
}

function buildMegamenuPanel(section, ctx) {
  const list = section.querySelector(':scope > ul');
  const panel = el('div', 'header-megamenu-panel');
  const items = [...list.children];
  const hasCategories = items.some((li) => li.querySelector(':scope > a') && li.querySelector(':scope > ul'));

  if (!hasCategories) {
    panel.classList.add('header-megamenu-panel-columns');
    const columns = el('div', 'header-mm-columns');
    buildMenuContent(list, columns, ctx, true);
    panel.append(columns);
    return panel;
  }

  panel.classList.add('header-megamenu-panel-categories');
  const sidebar = el('ul', 'header-mm-sidebar');
  items.forEach((li) => {
    const a = li.querySelector(':scope > a');
    const nested = li.querySelector(':scope > ul');
    const item = el('li', 'header-mm-sidebar-item');
    if (a && nested) {
      const bodyId = nextId('header-mm-category');
      const button = el('button', 'header-mm-category', { type: 'button', 'aria-expanded': 'false', 'aria-controls': bodyId });
      button.textContent = a.textContent.trim();
      const body = el('div', 'header-mm-category-body', { id: bodyId });
      body.append(buildBackButton(ctx, () => {
        selectCategory(panel, item, false);
        setDrill(ctx, item, false);
        button.focus();
      }));
      buildMenuContent(nested, body, ctx, false);
      item.append(button, body);
      button.addEventListener('click', () => {
        const open = button.getAttribute('aria-expanded') !== 'true';
        selectCategory(panel, item, open);
        if (!DESKTOP.matches) setDrill(ctx, item, open);
      });
    } else if (a) {
      a.className = 'header-mm-sidebar-link';
      item.append(a);
    } else {
      return;
    }
    sidebar.append(item);
  });
  panel.append(sidebar);
  return panel;
}

function resetPanel(panel) {
  panel.classList.remove('has-selection');
  panel.querySelectorAll('.is-selected').forEach((n) => n.classList.remove('is-selected'));
  panel.querySelectorAll('.header-mm-category[aria-expanded="true"]').forEach((b) => {
    b.setAttribute('aria-expanded', 'false');
  });
}

/* ---------------------------------------------------------------------------
 * Primary navigation
 * ------------------------------------------------------------------------- */

function buildPrimary(section, menus, closeOthers, ctx) {
  const nav = el('nav', 'header-primary', { 'aria-label': 'Primary' });
  section.querySelectorAll(':scope > ul').forEach((srcList, listIndex) => {
    const list = el('ul', `header-primary-list header-primary-list-${listIndex + 1}`);
    [...srcList.children].forEach((li) => {
      const item = el('li', 'header-primary-item');
      const a = li.querySelector(':scope > a');
      const label = ownText(li);
      const menu = menus.get(label);
      if (a) {
        a.className = 'header-primary-link';
        if (a.getAttribute('href') === '/') item.classList.add('header-primary-home');
        item.append(a);
      } else if (menu) {
        const panel = buildMegamenuPanel(menu, ctx);
        const panelId = nextId('header-megamenu');
        panel.id = panelId;
        const button = el('button', 'header-primary-trigger', {
          type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId, 'aria-haspopup': 'true',
        });
        button.textContent = label;
        item.classList.add('header-primary-has-menu');
        item.append(button, panel);
        item.close = () => {
          item.classList.remove('is-open', 'is-drill-parent');
          button.setAttribute('aria-expanded', 'false');
          resetPanel(panel);
        };
        button.addEventListener('click', () => {
          const open = !item.classList.contains('is-open');
          closeOthers(item);
          if (open) {
            item.classList.add('is-open');
            button.setAttribute('aria-expanded', 'true');
          } else {
            item.close();
          }
        });
      } else if (label) {
        const span = el('span', 'header-primary-label');
        span.textContent = label;
        item.append(span);
      }
      list.append(item);
    });
    nav.append(list);
  });
  return nav;
}

/* ---------------------------------------------------------------------------
 * Decorate
 * ------------------------------------------------------------------------- */

/**
 * loads and decorates the header
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  const fragment = await fetchNav();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.querySelectorAll(':scope > div')];
  const {
    banner, alert, brand, primary, labels, menus,
  } = classifySections(sections);
  const [menuLabel = '', closeLabel = '', backLabel = ''] = labels;
  const ctx = { block, backLabel };

  // registry of closable controls (megamenu items + search)
  const closables = new Set();
  const closeOthers = (keep) => {
    closables.forEach((c) => {
      if (c !== keep && typeof c.close === 'function') c.close();
    });
    block.classList.remove('is-drilled');
  };

  if (banner) block.append(buildBanner(banner));
  if (alert) block.append(buildAlert(alert));

  const main = el('div', 'header-main');
  let row = null;
  if (brand) {
    row = buildBrand(brand, closeOthers);
    row.querySelectorAll('.header-search').forEach((s) => closables.add(s));
    main.append(row);
  }

  // small-screen menu toggle (hidden on desktop): "Menu" <-> "Close"
  const hamburger = el('div', 'header-hamburger');
  const hamburgerButton = el('button', 'header-hamburger-button', {
    type: 'button', 'aria-expanded': 'false', 'aria-controls': 'header-menu-panel',
  });
  const hamburgerLabel = el('span', 'header-hamburger-label');
  hamburgerLabel.textContent = menuLabel;
  const hamburgerIcon = el('span', 'header-hamburger-icon', { 'aria-hidden': 'true' });
  hamburgerButton.append(hamburgerLabel, hamburgerIcon);
  hamburger.append(hamburgerButton);
  const setMenu = (open) => {
    block.classList.toggle('is-menu-open', open);
    hamburgerButton.setAttribute('aria-expanded', open);
    hamburgerLabel.textContent = open ? closeLabel : menuLabel;
    if (!open) closeOthers(null);
  };
  hamburgerButton.addEventListener('click', () => setMenu(!block.classList.contains('is-menu-open')));
  (row || main).append(hamburger);
  block.append(main);

  if (primary) {
    const bottom = el('div', 'header-bottom', { id: 'header-menu-panel' });
    const rule = el('div', 'header-rule');
    const bar = el('div', 'header-primary-bar');
    const nav = buildPrimary(primary, menus, closeOthers, ctx);
    nav.id = 'header-primary';
    nav.querySelectorAll('.header-primary-has-menu').forEach((item) => closables.add(item));

    // small-screen extras: in-menu search + utility links as menu rows
    if (row) {
      const searchToggle = row.querySelector('.header-search-toggle');
      const searchForm = row.querySelector('.header-search-form');
      if (searchToggle && searchForm) {
        const mobileSearch = el('div', 'header-menu-search');
        mobileSearch.append(buildSearchForm(searchForm.action, searchToggle.textContent.trim()));
        bottom.append(mobileSearch);
      }
      const lists = nav.querySelectorAll('.header-primary-list');
      const lastList = lists[lists.length - 1];
      row.querySelectorAll('a.header-utility-link').forEach((link) => {
        const item = el('li', 'header-primary-item header-primary-menu-only');
        const copy = link.cloneNode(true);
        copy.className = 'header-primary-link';
        item.append(copy);
        if (lastList) lastList.append(item);
      });
    }

    bar.append(nav);
    bottom.append(rule, bar);
    block.append(bottom);
  }

  // close open panels on outside click (desktop dropdowns)
  document.addEventListener('click', (e) => {
    if (DESKTOP.matches && !block.contains(e.target)) closeOthers(null);
  });

  // close on Escape when focus is inside the header
  block.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    const openItem = [...closables].find((c) => c.classList.contains('is-open'));
    if (openItem) {
      closeOthers(null);
      const trigger = openItem.querySelector('button');
      if (trigger) trigger.focus();
    } else if (block.classList.contains('is-menu-open')) {
      setMenu(false);
      hamburgerButton.focus();
    }
  });

  // viewport resize: crossing the desktop breakpoint resets every open state
  DESKTOP.addEventListener('change', () => {
    closeOthers(null);
    setMenu(false);
  });
}
