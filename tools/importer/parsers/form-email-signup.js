/* eslint-disable */
/* global WebImporter */
/**
 * Parser for form-email-signup. Base: form (custom - no library convention).
 * Source: https://www.va.gov/  Generated: 2026-10-14
 *
 * Output (matches blocks/form-email-signup/form-email-signup.js), 2 columns:
 *   [H2 intro heading | '']         (from va-text-input[form-heading]; no light-DOM heading exists)
 *   Label | Email address
 *   Button | Sign up
 *   Action | <form action>          (GovDelivery subscriber endpoint)
 *   Method | post
 *   Name | email
 *   Required | true / false
 *   Hidden | key=value              (one row per hidden input, e.g. category_id=USVACHOOSE_C1)
 *
 * Source selectors (validated against block-context/form-email-signup/source.html + live DOM):
 *   form#email-signup-form / form, input[type="hidden"], va-text-input (label, name,
 *   form-heading, required, placeholder attrs), va-button (text attr) / button[type=submit].
 * The hidden "email" input (homepage-hidden-email) is a JS mirror of the visible
 * field and is represented by the Name row instead of a Hidden row.
 */
export default function parse(element, { document }) {
  const form = element.matches('form') ? element : element.querySelector('form');
  const root = form || element;

  const textInput = root.querySelector('va-text-input, input[type="email"], input[type="text"]');
  const buttonEl = root.querySelector('va-button, button[type="submit"], input[type="submit"]');

  const rows = [];

  // Intro heading (VA renders it inside the va-text-input shadow DOM).
  const headingText = textInput && textInput.getAttribute('form-heading');
  const lightHeading = element.querySelector('h1, h2, h3, h4, h5, h6');
  if (headingText || (lightHeading && lightHeading.textContent.trim())) {
    const level = parseInt((textInput && textInput.getAttribute('form-heading-level')) || '2', 10);
    const h = document.createElement(`h${level >= 1 && level <= 6 ? level : 2}`);
    h.textContent = (headingText || lightHeading.textContent).trim();
    rows.push([h, '']);
  }

  // Visible email field.
  let label = '';
  let name = 'email';
  let required = '';
  let placeholder = '';
  if (textInput) {
    label = (textInput.getAttribute('label') || '').trim();
    if (!label && textInput.id) {
      const l = root.querySelector(`label[for="${textInput.id}"]`);
      if (l) label = l.textContent.trim();
    }
    placeholder = (textInput.getAttribute('placeholder') || '').trim();
    const req = textInput.getAttribute('required');
    if (req !== null) required = req === 'false' ? 'false' : 'true';
    if (textInput.getAttribute('name')) name = textInput.getAttribute('name');
  }

  // Hidden inputs (category_id etc.). The hidden mirror of the email field defines the posted name.
  const hidden = [];
  root.querySelectorAll('input[type="hidden"]').forEach((input) => {
    const key = input.getAttribute('name');
    if (!key) return;
    const value = input.getAttribute('value') || input.value || '';
    if (key === 'email' || /hidden-email/.test(input.id || '')) {
      name = key;
      return;
    }
    hidden.push(`${key}=${value}`);
  });

  const buttonText = buttonEl
    ? (buttonEl.getAttribute('text') || buttonEl.getAttribute('value') || buttonEl.textContent || '').trim()
    : '';
  const action = form ? (form.getAttribute('action') || '') : '';
  const method = form ? (form.getAttribute('method') || '').toLowerCase() : '';

  if (!textInput && !action && !buttonText) {
    element.replaceWith(...element.childNodes);
    return;
  }

  if (label) rows.push(['Label', label]);
  if (buttonText) rows.push(['Button', buttonText]);
  if (action) {
    const a = document.createElement('a');
    a.href = action;
    a.textContent = action;
    rows.push(['Action', a]);
  }
  if (method) rows.push(['Method', method]);
  rows.push(['Name', name]);
  if (placeholder) rows.push(['Placeholder', placeholder]);
  if (required) rows.push(['Required', required]);
  hidden.forEach((pair) => rows.push(['Hidden', pair]));

  const block = WebImporter.Blocks.createBlock(document, { name: 'form-email-signup', cells: rows });
  element.replaceWith(block);
}
