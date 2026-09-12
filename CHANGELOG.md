# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.20.2] - 2026-09-12

### Added
- **Dynamic Contact Page Title & Subtitle from Backend (`Contact.tsx`, `queries.ts`)**: Integrated GraphQL `pageBySlug` query to dynamically load page title and intro description from the backend CMS `Page` model (`slug: 'contacto'` / `'contact'`) with DOM parsing to cleanly extract subtitle text without duplicate headers.
- **Robust i18n Fallback**: Seamlessly falls back to local translation keys (`contact.title` and `contact.intro`) when backend records are loading, empty, or unavailable.

## [0.20.1] - 2026-09-12

### Added
- **Interactive Google Maps Branch Address Link (`CafeDetail.tsx`, `cafes.css`)**: Converted static address badge into a tactile Apple pill link (`.apple-address-pill`) that opens Google Maps in a new tab with location pin icon and external link arrow.
- **Smart Fallback Search Resolver**: If `google_maps_url` is not set or contains an iframe embed, dynamically constructs a query URL targeting `[cafe name, branch name, address, comuna/city]` on Google Maps.
- **i18n Localization**: Added `open_in_maps` translation key in `es` and `en`.

## [0.20.0] - 2026-09-12

### Added
- **Apple HIG Branch Selector Pop-Up Dropdown (`CafeDetail.tsx`, `cafes.css`)**: Replaced overflowing and overlapping branch tabs with an Apple Pop-Up Dropdown selector (`.apple-branch-picker-btn`, `.apple-branch-dropdown-menu`).
- **Tactile Branch Stepper Navigation**: Added quick previous/next branch chevron buttons (`.apple-branch-step-btn`) allowing 1-tap switching between branches without opening the menu.
- **Rich Branch List Items**: Dropdown menu displays each branch with optical icon, location name, address, and selected checkmark state with smooth scroll for large branch lists.
- **Adaptive Responsive Layout**: Automatically activates the compact Dropdown on mobile viewports for all branch counts, and on desktop whenever a cafe has more than 3 branches. For <= 3 branches on desktop, tabs use non-overlapping flex bounds (`flex: 1 1 0`, `min-width: 0`, `text-truncate`).
- **i18n Localization**: Added keys `select_branch`, `prev_branch`, and `next_branch` in `es` and `en`.

### Fixed
- Fixed visual overlap and text clipping occurring in cafe branch tabs when cafes have many branches or long address labels.

## [0.19.0] - 2026-09-12

### Added
- **Apple HIG Edit Profile Experience (`EditProfile.tsx`, `edit-profile.css`)**: Completely redesigned the profile editor into a macOS/iOS System Settings inspector using Apple Human Interface Guidelines (HIG 2026).
- **Apple Segmented Inspector Navigation**: Implemented a responsive horizontal segmented bar (`.edit-profile-segmented`) organizing settings into clean tabs: *General*, *Creador*, *Enlaces*, *Etiquetas*, and *Seguridad*.
- **Editorial Hero Header**: Added return pill link (`.edit-profile-back-link`) to public profile, kicker badge (`.edit-profile-kicker`), Large Title, and quick profile link.
- **Continuous Squircle Avatar Preview**: Added an 84px squircle avatar box with optical borders, camera section plate, and integrated frosted FilePond drop zone.
- **Section Headers with Optical Icon Plates**: 36px squircle plates (`.edit-profile-icon-plate`) in Apple functional gradients (blue, teal, orange, purple, rose, indigo, emerald) for rapid visual scanning.
- **Apple Styled Inputs & Switches**: Replaced default Bootstrap form controls with `.apple-input`, `.apple-select`, and `.apple-textarea` featuring continuous squircles, 48px touch targets, focus glow rings, and Apple toggles.
- **Interactive Card Customization Live Preview**: Added real-time simulated creator card (`.apple-card-live-preview`) reflecting background color, opacity slider, dynamic text luminance contrast, and sample badges.
- **Tactile Link Management**: Redesigned link items with squircle cards, optical platform icon picker, age-gate (+18) checkbox, and 44pt tactile destructive delete buttons.
- **Apple Tag Pills**: Designed `.apple-tag-pill` with icon support, active solid tinting, fixed tag indicators, search filter, and zero outline buttons.
- **Apple Destructive Danger Zone & Modal**: Enclosed account deletion in an isolated `.apple-danger-zone-card` with 48px solid red action and frosted confirmation modal.
- **i18n Localization**: Added keys in `es/translation.json` and `en/translation.json` for new tabs, titles, and avatar sections.

### Changed
- Replaced monolithic 800+ lines scrolling form and default Bootstrap cards/alerts with modular Apple Liquid Glass cards and 100% solid tactile buttons (zero outline buttons).

