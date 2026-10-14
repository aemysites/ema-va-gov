/**
 * Form Email Signup block.
 * Renders a single-field email signup form from authored content. Supported
 * authoring (all rows optional, any order):
 *   - Free content (heading, paragraph) -> intro above the form.
 *   - Two-cell config rows, keyed by the first cell:
 *       Label | Email address
 *       Button | Sign up
 *       Action | https://example.com/subscribe   (form POST target)
 *       Name | email                            (input name, default "email")
 *       Placeholder | you@example.com
 *       Required | true / false                  (default true)
 *       Success | Thanks for signing up!         (shown when no action URL)
 *       Hidden | key=value                       (extra hidden fields, repeatable)
 *   - A standalone link (not .json) -> form action; its text becomes the button
 *     label unless the text is itself a URL. Links to a .json form definition
 *     are ignored, so Block Collection "form" style content degrades gracefully.
 */

const CONFIG_KEYS = ['label', 'button', 'action', 'name', 'placeholder', 'required', 'success', 'hidden', 'method'];

let formCount = 0;

const toKey = (text) => text.trim().toLowerCase().replace(/[^a-z]/g, '');

function isUrlText(text) {
  return /^(https?:)?\/\//i.test(text.trim()) || text.trim().startsWith('/');
}

function readContent(block) {
  const config = { hidden: [] };
  const intro = [];

  [...block.children].forEach((row) => {
    const cells = [...row.children];
    const key = cells.length >= 2 ? toKey(cells[0].textContent) : '';
    if (key && CONFIG_KEYS.includes(key)) {
      const valueCell = cells[1];
      const link = valueCell.querySelector('a[href]');
      const value = key === 'action' && link ? link.href : valueCell.textContent.trim();
      if (key === 'hidden') config.hidden.push(value);
      else config[key] = value;
      return;
    }

    cells.forEach((cell) => {
      [...cell.children].forEach((el) => {
        const links = [...el.querySelectorAll('a[href]')];
        const standalone = links.length === 1
          && el.textContent.trim() === links[0].textContent.trim();
        if (standalone) {
          const a = links[0];
          const { pathname } = new URL(a.href, window.location.href);
          if (!pathname.endsWith('.json') && !config.action) {
            config.action = a.href;
            if (!config.button && !isUrlText(a.textContent)) config.button = a.textContent.trim();
          }
          return;
        }
        if (el.textContent.trim() || el.querySelector('picture, img')) intro.push(el);
      });
      // bare text directly in a cell (no wrapping element)
      if (!cell.children.length && cell.textContent.trim()) {
        const p = document.createElement('p');
        p.textContent = cell.textContent.trim();
        intro.push(p);
      }
    });
  });

  return { config, intro };
}

function buildForm(config) {
  formCount += 1;
  const id = `form-email-signup-email-${formCount}`;
  const required = !/^(false|no|0)$/i.test(config.required || '');

  const form = document.createElement('form');
  form.className = 'form-email-signup-form';
  form.noValidate = true;
  if (config.action) {
    form.action = config.action;
    form.method = /^get$/i.test(config.method || '') ? 'get' : 'post';
    form.target = '_blank';
  }

  const field = document.createElement('div');
  field.className = 'form-email-signup-field';

  const label = document.createElement('label');
  label.htmlFor = id;
  label.className = 'form-email-signup-label';
  label.textContent = config.label || 'Email address';
  if (required) {
    const req = document.createElement('span');
    req.className = 'form-email-signup-required';
    req.textContent = ' (*Required)';
    label.append(req);
  }

  const error = document.createElement('span');
  error.className = 'form-email-signup-error';
  error.id = `${id}-error`;
  error.setAttribute('role', 'alert');

  const input = document.createElement('input');
  input.type = 'email';
  input.id = id;
  input.name = config.name || 'email';
  input.autocomplete = 'email';
  input.required = required;
  if (config.placeholder) input.placeholder = config.placeholder;
  input.setAttribute('aria-describedby', error.id);

  field.append(label, error, input);

  config.hidden.forEach((pair) => {
    const [k, ...rest] = pair.split('=');
    if (!k || !k.trim()) return;
    const hidden = document.createElement('input');
    hidden.type = 'hidden';
    hidden.name = k.trim();
    hidden.value = rest.join('=').trim();
    form.append(hidden);
  });

  const button = document.createElement('button');
  button.type = 'submit';
  button.className = 'form-email-signup-submit button';
  button.textContent = config.button || 'Sign up';

  const status = document.createElement('p');
  status.className = 'form-email-signup-status';
  status.setAttribute('aria-live', 'polite');

  form.append(field, button, status);

  form.addEventListener('submit', (e) => {
    const value = input.value.trim();
    let message = '';
    if (required && !value) message = 'Enter an email address.';
    else if (value && !input.checkValidity()) message = 'Enter a valid email address.';
    error.textContent = message;
    field.classList.toggle('form-email-signup-invalid', !!message);
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
    if (message) {
      e.preventDefault();
      input.focus();
      return;
    }
    if (!config.action) {
      // No endpoint authored: confirm locally instead of navigating away.
      e.preventDefault();
      status.textContent = config.success || 'Thank you for signing up.';
      form.reset();
    }
  });

  return form;
}

export default function decorate(block) {
  const { config, intro } = readContent(block);

  const wrapper = document.createElement('div');
  wrapper.className = 'form-email-signup-inner';

  if (intro.length) {
    const introEl = document.createElement('div');
    introEl.className = 'form-email-signup-intro';
    introEl.append(...intro);
    wrapper.append(introEl);
  }

  wrapper.append(buildForm(config));
  block.replaceChildren(wrapper);
}
