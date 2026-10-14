/*
 * Footer block
 * Renders the site footer from the authored footer fragment (footer.plain.html).
 * All copy, links and images come from the fragment; this file only builds the
 * layout shells and interactive controls (dialog trigger, dialog, accordion).
 *
 * Fragment sections (flat, semantic):
 * - link columns: sections starting with an h2 followed by lists (no images)
 * - bottom section: the section holding the home logo link; content before the
 *   logo paragraph forms a bordered band, content after it the inline link row
 * - dialog section: starts with a trigger paragraph link and contains an h3;
 *   other footer links to the same URL open the dialog
 * - labels section: plain paragraphs only (small-screen accordion labels)
 */

const WIDE = window.matchMedia('(width >= 900px)');

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

function moveChildren(from, to) {
  while (from.firstChild) to.append(from.firstChild);
  return to;
}

/**
 * Fetches the footer fragment. Metadata-independent dual fetch:
 * /content/footer.plain.html (local preview) then /footer.plain.html (DA/EDS).
 * @returns {Promise<HTMLElement|null>} container holding the fragment sections
 */
async function fetchFooter() {
  let resp = await fetch('/content/footer.plain.html');
  if (!resp.ok) resp = await fetch('/footer.plain.html');
  if (!resp.ok) return null;
  const container = document.createElement('div');
  container.innerHTML = await resp.text();
  container.querySelectorAll('img[src]').forEach((img) => {
    const src = img.getAttribute('src');
    if (src && !/^(https?:|data:|\/)/.test(src)) {
      img.setAttribute('src', new URL(src, resp.url).pathname);
    }
    img.loading = 'lazy';
  });
  return container;
}

function classifySections(sections) {
  const result = {
    columns: [], bottom: null, dialog: null, labels: [],
  };
  sections.forEach((section) => {
    const first = section.firstElementChild;
    if (!result.bottom && section.querySelector(':scope > p > a[href="/"] > img')) {
      result.bottom = section;
    } else if (!result.dialog && section.querySelector(':scope > p:first-child > a') && section.querySelector('h3')) {
      result.dialog = section;
    } else if (first && first.tagName === 'H2' && section.querySelector(':scope > ul') && !section.querySelector('img')) {
      result.columns.push(section);
    } else if (!section.querySelector('a, img, ul') && section.querySelector(':scope > p')) {
      result.labels = [...section.querySelectorAll(':scope > p')].map((p) => p.textContent.trim());
    }
  });
  return result;
}

/** splits a column section into heading + list groups */
function columnGroups(section) {
  const groups = [];
  [...section.children].forEach((child) => {
    if (/^H[1-6]$/.test(child.tagName) || !groups.length) groups.push({ heading: null, lists: [] });
    const group = groups[groups.length - 1];
    if (/^H[1-6]$/.test(child.tagName)) group.heading = child;
    else group.lists.push(child);
  });
  return groups;
}

/* ---------------------------------------------------------------------------
 * Dialog (e.g. Veterans Crisis Line)
 * ------------------------------------------------------------------------- */

function buildDialog(section) {
  const triggerLink = section.querySelector(':scope > p:first-child > a');
  const triggerHref = triggerLink.href;
  const triggerContent = triggerLink.cloneNode(true);
  section.querySelector(':scope > p:first-child').remove();

  const dialog = el('dialog', 'footer-dialog');
  const close = el('button', 'footer-dialog-close', { type: 'button' });
  const closeP = [...section.querySelectorAll(':scope > p')].find((p) => p.querySelector('img') && !p.querySelector('a') && !p.textContent.trim());
  if (closeP) {
    const img = closeP.querySelector('img');
    close.setAttribute('aria-label', img.alt || 'Close');
    img.alt = '';
    img.setAttribute('aria-hidden', 'true');
    close.append(img);
    closeP.remove();
  } else {
    close.setAttribute('aria-label', 'Close');
  }

  const body = el('div', 'footer-dialog-body');
  const heading = section.querySelector('h1, h2, h3, h4, h5, h6');
  if (heading) {
    heading.id = nextId('footer-dialog-title');
    dialog.setAttribute('aria-labelledby', heading.id);
    // decorative heading mark is rendered as a background, as on the source
    const mark = heading.querySelector('img');
    if (mark) {
      heading.style.setProperty('--footer-dialog-mark', `url("${mark.getAttribute('src')}")`);
      heading.classList.add('footer-dialog-title-marked');
      mark.remove();
    }
  }
  moveChildren(section, body);
  body.querySelectorAll('ul > li').forEach((li) => {
    li.classList.add('footer-dialog-item');
    const icon = li.querySelector(':scope > img');
    if (icon) icon.classList.add('footer-dialog-item-icon');
  });
  body.querySelectorAll('ul a').forEach((a) => a.classList.add('footer-dialog-item-link'));
  dialog.append(close, body);

  close.addEventListener('click', () => dialog.close());

  const open = () => {
    dialog.showModal();
    const firstLink = body.querySelector('a');
    if (firstLink) firstLink.focus();
  };

  return {
    dialog, open, triggerHref, triggerContent,
  };
}