## [0.18.0] - 2026-09-12

### Added
- **Apple Liquid Glass Offcanvas Sheet Navigation**: Completely redesigned the user profile slide-over sheet (`Navigation.tsx`, `offcanvas.css`) following Apple Human Interface Guidelines (HIG 2026).
- **User Identity Hero Card**: Added an elevated squircle profile card (`.apple-offcanvas-user-card`) linking to `/u/:username` with squircle avatar, verified badge, handle, and dynamic role pills (`VIP`, `Creador`, `Staff`).
- **Inset Grouped Navigation Lists**: Structured navigation into iOS Settings-style inset grouped cards (`.apple-offcanvas-inset-group`) with 32px optical icon plates (`.apple-offcanvas-icon-plate`) in functional Apple gradients (blue, teal, purple, rose, orange, slate, emerald, indigo).
- **Comprehensive Account & Management Links**: Added direct navigation items for "Mi Perfil", "Editar Perfil", "Mis Galerías", "Nueva Galería", "Notificaciones" (with unread count badge), "Panel Admin" (staff only), and "Tickets de Soporte".
- **System Preferences Rows**: Embedded Language switcher and Theme switcher as native inset group rows (`.apple-offcanvas-pref-row`) with Apple capsule dropdown styling.
- **Solid Tactile Logout Button**: Replaced legacy `outline-danger` button with 100% solid, tactile Apple destructive action button (`.apple-offcanvas-logout-btn`) meeting ≥ 44pt touch targets with active scale feedback.
- **Capsule User Pill Trigger**: Replaced bare text navbar triggers with `.apple-nav-user-pill` featuring a 28px mini-avatar squircle, user name, and subtle chevron for desktop and mobile viewports.
- **i18n Localization**: Added internationalization keys in `es` and `en` for new offcanvas sections, actions, and roles.

### Changed
- Replaced plain text drawer links and generic Bootstrap Offcanvas styles with high-craft translucent Liquid Glass (`blur(28px) saturate(180%)`), 28px corner squircles, and frosted circular close button.

## [0.17.1] - 2026-09-12

### Security
- **Email Privacy Protection**: Added permission-check resolver to `UserType.php` for `email` and `email_verified_at` fields. Email addresses are now strictly restricted to the user themselves or staff (`super_admin`, `admin`, `moderator`), blocking public scraping.
- **Support Ticket Authorization**: Enforced viewer ownership and role checks on `TicketQuery` and `TicketsQuery`. Guests and unauthorized users can no longer read other users' support tickets or access full ticket listings.
- **Support Ticket Impersonation Prevention**: Hardened `CreateTicketMutation` to require an authenticated session and verify `user_id` matches the caller (preventing forging tickets on behalf of others). Added rate limiting of 5 tickets/hour per user.
- **Staff Internal Comments Isolation**: Filtered `is_internal` comments and comments count in `TicketType.php` so staff notes are completely hidden from regular users.

### Fixed
- **Default GraphQL Schema Alignment**: Registered `TicketQuery`, `TicketsQuery`, and `CreateTicketMutation` in `default` schema in `config/graphql.php` so authenticated SPA queries work consistently on both endpoints.
- **Backend Test Suite**: Added `TicketsGraphqlTest.php` covering authorization, isolation, staff comments privacy, ticket creation rules, and email masking (24 passing assertions across 6 test suites).

## [0.17.0] - 2026-09-12

### Added
- Implemented high-fidelity Apple HIG skeleton preloader system matching 1:1 real component geometries with smooth hardware-accelerated light reflection shimmer (`apple-skeleton-shimmer`).
- Created 1:1 `UserCardSkeleton` in `UsersGrid.tsx` preserving exact squircle card curvature, avatar diameter, handle line, 2-line bio width, meta pills row (country, age, gender, price), tags row, and full-width CTA pill button to achieve zero Cumulative Layout Shift (CLS: 0).
- Integrated `UsersGrid` skeletons into `Home.tsx` (VIP creators), `Explore.tsx`, and `Tag.tsx`, replacing generic spinners with structured preloaded cards.
- Designed faithful skeleton grid for `FeaturedGalleries.tsx` matching cover image, title line, author chip, and like button metrics.
- Designed faithful tag cloud skeletons for `PopularTags.tsx` matching pill geometries and realistic varied widths.
- Designed faithful cafe card skeletons for `CafesWithReviews.tsx` matching image cover, rating pill, branch count, and review badges.
- Designed faithful creator hero and gallery card skeletons for `UserGalleries.tsx` and `GalleryDetail.tsx`.
- Designed faithful profile card skeleton for `UserProfile.tsx` matching avatar 150px, handle, bio, actions, counters, and links list.
- Upgraded `OptimizedImage.tsx` to use dark/light adaptive Apple shimmer instead of static grey Bootstrap placeholders.

