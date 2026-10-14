/**
 * Alert Info block - informational callout with an optional expandable details area.
 *
 * Content model (1 column):
 *   Row 1: heading (H2) followed by any always-visible body (paragraphs, links).
 *   Optional Row 2+ (2 cells): [trigger text | hidden details content]
 *     -> rendered as a native <details>/<summary> disclosure.
 *
 * Defensive handling:
 *   - single-cell rows after the first are merged into the visible body;
 *   - a row whose second cell is empty is treated as body content;
 *   - a missing heading is tolerated (the block renders body only);
 *   - a leading screen-reader "Information Alert" prefix is stripped;
 *   - button classes added by decorateButtons to lone links are reverted.
 */

const SR_PREFIX = /^\s*information alert[\s\u00a0:]*/i;

function nonEmptyCells(row) {
  return [...row.children].filter(
    (cell) => cell.textContent.trim() || cell.querySelector('picture, img, span.icon'),
  );
}

function moveChildren(from, to) {
  while (from.firstChild) to.append(from.firstChild);
}

function unbuttonize(root) {
  root.querySelectorAll('a.button').forEach((a) => {
    a.classList.remove('button', 'primary', 'secondary', 'accent');
    if (!a.className) a.removeAttribute('class');
  });
  root.querySelectorAll('.button-wrapper, .button-container').forEach((p) => {
    p.classList.remove('button-wrapper', 'button-container');
    if (!p.className) p.removeAttribute('class');
  });
}

function stripSrPrefix(heading) {
  if (!heading) return;
  heading.querySelectorAll('.usa-sr-only, .sr-only').forEach((el) => el.remove());
  const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node && !node.textContent.trim()) node = walker.nextNode();
  if (node && SR_PREFIX.test(node.textContent)) {
    node.textContent = node.textContent.replace(SR_PREFIX, '');
  }
}

function buildDetails(triggerCell, contentCells) {
  const details = document.createElement('details');
  details.className = 'alert-info-details';

  const summary = document.createElement('summary');
  summary.className = 'alert-info-trigger';
  const label = document.createElement('span');
  label.className = 'alert-info-trigger-label';
  // keep only the text of the trigger (it may be wrapped in <p>/<strong>)
  label.textContent = triggerCell.textContent.trim();
  summary.append(label);

  const panel = document.createElement('div');
  panel.className = 'alert-info-details-content';
  contentCells.forEach((cell) => moveChildren(cell, panel));

  details.append(summary, panel);
  return details;
}

export default function decorate(block) {
  const icon = document.createElement('span');
  icon.className = 'alert-info-icon';
  icon.setAttribute('aria-hidden', 'true');

  const body = document.createElement('div');
  body.className = 'alert-info-body';

  const content = document.createElement('div');
  content.className = 'alert-info-content';

  const disclosures = [];

  [...block.children].forEach((row, index) => {
    const cells = nonEmptyCells(row);
    if (!cells.length) return;
    if (index > 0 && cells.length >= 2) {
      disclosures.push(buildDetails(cells[0], cells.slice(1)));
    } else {
      cells.forEach((cell) => moveChildren(cell, content));
    }
  });

  // lift the first heading out as the alert title
  const heading = content.querySelector(':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6');
  if (heading) {
    heading.classList.add('alert-info-title');
    stripSrPrefix(heading);
    body.append(heading);
    if (!heading.id) {
      heading.id = `alert-info-${Math.random().toString(36).slice(2, 8)}`;
    }
    block.setAttribute('aria-labelledby', heading.id);
  }

  if (content.children.length || content.textContent.trim()) body.append(content);
  disclosures.forEach((d) => body.append(d));
  if (disclosures.length) block.classList.add('alert-info-has-details');

  unbuttonize(body);
  block.setAttribute('role', 'region');
  block.replaceChildren(icon, body);
}
