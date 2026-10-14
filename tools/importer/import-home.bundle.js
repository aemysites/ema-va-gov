/* eslint-disable */
var CustomImportScript = (() => {
  var __defProp = Object.defineProperty;
  var __defProps = Object.defineProperties;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropDescs = Object.getOwnPropertyDescriptors;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };
  var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));
  var __export = (target, all) => {
    for (var name in all)
      __defProp(target, name, { get: all[name], enumerable: true });
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
  var __async = (__this, __arguments, generator) => {
    return new Promise((resolve, reject) => {
      var fulfilled = (value) => {
        try {
          step(generator.next(value));
        } catch (e) {
          reject(e);
        }
      };
      var rejected = (value) => {
        try {
          step(generator.throw(value));
        } catch (e) {
          reject(e);
        }
      };
      var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
      step((generator = generator.apply(__this, __arguments)).next());
    });
  };

  // tools/importer/import-home.js
  var import_home_exports = {};
  __export(import_home_exports, {
    default: () => import_home_default
  });

  // tools/importer/parsers/hero-welcome.js
  var SIGN_IN_URL = "https://www.va.gov/sign-in/";
  function wcLabel(el) {
    return (el.getAttribute("text") || el.getAttribute("label") || el.textContent || "").trim();
  }
  function makeLink(document2, href, text) {
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function linkParagraph(document2, el, { strong = false, fallbackHref = "" } = {}) {
    const text = wcLabel(el);
    const href = el.getAttribute("href") || fallbackHref;
    if (!text || !href) return null;
    const p = document2.createElement("p");
    const a = makeLink(document2, href, text);
    if (strong) {
      const s = document2.createElement("strong");
      s.append(a);
      p.append(s);
    } else {
      p.append(a);
    }
    return p;
  }
  function collect(document2, root, opts = {}) {
    const out = [];
    const nodes = root.querySelectorAll("h1, h2, h3, h4, h5, h6, p, va-link-action, va-link, va-button, a[href]");
    nodes.forEach((node) => {
      const tag = node.tagName.toLowerCase();
      if (node.parentElement && node.parentElement.closest("va-link-action, va-link, va-button, a[href], h1, h2, h3, h4, h5, h6")) return;
      if (/^h[1-6]$/.test(tag)) {
        if (!node.textContent.trim()) return;
        const h = document2.createElement(tag);
        h.textContent = node.textContent.trim();
        out.push(h);
      } else if (tag === "p") {
        const wc = node.querySelector("va-link, va-link-action, va-button, a[href]");
        if (wc) return;
        if (!node.textContent.trim()) return;
        const p = document2.createElement("p");
        p.textContent = node.textContent.trim();
        out.push(p);
      } else if (tag === "va-button") {
        const p = linkParagraph(document2, node, { strong: true, fallbackHref: opts.buttonHref || SIGN_IN_URL });
        if (p) out.push(p);
      } else {
        const p = linkParagraph(document2, node);
        if (p) out.push(p);
      }
    });
    return out;
  }
  function parse(element, { document: document2 }) {
    const card = element.querySelector(".homepage-hero__create-account") || element.querySelector('[class*="create-account"]');
    const columns = [...element.querySelectorAll('.vads-grid-row > [class*="vads-grid-col"]')];
    let contentCol = columns.find((col) => !card || !col.contains(card));
    if (!contentCol) contentCol = element;
    const contentCell = collect(document2, contentCol);
    const calloutCell = card ? collect(document2, card) : [];
    if (!contentCell.length && !calloutCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [[contentCell, calloutCell.length ? calloutCell : ""]];
    const block = WebImporter.Blocks.createBlock(document2, { name: "hero-welcome", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-search-tools.js
  var SEARCH_URL = "https://www.va.gov/search/";
  function wcLabel2(el) {
    return (el.getAttribute("text") || el.getAttribute("label") || el.textContent || "").trim();
  }
  function toLink(document2, el) {
    const href = el.getAttribute("href");
    const text = wcLabel2(el);
    if (!href || !text) return null;
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function buildColumn(document2, col) {
    const out = [];
    const nodes = col.querySelectorAll('h1, h2, h3, h4, h5, h6, va-search-input, form[role="search"], ul, ol');
    nodes.forEach((node) => {
      const tag = node.tagName.toLowerCase();
      if (node.parentElement && node.parentElement.closest("ul, ol, h1, h2, h3, h4, h5, h6, va-search-input")) return;
      if (/^h[1-6]$/.test(tag)) {
        if (!node.textContent.trim()) return;
        const h = document2.createElement(tag);
        h.textContent = node.textContent.trim();
        out.push(h);
      } else if (tag === "va-search-input" || tag === "form") {
        const p = document2.createElement("p");
        const a = document2.createElement("a");
        a.href = SEARCH_URL;
        a.textContent = (node.getAttribute("label") || "").trim() || "Search VA.gov";
        p.append(a);
        out.push(p);
      } else {
        const list = document2.createElement(tag);
        [...node.querySelectorAll(":scope > li")].forEach((li) => {
          const src = li.querySelector("va-link-action, va-link, a[href]");
          const item = document2.createElement("li");
          const a = src ? toLink(document2, src) : null;
          if (a) item.append(a);
          else if (li.textContent.trim()) item.textContent = li.textContent.trim();
          else return;
          list.append(item);
        });
        if (list.children.length) out.push(list);
      }
    });
    return out;
  }
  function parse2(element, { document: document2 }) {
    let columns = [
      element.querySelector('[class*="__columnLeft"]'),
      element.querySelector('[class*="__columnRight"]')
    ].filter(Boolean);
    if (columns.length < 2) {
      columns = [...element.querySelectorAll('.vads-grid-row > [class*="vads-grid-col"]')];
    }
    if (!columns.length) columns = [element];
    const row = columns.map((col) => buildColumn(document2, col)).filter((c) => c.length);
    if (!row.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const cells = [row];
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-search-tools", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/columns-news-promo.js
  function wcLink(document2, el) {
    const href = el.getAttribute("href");
    const text = (el.getAttribute("text") || el.textContent || "").trim();
    if (!href || !text) return null;
    const a = document2.createElement("a");
    a.href = href;
    a.textContent = text;
    return a;
  }
  function parse3(element, { document: document2 }) {
    const img = element.querySelector(".homepage-blog__image img, picture img, img");
    const columns = [...element.querySelectorAll('.vads-grid-row > [class*="vads-grid-col"]')];
    const textCol = columns.find((col) => !img || !col.contains(img)) || element;
    const headings = [...textCol.querySelectorAll("h1, h2, h3, h4, h5, h6")].filter((h) => h.textContent.trim());
    const textCell = [];
    let title = headings[0];
    if (headings.length > 1) {
      const eyebrow = document2.createElement("p");
      eyebrow.textContent = headings[0].textContent.trim();
      textCell.push(eyebrow);
      [, title] = headings;
    }
    if (title) {
      const h = document2.createElement(title.tagName.toLowerCase());
      h.textContent = title.textContent.trim();
      textCell.push(h);
    }
    [...textCol.querySelectorAll("p")].forEach((p) => {
      const out = document2.createElement("p");
      p.childNodes.forEach((n) => {
        if (n.nodeType === 3) {
          out.append(document2.createTextNode(n.textContent.replace(/\s+/g, " ")));
        } else if (n.nodeType === 1) {
          const tag = n.tagName.toLowerCase();
          if (tag === "va-link" || tag === "va-link-action" || tag === "a") {
            const a = wcLink(document2, n);
            if (a) out.append(a);
          } else if (n.textContent.trim()) {
            out.append(document2.createTextNode(n.textContent.replace(/\s+/g, " ")));
          }
        }
      });
      if (out.firstChild && out.firstChild.nodeType === 3) out.firstChild.textContent = out.firstChild.textContent.replace(/^\s+/, "");
      if (out.lastChild && out.lastChild.nodeType === 3) out.lastChild.textContent = out.lastChild.textContent.replace(/\s+$/, "");
      if (out.textContent.trim()) textCell.push(out);
    });
    if (!img && !textCell.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    const row = [];
    if (img) row.push(img);
    row.push(textCell);
    const block = WebImporter.Blocks.createBlock(document2, { name: "columns-news-promo", cells: [row] });
    element.replaceWith(block);
  }

  // tools/importer/parsers/cards-benefit-hub.js
  var ICON_MAP = {
    identification: "id-card",
    location_city: "account-balance"
  };
  function iconToken(name) {
    if (!name) return "";
    const n = name.trim();
    return ICON_MAP[n] || n.replace(/_/g, "-").toLowerCase();
  }
  function buildCard(document2, col) {
    const heading = col.querySelector("h1, h2, h3, h4, h5, h6");
    const linkEl = col.querySelector("va-link, va-link-action, a[href]");
    const iconEl = col.querySelector("va-icon");
    const desc = [...col.querySelectorAll("p")].find((p) => p.textContent.trim() && !p.querySelector("va-link, a[href]"));
    const href = linkEl ? linkEl.getAttribute("href") : "";
    const text = linkEl ? (linkEl.getAttribute("text") || linkEl.textContent || "").trim() : heading ? heading.textContent.trim() : "";
    if (!text && !desc) return null;
    const h3 = document2.createElement("h3");
    const token = iconToken(iconEl ? iconEl.getAttribute("icon") : "");
    if (token) h3.append(document2.createTextNode(`:${token}: `));
    if (href) {
      const a = document2.createElement("a");
      a.href = href;
      a.textContent = text;
      h3.append(a);
    } else {
      h3.append(document2.createTextNode(text));
    }
    const content = [h3];
    if (desc) {
      const p = document2.createElement("p");
      p.textContent = desc.textContent.trim();
      content.push(p);
    }
    return content;
  }
  function parse4(element, { document: document2 }) {
    if (!element.parentElement || element.dataset.cardsBenefitHubConsumed) return;
    const parent = element.parentElement;
    let rows = [...parent.children].filter((el) => el.matches("div.vads-grid-row"));
    if (!rows.includes(element)) rows = [element];
    const cells = [];
    rows.forEach((row) => {
      let cols = [...row.querySelectorAll(':scope > div[class*="vads-grid-col"]')];
      if (!cols.length) cols = [...row.children].filter((c) => c.querySelector("h1, h2, h3, h4, h5, h6, va-link, a[href]"));
      cols.forEach((col) => {
        const card = buildCard(document2, col);
        if (card) cells.push([card]);
      });
    });
    if (!cells.length) {
      element.replaceWith(...element.childNodes);
      return;
    }
    rows.forEach((row) => {
      if (row !== element) {
        row.dataset.cardsBenefitHubConsumed = "true";
        row.remove();
      }
    });
    const block = WebImporter.Blocks.createBlock(document2, { name: "cards-benefit-hub", cells });
    element.replaceWith(block);
  }

  // tools/importer/parsers/form-email-signup.js
  function parse5(element, { document: document2 }) {
    const form = element.matches("form") ? element : element.querySelector("form");
    const root = form || element;
    const textInput = root.querySelector('va-text-input, input[type="email"], input[type="text"]');
    const buttonEl = root.querySelector('va-button, button[type="submit"], input[type="submit"]');
    const rows = [];
    const headingText = textInput && textInput.getAttribute("form-heading");
    const lightHeading = element.querySelector("h1, h2, h3, h4, h5, h6");
    if (headingText || lightHeading && lightHeading.textContent.trim()) {
      const level = parseInt(textInput && textInput.getAttribute("form-heading-level") || "2", 10);
      const h = document2.createElement(`h${level >= 1 && level <= 6 ? level : 2}`);
      h.textContent = (headingText || lightHeading.textContent).trim();
      rows.push([h, ""]);
    }
    let label = "";
    let name = "email";
    let required = "";
    let placeholder = "";
    if (textInput) {
      label = (textInput.getAttribute("label") || "").trim();
      if (!label && textInput.id) {
        const l = root.querySelector(`label[for="${textInput.id}"]`);
        if (l) label = l.textContent.trim();
      }
      placeholder = (textInput.getAttribute("placeholder") || "").trim();
      const req = textInput.getAttribute("required");
      if (req !== null) required = req === "false" ? "false" : "true";
      if (textInput.getAttribute("name")) name = textInput.getAttribute("name");
    }
    const hidden = [];
    root.querySelectorAll('input[type="hidden"]').forEach((input) => {
      const key = input.getAttribute("name");
      if (!key) return;
      const value = input.getAttribute("value") || input.value || "";
      if (key === "email" || /hidden-email/.test(input.id || "")) {
        name = key;
        return;
      }
      hidden.push(`${key}=${value}`);
    });
    const buttonText = buttonEl ? (buttonEl.getAttribute("text") || buttonEl.getAttribute("value") || buttonEl.textContent || "").trim() : "";
    const action = form ? form.getAttribute("action") || "" : "";
    const method = form ? (form.getAttribute("method") || "").toLowerCase() : "";
    if (!textInput && !action && !buttonText) {
      element.replaceWith(...element.childNodes);
      return;
    }
    if (label) rows.push(["Label", label]);
    if (buttonText) rows.push(["Button", buttonText]);
    if (action) {
      const a = document2.createElement("a");
      a.href = action;
      a.textContent = action;
      rows.push(["Action", a]);
    }
    if (method) rows.push(["Method", method]);
    rows.push(["Name", name]);
    if (placeholder) rows.push(["Placeholder", placeholder]);
    if (required) rows.push(["Required", required]);
    hidden.forEach((pair) => rows.push(["Hidden", pair]));
    const block = WebImporter.Blocks.createBlock(document2, { name: "form-email-signup", cells: rows });
    element.replaceWith(block);
  }

  // tools/importer/transformers/va-gov-cleanup.js
  var TransformHook = { beforeTransform: "beforeTransform", afterTransform: "afterTransform" };
  function transform(hookName, element, payload) {
    if (hookName === TransformHook.beforeTransform) {
      WebImporter.DOMUtils.remove(element, [
        // Facility/status alert container: <div id="announcement-root">
        "#announcement-root",
        // Severe weather / facility status banner: <va-banner id="71421" class="hydrated">
        "va-banner",
        // Crisis line modal: <div id="modal-crisisline" class="va-overlay va-modal va-modal-large">
        "#modal-crisisline",
        ".va-overlay.va-modal",
        // Logout modal root: <div id="logout-modal-root">
        "#logout-modal-root",
        // Feedback (Medallia) survey button: <va-button id="mdFormButton"> inside <div class="last-updated">
        "#mdFormButton",
        ".last-updated"
      ]);
      element.querySelectorAll("#content > div.vads-grid-container").forEach((el) => {
        if (!el.textContent.trim() && !el.querySelector("img, picture, va-link, va-button, va-link-action")) {
          el.remove();
        }
      });
    }
    if (hookName === TransformHook.afterTransform) {
      WebImporter.DOMUtils.remove(element, [
        // <header class="header"> containing #header-v2, #legacy-header, .usa-banner, #gov-banner,
        // .va-crisis-line-container, #va-header-logo-menu, #login-root, #mega-menu, #vetnav
        "header.header",
        "#header-v2",
        "#legacy-header",
        ".va-notice--banner",
        ".usa-banner",
        "#gov-banner",
        "#va-header-logo-menu",
        "#login-root",
        "#mega-menu",
        "#vetnav",
        "va-maintenance-banner",
        // <footer class="footer"> with <div id="footerNav">
        "footer.footer",
        "#footerNav",
        // Skip link: <a href="#content" class="show-on-focus">
        "a.show-on-focus",
        // Next.js route announcer: <next-route-announcer>
        "next-route-announcer",
        // Non-content elements
        "script",
        "noscript",
        "iframe",
        "link",
        "style"
      ]);
    }
  }

  // tools/importer/transformers/va-gov-sections.js
  var SECTION_MARKER_ATTR = "data-excat-section-id";
  function querySection(root, selectors) {
    const list = Array.isArray(selectors) ? selectors : [selectors];
    for (const sel of list) {
      if (!sel) continue;
      const el = root.querySelector(sel);
      if (el) return el;
    }
    return null;
  }
  function transform2(hookName, element, payload) {
    const sections = payload && payload.template && payload.template.sections || [];
    if (sections.length < 2) return;
    if (hookName === "beforeTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (i === 0 && !section.style) continue;
        const sectionEl = querySection(element, section.selector);
        if (!sectionEl) continue;
        const hr = document.createElement("hr");
        if (section.style) hr.setAttribute(SECTION_MARKER_ATTR, section.id);
        sectionEl.before(hr);
      }
    }
    if (hookName === "afterTransform") {
      for (let i = sections.length - 1; i >= 0; i -= 1) {
        const section = sections[i];
        if (!section.style) continue;
        const marker = element.querySelector(`[${SECTION_MARKER_ATTR}="${section.id}"]`);
        const anchor = marker || querySection(element, section.selector);
        if (!anchor) continue;
        const metadataBlock = WebImporter.Blocks.createBlock(document, {
          name: "Section Metadata",
          cells: { style: section.style }
        });
        anchor.after(metadataBlock);
        if (marker) {
          marker.removeAttribute(SECTION_MARKER_ATTR);
          if (i === 0) marker.remove();
        }
      }
    }
  }

  // tools/importer/import-home.js
  var parsers = {
    "hero-welcome": parse,
    "columns-search-tools": parse2,
    "columns-news-promo": parse3,
    "cards-benefit-hub": parse4,
    "form-email-signup": parse5
  };
  var PAGE_TEMPLATE = {
    "name": "home",
    "urls": [
      "https://www.va.gov/"
    ],
    "description": "VA.gov homepage",
    "blocks": [
      {
        "name": "hero-welcome",
        "instances": [
          "#content > div.homepage-hero__wrapper",
          ".homepage-hero__wrapper"
        ]
      },
      {
        "name": "columns-search-tools",
        "instances": [
          "#content > div.template-module__JEykya__wrapper",
          '#content > div[class*="template-module__"][class$="__wrapper"]'
        ]
      },
      {
        "name": "columns-news-promo",
        "instances": [
          "#content > div.vads-u-background-color--primary-dark",
          ".vads-u-background-color--primary-dark .homepage-blog"
        ]
      },
      {
        "name": "cards-benefit-hub",
        "instances": [
          "#content > section.vads-grid-container > div.vads-grid-row"
        ]
      },
      {
        "name": "form-email-signup",
        "instances": [
          ".homepage-email-update-wrapper .email-signup-form",
          "#email-signup-form"
        ]
      }
    ],
    "sections": [
      {
        "id": "1",
        "name": "hero-welcome",
        "selector": [
          "#content > div.homepage-hero__wrapper",
          ".homepage-hero__wrapper"
        ],
        "style": null,
        "blocks": [
          "hero-welcome"
        ],
        "defaultContent": []
      },
      {
        "id": "2",
        "name": "search-tools",
        "selector": [
          "#content > div.template-module__JEykya__wrapper",
          '#content > div[class*="template-module__"][class$="__wrapper"]'
        ],
        "style": null,
        "blocks": [
          "columns-search-tools"
        ],
        "defaultContent": []
      },
      {
        "id": "3",
        "name": "news-promo",
        "selector": [
          "#content > div.vads-u-background-color--primary-dark"
        ],
        "style": "dark",
        "blocks": [
          "columns-news-promo"
        ],
        "defaultContent": []
      },
      {
        "id": "4",
        "name": "explore-benefits",
        "selector": [
          "#content > section.vads-grid-container"
        ],
        "style": null,
        "blocks": [
          "cards-benefit-hub"
        ],
        "defaultContent": [
          "#content > section.vads-grid-container > h2"
        ]
      },
      {
        "id": "5",
        "name": "email-signup",
        "selector": [
          "#content > div.homepage-email-update-wrapper",
          ".homepage-email-update-wrapper"
        ],
        "style": "light-blue",
        "blocks": [
          "form-email-signup"
        ],
        "defaultContent": [
          "#vets-banner-1"
        ]
      }
    ]
  };
  var transformers = [
    transform,
    ...PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [transform2] : []
  ];
  function executeTransformers(hookName, element, payload) {
    const enhancedPayload = __spreadProps(__spreadValues({}, payload), {
      template: PAGE_TEMPLATE
    });
    transformers.forEach((transformerFn) => {
      try {
        transformerFn.call(null, hookName, element, enhancedPayload);
      } catch (e) {
        console.error(`Transformer failed at ${hookName}:`, e);
      }
    });
  }
  function findBlocksOnPage(document2, template) {
    const pageBlocks = [];
    const seen = /* @__PURE__ */ new Set();
    template.blocks.forEach((blockDef) => {
      blockDef.instances.forEach((selector) => {
        const elements = document2.querySelectorAll(selector);
        if (elements.length === 0) {
          console.warn(`Block "${blockDef.name}" selector not found: ${selector}`);
        }
        elements.forEach((element) => {
          if (seen.has(element)) return;
          seen.add(element);
          pageBlocks.push({
            name: blockDef.name,
            selector,
            element,
            section: blockDef.section || null
          });
        });
      });
    });
    console.log(`Found ${pageBlocks.length} block instances on page`);
    return pageBlocks;
  }
  var LATE_CONTENT_SELECTORS = [
    ".homepage-hero__create-account va-link[text]",
    '.homepage-blog va-link[text="More VA news"], .homepage-blog p:last-child va-link[text]'
  ];
  function waitForLateContent(document2, timeout = 1e4) {
    return __async(this, null, function* () {
      const start = Date.now();
      while (Date.now() - start < timeout) {
        if (LATE_CONTENT_SELECTORS.every((sel) => document2.querySelector(sel))) return;
        yield new Promise((resolve) => {
          setTimeout(resolve, 250);
        });
      }
      console.warn("Late-hydrated content not found before timeout");
    });
  }
  function exposeWebComponentLabels(document2) {
    document2.querySelectorAll("va-link[text], va-link-action[text], va-button[text]").forEach((el) => {
      if (!el.textContent.trim()) el.textContent = el.getAttribute("text");
    });
  }
  var import_home_default = {
    onLoad: (_0) => __async(void 0, [_0], function* ({ document: document2 }) {
      yield waitForLateContent(document2);
      exposeWebComponentLabels(document2);
    }),
    transform: (payload) => {
      const { document: document2, url, html, params } = payload;
      const main = document2.body;
      executeTransformers("beforeTransform", main, payload);
      const pageBlocks = findBlocksOnPage(document2, PAGE_TEMPLATE);
      pageBlocks.forEach((block) => {
        if (!block.element.parentNode || !main.contains(block.element)) return;
        const parser = parsers[block.name];
        if (parser) {
          try {
            parser(block.element, { document: document2, url, params });
          } catch (e) {
            console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
          }
        } else {
          console.warn(`No parser found for block: ${block.name}`);
        }
      });
      executeTransformers("afterTransform", main, payload);
      const hr = document2.createElement("hr");
      main.appendChild(hr);
      WebImporter.rules.createMetadata(main, document2);
      WebImporter.rules.transformBackgroundImages(main, document2);
      WebImporter.rules.adjustImageUrls(main, url, params.originalURL);
      const rawPath = new URL(params.originalURL).pathname.replace(/\/$/, "").replace(/\.html?$/, "");
      const path = WebImporter.FileUtils.sanitizePath(rawPath === "" ? "/index" : rawPath);
      return [{
        element: main,
        path,
        report: {
          title: document2.title,
          template: PAGE_TEMPLATE.name,
          blocks: pageBlocks.map((b) => b.name)
        }
      }];
    }
  };
  return __toCommonJS(import_home_exports);
})();