### Changed
- Replaced mismatched Bootstrap `Placeholder` wave animations and spinners across home, explorer, tags, galleries, profile, and cafes with authentic Apple HIG shimmer skeletons.

## [0.16.0] - 2026-09-12

### Added
- Redesigned User Galleries directory (`UserGalleries.tsx` at `/u/:username/galleries`) and Gallery Detail viewer (`GalleryDetail.tsx` at `/galleries/:id`) under Apple Human Interface Guidelines (HIG 2026).
- Enhanced `galleries.css` with Apple Liquid Glass empty states (`.galleries-empty-card`) featuring frosted halos, clear messaging, and solid CTA buttons for empty search and empty creator states.
- Added Apple Liquid Glass error cards (`.gallery-error-card`) with error halos, retry actions, and direct navigation.
- Created tactile Apple HIG return navigation (`.gallery-back-link`) with squircle geometry and touch target heights ≥ 44pt.
- Redesigned search bar with 48px height, optical search icon, and smooth clear button with touch target compliance.
- Upgraded gallery cards (`.gallery-apple-card`) with 24px continuous squircles, hover micro-interactions, Liquid Glass visibility badges, and image lazy loading.
- Redesigned gallery detail header card (`.gallery-detail-header-card`) with author chip, photo counter, and solid tactile edit/back buttons (zero outline buttons).
- Added i18n support strings in `es` and `en` for empty states, clear search, and creator collections.

### Changed
- Replaced legacy Bootstrap alerts and undersized 36px buttons with Apple HIG squircle cards and 100% solid tactile buttons (≥ 44pt touch targets).

## [0.15.0] - 2026-09-12

