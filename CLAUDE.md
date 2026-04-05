# CLAUDE.md — AI Visibility Website

This file provides guidance for AI assistants (Claude and others) working in this repository.

## Project Overview

**AI Visibility Index** is a static marketing website for a service that evaluates how "visible" a business website is to AI language models. The service analyzes structured data, meta-information, and schema.org implementation to produce a scored report.

- **Contact**: ai-visibility-index@protonmail.com
- **Payment provider (planned)**: Stripe

## Repository Structure

```
ai-visibility-website/
├── CLAUDE.md        ← this file
├── README.md        ← minimal placeholder
├── config.js        ← Stripe Payment Link URLs and shared constants
├── index.html       ← main landing/marketing page (778 lines)
└── pricing.html     ← dedicated pricing/purchase page (300 lines)
```

This is a **pure static website** — no build tools, no package manager, no framework.

## Technology Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Markup     | HTML5                               |
| Styling    | CSS (embedded in HTML, no stylesheet) |
| Scripting  | Vanilla JavaScript (embedded)       |
| Fonts      | Google Fonts (Shippori Mincho, DM Mono, Noto Sans JP) |
| Build      | None                                |
| Tests      | None                                |
| CI/CD      | None                                |

## Pages

### `index.html` — Main Landing Page

Sections in order:
1. Fixed navigation header with logo and menu links
2. Hero — value proposition ("Are you visible to AI?")
3. Ticker — scrolling industry statistics
4. Problem Statement — why AI visibility matters
5. How It Works — 3-step process
6. Scoring — 5-axis evaluation system (basic meta, JSON-LD, schema type, field completeness)
7. Use Cases — hotels, consultants, researchers
8. Sample Results — demo ranking table with blurred names
9. Pricing — two tiers embedded in the page
10. Contact Form — `mailto:` based, uses `CONTACT_EMAIL` constant
11. FAQ — collapsible accordion items
12. CTA Footer

Key JS behaviors:
- `IntersectionObserver` for scroll-triggered fade-in animations
- FAQ accordion via click handlers
- Contact form builds a `mailto:` link from form fields

### `pricing.html` — Pricing / Purchase Page

Three plan cards:
| Plan | Price |
|------|-------|
| Spot Diagnosis | ¥9,800 |
| Industry Ranking (featured) | ¥49,800 |
| Custom Inquiry | Contact |

**Status**: Payment buttons are placeholders (`onclick="alert(...)"`) — Stripe is not yet integrated.

## Design Conventions

- **Color scheme**: Dark background with gold accent color `#c8a96e`
- **Typography**: Shippori Mincho (headings), DM Mono (code/data), Noto Sans JP (body)
- **Layout**: CSS Grid and Flexbox throughout
- **Responsive**: Mobile-first breakpoints via media queries
- **Language**: Japanese copy (UI text, marketing copy); code comments in English

## Development Workflow

Since there is no build step, development is straightforward:

```bash
# Serve locally (any static file server works)
python3 -m http.server 8080
# or
npx serve .
# or simply open index.html in a browser
```

There is no hot-reload, compilation, linting, or testing pipeline.

## Editing Guidelines

- **CSS and JS are embedded** inside each HTML file — do not create separate `.css` or `.js` files unless refactoring is explicitly requested.
- Keep the two files self-contained and independently deployable.
- When adding new sections to `index.html`, follow the existing pattern: section wrapper → `.section-title` heading → content.
- Maintain the dark/gold color scheme when adding new UI elements.
- New FAQ items follow the `.faq-item` → `.faq-question` → `.faq-answer` pattern.

## Configuration (`config.js`)

`config.js` is loaded by `pricing.html` before the closing `</body>` tag and defines:

```js
const STRIPE_LINKS = {
  spot:    "https://buy.stripe.com/...",   // スポット診断 ¥9,800
  ranking: "https://buy.stripe.com/...",   // 業界ランキング ¥49,800
};
const CONTACT_EMAIL = "ai-visibility-index@protonmail.com";
```

**To update payment links**: Replace the placeholder URLs in `config.js` with real
Stripe Payment Link URLs from the [Stripe Dashboard](https://dashboard.stripe.com/payment-links).
No changes to `pricing.html` are needed.

> Do NOT put Stripe secret keys here — Payment Link URLs are safe to expose publicly.

## Planned / Not Yet Implemented

The following features are described in marketing copy but have **no backend or integration code**:
- Stripe payment processing
- Website scanning / crawling engine
- AI visibility scoring algorithm
- Report generation and delivery
- Email delivery system

When implementing these, new files and likely a backend or serverless function layer will be needed.

## Git Conventions

- Commit messages should be short and descriptive in English.
- The main production branch is `master`.
- Claude Code uses branches prefixed with `claude/` for its working branches.
