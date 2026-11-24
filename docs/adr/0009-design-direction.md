# 0009. Design direction: delivery app with an editorial look

- **Status:** Accepted
- **Step:** 13 (web app base), refined in 30 (sign-in screens)

## Context

MenuCart is used mostly on a phone, in the kitchen while planning and in the supermarket while shopping. It
has to be quick to scan, but it is about food and home, not about a store. Several directions were sketched
before writing the web app.

## Decision

The structure of a **delivery app** with an **editorial** look:

- **Structure:** menu cards with their ingredients, a cart bar with what was chosen, and a shopping list
  grouped by supermarket section. On large screens the sign-in pages split into a brand panel and the form.
- **Look:** cream background (`#f7f2e9`), warm orange accent (`#c2410c`) and olive for success; **Fraunces**
  (serif) for titles and **Plus Jakarta Sans** for text. The fonts are bundled with the app (Fontsource), not
  loaded from Google Fonts.
- **Tokens** live in one place, `apps/web/src/index.css` (Tailwind CSS `@theme`). Text colors keep at least a
  4.5:1 contrast on cream and on white.
- **Accessibility:** labels on every field, errors linked with `aria-describedby`, native `<dialog>` for
  confirmations, and touch targets of at least 44 px.

## Alternatives

- **A component library (Material UI, shadcn/ui).** Faster, but it looks like many other apps and adds
  weight. The app needs few components.
- **A plain list app.** Clear but cold, and it does not show the menus, the heart of the app.

## Consequences

- Components are written with Tailwind CSS and a few shared pieces (`Modal`, form styles).
- Every screen is checked in Spanish and English, which have different text lengths.
- Screenshots of the app will be added to the README with the public demo.
