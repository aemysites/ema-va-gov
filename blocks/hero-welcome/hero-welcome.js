/**
 * Hero Welcome block.
 * Content model: 1 row, 2 cells.
 *   Cell 1: eyebrow (H1), heading (H2), paragraph, action link.
 *   Cell 2: callout card - sentence, primary button link, secondary link.
 * Authors may omit the callout cell or add extra rows/cells; every cell after
 * the first is merged into the callout card so nothing is dropped.
 */
export default function decorate(block) {
  const cells = [...block.children].flatMap((row) => [...row.children]);
  const [contentCell, ...calloutCells] = cells;

  const inner = document.createElement('div');
  inner.className = 'hero-welcome-inner';

  if (contentCell) {
    contentCell.className = 'hero-welcome-content';
    const eyebrow = contentCell.querySelector('h1');
    const headings = contentCell.querySelectorAll('h1, h2, h3');
    // When both an H1 and a following heading exist, the H1 is the eyebrow line.
    if (eyebrow && headings.length > 1 && headings[0] === eyebrow) {
      eyebrow.classList.add('hero-welcome-eyebrow');
    }
    // Last standalone link in the content cell is the action link.
    const actionLinks = [...contentCell.querySelectorAll('p > a:only-child, p > strong > a:only-child, p > em > a:only-child')];
    const action = actionLinks[actionLinks.length - 1];
    if (action) action.closest('p').classList.add('hero-welcome-action');
    inner.append(contentCell);
  }

  const callouts = calloutCells.filter((cell) => cell.textContent.trim() || cell.querySelector('picture, img'));
  if (callouts.length) {
    const card = document.createElement('div');
    card.className = 'hero-welcome-callout';
    callouts.forEach((cell) => {
      while (cell.firstChild) card.append(cell.firstChild);
    });
    inner.append(card);
  } else {
    block.classList.add('hero-welcome-no-callout');
  }

  block.replaceChildren(inner);
}