/** replaces a link with a button that opens the dialog */
function linkToTrigger(link, open, className) {
  const button = el('button', `footer-dialog-trigger ${className}`, { type: 'button', 'aria-haspopup': 'dialog' });
  moveChildren(link, button);
  button.addEventListener('click', open);
  link.replaceWith(button);
  return button;
}

/* ---------------------------------------------------------------------------
 * Wide-screen link columns
 * ------------------------------------------------------------------------- */

function buildColumns(columns) {
  const wrap = el('div', 'footer-columns');
  columns.forEach((section) => {
    const col = el('div', 'footer-column');
    moveChildren(section, col);
    col.querySelectorAll('h2').forEach((h, i) => {
      h.classList.add('footer-column-title');
      if (i > 0) h.classList.add('footer-column-subtitle');
    });
    col.querySelectorAll('ul').forEach((ul) => ul.classList.add('footer-links'));
    wrap.append(col);
  });
  return wrap;
}

/* ---------------------------------------------------------------------------
 * Small-screen accordion variant (mirrors the source's responsive copy of the
 * link columns; hidden on wide screens, styled in the small-screen rules)
 * ------------------------------------------------------------------------- */

function accordionItem(label, panelNodes, wrapHeading) {
  const li = el('li', 'footer-accordion-item');
  const panelId = nextId('footer-accordion-panel');
  const toggle = el('button', 'footer-accordion-toggle', { type: 'button', 'aria-expanded': 'false', 'aria-controls': panelId });
  toggle.textContent = label;
  const panel = el('div', 'footer-accordion-panel', { id: panelId });
  panel.hidden = true;
  panelNodes.forEach((n) => panel.append(n));
  panel.querySelectorAll('h2').forEach((h, i) => {
    h.className = i ? 'footer-panel-title footer-panel-subtitle' : 'footer-panel-title';
  });
  if (wrapHeading) {
    li.classList.add('footer-accordion-item-headed');
    const h = el('h2', 'footer-accordion-heading');
    h.append(toggle);
    li.append(h);
  } else {
    li.append(toggle);
  }
  li.append(panel);
  return li;
}