### Added
- Redesigned Tag Explorer page (`Tag.tsx` at `/t/:tag`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `tag.css` featuring Apple Liquid Glass filter bar (`.tag-filters-card`), continuous squircle corners (`var(--rounded-2xl)`), and elevated shadows.
- Designed Apple editorial Hero section with kicker badge (`.tag-kicker`), Large Title typography, and glowing Liquid Glass `#tag` pill (`.tag-hero-pill`).
- Added responsive Liquid Glass filter controls with optical icons: Min/Max Price (`fa-dollar-sign`), Gender (`fa-venus-mars`), Country (`fa-globe`), and 100% solid reset button (`.tag-filter-reset-btn`) with touch targets ≥ 44pt (48px).
- Implemented Apple HIG empty state card (`.tag-empty-card`) with luminous frosted halo, clear messaging, and solid CTA back to `/explorar`.
- Integrated fluid Apple motion curves (`fadeIn`, `defaultTransition`, `appleEase`) from `motion/react`.
- Added complete i18n support strings in `es` and `en` for tag explorer kicker, subtitles, filters, and empty states.

### Changed
- Replaced legacy Bootstrap form controls and outline buttons with Apple HIG squircle inputs and 100% solid tactile buttons (zero outline buttons).

## [0.14.0] - 2026-09-12

### Added
- Redesigned Help & Support Tickets module (`Tickets.tsx`, `NewTicket.tsx`, `TicketDetail.tsx`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `tickets.css` featuring Apple Liquid Glass cards (`.ticket-apple-card`, 20px squircle), `--shadow-card` elevation, and hover transitions.
- Replaced legacy Bootstrap HTML tables with responsive Apple HIG card lists with status pills (`.ticket-status-pill`), priority pills (`.ticket-priority-pill`), category badges, and solid view action buttons.
- Redesigned ticket creation form (`NewTicket.tsx`) with 48px touch targets, optical icons (`.ticket-input-icon`), and 100% solid submission buttons.
- Redesigned ticket detail and conversation thread (`TicketDetail.tsx`) featuring discussion bubble cards, comment timeline, and glassmorphic ticket metadata sidebar.
- Added Apple HIG empty state card (`.tickets-empty-card`) with support headset icon and direct solid CTA.
- Added i18n support strings in `es` and `en` for ticket kicker, subtitle, creation flow, and discussion threads.

### Changed
- Replaced all outline buttons across the tickets module with 100% solid tactile buttons (`.tickets-new-btn`, `.ticket-submit-btn`, `.ticket-view-btn`).

## [0.13.0] - 2026-09-12

### Added
- Redesigned Notifications page (`Notifications.tsx` at `/notificaciones`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `notifications.css` featuring Apple Liquid Glass cards (`.notif-apple-card`, 20px squircle), `--shadow-card` elevation and unread indicator accents.
- Implemented Apple HIG Segmented Control (`.notif-segmented-nav`, `.notif-segment-btn`) for filtering notifications (Todas, Sin leer, VIP) with continuous pill geometry and touch targets ≥ 44pt.
- Added Apple editorial Hero section with kicker badge (`.notif-kicker`), Large Title hierarchy, and unread counter badge.
- Designed distinctive notification type halo badges (`.notif-type-badge`) with curated soft halos for follows, VIP messages, featured galleries, approvals, rejections, and system alerts.
- Added 100% solid "Marcar todas como leídas" button (`.notif-mark-all-btn`) and VIP reply button (`.notif-reply-btn`) with zero outline buttons.
- Redesigned VIP message reply modal into an authentic Apple Liquid Glass dialog (`.notif-modal-card`, 24px squircle, `blur(28px) saturate(160%)`) with 100% solid actions.
- Added Apple HIG empty state cards (`.notif-empty-card`) with frosted halos for each filter state.
- Added i18n support strings in `es` and `en` for notification kicker, subtitle, VIP filters, and reply actions.

### Changed
- Converted notifications feed and reply dialog from plain Bootstrap cards and modal into fluid Apple motion components (`motion/react`, `appleEase`).

## [0.12.0] - 2026-09-12

### Added
- Redesigned Age & Warning Modal (`WarningModal.tsx`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `warning-modal.css` featuring Apple Liquid Glass frosted veil (`.warning-modal-backdrop`, `blur(36px) saturate(180%)`) with full-screen coverage (`z-index: 100000`).
- Implemented immediate zero-leak content gating: when the age modal is enabled and unconfirmed, the frosted glass barrier activates immediately on mount, preventing any flash or leak of adult/creator content before age confirmation.
- Implemented persistent client-side cache and dismissal tracking in `localStorage` (`warning_modal_dismissed` and `warning_modal_cached_config`) alongside authenticated GraphQL dismissal sync (`mutation { dismissWarning }`).
- Designed Apple HIG squircle card (`.warning-modal-card`, 28px continuous squircle) with elevated 3D shadow and dynamic light reflection borders.
- Added glowing +18 age verification badge (`.warning-modal-badge`) with gradient amber/rose accents and security kicker (`.warning-modal-kicker`).
- Added legal/jurisdiction disclaimer callout (`.warning-modal-disclaimer`).
- Added 100% solid primary accept button (`.warning-modal-accept-btn`) and solid neutral cancel/exit button (`.warning-modal-cancel-btn`) with zero outline buttons.
- Added i18n support strings in `es` and `en` for age kicker, disclaimer, and exit CTAs.

### Changed
- Converted WarningModal from plain Bootstrap `<Modal>` into an authentic Apple Liquid Glass dialog with `motion/react` fluid transitions (`appleEase`).

## [0.11.0] - 2026-09-12

### Added
- Redesigned Suggest Café page (`SuggestCafe.tsx` at `/suggest-cafe`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `suggest.css` featuring Apple Liquid Glass squircle cards (`.suggest-apple-card`, 24px continuous squircle) with `--shadow-card` elevation.
- Added Apple editorial Hero section with kicker badge (`.suggest-kicker`), Large Title hierarchy, and high-contrast subtitle.
- Implemented Apple HIG notice callout (`.suggest-notice-callout`) for community moderation policies.
- Designed structured input layout with two-column responsive grouping for City & Address, Website & Maps with optical icon alignment.
- Added frosted squircle Altcha anti-spam container (`.suggest-altcha-wrapper`).
- Implemented Apple HIG success confirmation view (`.suggest-state-card`) with checkmark badge and solid navigation actions ("Sugerir otro café", "Explorar Cafés").
- Implemented Apple HIG authentication gate card with locked state and solid login/register action buttons.
- Added i18n support strings in `es` and `en` for suggest kicker, subtitle, placeholders, success state, and auth gate.

### Changed
- Converted suggestion submit button to 100% solid pill button (`.suggest-submit-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).

## [0.10.0] - 2026-09-12

### Added
- Redesigned Creator Ranking page (`Ranking.tsx` at `/ranking`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `ranking.css` featuring Apple Liquid Glass squircle cards (`.ranking-apple-card`, 24px continuous squircle) with `--shadow-card` elevation and hover depth.
- Implemented Apple HIG visual podium treatment for Top 3 creators:
  - #1 (Gold): Subtle warm golden aura, `.avatar-gold` halo, and crown position badge (`.badge-gold`).
  - #2 (Silver): Sleek silver gradient aura and position badge (`.badge-silver`).
  - #3 (Bronze): Warm bronze gradient aura and position badge (`.badge-bronze`).
  - #4 - #10: Clean Liquid Glass card with standard position pill (`.badge-standard`).
- Redesigned creator metrics row (`.ranking-stats-row`, `.ranking-stat-box`) with WCAG AAA high-contrast tokens for views, followers, and following.
- Added 100% solid profile access button (`.ranking-profile-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).
- Added i18n support strings in `es` and `en` for ranking kicker and view profile CTA.

### Fixed
- Fixed `.ranking-tag-pill` text contrast by adopting crisp high-contrast black (`#111827`) in light mode and white (`#ffffff`) in dark mode with subtle border styling.
- Enabled interactive navigation on ranking creator tags to `/t/:slug`.

## [0.9.1] - 2026-09-12

### Added
- Redesigned Login page (`Login.tsx` at `/login`) under Apple Human Interface Guidelines (HIG 2026).
- Extended modular stylesheet `auth.css` for login views with squircle Liquid Glass card (`.auth-apple-card`, 24px continuous squircle), ergonomic touch targets (≥ 44pt), and optical icon alignment for email (`fa-envelope`) and password (`fa-lock`).
- Added Apple editorial Hero section with kicker badge (`.auth-kicker`), Large Title hierarchy, and high-contrast typography.
- Added i18n support strings in `es` and `en` for login kicker and subtitle.

### Changed
- Converted login submit button to 100% solid pill button (`.auth-submit-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).

## [0.9.0] - 2026-09-12

### Added
- Redesigned Register page (`Register.tsx` at `/register`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `auth.css` featuring Apple Liquid Glass cards (`.auth-apple-card`, 24px continuous squircle), ergonomic input groups (≥ 44pt touch targets), and optical icon alignment.
- Added Apple editorial Hero section with kicker badge (`.auth-kicker`), Large Title hierarchy, and high-contrast typography.
- Designed structured input layout with two-column responsive grouping for gender, birth date, and password confirmation.
- Added frosted glass Altcha anti-spam container (`.auth-altcha-container`) and 256-bit SSL trust badge (`.auth-trust-badge`).
- Added i18n support strings in `es` and `en` for registration kicker, subtitle, and SSL security badge.

### Changed
- Converted registration submit button to 100% solid pill button (`.auth-submit-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).

## [0.8.1] - 2026-09-12

### Changed
- Refactored `Faq.tsx` to dynamically query and consume all FAQ titles, content, and answers directly from the Laravel backend (`App\Models\Page`) via GraphQL `page(slug: $slug)`, eliminating static client-side FAQ data arrays.
- Implemented client-side DOM parser in `Faq.tsx` to automatically transform backend rich HTML (`<h2>`, `<h3>`) into interactive Apple HIG squircle accordions with `appleEase` micro-animations while supporting fallback raw HTML rendering.
- Updated `PageSeeder.php` and refreshed Laravel database with structured HTML content for `preguntas-frecuentes` and `faqs`.

## [0.8.0] - 2026-09-12

### Added
- Redesigned Frequently Asked Questions module (`Faq.tsx` at `/preguntas-frecuentes` and `/faqs`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `faq.css` with squircle Liquid Glass cards (`.faq-apple-card`, 24px continuous squircle), real-time live search capsule (`.faq-search-input`), and categorized segmented control pills (`.faq-category-btn`).
- Implemented Apple HIG disclosure accordion rows with hairline dividers, optical category pills, and canonical `appleEase` cubic-bezier animated chevron rotation.
- Added contextual assistance card (`.faq-cta-card`) with direct communication channels and 100% solid buttons (`--shadow-primary-btn`, `--shadow-button`) to `/contacto` and `/tickets` (zero outline buttons).
- Added structured FAQ knowledge base covering platform overview, creators & VIP galleries, cafes directory & reviews, and 256-bit SSL security & Altcha anti-spam protection.
- Added i18n localization strings in `es` and `en` for all FAQ categories, search placeholders, and assistance actions.

## [0.7.0] - 2026-09-12

### Added
- Redesigned Contact page (`Contact.tsx` at `/contacto`) under Apple Human Interface Guidelines (HIG 2026).
- Created modular stylesheet `contact.css` with squircle Liquid Glass cards (`.contact-apple-card`, 24px continuous squircle), ergonomic input groups (≥ 44pt touch targets), and optical icon alignment.
- Added Apple editorial Hero section with kicker badge (`.contact-kicker`), Large Title hierarchy, and high-contrast typography.
- Added contextual Support & Assistance card (`.contact-info-card`) with response SLA indicator (< 24h), direct inquiry channel, and 256-bit SSL encrypted security badge.
- Added capsule character counter pill (`.contact-char-pill`) and glass-styled Altcha anti-spam container (`.contact-altcha-container`).
- Added i18n support strings in `es` and `en` for all contact page cards, channels, and security notes.

### Changed
- Converted contact submit button to 100% solid pill button (`.contact-submit-btn`) with elevated shadow (`--shadow-primary-btn`) and tactile active feedback (zero outline buttons).
- Enhanced form validation and status alerts with translucent squircle Apple banners (`.contact-status-alert`).

## [0.6.3] - 2026-09-12

### Changed
- Replaced all blue tones in link color scheme with dark, high-contrast monochrome tones:
  - Light mode: Configured `--link-color: #111827` (deep charcoal slate, contrast ratio 15.6:1 on white and 13.8:1 on warm cafe beige) with hover `#000000`.
  - Dark mode: Configured neutral `--link-color: #f3f4f6` (silver/white, 0% blue, contrast ratio 14.2:1) with hover `#ffffff`.
  - Updated `--color-link` in root tokens and removed blue utility classes from profile stats and link icons.

## [0.6.2] - 2026-09-11

### Fixed
- Fixed link visibility and contrast across all website backgrounds (cream/cafe gradients, white surfaces, translucent liquid glass, and dark theme):
  - Light mode: Defined `--link-color: #0052cc` and hover `--link-hover-color: #003380` (contrast ratio > 6.5:1 on white and > 5.8:1 on warm beige).
  - Dark mode: Defined vibrant `--link-color: #70b5ff` and hover `--link-hover-color: #bfe3ff` (contrast ratio > 9.0:1 on dark surfaces).
  - Synchronized `--bs-link-color` and `--bs-link-color-rgb` custom properties.
  - Implemented global link override in `base.css` with component exclusions to avoid affecting buttons, badges, navbars, and cards.
  - Enhanced creator handles in `galleries.css` to use high-contrast link tokens with underline hover.

## [0.6.1] - 2026-09-11

### Fixed
- Increased contrast and legibility of `--text-muted` and `.text-muted` to satisfy WCAG AA contrast standards:
  - Light mode: Changed from washed-out `#6c757d` to high-contrast `#374151` (contrast ratio > 8.5:1).
  - Dark mode: Changed from dim `#adb5bd` to crisp `#cbd5e1` (contrast ratio > 9:1).
  - Synchronized `--apple-glass-text-muted` and `--bs-secondary-color` with high-contrast tokens.
  - Added global override in `base.css` to ensure `.text-muted` renders with high contrast across both light and dark themes.

## [0.6.0] - 2026-09-11

### Added
- Redesigned Galleries module (`UserGalleries.tsx` at `/u/:username/galleries` and `GalleryDetail.tsx` at `/galleries/:id`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `galleries.css` with squircle cards (`.gallery-apple-card`), creator hero banner (`.gallery-creator-hero`), and Apple photo grid (`.apple-gallery-grid`).
- Implemented Apple Segmented Control in `UserGalleries.tsx` (`Perfil` | `Galerías`) for bidirectional navigation with `UserProfile.tsx`.
- Implemented Liquid Glass search capsule (`.gallery-search-bar`, `.gallery-search-input`) with touch targets ≥ 44pt.
- Implemented Apple Liquid Glass header card in `GalleryDetail.tsx` with author chip, metadata strip, and squircle photo grid with LightGallery support.

### Changed
- Replaced 100% of outline buttons (`btn-outline-*`, `variant="outline-*"`) across `GalleryDetail.tsx`, `FeaturedGalleries.tsx`, `MyGalleries.tsx` and `EditGallery.tsx` with solid elevated buttons.
- Replaced hardcoded CSS box-shadows with modular CSS custom property tokens.

## [0.5.0] - 2026-09-11

### Added
- Redesigned User/Model Profile page (`UserProfile.tsx`, `/u/:username`) under Apple Human Interface Guidelines (HIG 2026).
- Created dedicated modular stylesheet `profile.css` with squircle cards (`.profile-apple-card`), avatar halo container (`.profile-avatar-container`), and floating VIP badge (`.profile-vip-pill`).
- Implemented Apple Segmented Control (`.profile-segmented-control`) with sliding glass pill effect for Perfil / Galerías navigation.
- Implemented Apple Inset Grouped List (`.profile-details-list`, `.profile-detail-row`) for user metadata, links, and details with hairline dividers.
- Added Apple metric stat strip (`.profile-stats-bar`, `.profile-stat-item`) for followers, following, and views counter.

### Changed
- Replaced all outline buttons (`btn-outline-secondary`, `btn-outline-dark`) with solid elevated buttons (`profile-btn-solid`, `btn-secondary`, `btn-dark`) featuring tactile active states and box-shadow variables across profile views and modals.
- Converted QR code card to Apple Inset Grouped card with solid download and copy actions.

## [0.4.0] - 2026-09-11

### Added
- Redesigned `/explorar` page (`Explore.tsx`) under Apple Human Interface Guidelines (HIG 2026).
- Implemented Apple Hero Section with Large Title hierarchy, kicker, and live creator counter pill (`.explore-counter-pill`).
- Implemented Apple Liquid Glass filter bar (`.explore-filter-bar`) with search input capsule (`.explore-search-input-wrapper`), clear button, country flags, and solid reset button.
- Refactored `UsersGrid.tsx` to Apple Grouped Inset Card (`.user-apple-card`) with continuous squircle corners (24px), elevated `:hover` states, metadata pill chips, and solid CTA buttons.
- Created dedicated modular stylesheet `explore.css` using centralized CSS variables and dark mode elevation tokens.

## [0.3.2] - 2026-09-11

### Added
- Expanded full modular box-shadow scale (`--shadow-2xs` to `--shadow-2xl`, `--shadow-card`, `--shadow-card-hover`, `--shadow-button`, `--shadow-button-hover`, `--shadow-button-active`, `--shadow-primary-btn`, `--shadow-primary-btn-hover`, `--shadow-focus-ring`, `--shadow-pill`, `--shadow-sheet`) in `variables.css`.
- Added dark mode box-shadow elevation tokens under `[data-bs-theme="dark"]`.

### Changed
- Replaced hardcoded box-shadow values across `cafes.css`, `apple-components.css`, and `apple-glass.css` with CSS custom property tokens.
- Enhanced button interaction feedback with tactile active states (`:active`) and shadow depth.

## [0.3.1] - 2026-09-11

### Changed
- Replaced all outline buttons (`btn-outline-secondary`, `outline-dark`) with solid buttons (`btn-secondary`, `btn-dark`) in Cafes explorer and interior detail pages.
- Updated `cafes.css` button classes (`.cafes-filter-reset-btn`, `.cafe-detail-back-btn`, `.cafe-detail-action-btn`, `.cafe-secondary-action-btn`) to solid background styles with contrast elevation.

## [0.3.0] - 2026-09-11

### Added
- Redesigned Cafes Module and Interior Detail under Apple Human Interface Guidelines (HIG 2026).
- Implemented Apple Segmented Control (`.apple-segmented-control`) for seamless branch switching.
- Implemented Apple Grouped Inset Cards (`.cafe-apple-card`) with hairline rows and metadata icons.
- Implemented Hero visual banner on `CafeDetail.tsx` with floating rating pill and glass action bar.
- Added quick action sidebar with direct Google Maps trigger, menu QR access, and official website links.

### Changed
- Replaced legacy 01/02 accordion in `CafeDetail.tsx` with a continuous two-column editorial layout.
- Replaced 5-column rectangular form filter grid with an Apple Liquid Glass filter bar (`.cafes-filter-bar`).
- Refactored `Cafes.tsx` with Apple Hero typography and rounded-pill actions.
- Reduced Bootstrap bundle by 7 kB by pruning unused accordion and tab components.

## [0.2.7] - 2026-09-11

### Added
- Added Opacity tokens (`--opacity-faint`, `--opacity-muted`, `--opacity-pulse-min`, `--opacity-backdrop`, etc.) in `variables.css`.
- Added Rounded scale aliases (`--rounded-none`, `--rounded-sm`, `--rounded-md`, `--rounded-lg`, `--rounded-full`, `--rounded-circle`).
- Added Font sizes (`--fs-2xs` to `--fs-hero`), icon sizes (`--icon-xs` to `--icon-xl`), and component sizes (`--size-touch-min`, `--size-arrow-circle`, etc.).

### Changed
- Integrated opacity, rounded, and size variables across `apple-components.css`, `cafes.css`, and `base.css`.

## [0.2.6] - 2026-09-11

### Added
- Expanded `variables.css` with modular spacing scale (`--space-1` to `--space-12`), z-index hierarchy (`--z-navbar`, `--z-modal`, etc.), Apple HIG touch targets & dimensions (`--touch-target-min`, `--tab-min-w`, etc.), aspect ratios (`--ratio-tile`, `--ratio-square`), composite glass filters, typography weights/tracking, and icon theme filters.

### Changed
- Refactored `apple-components.css`, `apple-glass.css`, and `cafes.css` to adopt dimensions, z-index, aspect ratios, and spacing variables.

## [0.2.5] - 2026-09-11

### Added
- Created `src/styles/variables.css` centralizing CSS Custom Properties (Sass-like tokens) for typography, brand, warm coffee palette, border radii, transitions, shadows, and light/dark theme adaptive tokens.

### Changed
- Refactored `base.css`, `apple-glass.css`, `apple-components.css`, and `cafes.css` to consume centralized native CSS variables instead of hardcoded hex/rgba values.
- Imported `variables.css` at the top of `index.css` ensuring global design token availability without Sass compiler overhead.

## [0.2.4] - 2026-09-11

### Changed
- Modularized monolithic `index.css` (1000+ lines) into clean native CSS modules under `src/styles/` (`base.css`, `cafes.css`, `apple-glass.css`, `apple-components.css`) bundled via native Vite `@import` without extra dependencies.

## [0.2.3] - 2026-09-11

### Added
- Added Apple HIG Hero section on homepage (`Home.tsx`) featuring Large Title typography, descriptive subtitle, and integrated Liquid Glass search pill.
- Added Skeleton screen placeholders (`apple-skeleton-card`, `apple-skeleton-avatar`, `apple-skeleton-text`) for VIP creator loading states to avoid layout jumps.
- Added search query synchronization (`?search=...`) between the Home search pill and `Explore.tsx`.

### Changed
- Replaced `btn-outline-warning` with Apple-standard filled capsule button (`rounded-pill`, 44pt touch target) in VIP creators section.
- Wrapped homepage editorial content in Apple grouped card container (`.apple-grouped-card`, 24px squircle border-radius, hairline border).

## [0.2.2] - 2026-09-11

### Added
- Created unified `<RouteGuard />` component consolidating route protection, role requirements, and email verification in a single place.
- Added Section 6 to `AGENTS.md` enforcing mandatory `caveman` (chat & code comments) and `caveman-commit` (Conventional Commits) rules.

### Changed
- Replaced font preload React component (`PreloadCriticalAssets`) with static `<link rel="preload">` in `index.html`.
- Consolidated 12 separate `useState` hooks in `WarningModal.tsx` into a single `modalConfig` state object, reducing redundant re-renders.
- Converted `useOnlineStatus` hook to native React 18 `useSyncExternalStore`.
- Enhanced `countryUtils.ts` with browser-native `Intl.DisplayNames` for localized country names worldwide.
- Inlined GraphQL error handler in `config/graphql.php`.

### Removed
- Deleted unused ghost re-export component `GalleryImage.tsx`.
- Deleted single-purpose route wrappers `CreatorRoute.tsx`, `ProtectedRoute.tsx`, and `VerifiedRoute.tsx`.
- Deleted `PreloadCriticalAssets.tsx` component.
- Deleted redundant delegation wrapper class `app/Support/GraphQLErrorsHandler.php`.

## [0.2.1] - 2026-09-11

### Added
- Installed `DietrichGebert/ponytail` skill suite (`ponytail`, `ponytail-audit`, `ponytail-debt`, `ponytail-gain`, `ponytail-help`, `ponytail-review`) in `.agents/skills/`.
- Created `AGENTS.md` establishing mandatory guidelines for AI agents (skills adoption, RTK standard, Graphify queries, version bumping, changelog maintenance, and Apple HIG compliance).
- Apple Tab Bar navigation styles (`.apple-tab-link`, `.apple-tab-dropdown`, `.apple-tab-content`, `.apple-tab-icon`, `.apple-tab-label`, `.apple-tab-caret`).
- Liquid Glass floating material styling (`.apple-liquid-glass-nav`, `.apple-liquid-glass-dropdown`, `.apple-liquid-glass-offcanvas`) with `@media (prefers-reduced-transparency: reduce)` fallbacks.
- Apple canonical motion curve `appleEase` (`[0.16, 1, 0.3, 1]`) and `appleSpring` physics in `front-site/src/lib/animations.ts`.

### Changed
- Replaced side-by-side navbar links with Apple Tab Bar stacked layout (icon centered above single-word label).
- Replaced default Bootstrap dropdown arrow with a rotating Apple micro-chevron.
- Reduced entrance animation durations across `Home.tsx`, `CafesWithReviews.tsx`, and `PopularTags.tsx` from 0.6s to 0.28s.
- Converted `ThemeSwitcher` from floating screen-fixed overlay to an inline navigation element.

### Fixed
- Fixed contrast ratio on VIP badges and category tags to satisfy WCAG AA (≥ 4.5:1).
- Enforced minimum 44 × 44 pt touch targets on interactive buttons and notification dismiss triggers.
- Added accessible `visually-hidden` text labels to loading spinners for VoiceOver / screen reader support.
