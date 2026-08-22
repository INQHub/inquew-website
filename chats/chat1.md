# Business website UI prototype

_Started 2026-08-21 21:48 UTC_

---

## User

I have attached a design brief, workflow, deliverables list, stakeholder network diagram, logo, screenshot references, and headshot (etc.)for my business website. I would like a full end-to-end UI prototype of this system that follows along with the exact cadence of my workflow and has all existing screens. Please create ALL screens since I plan on pushing this final project to Claude Code, adding a domain, and using it as a live site. 

Before I do that, I would like to confirm the site UI. Once confirmed, this design will be used for the exact live site that I will push to customers.

I would like design inspiration drawn from the following Behance links (and the images/design brief):
https://www.behance.net/gallery/253962433/Finku-Modern-Digital-Finance-Platform?tracking_source=search_projects|consulting+platform&l=31

https://www.behance.net/gallery/251095801/Grocery-Delivery-App-Design?tracking_source=search_projects|grocery+shopping&l=6

https://www.behance.net/gallery/253308627/Native-Connect?tracking_source=search_projects|grocery+shopping&l=31

## Assistant

I'll read the brief and deliverables list first.

_[tool: run_script]_

_[tool: run_script]_

_[tool: run_script]_

_[tool: copy_files]_

Now building the prototype.

_[tool: dc_write]_

_[tool: ready_for_verification]_

Full prototype is up — one file, every Phase 1 screen plus the Phase 2 dashboard, all clickable end to end:

**Public site:** Home, How It Works (5-step + what AI does/never does + edit credits), Deliverables Menu (all 21 items, tier/category/search/sort filters), Deliverable Detail modal with add-on checkboxes, Team, Contact, Footer.

**Flow:** Video intake (consent → record with live 2:00 timer → transcribing → 3 problem statements with regenerate/edit → recommended deliverables) → Cart with add-ons and delivery-method choice → Checkout → Confirmation → Client Dashboard (overview, orders, downloads, account).

Built on your confirmed palette and Outfit/Montserrat pairing, with tier badges gold/teal/olive and cyan reserved for CTAs (dark text per your accessibility note).

Three things carried through as-is from the brief for you to confirm:
- Add-on upcharges show as `+$__` placeholders.
- The video add-on is hidden on Ishikawa, PM Plan, and Training Plan (marked "included in base price" instead).
- No reversed white logo file exists, so the footer and dashboard use an Outfit wordmark with your tagline. Send me a white lockup and I'll swap it in.

Product images are striped placeholders labeled with each item's suggested image keyword — I can't generate photography, so those need real assets or stock before launch.

## User

Found issues — fixing…

## Assistant

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: ready_for_verification]_

Fixed the tablet-width overflow (clamped the implicit grid tracks in the hero panel, cart list, and statement list), and swapped the placeholder-looking letter glyphs for small color-coded marks plus a proper checkmark on the confirmation screen.

## User

For the optional add-ons on the delivery menu items, I would like the "add a video presentation" add-on price to be $35 and the Zoom session to be price $45

## Assistant

_[tool: grep]_

_[tool: run_script]_

_[tool: ready_for_verification]_

Add-ons are now $35 (video presentation) and $45 (30-minute Zoom), shown on the shop cards, detail modal, and cart. Both now roll into the cart and checkout totals, and checkout line items show the per-deliverable total including add-ons.

## User

I would like a hero image on every deliverable cover page. Keep it simple with white space so as not to visually overwhelm the viewer.

## Assistant

_[tool: read_file]_

_[tool: dc_html_str_replace]_

_[tool: ready_for_verification]_

Each deliverable detail page now opens with a full-width hero band (21:9) above the content, with the tier badge and close control overlaid on it and the title, category, and price sitting below in generous whitespace.

The hero is still a striped placeholder labeled with that item's suggested image keyword — drop in real photography or illustration per item and it slots straight in.