function buildAccordion(columnsWrap, languageBand, labels, dialogParts) {
  const list = el('ul', 'footer-accordion');
  const cols = [...columnsWrap.querySelectorAll('.footer-column')];
  const triggerCols = [];
  const plainCols = [];
  cols.forEach((col) => (col.querySelector('.footer-dialog-trigger') ? triggerCols : plainCols).push(col));

  if (dialogParts) {
    const li = el('li', 'footer-accordion-item footer-accordion-alert');
    const button = el('button', 'footer-dialog-trigger footer-accordion-alert-button', { type: 'button', 'aria-haspopup': 'dialog' });
    const text = el('span');
    const content = dialogParts.triggerContent.cloneNode(true);
    const imgs = [...content.querySelectorAll('img')];
    imgs.forEach((img) => img.remove());
    moveChildren(content, text);
    button.append(text, ...imgs);
    button.addEventListener('click', dialogParts.open);
    li.append(button);
    list.append(li);
  }

  // column(s) led by the dialog trigger: remaining groups collapse under one label
  triggerCols.forEach((col) => {
    const groups = columnGroups(col).filter((g) => !g.lists.some((l) => l.querySelector('.footer-dialog-trigger')));
    if (!groups.length) return;
    const label = labels[0] || groups[0].heading?.textContent.trim() || '';
    const nodes = [];
    groups.forEach((g) => {
      if (g.heading) nodes.push(g.heading.cloneNode(true));
      g.lists.forEach((l) => nodes.push(l.cloneNode(true)));
    });
    list.append(accordionItem(label, nodes));
  });

  plainCols.forEach((col) => {
    const groups = columnGroups(col);
    const label = groups[0].heading ? groups[0].heading.textContent.trim() : '';
    const nodes = [];
    groups.forEach((g, i) => {
      if (g.heading && i > 0) nodes.push(g.heading.cloneNode(true));
      g.lists.forEach((l) => nodes.push(l.cloneNode(true)));
    });
    list.append(accordionItem(label, nodes));
  });

  if (languageBand) {
    const heading = languageBand.querySelector('h2');
    const lists = [...languageBand.querySelectorAll('ul')].map((ul) => ul.cloneNode(true));
    if (heading) list.append(accordionItem(heading.textContent.trim(), lists, true));
  }

  list.querySelectorAll('[id]:not(.footer-accordion-panel)').forEach((n) => n.removeAttribute('id'));

  // one panel open at a time (as on the source)
  const toggles = [...list.querySelectorAll('.footer-accordion-toggle')];
  const setExpanded = (toggle, expanded) => {
    toggle.setAttribute('aria-expanded', String(expanded));
    document.getElementById(toggle.getAttribute('aria-controls')).hidden = !expanded;
  };
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const expand = toggle.getAttribute('aria-expanded') !== 'true';
      toggles.forEach((t) => { if (t !== toggle) setExpanded(t, false); });
      setExpanded(toggle, expand);
    });
  });
  return list;
}

/* ---------------------------------------------------------------------------
 * Bottom bands: bordered band, logo, inline link row
 * ------------------------------------------------------------------------- */

function buildBottom(section) {
  const logoP = section.querySelector(':scope > p > a[href="/"] > img').closest('p');
  const before = [];
  const after = [];
  let seen = false;
  [...section.children].forEach((child) => {
    if (child === logoP) seen = true;
    else if (seen) after.push(child);
    else before.push(child);
  });

  const bands = [];
  if (before.length) {
    const band = el('div', 'footer-band footer-band-bordered');
    before.forEach((n) => band.append(n));
    band.querySelectorAll('h2').forEach((h) => h.classList.add('footer-band-title'));
    band.querySelectorAll('ul').forEach((ul) => ul.classList.add('footer-inline-links'));
    bands.push(band);
  }
  const logo = el('div', 'footer-band footer-logo');
  logo.append(logoP);
  bands.push(logo);
  if (after.length) {
    const band = el('div', 'footer-band footer-legal');
    after.forEach((n) => band.append(n));
    band.querySelectorAll('ul').forEach((ul) => ul.classList.add('footer-inline-links'));
    bands.push(band);
  }
  return bands;
}

/**
 * loads and decorates the footer
 * @param {Element} block The footer block element
 */
export default async function decorate(block) {
  const fragment = await fetchFooter();
  block.textContent = '';
  if (!fragment) return;

  const sections = [...fragment.children].filter((n) => n.tagName === 'DIV');
  const {
    columns, bottom, dialog: dialogSection, labels,
  } = classifySections(sections);

  const inner = el('div', 'footer-inner');
  const dialogParts = dialogSection ? buildDialog(dialogSection) : null;

  const columnsWrap = buildColumns(columns);
  if (dialogParts) {
    columnsWrap.querySelectorAll('a[href]').forEach((a) => {
      if (a.href === dialogParts.triggerHref) linkToTrigger(a, dialogParts.open, 'footer-link-button');
    });
  }
  inner.append(columnsWrap);

  const bands = bottom ? buildBottom(bottom) : [];
  const languageBand = bands.find((b) => b.classList.contains('footer-band-bordered'));
  inner.append(buildAccordion(columnsWrap, languageBand, labels, dialogParts));
  inner.append(...bands);

  block.append(inner);
  if (dialogParts) block.append(dialogParts.dialog);

  // the bordered band is wide-screen only: on small screens its content lives in
  // the accordion, so (as on the source) it is taken out of the DOM entirely
  if (languageBand) {
    const anchor = languageBand.nextElementSibling;
    const place = () => {
      if (WIDE.matches) {
        if (!languageBand.isConnected) inner.insertBefore(languageBand, anchor);
      } else {
        languageBand.remove();
      }
    };
    place();
    WIDE.addEventListener('change', place);
  }
}
