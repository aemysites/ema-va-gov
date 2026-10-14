/* eslint-disable */
/* global WebImporter */

// PARSER IMPORTS
import heroWelcomeParser from './parsers/hero-welcome.js';
import columnsSearchToolsParser from './parsers/columns-search-tools.js';
import columnsNewsPromoParser from './parsers/columns-news-promo.js';
import cardsBenefitHubParser from './parsers/cards-benefit-hub.js';
import formEmailSignupParser from './parsers/form-email-signup.js';

// TRANSFORMER IMPORTS
import vaGovCleanupTransformer from './transformers/va-gov-cleanup.js';
import vaGovSectionsTransformer from './transformers/va-gov-sections.js';

// PARSER REGISTRY
const parsers = {
  'hero-welcome': heroWelcomeParser,
  'columns-search-tools': columnsSearchToolsParser,
  'columns-news-promo': columnsNewsPromoParser,
  'cards-benefit-hub': cardsBenefitHubParser,
  'form-email-signup': formEmailSignupParser,
};

// PAGE TEMPLATE CONFIGURATION - Embedded from page-templates.json
const PAGE_TEMPLATE = {
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
        "#content > div[class*=\"template-module__\"][class$=\"__wrapper\"]"
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
        "#content > div[class*=\"template-module__\"][class$=\"__wrapper\"]"
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

// TRANSFORMER REGISTRY - cleanup first, then section breaks/metadata
const transformers = [
  vaGovCleanupTransformer,
  ...(PAGE_TEMPLATE.sections && PAGE_TEMPLATE.sections.length > 1 ? [vaGovSectionsTransformer] : []),
];

/**
 * Execute all page transformers for a specific hook
 * @param {string} hookName - 'beforeTransform' or 'afterTransform'
 * @param {Element} element - The DOM element to transform
 * @param {Object} payload - { document, url, html, params }
 */
function executeTransformers(hookName, element, payload) {
  const enhancedPayload = {
    ...payload,
    template: PAGE_TEMPLATE,
  };

  transformers.forEach((transformerFn) => {
    try {
      transformerFn.call(null, hookName, element, enhancedPayload);
    } catch (e) {
      console.error(`Transformer failed at ${hookName}:`, e);
    }
  });
}

/**
 * Find all blocks on the page based on the embedded template configuration.
 * The same element can match several instance selectors; it is only listed once.
 * @param {Document} document - The DOM document
 * @param {Object} template - The embedded PAGE_TEMPLATE object
 * @returns {Array} Block instances found on the page
 */
function findBlocksOnPage(document, template) {
  const pageBlocks = [];
  const seen = new Set();

  template.blocks.forEach((blockDef) => {
    blockDef.instances.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
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
          section: blockDef.section || null,
        });
      });
    });
  });

  console.log(`Found ${pageBlocks.length} block instances on page`);
  return pageBlocks;
}

/**
 * VA.gov hydrates some web-component links after load (hero "Learn how an account
 * helps you", news promo "More VA news"). Wait for them so parsers can read them.
 */
const LATE_CONTENT_SELECTORS = [
  '.homepage-hero__create-account va-link[text]',
  '.homepage-blog va-link[text="More VA news"], .homepage-blog p:last-child va-link[text]',
];

async function waitForLateContent(document, timeout = 10000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (LATE_CONTENT_SELECTORS.every((sel) => document.querySelector(sel))) return;
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => { setTimeout(resolve, 250); });
  }
  console.warn('Late-hydrated content not found before timeout');
}

/**
 * VA.gov web components render their label in shadow DOM, so a <p> holding only a
 * va-link looks empty and the importer prunes it before parsing. Mirror the label
 * into light DOM so the element survives; parsers still read the attributes.
 */
function exposeWebComponentLabels(document) {
  document.querySelectorAll('va-link[text], va-link-action[text], va-button[text]').forEach((el) => {
    if (!el.textContent.trim()) el.textContent = el.getAttribute('text');
  });
}

export default {
  onLoad: async ({ document }) => {
    await waitForLateContent(document);
    exposeWebComponentLabels(document);
  },

  transform: (payload) => {
    const { document, url, html, params } = payload;

    const main = document.body;

    // 1. Initial cleanup + section break markers
    executeTransformers('beforeTransform', main, payload);

    // 2. Find blocks on page using embedded template
    const pageBlocks = findBlocksOnPage(document, PAGE_TEMPLATE);

    // 3. Parse each block; skip elements already replaced or removed by an earlier parser
    pageBlocks.forEach((block) => {
      if (!block.element.parentNode || !main.contains(block.element)) return;
      const parser = parsers[block.name];
      if (parser) {
        try {
          parser(block.element, { document, url, params });
        } catch (e) {
          console.error(`Failed to parse ${block.name} (${block.selector}):`, e);
        }
      } else {
        console.warn(`No parser found for block: ${block.name}`);
      }
    });

    // 4. Final cleanup + section metadata
    executeTransformers('afterTransform', main, payload);

    // 5. WebImporter built-in rules
    const hr = document.createElement('hr');
    main.appendChild(hr);
    WebImporter.rules.createMetadata(main, document);
    WebImporter.rules.transformBackgroundImages(main, document);
    WebImporter.rules.adjustImageUrls(main, url, params.originalURL);

    // 6. Sanitized path; the root URL maps to /index
    const rawPath = new URL(params.originalURL).pathname
      .replace(/\/$/, '')
      .replace(/\.html?$/, '');
    const path = WebImporter.FileUtils.sanitizePath(rawPath === '' ? '/index' : rawPath);

    return [{
      element: main,
      path,
      report: {
        title: document.title,
        template: PAGE_TEMPLATE.name,
        blocks: pageBlocks.map((b) => b.name),
      },
    }];
  },
};
