/* ============================================================================
   Travler storefront — vanilla JS, hash-routed, runs from file://
   Built on the Shopler foundation (same architecture, routing style and demo
   behaviour), reskinned and rewritten for a travel vertical.
   ----------------------------------------------------------------------------
   IMPORTANT: This build contains NO personalisation. Every "Activate" surface
   (hero, recommendation rails, recognition banner, persuasion badges, email
   moment, checkout cross-sell, PDP social proof) is a clean EMPTY container
   marked with data-activate="<slot>". Spotler Activate injects content there
   at runtime. This file never invents recommended/popular/welcome-back content.
   The only data-derived dynamics are factual (price, sale, real rooms-left).
   ========================================================================== */
(function () {
  "use strict";

  /* ---------------- Catalogue ---------------- */
  // No admin/catalogue-editor in this build (see README) — TRIPS is simply the
  // override layer (trips.js) if populated, else the immutable factory default.
  var TRIPS = (window.TRIPS && window.TRIPS.length) ? window.TRIPS : (window.TRIPS_DEFAULT || []).slice();
  var BY_SKU = {};
  TRIPS.forEach(function (p) { BY_SKU[p.sku] = p; });

  // Add-ons are a small static list — not admin-editable, referenced by trips' addonIds.
  var ADDONS = [
    { id: "ADD-TRANSFER", name_en: "Airport transfer", name_nl: "Luchthaventransfer", price_eur: 39, type: "transport" },
    { id: "ADD-LUGGAGE", name_en: "Hold luggage", name_nl: "Ruimbagage", price_eur: 45, type: "flight extra" },
    { id: "ADD-INSURANCE", name_en: "Travel insurance", name_nl: "Reisverzekering", price_eur: 29, type: "protection" },
    { id: "ADD-ROOM", name_en: "Room upgrade", name_nl: "Kamerupgrade", price_eur: 120, type: "accommodation" },
    { id: "ADD-BREAKFAST", name_en: "Breakfast upgrade", name_nl: "Ontbijtupgrade", price_eur: 75, type: "accommodation" },
    { id: "ADD-TOUR", name_en: "Guided city tour", name_nl: "Begeleide stadstour", price_eur: 55, type: "experience" },
    { id: "ADD-EXCURSION", name_en: "Guided excursion", name_nl: "Begeleide excursie", price_eur: 65, type: "experience" },
    { id: "ADD-CAR", name_en: "Car hire", name_nl: "Huurauto", price_eur: 180, type: "transport" },
    { id: "ADD-LOUNGE", name_en: "Airport lounge", name_nl: "Airport lounge", price_eur: 35, type: "comfort" },
    { id: "ADD-FLEX", name_en: "Flexible cancellation", name_nl: "Flexibel annuleren", price_eur: 49, type: "protection" },
    { id: "ADD-SKI", name_en: "Ski pass", name_nl: "Skipas", price_eur: 210, type: "activity" },
    { id: "ADD-EQUIPMENT", name_en: "Equipment rental", name_nl: "Materiaalhuur", price_eur: 95, type: "activity" },
    { id: "ADD-SPA", name_en: "Spa treatment", name_nl: "Spabehandeling", price_eur: 85, type: "luxury" },
    { id: "ADD-KIDSCLUB", name_en: "Kids club upgrade", name_nl: "Kids club-upgrade", price_eur: 40, type: "family" },
    { id: "ADD-PARK", name_en: "Theme park tickets", name_nl: "Pretparktickets", price_eur: 60, type: "experience" }
  ];
  var BY_ADDON = {};
  ADDONS.forEach(function (a) { BY_ADDON[a.id] = a; });

  // Canonical holiday-type slugs (the eight real categories; "last-minute" is a flag-driven
  // view, not a category value in the data). Order here drives the home tiles / footer list.
  var CATEGORY_SLUGS = [
    "beach-holidays", "city-breaks", "all-inclusive", "family-holidays",
    "luxury-escapes", "winter-sun", "ski-holidays", "adventure-holidays"
  ];
  // Home tiles, in the build-spec order. "adventure-holidays" is appended (not in the
  // spec's tile list) so its three trips stay reachable via a direct tile, not just search.
  var HOME_TILE_SLUGS = [
    "beach-holidays", "city-breaks", "all-inclusive", "family-holidays",
    "last-minute", "winter-sun", "luxury-escapes", "ski-holidays", "adventure-holidays"
  ];
  var CATEGORY_LABEL = {
    "beach-holidays": { en: "Beach holidays", nl: "Strandvakanties" },
    "city-breaks": { en: "City breaks", nl: "Stedentrips" },
    "all-inclusive": { en: "All inclusive", nl: "All inclusive" },
    "family-holidays": { en: "Family holidays", nl: "Gezinsvakanties" },
    "last-minute": { en: "Last minute", nl: "Last minute" },
    "luxury-escapes": { en: "Luxury escapes", nl: "Luxe vakanties" },
    "winter-sun": { en: "Winter sun", nl: "Winterzon" },
    "ski-holidays": { en: "Ski holidays", nl: "Skivakanties" },
    "adventure-holidays": { en: "Adventure holidays", nl: "Avontuurlijke vakanties" }
  };
  // Editorial taglines for the home category section (revealed on hover). Not personalisation —
  // fixed copy per category, same for every visitor.
  var CATEGORY_TAGLINE = {
    "beach-holidays": { en: "Salt air, slow mornings", nl: "Zilte lucht, trage ochtenden" },
    "city-breaks": { en: "A weekend, well spent", nl: "Een weekend goed besteed" },
    "all-inclusive": { en: "Everything, already sorted", nl: "Alles al geregeld" },
    "family-holidays": { en: "Built for every age", nl: "Voor elke leeftijd" },
    "last-minute": { en: "Go before you overthink it", nl: "Ga voordat je twijfelt" },
    "luxury-escapes": { en: "Quiet, considered, yours", nl: "Rustig, doordacht, van jou" },
    "winter-sun": { en: "Chase the warmth", nl: "Achter de warmte aan" },
    "ski-holidays": { en: "Fresh snow, first tracks", nl: "Verse sneeuw, eerste sporen" },
    "adventure-holidays": { en: "Somewhere further out", nl: "Ergens verder weg" }
  };
  function categoryTagline(slug) { var c = CATEGORY_TAGLINE[slug]; return c ? (state.lang === "nl" ? c.nl : c.en) : ""; }
  // Fixed category photography (not tied to any trip SKU) for the home bento section.
  // Base = at-rest shot, hover = crossfade-in shot on hover/focus.
  var CATEGORY_IMAGE = {};
  HOME_TILE_SLUGS.forEach(function (slug) {
    CATEGORY_IMAGE[slug] = { base: "category-" + slug + ".jpg", hover: "category-" + slug + "-hover.jpg" };
  });
  var BOARD_LABEL = {
    "Half board": { en: "Half board", nl: "Halfpension" },
    "All inclusive": { en: "All inclusive", nl: "All inclusive" },
    "Breakfast included": { en: "Breakfast included", nl: "Ontbijt inbegrepen" },
    "Room only": { en: "Room only", nl: "Logies only" },
    "Self catering": { en: "Self catering", nl: "Zelfverzorging" }
  };
  var FACILITY_TAGS = ["beach", "pool", "spa", "kids club", "city centre"];
  function slugFor(categoryLabel) { return String(categoryLabel || "").toLowerCase().replace(/\s+/g, "-"); }
  function categoryLabel(slug) { var c = CATEGORY_LABEL[slug]; return c ? (state.lang === "nl" ? c.nl : c.en) : slug; }
  function boardLabel(board) { var b = BOARD_LABEL[board]; return b ? (state.lang === "nl" ? b.nl : b.en) : board; }
  function addonName(a) { return state.lang === "nl" ? a.name_nl : a.name_en; }

  /* ---------------- State ---------------- */
  var state = {
    lang: localStorage.getItem("travler_lang") || "en",
    cart: JSON.parse(localStorage.getItem("travler_cart") || "[]"),       // [{kind:'trip'|'addon', id, qty}]
    saved: JSON.parse(localStorage.getItem("travler_saved") || "[]"),     // [tripId]
    recent: JSON.parse(localStorage.getItem("travler_recent") || "[]"),   // [tripId], most recent first
    checkoutStep: 1,
    checkoutEntered: false,
    prePurchaseFired: false,
    lastOrder: null,
    lastSearch: null // { keyword, checkin, nights, airport }
  };
  function persist() {
    localStorage.setItem("travler_lang", state.lang);
    localStorage.setItem("travler_cart", JSON.stringify(state.cart));
    localStorage.setItem("travler_saved", JSON.stringify(state.saved));
    localStorage.setItem("travler_recent", JSON.stringify(state.recent));
  }
  var sqzlBooted = false; // becomes true after the first render() (see PageReload note below)

  /* ---------------- i18n (UI chrome only; trip copy comes from data) ---------------- */
  var I18N = {
    en: {
      nav_beach: "Beach holidays", nav_city: "City breaks", nav_allinclusive: "All inclusive",
      nav_family: "Family holidays", nav_lastminute: "Last minute", nav_luxury: "Luxury escapes",
      nav_saved: "Saved trips", search: "Search", close: "Close", basket: "Booking basket",
      hero_title: "Find your next escape",
      hero_sub: "Package holidays, city breaks and sunny getaways picked around the way you travel.",
      hero_cta: "Search holidays", hero_cta2: "View last-minute deals",
      search_keyword: "Destination or hotel", search_keyword_ph: "Where do you want to go?",
      search_airport: "Departure airport", search_any_airport: "Any airport",
      search_date: "Departure date", search_duration: "Duration", search_any_duration: "Any duration",
      search_travellers: "Travellers", search_submit: "Search holidays",
      picked: "Recommended holidays", recent_title: "Recently viewed",
      popular_title: "Popular right now", lastmin_title: "Last-minute deals", view_all: "View all",
      trust_1: "Package holidays", trust_2: "Flexible payments",
      trust_3: "Support before and during your trip", trust_4: "Secure booking",
      signup_title: "Get price alerts for trips you care about",
      signup_sub: "We will let you know when the price drops or a similar trip appears.",
      signup_cta: "Send me price alerts", signup_ph: "Your email address",
      saved_title: "Saved trips", save_trip: "Save trip", unsave_trip: "Remove from saved trips",
      saved_empty: "You haven't saved any trips yet.", browse_trips: "Browse holidays",
      view_trip: "View trip", from_pp: "from", pp: "pp", nights_label: "{n} nights",
      only_left: "Only {n} rooms left", sold_out: "Fully booked", on_sale: "Price drop",
      last_minute_badge: "Last minute",
      f_destination: "Destination", f_board: "Board", f_airport: "Departure airport",
      f_rating: "Star rating", f_family: "Traveller type", f_facilities: "Facilities",
      f_budget: "Budget", f_duration: "Duration", f_holiday_type: "Holiday type",
      any: "Any", family_only: "Family", adults_only: "Adults only",
      filters: "Filters", sort: "Sort", clear_all: "Clear all",
      sort_featured: "Featured", sort_price_asc: "Price: low to high",
      sort_price_desc: "Price: high to low", sort_rating: "Rating",
      results_one: "{n} trip", results_many: "{n} trips",
      destination: "Destination", country: "Country", nights: "Nights", board: "Board",
      departure_airports: "Departure airports", hotel: "Hotel", rooms_available: "Rooms available",
      rooms_low: "Only {n} rooms left", fully_booked: "Fully booked",
      included_flights: "Flights", included_hotel: "Hotel", included_transfers: "Transfers", included_baggage: "Baggage",
      highlights: "Highlights", start_booking: "Start booking", continue_booking: "Continue booking",
      price_alert_title: "Get price alerts for this trip", price_alert_cta: "Alert me",
      avail_alert_title: "Tell me when this trip is available again", avail_alert_cta: "Notify me",
      you_may: "Similar trips",
      step1: "Trip summary", step2: "Traveller details", step3: "Add extras",
      step4: "Review booking", step5: "Confirmation", leave_checkout: "Leave checkout",
      back: "Back", next: "Continue",
      lead_traveller: "Lead traveller", first_name: "First name", last_name: "Last name",
      email: "Email", num_travellers: "Travellers", continue_to_extras: "Continue to extras",
      extras_title: "Add extras to your booking", extras_sub: "Optional add-ons for this booking.",
      add_extra: "Add", added: "Added", crosssell: "You might also need",
      review_title: "Review your booking", complete_booking: "Complete demo booking",
      your_basket: "Booking basket", basket_empty: "Your booking basket is empty.",
      order_summary: "Order summary",
      subtotal: "Subtotal", total: "Total", remove: "Remove",
      placed_title: "Thank you for your booking",
      placed_sub: "A confirmation has been sent to your email. This is a demo — no payment was taken and nothing will be booked.",
      back_home: "Back to home", booking_no: "Booking reference",
      cc_title: "Your privacy", cc_text: "We use cookies to improve your experience.",
      cc_accept: "Accept all", cc_reject: "Necessary only", cc_prefs: "Preferences",
      cc_save: "Save preferences", cc_prefs_intro: "Choose which cookies we may use.",
      cc_necessary: "Necessary", cc_necessary_note: "Always on",
      cc_analytics: "Analytics", cc_marketing: "Marketing",
      ft_cookies: "Cookie preferences",
      ft_holidaytypes: "Holiday types", ft_help: "Help", ft_about: "About",
      ft_beforeyougo: "Before you go", ft_cancellations: "Cancellations", ft_faq: "FAQ", ft_contact: "Contact",
      ft_story: "Our story", ft_sustainability: "Sustainable travel", ft_alltrips: "View all trips",
      rating_label: "{n} star", rating_label_plural: "{n} stars"
    },
    nl: {
      nav_beach: "Strandvakanties", nav_city: "Stedentrips", nav_allinclusive: "All inclusive",
      nav_family: "Gezinsvakanties", nav_lastminute: "Last minute", nav_luxury: "Luxe vakanties",
      nav_saved: "Bewaarde reizen", search: "Zoeken", close: "Sluiten", basket: "Boekingsmandje",
      hero_title: "Vind je volgende ontsnapping",
      hero_sub: "Pakketreizen, stedentrips en zonvakanties, samengesteld rond de manier waarop jij reist.",
      hero_cta: "Zoek vakanties", hero_cta2: "Bekijk last-minute deals",
      search_keyword: "Bestemming of hotel", search_keyword_ph: "Waar wil je naartoe?",
      search_airport: "Vertrekluchthaven", search_any_airport: "Elke luchthaven",
      search_date: "Vertrekdatum", search_duration: "Duur", search_any_duration: "Elke duur",
      search_travellers: "Reizigers", search_submit: "Zoek vakanties",
      picked: "Aanbevolen vakanties", recent_title: "Onlangs bekeken",
      popular_title: "Populair op dit moment", lastmin_title: "Last-minute deals", view_all: "Bekijk alles",
      trust_1: "Pakketreizen", trust_2: "Flexibel betalen",
      trust_3: "Ondersteuning voor en tijdens je reis", trust_4: "Veilig boeken",
      signup_title: "Ontvang prijsalerts voor reizen die je interesseren",
      signup_sub: "We laten het je weten zodra de prijs daalt of er een vergelijkbare reis verschijnt.",
      signup_cta: "Stuur mij prijsalerts", signup_ph: "Je e-mailadres",
      saved_title: "Bewaarde reizen", save_trip: "Reis bewaren", unsave_trip: "Verwijderen uit bewaarde reizen",
      saved_empty: "Je hebt nog geen reizen bewaard.", browse_trips: "Bekijk vakanties",
      view_trip: "Bekijk reis", from_pp: "vanaf", pp: "p.p.", nights_label: "{n} nachten",
      only_left: "Nog {n} kamers beschikbaar", sold_out: "Volgeboekt", on_sale: "Prijsverlaging",
      last_minute_badge: "Last minute",
      f_destination: "Bestemming", f_board: "Verzorging", f_airport: "Vertrekluchthaven",
      f_rating: "Sterrenclassificatie", f_family: "Type reiziger", f_facilities: "Voorzieningen",
      f_budget: "Budget", f_duration: "Duur", f_holiday_type: "Type vakantie",
      any: "Alle", family_only: "Gezin", adults_only: "Alleen volwassenen",
      filters: "Filters", sort: "Sorteren", clear_all: "Wis alles",
      sort_featured: "Aanbevolen", sort_price_asc: "Prijs: laag naar hoog",
      sort_price_desc: "Prijs: hoog naar laag", sort_rating: "Beoordeling",
      results_one: "{n} reis", results_many: "{n} reizen",
      destination: "Bestemming", country: "Land", nights: "Nachten", board: "Verzorging",
      departure_airports: "Vertrekluchthavens", hotel: "Hotel", rooms_available: "Kamers beschikbaar",
      rooms_low: "Nog {n} kamers beschikbaar", fully_booked: "Volgeboekt",
      included_flights: "Vluchten", included_hotel: "Hotel", included_transfers: "Transfers", included_baggage: "Bagage",
      highlights: "Hoogtepunten", start_booking: "Start boeking", continue_booking: "Verder boeken",
      price_alert_title: "Ontvang prijsalerts voor deze reis", price_alert_cta: "Meld mij",
      avail_alert_title: "Laat me weten als deze reis weer beschikbaar is", avail_alert_cta: "Meld mij",
      you_may: "Vergelijkbare reizen",
      step1: "Reisoverzicht", step2: "Reizigersgegevens", step3: "Extra's toevoegen",
      step4: "Boeking controleren", step5: "Bevestiging", leave_checkout: "Boeking verlaten",
      back: "Terug", next: "Verder",
      lead_traveller: "Hoofdboeker", first_name: "Voornaam", last_name: "Achternaam",
      email: "E-mail", num_travellers: "Reizigers", continue_to_extras: "Verder naar extra's",
      extras_title: "Voeg extra's toe aan je boeking", extras_sub: "Optionele extra's voor deze boeking.",
      add_extra: "Toevoegen", added: "Toegevoegd", crosssell: "Misschien ook interessant",
      review_title: "Controleer je boeking", complete_booking: "Boeking afronden (demo)",
      your_basket: "Boekingsmandje", basket_empty: "Je boekingsmandje is leeg.",
      order_summary: "Besteloverzicht",
      subtotal: "Subtotaal", total: "Totaal", remove: "Verwijderen",
      placed_title: "Bedankt voor je boeking",
      placed_sub: "Een bevestiging is naar je e-mail gestuurd. Dit is een demo — er is niet betaald en er is niets geboekt.",
      back_home: "Terug naar home", booking_no: "Boekingsnummer",
      cc_title: "Je privacy", cc_text: "We gebruiken cookies om je ervaring te verbeteren.",
      cc_accept: "Alles accepteren", cc_reject: "Alleen noodzakelijk", cc_prefs: "Voorkeuren",
      cc_save: "Voorkeuren opslaan", cc_prefs_intro: "Kies welke cookies we mogen gebruiken.",
      cc_necessary: "Noodzakelijk", cc_necessary_note: "Altijd aan",
      cc_analytics: "Analyse", cc_marketing: "Marketing",
      ft_cookies: "Cookievoorkeuren",
      ft_holidaytypes: "Type vakanties", ft_help: "Hulp", ft_about: "Over",
      ft_beforeyougo: "Voor je vertrek", ft_cancellations: "Annuleren", ft_faq: "FAQ", ft_contact: "Contact",
      ft_story: "Ons verhaal", ft_sustainability: "Duurzaam reizen", ft_alltrips: "Bekijk alle reizen",
      rating_label: "{n} ster", rating_label_plural: "{n} sterren"
    }
  };
  function t(key, vars) {
    var s = (I18N[state.lang] && I18N[state.lang][key]) || I18N.en[key] || key;
    if (vars) Object.keys(vars).forEach(function (k) { s = s.replace("{" + k + "}", vars[k]); });
    return s;
  }

  /* ---------------- Helpers ---------------- */
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function name(p) { return state.lang === "nl" ? p.name_nl : p.name_en; }
  function shortDesc(p) { return state.lang === "nl" ? p.short_desc_nl : p.short_desc_en; }
  function highlightsFor(p) { return state.lang === "nl" ? p.highlights_nl : p.highlights_en; }
  function money(n) {
    // Display only — no decimals. Raw values still flow to _sqzl/feed.
    return new Intl.NumberFormat(state.lang === "nl" ? "nl-NL" : "en-IE", {
      style: "currency", currency: "EUR", minimumFractionDigits: 0, maximumFractionDigits: 0
    }).format(n);
  }
  // No real photography is shipped in this build (see IMAGE_REQUIREMENTS.md); real image
  // paths are always attempted first (stable for the feed) and fall back to a category-
  // tinted inline placeholder on error, so the demo never shows a broken-image icon.
  function img(file) { return "images/" + file; }
  var PLACEHOLDER_HUES = {
    "beach-holidays": 32, "city-breaks": 205, "all-inclusive": 165, "family-holidays": 292,
    "luxury-escapes": 260, "winter-sun": 15, "ski-holidays": 198, "adventure-holidays": 140
  };
  function placeholderFor(p) {
    var hue = PLACEHOLDER_HUES[slugFor(p.category)] || 210;
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">' +
      '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="hsl(' + hue + ',55%,88%)"/>' +
      '<stop offset="1" stop-color="hsl(' + hue + ',45%,68%)"/>' +
      '</linearGradient></defs>' +
      '<rect width="800" height="600" fill="url(#g)"/>' +
      '<path d="M400 210c-46 0-80 35-80 78 0 55 80 120 80 120s80-65 80-120c0-43-34-78-80-78z" ' +
      'fill="none" stroke="hsl(' + hue + ',30%,30%)" stroke-width="8" stroke-linejoin="round"/>' +
      '<circle cx="400" cy="288" r="26" fill="none" stroke="hsl(' + hue + ',30%,30%)" stroke-width="7"/>' +
      '</svg>';
    return "data:image/svg+xml;base64," + btoa(svg);
  }
  function imgWithFallback(file, p, cls, alt, extra) {
    var ph = placeholderFor(p);
    return '<img class="' + cls + '" src="' + esc(img(file)) + '" alt="' + esc(alt || "") + '" loading="lazy"' +
      (extra || "") + ' onerror="this.onerror=null;this.src=\'' + ph + '\'">';
  }
  function effectivePrice(p) { return p.sale_price_eur != null ? p.sale_price_eur : p.price_eur; }
  function stockState(p) { return p.stock === 0 ? "sold" : (p.stock <= 3 ? "low" : "in"); }
  function starsHTML(rating) {
    var out = "";
    for (var i = 1; i <= 5; i++) {
      out += '<svg viewBox="0 0 20 20" class="' + (i <= rating ? "" : "is-off") + '" aria-hidden="true">' +
        '<path d="M10 1.5l2.6 5.6 6 .7-4.5 4.1 1.2 6-5.3-3-5.3 3 1.2-6-4.5-4.1 6-.7z"/></svg>';
    }
    return '<span class="stars" role="img" aria-label="' +
      esc(t(rating === 1 ? "rating_label" : "rating_label_plural", { n: rating })) + '">' + out + "</span>";
  }
  function addDays(dateStr, days) {
    if (!dateStr || !days) return "";
    var d = new Date(dateStr + "T00:00:00Z");
    d.setUTCDate(d.getUTCDate() + Number(days));
    return d.toISOString().slice(0, 10);
  }
  function uniq(a) { return a.filter(function (v, i) { return a.indexOf(v) === i; }).sort(); }

  /* ============================================================================
     Spotler Activate (Squeezely) data layer
     ----------------------------------------------------------------------------
     Squeezely reads events from the global array window._sqzl via .push({...}).
     The pixel script (loaded separately by Activate) drains this queue, so
     events pushed before the pixel loads are not lost. This file only PUSHES
     the standard Squeezely event vocabulary; it never invents personalised
     content. Field names/shapes follow the Spotler Activate API reference:
     products[] use id/name/price/category_ids/language/quantity (quantity
     omitted on ViewContent and Search), travel date fields ride on the events
     that carry them, and every event carries the sqzlBase() identity payload.
     ========================================================================== */
  window._sqzl = window._sqzl || [];
  function sqzlPush(obj) { try { window._sqzl.push(obj); } catch (e) { /* never break the shop on tracking */ } }
  function sqzlLang() { return state.lang === "nl" ? "nl-NL" : "en-GB"; }
  // Stable anonymous id so an unknown visitor can later be merged onto a known one (merge on User ID).
  function getUserId() {
    var id = localStorage.getItem("travler_uid");
    if (!id) {
      id = (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
        : "anon-" + Date.now().toString(36) + "-" + Math.floor(Math.random() * 1e9).toString(36);
      localStorage.setItem("travler_uid", id);
    }
    return id;
  }
  function round2(n) { return Math.round(n * 100) / 100; }
  function getKnownEmail() { return localStorage.getItem("travler_email") || ""; }
  function setKnownEmail(e) { if (e) localStorage.setItem("travler_email", e); }
  // Base payload carried on every event: userid + language, plus email once known.
  function sqzlBase(extra) {
    var o = { userid: getUserId(), language: sqzlLang() };
    var em = getKnownEmail();
    if (em) o.email = em;
    if (extra) Object.keys(extra).forEach(function (k) { o[k] = extra[k]; });
    return o;
  }
  // Canonical trip product payload. id === feed id, 1:1 with the trip feed.
  // qty omitted (not just falsy) when the caller passes nothing — required for
  // ViewContent / Search, where the API reference says quantity must be absent.
  function sqzlProduct(p, qty) {
    var o = { id: p.sku, name: name(p), price: effectivePrice(p), category_ids: [slugFor(p.category)], language: sqzlLang() };
    if (qty != null) o.quantity = qty;
    return o;
  }
  function sqzlAddonProduct(a, qty) {
    var o = { id: a.id, name: addonName(a), price: a.price_eur, category_ids: ["add-on"], language: sqzlLang() };
    if (qty != null) o.quantity = qty;
    return o;
  }
  function lineProduct(line, omitQty) {
    if (line.kind === "addon") return sqzlAddonProduct(BY_ADDON[line.id], omitQty ? null : line.qty);
    return sqzlProduct(BY_SKU[line.id], omitQty ? null : line.qty);
  }
  function basketProducts() { return state.cart.map(function (l) { return lineProduct(l); }); }

  function trackUserId() { sqzlPush({ userid: getUserId() }); }
  function trackPageView() { sqzlPush(sqzlBase({ event: "PageView", page: location.hash || "#/" })); }
  function trackViewContent(p) {
    sqzlPush(sqzlBase({ event: "ViewContent", currency: "EUR", category_id: slugFor(p.category), products: [sqzlProduct(p)] }));
  }
  function trackViewCategory(slug) {
    sqzlPush(sqzlBase({ event: "ViewCategory", category_id: slug, objectname: categoryLabel(slug) }));
  }
  function trackSearch(q) {
    var ex = { event: "Search", keyword: q.keyword || "" };
    if (q.checkin) ex.checkin_date = q.checkin;
    if (q.checkin && q.nights) ex.checkout_date = addDays(q.checkin, q.nights);
    if (q.nights) ex.amount_nights = Number(q.nights);
    if (q.products && q.products.length) ex.products = q.products.map(function (p) { return sqzlProduct(p); });
    sqzlPush(sqzlBase(ex));
  }
  function trackInitiateCheckout() {
    var ex = { event: "InitiateCheckout", currency: "EUR", totalvalue: round2(cartSubtotal()), products: basketProducts() };
    if (state.lastSearch && state.lastSearch.checkin) {
      ex.checkin_date = state.lastSearch.checkin;
      if (state.lastSearch.nights) ex.checkout_date = addDays(state.lastSearch.checkin, state.lastSearch.nights);
    }
    sqzlPush(sqzlBase(ex));
  }
  function trackAddToCart(line) {
    sqzlPush(sqzlBase({ event: "AddToCart", currency: "EUR", products: [lineProduct(line, true)] }));
  }
  function trackRemoveFromCart(line) {
    sqzlPush(sqzlBase({ event: "RemoveFromCart", products: [lineProduct(line, true)] }));
  }
  function trackPrePurchase(order) {
    sqzlPush(sqzlBase({ event: "PrePurchase", currency: "EUR", orderid: order.orderid, totalvalue: round2(order.total), products: order.products }));
  }
  function trackPurchase(order) {
    if (order.email) setKnownEmail(order.email);
    var ex = { event: "Purchase", orderid: order.orderid, currency: "EUR", totalvalue: round2(order.total), products: order.products };
    if (order.email) ex.email = order.email;
    if (order.checkin) ex.checkin_date = order.checkin;
    sqzlPush(sqzlBase(ex));
  }
  function trackEmailOptIn(email, extra) {
    setKnownEmail(email); // from now on this visitor is "known"
    var ex = { event: "EmailOptIn", email: email, newsletter: "yes" };
    if (extra) Object.keys(extra).forEach(function (k) { ex[k] = extra[k]; });
    sqzlPush(sqzlBase(ex));
  }
  function trackAvailabilityAlert(email, p) {
    setKnownEmail(email);
    sqzlPush(sqzlBase({ event: "EmailOptIn", email: email, newsletter: "no", trigger: "availability_alert", product: { id: p.sku } }));
  }
  function trackAddToWishlist(p) {
    sqzlPush(sqzlBase({ event: "AddToWishlist", products: [sqzlProduct(p)] }));
  }

  /* ============================================================================
     Consent (Activate / Squeezely consent API) — identical convention to Shopler.
     ========================================================================== */
  function getConsent() {
    try { return JSON.parse(localStorage.getItem("travler_consent") || "null"); }
    catch (e) { return null; }
  }
  function setConsent(o) { localStorage.setItem("travler_consent", JSON.stringify(o)); }
  function applyConsent(interactive) {
    var c = getConsent();
    if (!c || !c.decided) return;
    function push(o) { if (interactive) o.user_interaction = true; sqzlPush(o); }
    if (c.analytics && c.marketing) push({ consent: "grant" });
    else if (!c.analytics && !c.marketing) push({ consent: "revoke" });
    else {
      var grant = [], revoke = [];
      (c.analytics ? grant : revoke).push("analytics");
      (c.marketing ? grant : revoke).push("marketing");
      if (grant.length) push({ consent: "grant", permissions: grant });
      if (revoke.length) push({ consent: "revoke", permissions: revoke });
    }
  }
  function decideConsent(analytics, marketing) {
    setConsent({ decided: true, analytics: !!analytics, marketing: !!marketing });
    applyConsent(true);
    renderConsent();
  }
  function renderConsent(opts) {
    opts = opts || {};
    var el = document.getElementById("consent");
    if (!el) return;
    var c = getConsent();
    if (c && c.decided && !opts.open) { el.innerHTML = ""; return; }
    var showPrefs = !!opts.prefs;
    var aOn = c ? c.analytics : false, mOn = c ? c.marketing : false;
    var prefs = showPrefs
      ? '<div class="cc__prefs">' +
          '<p>' + esc(t("cc_prefs_intro")) + '</p>' +
          '<label class="cc__opt"><input type="checkbox" checked disabled> <span>' + esc(t("cc_necessary")) +
            '</span> <em>' + esc(t("cc_necessary_note")) + '</em></label>' +
          '<label class="cc__opt"><input type="checkbox" data-cc-cat="analytics"' + (aOn ? " checked" : "") + '> <span>' + esc(t("cc_analytics")) + '</span></label>' +
          '<label class="cc__opt"><input type="checkbox" data-cc-cat="marketing"' + (mOn ? " checked" : "") + '> <span>' + esc(t("cc_marketing")) + '</span></label>' +
          '<button class="btn" data-cc="save">' + esc(t("cc_save")) + '</button>' +
        '</div>'
      : "";
    el.innerHTML =
      '<div class="cc" role="dialog" aria-label="' + esc(t("cc_title")) + '" aria-live="polite">' +
        '<div class="cc__main">' +
          '<div class="cc__text"><strong>' + esc(t("cc_title")) + '</strong><p>' + esc(t("cc_text")) + '</p></div>' +
          '<div class="cc__actions">' +
            '<button class="btn btn--ghost" data-cc="reject">' + esc(t("cc_reject")) + '</button>' +
            '<button class="btn btn--ghost" data-cc="prefs">' + esc(t("cc_prefs")) + '</button>' +
            '<button class="btn" data-cc="accept">' + esc(t("cc_accept")) + '</button>' +
          '</div>' +
        '</div>' + prefs +
      '</div>';
  }

  /* ---------------- Catalogue views ---------------- */
  function productsForView(view) {
    if (view === "all") return TRIPS.slice();
    if (view === "last-minute") return TRIPS.filter(function (p) { return p.lastMinute; });
    return TRIPS.filter(function (p) { return slugFor(p.category) === view; });
  }

  /* ---------------- Booking basket ---------------- */
  function cartCount() { return state.cart.reduce(function (n, l) { return n + l.qty; }, 0); }
  function cartSubtotal() {
    return state.cart.reduce(function (s, l) {
      if (l.kind === "addon") { var a = BY_ADDON[l.id]; return a ? s + a.price_eur * l.qty : s; }
      var p = BY_SKU[l.id]; return p ? s + effectivePrice(p) * l.qty : s;
    }, 0);
  }
  function findLine(kind, id) {
    for (var i = 0; i < state.cart.length; i++) { if (state.cart[i].kind === kind && state.cart[i].id === id) return i; }
    return -1;
  }
  function addTripToBasket(sku) {
    var p = BY_SKU[sku];
    if (!p || p.stock === 0) return;
    var i = findLine("trip", sku);
    if (i < 0) { state.cart.push({ kind: "trip", id: sku, qty: 1 }); trackAddToCart({ kind: "trip", id: sku, qty: 1 }); }
    persist(); renderChrome();
  }
  function addAddonToBasket(id) {
    if (findLine("addon", id) >= 0) return; // one of each add-on per booking
    state.cart.push({ kind: "addon", id: id, qty: 1 });
    trackAddToCart({ kind: "addon", id: id, qty: 1 });
    persist(); renderChrome();
  }
  function removeLineAt(i) {
    var line = state.cart[i]; if (!line) return;
    trackRemoveFromCart(line);
    state.cart.splice(i, 1);
    persist(); renderChrome(); renderDrawer();
  }
  function openDrawer() { document.getElementById("scrim").classList.add("is-open"); document.getElementById("drawer").classList.add("is-open"); }
  function closeDrawer() { document.getElementById("scrim").classList.remove("is-open"); document.getElementById("drawer").classList.remove("is-open"); }
  function renderDrawer() {
    var body, foot = "";
    if (!state.cart.length) {
      body = '<p class="empty-msg">' + esc(t("basket_empty")) + "</p>";
    } else {
      body = state.cart.map(function (l, i) {
        if (l.kind === "addon") {
          var a = BY_ADDON[l.id];
          return '<div class="line"><div style="width:68px;height:68px;border-radius:var(--r-sm);background:var(--surface-sunken);display:flex;align-items:center;justify-content:center;font-size:11px;color:var(--stone-600)">' +
            esc(a.type) + '</div>' +
            '<div><div class="line__meta">' + esc(t("added")) + '</div><div class="line__name">' + esc(addonName(a)) + '</div>' +
            '<div class="money" style="font-size:var(--text-sm)">' + esc(money(a.price_eur)) + '</div></div>' +
            '<div><div class="money">' + esc(money(a.price_eur)) + '</div>' +
            '<button class="linkbtn" data-remove-line="' + i + '">' + esc(t("remove")) + '</button></div></div>';
        }
        var p = BY_SKU[l.id];
        return '<div class="line">' + imgWithFallback(p.image, p, "", name(p), ' style="width:68px;height:68px;object-fit:cover;border-radius:var(--r-sm)"') +
          '<div><div class="line__meta">' + esc(p.destination) + ', ' + esc(p.country) + '</div>' +
            '<div class="line__name">' + esc(name(p)) + '</div>' +
            '<div class="money" style="font-size:var(--text-sm)">' + esc(t("nights_label", { n: p.nights })) + '</div></div>' +
          '<div><div class="money">' + esc(money(effectivePrice(p) * l.qty)) + '</div>' +
          '<button class="linkbtn" data-remove-line="' + i + '">' + esc(t("remove")) + '</button></div></div>';
      }).join("");
      var ctaLabel = state.checkoutEntered ? t("continue_booking") : t("start_booking");
      foot = '<div class="totals"><span>' + esc(t("subtotal")) + '</span><span class="money">' + esc(money(cartSubtotal())) + '</span></div>' +
        '<a class="btn btn--block" href="#/checkout" data-go-checkout>' + esc(ctaLabel) + '</a>';
    }
    document.getElementById("drawer").innerHTML =
      '<div class="drawer__head"><h2>' + esc(t("your_basket")) + '</h2>' +
        '<button class="linkbtn" data-close-cart>' + esc(t("close")) + '</button></div>' +
      '<div class="drawer__body">' + body + '</div>' +
      (foot ? '<div class="drawer__foot">' + foot + "</div>" : "");
  }

  /* ---------------- Saved trips + recently viewed ---------------- */
  function isSaved(sku) { return state.saved.indexOf(sku) >= 0; }
  function toggleSaved(sku) {
    var p = BY_SKU[sku]; if (!p) return;
    var i = state.saved.indexOf(sku);
    if (i >= 0) { state.saved.splice(i, 1); }
    else { state.saved.push(sku); trackAddToWishlist(p); }
    persist(); renderChrome();
  }
  function noteRecentlyViewed(sku) {
    state.recent = state.recent.filter(function (s) { return s !== sku; });
    state.recent.unshift(sku);
    state.recent = state.recent.slice(0, 8);
    persist();
  }

  /* ---------------- Reusable fragments ---------------- */
  function priceHTML(p) {
    if (p.sale_price_eur != null) {
      return '<span class="price">' +
        '<span class="price__now price__now--sale money">' + esc(money(p.sale_price_eur)) + '</span>' +
        '<span class="price__was money">' + esc(money(p.price_eur)) + '</span>' +
        '<span class="price__pp">' + esc(t("pp")) + '</span></span>';
    }
    return '<span class="price"><span class="price__now money">' + esc(money(p.price_eur)) + '</span>' +
      '<span class="price__pp">' + esc(t("pp")) + '</span></span>';
  }
  function saveButtonHTML(sku) {
    var saved = isSaved(sku);
    return '<button class="card__save' + (saved ? " is-saved" : "") + '" data-toggle-saved="' + esc(sku) + '" ' +
      'aria-label="' + esc(saved ? t("unsave_trip") : t("save_trip")) + '" title="' + esc(saved ? t("unsave_trip") : t("save_trip")) + '">' +
      '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.35-9.5-8.8C1 8 2.4 4.5 6 4.5c2 0 3.4 1.1 6 3.7 2.6-2.6 4-3.7 6-3.7 3.6 0 5 3.5 3.5 6.7C19 15.65 12 20 12 20z"/></svg>' +
    '</button>';
  }

  function cardHTML(p) {
    var st = stockState(p);
    var labels = "";
    if (p.sale_price_eur != null) labels += '<span class="clabel clabel--sale">' + esc(t("on_sale")) + "</span>";
    if (p.lastMinute) labels += '<span class="clabel clabel--lastmin">' + esc(t("last_minute_badge")) + "</span>";
    if (st === "low") labels += '<span class="clabel clabel--low">' + esc(t("only_left", { n: p.stock })) + "</span>";
    else if (st === "sold") labels += '<span class="clabel clabel--sold">' + esc(t("sold_out")) + "</span>";
    return '' +
      '<article class="card' + (st === "sold" ? " is-sold" : "") + '" data-product-sku="' + esc(p.sku) + '">' +
        '<a class="card__media" href="#/product/' + esc(p.sku) + '">' +
          imgWithFallback(p.image, p, "card__img--packshot", name(p)) +
          imgWithFallback(p.image_lifestyle, p, "card__img--lifestyle", "") +
          '<div class="card__perso perso-slot" data-activate="card-badge" data-sku="' + esc(p.sku) + '"></div>' +
        '</a>' +
        saveButtonHTML(p.sku) +
        '<div class="card__body">' +
          '<a href="#/product/' + esc(p.sku) + '">' +
            '<div class="card__dest">' + esc(p.destination) + ', ' + esc(p.country) + '</div>' +
            '<div class="card__name">' + esc(name(p)) + '</div>' +
          '</a>' +
          starsHTML(p.rating) +
          '<div class="card__meta">' +
            '<span>' + esc(boardLabel(p.board)) + '</span>' +
            '<span>' + esc(t("nights_label", { n: p.nights })) + '</span>' +
            '<span>' + esc(p.departureAirports[0]) + '</span>' +
          '</div>' +
          '<div>' + esc(t("from_pp")) + ' ' + priceHTML(p) + '</div>' +
          (labels ? '<div class="card__labels">' + labels + '</div>' : "") +
          '<div style="margin-top:var(--space-2)"><a class="btn btn--ghost btn--sm" href="#/product/' + esc(p.sku) + '">' + esc(t("view_trip")) + '</a></div>' +
        '</div>' +
      '</article>';
  }
  function gridHTML(list) {
    if (!list.length) return '<div class="empty-state">—</div>';
    return '<div class="grid">' + list.map(cardHTML).join("") + "</div>";
  }
  function persoRail(slot, heading) {
    return '<section class="perso-rail perso-slot" data-activate="' + slot + '" aria-label="' + esc(heading) + '"></section>';
  }

  /* ---------------- Views ---------------- */
  var LARGE_TILE_SLUGS = ["beach-holidays", "city-breaks"];
  function tileHTML(slug) {
    var label = categoryLabel(slug);
    var tagline = categoryTagline(slug);
    var images = CATEGORY_IMAGE[slug];
    var placeholderRef = { category: slug }; // slugFor(slug) === slug, so the right placeholder hue is picked
    var isLarge = LARGE_TILE_SLUGS.indexOf(slug) >= 0;
    return '<a class="tile' + (isLarge ? " tile--lg" : "") + '" href="#/c/' + slug + '" data-slug="' + esc(slug) + '">' +
      imgWithFallback(images.base, placeholderRef, "tile__img tile__img--base", "") +
      imgWithFallback(images.hover, placeholderRef, "tile__img tile__img--hover", "") +
      '<div class="tile__scrim"></div>' +
      '<div class="tile__copy">' +
        '<span class="tile__title">' + esc(label) + '</span>' +
        (tagline ? '<span class="tile__tagline">' + esc(tagline) + '</span>' : "") +
      '</div>' +
    '</a>';
  }

  function searchModHTML() {
    var airports = uniq(TRIPS.reduce(function (a, p) { return a.concat(p.departureAirports); }, []));
    return '<div class="searchmod">' +
      '<form data-search-form>' +
        '<div class="field"><label>' + esc(t("search_keyword")) + '</label>' +
          '<input type="text" name="q" placeholder="' + esc(t("search_keyword_ph")) + '"></div>' +
        '<div class="field"><label>' + esc(t("search_airport")) + '</label>' +
          '<select name="airport"><option value="">' + esc(t("search_any_airport")) + '</option>' +
          airports.map(function (a) { return '<option value="' + esc(a) + '">' + esc(a) + '</option>'; }).join("") +
          '</select></div>' +
        '<div class="field"><label>' + esc(t("search_date")) + '</label><input type="date" name="checkin"></div>' +
        '<div class="field"><label>' + esc(t("search_duration")) + '</label>' +
          '<select name="nights"><option value="">' + esc(t("search_any_duration")) + '</option>' +
          [3, 4, 5, 7, 9, 10, 14].map(function (n) { return '<option value="' + n + '">' + esc(t("nights_label", { n: n })) + '</option>'; }).join("") +
          '</select></div>' +
        '<button class="btn" type="submit">' + esc(t("search_submit")) + '</button>' +
      '</form>' +
    '</div>';
  }

  function trustStripHTML() {
    var icon = '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12l9-9 9 9M5 10v10h14V10"/></svg>';
    return '<div class="wrap"><div class="trust">' +
      ["trust_1", "trust_2", "trust_3", "trust_4"].map(function (k) {
        return '<div class="trust__item">' + icon + '<span>' + esc(t(k)) + '</span></div>';
      }).join("") +
    '</div></div>';
  }

  function signupHTML() {
    return '<section class="signup">' +
      '<div class="perso-slot" data-activate="email-capture"></div>' +
      '<h2>' + esc(t("signup_title")) + '</h2>' +
      '<p>' + esc(t("signup_sub")) + '</p>' +
      '<form data-signup><input type="email" placeholder="' + esc(t("signup_ph")) + '" aria-label="' + esc(t("email")) + '" required>' +
        '<button class="btn" type="submit">' + esc(t("signup_cta")) + '</button></form>' +
    '</section>';
  }

  function viewHome() {
    var popular = TRIPS.slice().sort(function (a, b) { return b.popularity - a.popularity; }).slice(0, 8);
    var lastMin = productsForView("last-minute").slice(0, 8);
    var recent = state.recent.map(function (sku) { return BY_SKU[sku]; }).filter(Boolean);
    return '' +
      '<div class="perso-slot" data-activate="recognition-banner" hidden></div>' +
      '<div class="perso-slot" data-activate="hero"></div>' +
      '<section class="hero">' +
        imgWithFallback("hero.webp", { category: "Beach holidays" }, "hero__bg", "") +
        '<div class="hero__overlay"><div class="hero__copy"><div class="inner">' +
          '<h1>' + esc(t("hero_title")) + '</h1>' +
          '<p>' + esc(t("hero_sub")) + '</p>' +
          '<div class="hero__ctas">' +
            '<a class="btn" href="#searchmod" data-scroll-search>' + esc(t("hero_cta")) + '</a>' +
            '<a class="btn btn--ghost" href="#/c/last-minute">' + esc(t("hero_cta2")) + '</a>' +
          '</div>' +
        '</div></div></div>' +
      '</section>' +
      '<div class="wrap"><div id="searchmod-anchor">' + searchModHTML() + '</div></div>' +
      '<div class="wrap">' +
        persoRail("rec-picked", t("picked")) +
        (recent.length ? '<section class="section">' +
          '<div class="section__head"><h2>' + esc(t("recent_title")) + '</h2></div>' +
          gridHTML(recent) + '</section>' : "") +
        '<section class="section">' +
          '<div class="tiles">' +
            HOME_TILE_SLUGS.map(tileHTML).join("") +
          '</div>' +
        '</section>' +
        '<section class="section">' +
          '<div class="section__head"><h2>' + esc(t("popular_title")) + '</h2>' +
            '<a href="#/c/all">' + esc(t("view_all")) + ' →</a></div>' +
          gridHTML(popular) +
        '</section>' +
        (lastMin.length ? '<section class="section">' +
          '<div class="section__head"><h2>' + esc(t("lastmin_title")) + '</h2>' +
            '<a href="#/c/last-minute">' + esc(t("view_all")) + ' →</a></div>' +
          gridHTML(lastMin) + '</section>' : "") +
      '</div>' +
      trustStripHTML() +
      '<div class="wrap">' + signupHTML() + '</div>';
  }

  var listingFilters = {};
  function defaultFilters(view) {
    return { view: view, destinations: [], boards: [], airports: [], facilities: [], holidayTypes: [],
      rating: "", family: "", price: "", duration: "", sort: "featured" };
  }
  function applyListingFilters(base, f) {
    return base.filter(function (p) {
      if (f.destinations.length && f.destinations.indexOf(p.destination) < 0) return false;
      if (f.boards.length && f.boards.indexOf(p.board) < 0) return false;
      if (f.airports.length && !f.airports.some(function (a) { return p.departureAirports.indexOf(a) >= 0; })) return false;
      if (f.facilities.length && !f.facilities.every(function (fac) { return p.tags.indexOf(fac) >= 0; })) return false;
      if (f.holidayTypes.length && f.holidayTypes.indexOf(slugFor(p.category)) < 0) return false;
      if (f.rating && p.rating < Number(f.rating)) return false;
      if (f.family === "family" && p.tags.indexOf("family") < 0) return false;
      if (f.family === "adults" && p.tags.indexOf("adults only") < 0) return false;
      if (f.price === "u500" && effectivePrice(p) >= 500) return false;
      if (f.price === "500-900" && (effectivePrice(p) < 500 || effectivePrice(p) > 900)) return false;
      if (f.price === "900-1300" && (effectivePrice(p) < 900 || effectivePrice(p) > 1300)) return false;
      if (f.price === "o1300" && effectivePrice(p) <= 1300) return false;
      if (f.duration === "short" && p.nights > 4) return false;
      if (f.duration === "mid" && (p.nights < 5 || p.nights > 7)) return false;
      if (f.duration === "long" && p.nights < 8) return false;
      return true;
    });
  }
  function priceLabel(v) {
    return v === "u500" ? "< " + money(500) : v === "500-900" ? money(500) + "–" + money(900)
      : v === "900-1300" ? money(900) + "–" + money(1300) : v === "o1300" ? "> " + money(1300) : "";
  }
  function durationLabel(v) { return v === "short" ? "≤ 4" : v === "mid" ? "5–7" : v === "long" ? "8+" : ""; }
  function chip(group, val, label) {
    return '<span class="chip">' + esc(label) + '<button data-remove-filter="' + group + '" data-val="' + esc(val) + '" aria-label="' + esc(t("remove")) + '">×</button></span>';
  }
  function fcheck(group, values, sel) {
    return values.map(function (v) {
      return '<label><input type="checkbox" data-filter="' + group + '" value="' + esc(v) + '"' + (sel.indexOf(v) >= 0 ? " checked" : "") + '>' + esc(v) + "</label>";
    }).join("");
  }
  function fradio(group, val, label, sel) {
    return '<label><input type="radio" name="' + group + '" data-radiofilter="' + group + '" value="' + esc(val) + '"' + (sel === val ? " checked" : "") + '>' + esc(label) + "</label>";
  }
  function sortOpt(val, label, sel) { return '<option value="' + val + '"' + (sel === val ? " selected" : "") + ">" + esc(label) + "</option>"; }

  function viewListing(view) {
    var base = productsForView(view);
    var f = listingFilters;
    if (f.view !== view) { listingFilters = f = defaultFilters(view); }
    var list = applyListingFilters(base, f);
    if (f.sort === "price_asc") list.sort(function (a, b) { return effectivePrice(a) - effectivePrice(b); });
    else if (f.sort === "price_desc") list.sort(function (a, b) { return effectivePrice(b) - effectivePrice(a); });
    else if (f.sort === "rating") list.sort(function (a, b) { return b.rating - a.rating; });
    else list.sort(function (a, b) { return b.popularity - a.popularity; });

    var destinations = uniq(base.map(function (p) { return p.destination; }));
    var boards = uniq(base.map(function (p) { return p.board; }));
    var airports = uniq(base.reduce(function (a, p) { return a.concat(p.departureAirports); }, []));
    var title = view === "all" ? t("ft_alltrips") : categoryLabel(view);

    var chips = [];
    f.destinations.forEach(function (d) { chips.push(chip("destinations", d, d)); });
    f.boards.forEach(function (b) { chips.push(chip("boards", b, boardLabel(b))); });
    f.airports.forEach(function (a) { chips.push(chip("airports", a, a)); });
    f.facilities.forEach(function (fac) { chips.push(chip("facilities", fac, fac)); });
    f.holidayTypes.forEach(function (h) { chips.push(chip("holidayTypes", h, categoryLabel(h))); });
    if (f.rating) chips.push(chip("rating", f.rating, f.rating + "+"));
    if (f.family) chips.push(chip("family", f.family, t(f.family === "family" ? "family_only" : "adults_only")));
    if (f.price) chips.push(chip("price", f.price, priceLabel(f.price)));
    if (f.duration) chips.push(chip("duration", f.duration, durationLabel(f.duration)));

    return '<div class="wrap">' +
      '<nav class="breadcrumb"><a href="#/">Travler</a> / ' + esc(title) + '</nav>' +
      '<h1 class="page-title">' + esc(title) + '</h1>' +
      '<div class="listing">' +
        '<aside class="filters">' +
          (view === "all" ? '<h3>' + esc(t("f_holiday_type")) + '</h3><div class="fgroup">' + CATEGORY_SLUGS.map(function (slug) {
            return '<label><input type="checkbox" data-filter="holidayTypes" value="' + esc(slug) + '"' + (f.holidayTypes.indexOf(slug) >= 0 ? " checked" : "") + '>' + esc(categoryLabel(slug)) + "</label>";
          }).join("") + '</div>' : "") +
          '<h3>' + esc(t("f_destination")) + '</h3><div class="fgroup">' + fcheck("destinations", destinations, f.destinations) + '</div>' +
          '<h3>' + esc(t("f_board")) + '</h3><div class="fgroup">' + boards.map(function (b) {
            return '<label><input type="checkbox" data-filter="boards" value="' + esc(b) + '"' + (f.boards.indexOf(b) >= 0 ? " checked" : "") + '>' + esc(boardLabel(b)) + "</label>";
          }).join("") + '</div>' +
          '<h3>' + esc(t("f_airport")) + '</h3><div class="fgroup">' + fcheck("airports", airports, f.airports) + '</div>' +
          '<h3>' + esc(t("f_budget")) + '</h3><div class="fgroup">' +
            fradio("price", "", t("any"), f.price) + fradio("price", "u500", "< " + money(500), f.price) +
            fradio("price", "500-900", money(500) + "–" + money(900), f.price) +
            fradio("price", "900-1300", money(900) + "–" + money(1300), f.price) +
            fradio("price", "o1300", "> " + money(1300), f.price) +
          '</div>' +
          '<h3>' + esc(t("f_duration")) + '</h3><div class="fgroup">' +
            fradio("duration", "", t("any"), f.duration) + fradio("duration", "short", "≤ 4", f.duration) +
            fradio("duration", "mid", "5–7", f.duration) + fradio("duration", "long", "8+", f.duration) +
          '</div>' +
          '<h3>' + esc(t("f_rating")) + '</h3><div class="fgroup">' +
            fradio("rating", "", t("any"), f.rating) + fradio("rating", "3", "3+", f.rating) +
            fradio("rating", "4", "4+", f.rating) + fradio("rating", "5", "5", f.rating) +
          '</div>' +
          '<h3>' + esc(t("f_family")) + '</h3><div class="fgroup">' +
            fradio("family", "", t("any"), f.family) + fradio("family", "family", t("family_only"), f.family) +
            fradio("family", "adults", t("adults_only"), f.family) +
          '</div>' +
          '<h3>' + esc(t("f_facilities")) + '</h3><div class="fgroup">' + fcheck("facilities", FACILITY_TAGS, f.facilities) + '</div>' +
        '</aside>' +
        '<div>' +
          '<div class="listing__bar">' +
            '<span class="count">' + esc(list.length === 1 ? t("results_one", { n: 1 }) : t("results_many", { n: list.length })) + '</span>' +
            '<label>' + esc(t("sort")) + ': <select data-sort>' +
              sortOpt("featured", t("sort_featured"), f.sort) +
              sortOpt("price_asc", t("sort_price_asc"), f.sort) +
              sortOpt("price_desc", t("sort_price_desc"), f.sort) +
              sortOpt("rating", t("sort_rating"), f.sort) +
            '</select></label>' +
          '</div>' +
          (chips.length ? '<div class="chiprow">' + chips.join("") +
            '<button class="linkbtn" data-clear>' + esc(t("clear_all")) + '</button></div>' : "") +
          (list.length ? gridHTML(list) : '<div class="empty-state">' + esc(t("results_many", { n: 0 })) + '</div>') +
        '</div>' +
      '</div></div>';
  }

  function viewSaved() {
    var list = state.saved.map(function (sku) { return BY_SKU[sku]; }).filter(Boolean);
    return '<div class="wrap">' +
      '<nav class="breadcrumb"><a href="#/">Travler</a> / ' + esc(t("saved_title")) + '</nav>' +
      '<h1 class="page-title">' + esc(t("saved_title")) + '</h1>' +
      (list.length ? gridHTML(list) :
        '<div class="saved-empty"><p>' + esc(t("saved_empty")) + '</p><a class="btn" href="#/c/all">' + esc(t("browse_trips")) + '</a></div>') +
    '</div>';
  }

  function viewProduct(sku) {
    var p = BY_SKU[sku];
    if (!p) return '<div class="wrap"><div class="empty-state">Not found</div></div>';
    var st = stockState(p);
    var stockTxt = st === "sold" ? t("fully_booked") : st === "low" ? t("rooms_low", { n: p.stock }) : t("rooms_available");
    var metaRows = [
      [t("destination"), p.destination + ", " + p.country], [t("hotel"), p.hotel],
      [t("board"), boardLabel(p.board)], [t("nights"), String(p.nights)],
      [t("departure_airports"), p.departureAirports.join(", ")]
    ];
    var alertBlock = (st === "sold" || st === "low")
      ? '<div class="addon-alert">' +
          '<p>' + esc(t("avail_alert_title")) + '</p>' +
          '<form data-avail-alert="' + esc(p.sku) + '"><input type="email" placeholder="' + esc(t("email")) + '" required>' +
            '<button class="btn btn--sm" type="submit">' + esc(t("avail_alert_cta")) + '</button></form>' +
        '</div>' : "";
    return '<div class="wrap">' +
      '<nav class="breadcrumb"><a href="#/">Travler</a> / <a href="#/c/' + esc(slugFor(p.category)) + '">' + esc(categoryLabel(slugFor(p.category))) + '</a> / ' + esc(name(p)) + '</nav>' +
      '<div class="pdp" data-product-sku="' + esc(p.sku) + '">' +
        '<div class="pdp__gallery">' +
          imgWithFallback(p.image, p, "", name(p)) +
          imgWithFallback(p.image_lifestyle, p, "", name(p)) +
        '</div>' +
        '<div class="pdp__info">' +
          '<div class="pdp__dest">' + esc(p.destination) + ', ' + esc(p.country) + '</div>' +
          '<h1>' + esc(name(p)) + '</h1>' +
          '<div class="pdp__stars">' + starsHTML(p.rating) + '<span class="eyebrow">' + esc(p.hotel) + '</span></div>' +
          '<div class="pdp__price">' + esc(t("from_pp")) + ' ' + priceHTML(p) + '</div>' +
          '<div class="stock stock--' + st + '">' + esc(stockTxt) + '</div>' +
          '<div class="perso-slot" data-activate="pdp-social"></div>' +
          alertBlock +
          '<p class="pdp__desc">' + esc(shortDesc(p)) + '</p>' +
          '<div class="pdp__included">' +
            '<span class="included-chip">' + esc(t("included_flights")) + '</span>' +
            '<span class="included-chip">' + esc(t("included_hotel")) + '</span>' +
            '<span class="included-chip">' + esc(t("included_transfers")) + '</span>' +
            '<span class="included-chip">' + esc(t("included_baggage")) + '</span>' +
          '</div>' +
          '<h3 style="font-size:var(--text-sm);text-transform:uppercase;letter-spacing:var(--track-caps);color:var(--stone-600)">' + esc(t("highlights")) + '</h3>' +
          '<ul class="pdp__highlights">' + highlightsFor(p).map(function (h) { return "<li>" + esc(h) + "</li>"; }).join("") + '</ul>' +
          '<div class="pdp__actions">' +
            '<button class="btn btn--block" data-start-booking="' + esc(p.sku) + '"' + (st === "sold" ? " disabled" : "") + '>' +
              esc(st === "sold" ? t("sold_out") : t("start_booking")) + '</button>' +
            saveButtonInlineHTML(p.sku) +
          '</div>' +
          '<div class="addon-alert">' +
            '<p>' + esc(t("price_alert_title")) + '</p>' +
            '<form data-price-alert="' + esc(p.sku) + '"><input type="email" placeholder="' + esc(t("email")) + '" required>' +
              '<button class="btn btn--sm" type="submit">' + esc(t("price_alert_cta")) + '</button></form>' +
          '</div>' +
          '<div class="pdp__meta"><dl>' +
            metaRows.map(function (r) { return "<dt>" + esc(r[0]) + "</dt><dd>" + esc(r[1]) + "</dd>"; }).join("") +
          '</dl></div>' +
        '</div>' +
      '</div>' +
      persoRail("rec-related", t("you_may")) +
    '</div>';
  }
  function saveButtonInlineHTML(sku) {
    var saved = isSaved(sku);
    return '<button class="btn btn--ghost btn--block" data-toggle-saved="' + esc(sku) + '">' +
      esc(saved ? t("unsave_trip") : t("save_trip")) + '</button>';
  }

  function viewSearch(params) {
    var kw = (params.q || "").trim().toLowerCase();
    var list = TRIPS.filter(function (p) {
      if (params.airport && p.departureAirports.indexOf(params.airport) < 0) return false;
      if (!kw) return true;
      return name(p).toLowerCase().indexOf(kw) >= 0 || p.destination.toLowerCase().indexOf(kw) >= 0 ||
        p.country.toLowerCase().indexOf(kw) >= 0 || p.hotel.toLowerCase().indexOf(kw) >= 0 ||
        p.tags.some(function (tag) { return tag.indexOf(kw) >= 0; });
    }).sort(function (a, b) { return b.popularity - a.popularity; });
    return '<div class="wrap">' +
      '<nav class="breadcrumb"><a href="#/">Travler</a> / ' + esc(t("search")) + '</nav>' +
      '<h1 class="page-title">' + esc(t("search")) + (params.q ? ': "' + esc(params.q) + '"' : "") + '</h1>' +
      '<p class="eyebrow">' + esc(list.length === 1 ? t("results_one", { n: 1 }) : t("results_many", { n: list.length })) + '</p>' +
      '<div style="margin-top:var(--space-6)">' + gridHTML(list) + '</div>' +
    '</div>';
  }

  /* ---------------- Booking flow (checkout) ---------------- */
  function stepsHTML(current) {
    var labels = [t("step1"), t("step2"), t("step3"), t("step4"), t("step5")];
    return '<div class="steps">' + labels.map(function (label, i) {
      var n = i + 1, cls = n === current ? " is-active" : (n < current ? " is-done" : "");
      return '<span class="step' + cls + '"><span class="step__n">' + n + '</span>' + esc(label) + '</span>';
    }).join("") + '</div>';
  }
  function tripLinesSummaryHTML() {
    return state.cart.filter(function (l) { return l.kind === "trip"; }).map(function (l) {
      var p = BY_SKU[l.id];
      return '<div class="trip-summary">' + imgWithFallback(p.image, p, "", name(p), ' style="width:96px;height:96px;object-fit:cover;border-radius:var(--r-sm)"') +
        '<div><div class="line__meta">' + esc(p.destination) + ', ' + esc(p.country) + ' · ' + esc(t("nights_label", { n: p.nights })) + '</div>' +
        '<div class="line__name" style="font-size:var(--text-base)">' + esc(name(p)) + '</div>' +
        '<div class="money">' + esc(money(effectivePrice(p))) + ' ' + esc(t("pp")) + '</div></div></div>';
    }).join("");
  }
  function summaryAsideHTML() {
    var lines = state.cart.map(function (l) {
      if (l.kind === "addon") { var a = BY_ADDON[l.id]; return { name: addonName(a), price: a.price_eur, img: null }; }
      var p = BY_SKU[l.id]; return { name: name(p), price: effectivePrice(p) * l.qty, img: p.image, p: p };
    });
    return '<aside class="summary">' +
      '<h3 style="margin-bottom:var(--space-4)">' + esc(t("order_summary")) + '</h3>' +
      lines.map(function (l) {
        return '<div class="line">' + (l.img ? imgWithFallback(l.img, l.p, "", l.name, ' style="width:52px;height:52px;object-fit:cover;border-radius:var(--r-sm)"') : '<span></span>') +
          '<div class="line__name">' + esc(l.name) + '</div><div class="money">' + esc(money(l.price)) + '</div></div>';
      }).join("") +
      '<div class="totals" style="margin-top:var(--space-4)"><span>' + esc(t("total")) + '</span><span class="money">' + esc(money(cartSubtotal())) + '</span></div>' +
    '</aside>';
  }
  function availableExtras() {
    var ids = {};
    state.cart.filter(function (l) { return l.kind === "trip"; }).forEach(function (l) {
      (BY_SKU[l.id].addonIds || []).forEach(function (id) { ids[id] = true; });
    });
    return Object.keys(ids).map(function (id) { return BY_ADDON[id]; }).filter(Boolean);
  }
  function viewCheckoutStep() {
    var step = state.checkoutStep;
    var leaveLink = '<p style="margin-top:var(--space-4)"><a class="linkbtn" href="#/" data-leave-checkout>' + esc(t("leave_checkout")) + '</a></p>';
    if (step === 1) {
      return '<div class="checkout"><div>' + tripLinesSummaryHTML() +
        '<div class="step-actions"><span></span><button class="btn" data-checkout-next>' + esc(t("next")) + '</button></div>' +
        leaveLink + '</div>' + summaryAsideHTML() + '</div>';
    }
    if (step === 2) {
      return '<div class="checkout"><div>' +
        '<h3 style="margin-bottom:var(--space-4)">' + esc(t("lead_traveller")) + '</h3>' +
        '<form data-traveller-form>' +
          '<div class="row2"><div class="field"><label>' + esc(t("first_name")) + '</label><input required></div>' +
            '<div class="field"><label>' + esc(t("last_name")) + '</label><input required></div></div>' +
          '<div class="field"><label>' + esc(t("email")) + '</label><input type="email" required value="' + esc(getKnownEmail()) + '"></div>' +
          '<div class="field"><label>' + esc(t("num_travellers")) + '</label>' +
            '<select><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select></div>' +
          '<div class="step-actions"><button type="button" class="btn btn--ghost" data-checkout-back>' + esc(t("back")) + '</button>' +
            '<button class="btn" type="submit">' + esc(t("continue_to_extras")) + '</button></div>' +
        '</form>' + leaveLink + '</div>' + summaryAsideHTML() + '</div>';
    }
    if (step === 3) {
      var extras = availableExtras();
      return '<div class="checkout"><div>' +
        '<h3 style="margin-bottom:var(--space-2)">' + esc(t("extras_title")) + '</h3>' +
        '<p class="eyebrow" style="margin-bottom:var(--space-4)">' + esc(t("extras_sub")) + '</p>' +
        '<div class="addon-list">' + extras.map(function (a) {
          var added = findLine("addon", a.id) >= 0;
          return '<div class="addon-row"><div class="addon-row__info"><div class="addon-row__name">' + esc(addonName(a)) + '</div>' +
            '<div class="addon-row__type">' + esc(a.type) + '</div></div>' +
            '<div class="money">' + esc(money(a.price_eur)) + '</div>' +
            '<button class="btn btn--sm' + (added ? " btn--ghost" : "") + '" data-add-extra="' + esc(a.id) + '"' + (added ? " disabled" : "") + '>' +
            esc(added ? t("added") : t("add_extra")) + '</button></div>';
        }).join("") + '</div>' +
        '<div class="perso-slot" data-activate="checkout-crosssell" aria-label="' + esc(t("crosssell")) + '"></div>' +
        '<div class="step-actions"><button type="button" class="btn btn--ghost" data-checkout-back>' + esc(t("back")) + '</button>' +
          '<button class="btn" data-checkout-next>' + esc(t("next")) + '</button></div>' +
        leaveLink + '</div>' + summaryAsideHTML() + '</div>';
    }
    // step 4 — review
    return '<div class="checkout"><div>' +
      '<h3 style="margin-bottom:var(--space-4)">' + esc(t("review_title")) + '</h3>' +
      tripLinesSummaryHTML() +
      '<div class="step-actions"><button type="button" class="btn btn--ghost" data-checkout-back>' + esc(t("back")) + '</button>' +
        '<button class="btn" data-complete-booking>' + esc(t("complete_booking")) + '</button></div>' +
      leaveLink + '</div>' + summaryAsideHTML() + '</div>';
  }
  function viewCheckout() {
    if (!state.cart.length) { location.hash = "#/"; return ""; }
    return '<div class="wrap"><h1 class="page-title">' + esc(t("your_basket")) + '</h1>' +
      stepsHTML(state.checkoutStep) + '<div id="checkout-step">' + viewCheckoutStep() + '</div></div>';
  }
  function renderCheckoutStepOnly() {
    var el = document.getElementById("checkout-step");
    if (el) el.innerHTML = viewCheckoutStep();
    var stepsEl = document.querySelector(".steps");
    if (stepsEl) stepsEl.outerHTML = stepsHTML(state.checkoutStep);
  }
  function goToCheckoutStep(n) {
    state.checkoutStep = n;
    if (n === 4 && !state.prePurchaseFired) {
      state.prePurchaseFired = true;
      var order = buildOrder();
      trackPrePurchase(order);
    }
    renderCheckoutStepOnly();
  }
  function buildOrder(email) {
    return {
      orderid: "TRV-" + Date.now().toString(36).toUpperCase() + "-" + Math.floor(Math.random() * 1e4),
      products: basketProducts(),
      total: round2(cartSubtotal()),
      email: email || getKnownEmail() || "",
      checkin: state.lastSearch && state.lastSearch.checkin ? state.lastSearch.checkin : undefined
    };
  }
  function viewConfirmation() {
    var order = state.lastOrder;
    if (!order) { location.hash = "#/"; return ""; }
    trackPurchase(order);
    var n = order.orderid;
    state.cart = []; state.lastOrder = null; state.checkoutEntered = false; state.checkoutStep = 1; state.prePurchaseFired = false;
    persist(); renderChrome();
    return '<div class="wrap"><div class="confirm">' +
      '<div class="tick">✓</div>' +
      '<h1 style="font-size:var(--text-xl)">' + esc(t("placed_title")) + '</h1>' +
      '<p style="color:var(--ink-soft);margin:var(--space-4) 0">' + esc(t("placed_sub")) + '</p>' +
      '<p class="eyebrow">' + esc(t("booking_no")) + " " + esc(n) + '</p>' +
      '<p style="margin-top:var(--space-6)"><a class="btn" href="#/">' + esc(t("back_home")) + '</a></p>' +
    '</div></div>';
  }

  /* ---------------- Chrome (header + drawer + footer) ---------------- */
  function monogramSVG() {
    return '<svg viewBox="0 0 40 40" width="30" height="30" aria-hidden="true">' +
      '<rect x="1.5" y="1.5" width="37" height="37" rx="12" fill="var(--navy)"/>' +
      '<path d="M20 9c-5.2 0-9 3.9-9 8.7 0 6.1 9 13.3 9 13.3s9-7.2 9-13.3C29 12.9 25.2 9 20 9z" ' +
        'fill="none" stroke="var(--accent)" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<circle cx="20" cy="17.6" r="3" fill="none" stroke="var(--paper)" stroke-width="2.2"/></svg>';
  }
  function renderChrome() {
    var hash = location.hash || "#/";
    function active(h) { return hash.indexOf(h) === 0 ? " is-active" : ""; }
    document.getElementById("hdr").innerHTML =
      '<div class="wrap"><div class="hdr__row">' +
        '<a class="brand" href="#/" aria-label="Travler home">' + monogramSVG() + '<span class="wm">Travler</span></a>' +
        '<nav class="nav">' +
          '<a href="#/c/beach-holidays" class="' + active("#/c/beach-holidays").trim() + '">' + esc(t("nav_beach")) + '</a>' +
          '<a href="#/c/city-breaks" class="' + active("#/c/city-breaks").trim() + '">' + esc(t("nav_city")) + '</a>' +
          '<a href="#/c/all-inclusive" class="' + active("#/c/all-inclusive").trim() + '">' + esc(t("nav_allinclusive")) + '</a>' +
          '<a href="#/c/family-holidays" class="' + active("#/c/family-holidays").trim() + '">' + esc(t("nav_family")) + '</a>' +
          '<a href="#/c/last-minute" class="is-lastminute' + active("#/c/last-minute") + '">' + esc(t("nav_lastminute")) + '</a>' +
          '<a href="#/c/luxury-escapes" class="' + active("#/c/luxury-escapes").trim() + '">' + esc(t("nav_luxury")) + '</a>' +
          '<a href="#/saved" class="' + active("#/saved").trim() + '">' + esc(t("nav_saved")) + '</a>' +
        '</nav>' +
        '<div class="hdr__actions">' +
          '<div class="lang">' +
            '<button data-lang="en" class="' + (state.lang === "en" ? "is-active" : "") + '">EN</button>' +
            '<button data-lang="nl" class="' + (state.lang === "nl" ? "is-active" : "") + '">NL</button>' +
          '</div>' +
          '<a class="icon-btn search-btn" href="#/" data-scroll-search aria-label="' + esc(t("search")) + '">' +
            '<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M20 20l-5-5"/></svg>' +
          '</a>' +
          '<a class="icon-btn' + (state.saved.length ? " is-saved" : "") + '" href="#/saved" aria-label="' + esc(t("nav_saved")) + '">' +
            '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.35-9.5-8.8C1 8 2.4 4.5 6 4.5c2 0 3.4 1.1 6 3.7 2.6-2.6 4-3.7 6-3.7 3.6 0 5 3.5 3.5 6.7C19 15.65 12 20 12 20z"/></svg>' +
            (state.saved.length ? '<span class="count">' + state.saved.length + "</span>" : "") +
          '</a>' +
          '<button class="icon-btn cart-btn" data-open-cart aria-label="' + esc(t("basket")) + '">' +
            '<svg viewBox="0 0 24 24"><path d="M6 7h12l-1 13H7L6 7z"/><path d="M9 7a3 3 0 0 1 6 0"/></svg>' +
            (cartCount() ? '<span class="count">' + cartCount() + "</span>" : "") +
          '</button>' +
          '<a class="icon-btn account-btn" href="#/" aria-label="My Travler">' +
            '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M4.5 20c1.5-4 4.5-6 7.5-6s6 2 7.5 6"/></svg>' +
          '</a>' +
        '</div>' +
      '</div></div>';
  }
  function renderFooter() {
    document.getElementById("ftr").innerHTML = '<div class="wrap"><div class="ftr__cols">' +
      '<div class="ftr__brand"><span class="wm">Travler</span>' +
        '<p style="margin-top:var(--space-3);max-width:32ch">' + esc(t("hero_sub")) + '</p></div>' +
      '<div><h4>' + esc(t("ft_holidaytypes")) + '</h4>' +
        CATEGORY_SLUGS.concat(["last-minute"]).map(function (slug) {
          return '<a href="#/c/' + slug + '">' + esc(categoryLabel(slug)) + '</a>';
        }).join("") + '<a href="#/c/all">' + esc(t("ft_alltrips")) + '</a></div>' +
      '<div><h4>' + esc(t("ft_help")) + '</h4>' +
        '<a href="#/">' + esc(t("ft_beforeyougo")) + '</a><a href="#/">' + esc(t("ft_cancellations")) + '</a>' +
        '<a href="#/">' + esc(t("ft_faq")) + '</a><a href="#/">' + esc(t("ft_contact")) + '</a></div>' +
      '<div><h4>' + esc(t("ft_about")) + '</h4>' +
        '<a href="#/">' + esc(t("ft_story")) + '</a>' +
        '<a href="#/">' + esc(t("ft_sustainability")) + '</a>' +
        '<a href="#" data-cc="open">' + esc(t("ft_cookies")) + '</a></div>' +
      '</div>' +
      '<div class="devnote">Travler — demo storefront for Spotler Activate. Static build; no personalisation, payments or bookings are real. Containers marked <code>data-activate</code> are populated by Activate at runtime.</div>' +
    '</div>';
  }

  /* ---------------- Router ---------------- */
  function parseHash() {
    var raw = (location.hash || "#/").replace(/^#/, "");
    var qIndex = raw.indexOf("?");
    var path = qIndex >= 0 ? raw.slice(0, qIndex) : raw;
    var query = qIndex >= 0 ? raw.slice(qIndex + 1) : "";
    var parts = path.split("/").filter(Boolean);
    var params = {};
    query.split("&").filter(Boolean).forEach(function (kv) {
      var i = kv.indexOf("=");
      var k = decodeURIComponent(i >= 0 ? kv.slice(0, i) : kv);
      var v = i >= 0 ? decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " ")) : "";
      params[k] = v;
    });
    return { parts: parts, params: params };
  }
  function render() {
    var r = parseHash(), parts = r.parts, params = r.params;
    var html, app = document.getElementById("app");
    if (parts[0] === "c" && parts[1]) html = viewListing(parts[1]);
    else if (parts[0] === "product" && parts[1]) html = viewProduct(parts[1]);
    else if (parts[0] === "search") html = viewSearch(params);
    else if (parts[0] === "saved") html = viewSaved();
    else if (parts[0] === "checkout") {
      if (!state.checkoutEntered) { state.checkoutEntered = true; state.checkoutStep = 1; state.prePurchaseFired = false; }
      html = viewCheckout();
      if (state.cart.length) trackInitiateCheckout();
    }
    else if (parts[0] === "confirmation") html = viewConfirmation();
    else { html = viewHome(); state.checkoutEntered = false; }
    app.innerHTML = html;
    renderChrome();
    window.scrollTo(0, 0);
    applyConsent(false);
    trackPageView();
    if (parts[0] === "product" && BY_SKU[parts[1]]) { trackViewContent(BY_SKU[parts[1]]); noteRecentlyViewed(parts[1]); }
    else if (parts[0] === "c" && parts[1] && parts[1] !== "all") trackViewCategory(parts[1]);
    else if (parts[0] === "search") {
      state.lastSearch = { keyword: params.q || "", checkin: params.checkin || "", nights: params.nights || "", airport: params.airport || "" };
      trackSearch(state.lastSearch);
    }
    document.dispatchEvent(new CustomEvent("travler:view", { detail: { route: parts, lang: state.lang } }));
    if (!sqzlBooted) { sqzlBooted = true; }
    else { sqzlPush({ event: "PageReload" }); }
  }

  /* ---------------- Events (delegated) ---------------- */
  document.addEventListener("click", function (e) {
    var el = e.target.closest("[data-start-booking],[data-toggle-saved],[data-cc],[data-open-cart],[data-close-cart],[data-lang]," +
      "[data-remove-line],[data-go-checkout],[data-remove-filter],[data-clear],[data-checkout-next],[data-checkout-back]," +
      "[data-add-extra],[data-complete-booking],[data-leave-checkout],[data-scroll-search]");
    if (!el) return;
    if (el.hasAttribute("data-scroll-search")) {
      var anchor = document.getElementById("searchmod-anchor");
      if (anchor) { e.preventDefault(); anchor.scrollIntoView({ behavior: "smooth", block: "start" }); }
      // else: not on the home page — let the href="#/" navigation happen normally.
      return;
    }
    if (el.hasAttribute("data-cc")) {
      e.preventDefault();
      var act = el.getAttribute("data-cc");
      if (act === "accept") decideConsent(true, true);
      else if (act === "reject") decideConsent(false, false);
      else if (act === "prefs") renderConsent({ open: true, prefs: true });
      else if (act === "open") renderConsent({ open: true, prefs: true });
      else if (act === "save") {
        var box = el.closest(".cc");
        var a = box && box.querySelector('[data-cc-cat="analytics"]');
        var m = box && box.querySelector('[data-cc-cat="marketing"]');
        decideConsent(a ? a.checked : false, m ? m.checked : false);
      }
      return;
    }
    if (el.hasAttribute("data-start-booking")) {
      e.preventDefault();
      addTripToBasket(el.getAttribute("data-start-booking"));
      location.hash = "#/checkout";
      return;
    }
    if (el.hasAttribute("data-toggle-saved")) {
      e.preventDefault();
      toggleSaved(el.getAttribute("data-toggle-saved"));
      render();
      return;
    }
    if (el.hasAttribute("data-open-cart")) { e.preventDefault(); renderDrawer(); openDrawer(); return; }
    if (el.hasAttribute("data-close-cart")) { closeDrawer(); return; }
    if (el.hasAttribute("data-lang")) { state.lang = el.getAttribute("data-lang"); persist(); render(); renderDrawer(); renderFooter(); renderConsent(); return; }
    if (el.hasAttribute("data-remove-line")) { removeLineAt(+el.getAttribute("data-remove-line")); return; }
    if (el.hasAttribute("data-go-checkout")) { closeDrawer(); return; }
    if (el.hasAttribute("data-leave-checkout")) { state.checkoutEntered = false; return; }
    if (el.hasAttribute("data-checkout-next")) { goToCheckoutStep(Math.min(4, state.checkoutStep + 1)); return; }
    if (el.hasAttribute("data-checkout-back")) { goToCheckoutStep(Math.max(1, state.checkoutStep - 1)); return; }
    if (el.hasAttribute("data-add-extra")) {
      addAddonToBasket(el.getAttribute("data-add-extra"));
      renderCheckoutStepOnly();
      return;
    }
    if (el.hasAttribute("data-complete-booking")) {
      var order = buildOrder();
      state.lastOrder = order;
      persist();
      location.hash = "#/confirmation";
      return;
    }
    if (el.hasAttribute("data-remove-filter")) {
      var g = el.getAttribute("data-remove-filter"), v = el.getAttribute("data-val");
      if (g === "rating") listingFilters.rating = "";
      else if (g === "family") listingFilters.family = "";
      else if (g === "price") listingFilters.price = "";
      else if (g === "duration") listingFilters.duration = "";
      else if (listingFilters[g]) listingFilters[g] = listingFilters[g].filter(function (x) { return x !== v; });
      render();
      return;
    }
    if (el.hasAttribute("data-clear")) { listingFilters = defaultFilters(listingFilters.view); render(); return; }
  });

  document.addEventListener("change", function (e) {
    var el = e.target;
    if (el.matches("[data-filter]")) {
      var g = el.getAttribute("data-filter"), v = el.value;
      var arr = listingFilters[g];
      if (el.checked) { if (arr.indexOf(v) < 0) arr.push(v); }
      else { var i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); }
      render();
    } else if (el.matches("[data-radiofilter]")) {
      listingFilters[el.getAttribute("data-radiofilter")] = el.value; render();
    } else if (el.matches("[data-sort]")) { listingFilters.sort = el.value; render(); }
  });

  document.addEventListener("submit", function (e) {
    if (e.target.matches("[data-search-form]")) {
      e.preventDefault();
      var f = new FormData(e.target);
      var q = { q: (f.get("q") || "").trim(), airport: f.get("airport") || "", checkin: f.get("checkin") || "", nights: f.get("nights") || "" };
      var parts = ["#/search"];
      var qs = Object.keys(q).filter(function (k) { return q[k]; }).map(function (k) { return k + "=" + encodeURIComponent(q[k]); }).join("&");
      location.hash = "#/search" + (qs ? "?" + qs : "");
    }
    else if (e.target.matches("[data-signup]")) {
      e.preventDefault();
      var emailInput = e.target.querySelector('input[type="email"]');
      var email = emailInput ? emailInput.value.trim() : "";
      if (email) trackEmailOptIn(email);
      e.target.reset(); e.target.querySelector("button").textContent = "✓";
    }
    else if (e.target.matches("[data-price-alert]")) {
      e.preventDefault();
      var sku = e.target.getAttribute("data-price-alert");
      var pe = e.target.querySelector('input[type="email"]');
      var pemail = pe ? pe.value.trim() : "";
      if (pemail) trackEmailOptIn(pemail, { trigger: "price_alert", product: { id: sku } });
      e.target.innerHTML = '<p>✓</p>';
    }
    else if (e.target.matches("[data-avail-alert]")) {
      e.preventDefault();
      var asku = e.target.getAttribute("data-avail-alert");
      var ae = e.target.querySelector('input[type="email"]');
      var aemail = ae ? ae.value.trim() : "";
      if (aemail && BY_SKU[asku]) trackAvailabilityAlert(aemail, BY_SKU[asku]);
      e.target.innerHTML = '<p>✓</p>';
    }
    else if (e.target.matches("[data-traveller-form]")) {
      e.preventDefault();
      var temail = e.target.querySelector('input[type="email"]');
      if (temail && temail.value.trim()) setKnownEmail(temail.value.trim());
      goToCheckoutStep(3);
    }
  });
  document.getElementById("scrim").addEventListener("click", closeDrawer);
  window.addEventListener("hashchange", render);

  /* ---------------- Boot ---------------- */
  trackUserId(); // seed Squeezely identity before the first page event
  renderChrome(); renderFooter(); renderDrawer(); renderConsent(); render();
})();
