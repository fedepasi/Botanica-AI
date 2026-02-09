# CLAUDE.md - Development Guidelines for Botanica AI

## 🧤 Critical UX Requirement: Glove-Friendly Design

**This app is used by gardeners who may be wearing gloves!**

All interactive elements must be designed for easy use with gardening gloves:

### Minimum Touch Targets
- **Buttons**: minimum 48x48px (ideally 56x56px)
- **List items**: minimum height 56px
- **Checkboxes/toggles**: minimum 44x44px touch area
- **Spacing between targets**: minimum 8px gap

### Interaction Guidelines
- Prefer **tap** over swipe gestures
- Avoid **long press** as primary actions
- Use **large, obvious buttons** instead of subtle icons
- Provide **generous padding** around interactive elements
- Avoid **small close buttons** in corners (use larger X buttons or tap-outside-to-dismiss)

### Visual Clarity
- High contrast text and icons
- Clear visual feedback on touch (scale, color change)
- Avoid relying on hover states (no hover with gloves!)

## 🌍 Internationalization

- Default language detected from browser/geolocation
- All UI strings in `i18n/locales/{en,it}.json`
- AI-generated content (tasks, descriptions) respects user language setting
- Task text stored with language field for consistency

## 📱 Mobile-First Design

- Primary target: smartphones in the garden
- Modals positioned at top (keyboard compatibility)
- Bottom navigation with large touch targets
- Horizontal scroll avoided where possible

## 🎨 Design System

### Colors (Tailwind)
- `garden-green`: Primary actions, positive states
- `garden-yellow`: Highlights, accents
- `garden-beige`: Backgrounds, subtle elements

### Typography
- Font: Outfit (via Google Fonts)
- Headings: `font-black`, `tracking-tight`
- Labels: `text-xs`, `uppercase`, `tracking-widest`

### Border Radius
- Cards: `rounded-[32px]` or `rounded-[40px]`
- Buttons: `rounded-2xl` or `rounded-3xl`
- Small elements: `rounded-xl`

## 🗄️ Database Conventions

All Supabase resources prefixed with `botanica_`:
- Tables: `botanica_plants`, `botanica_tasks`, etc.
- Storage buckets: `botanica_images`

## 📁 Project Structure

```
/components     - Reusable UI components
/contexts       - React contexts (Auth, Language, Careplan)
/hooks          - Custom hooks
/screens        - Page components
/services       - API/DB services (Supabase, Gemini)
/i18n           - Translations
/types.ts       - TypeScript interfaces
```
