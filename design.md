# Climano — Design System & Visual Direction

Climano uses a restrained **monochrome, ink-and-paper visual language**. The interface is intentionally quiet: it keeps attention on local weather information and makes current conditions, forecast periods, and detailed measurements easy to scan.

## 1. Design intent

**Personality:** calm, precise, trustworthy, minimal, and quietly confident.

**Core idea:** local weather should feel clear and useful. The interface should not compete with the forecast or make weather data feel technical or intimidating.

- Keep the palette monochrome and let contrast do the work.
- Use a clear hierarchy: brand and headline first, location and current conditions next, forecast details after.
- Separate related information into softly defined surfaces instead of decorative panels.
- Prefer consistent spacing, alignment, and component behavior over visual effects.
- Keep location permissions and external data use understandable.

## 2. Color palette

### Light theme

| Token | Hex | Use |
|---|---:|---|
| `--page` | `#F1F1F1` | Main popup canvas. |
| `--surface` | `#FFFFFF` | Main cards and raised controls. |
| `--surface-raised` | `#F8F8F8` | Secondary surfaces and hover states. |
| `--field` / `--field-soft` | `#FAFAFA` | Search and soft fields. |
| `--ink` | `#171717` | Primary text and icons. |
| `--button-ink` | `#111111` | High-emphasis controls. |
| `--button-text` | `#FFFFFF` | Text on dark controls. |
| `--secondary` | `#626262` | Supporting descriptions. |
| `--muted` | `#858585` | Metadata and hints. |
| `--line` | `#D2D2D2` | Card and divider borders. |
| `--line-strong` | `#BFBFBF` | Input and control borders. |

### Dark theme

| Token | Hex | Use |
|---|---:|---|
| `--page` | `#101010` | Main popup canvas. |
| `--surface` | `#1B1B1B` | Cards and primary surfaces. |
| `--surface-raised` | `#242424` | Secondary surfaces. |
| `--field` | `#151515` | Search field. |
| `--field-soft` | `#202020` | Soft fields. |
| `--ink` | `#F4F4F4` | Primary text and icons. |
| `--button-ink` | `#F3F3F3` | High-emphasis controls. |
| `--button-text` | `#111111` | Text on light controls. |
| `--secondary` | `#B7B7B7` | Supporting descriptions. |
| `--muted` | `#909090` | Metadata and hints. |
| `--line` | `#363636` | Card and divider borders. |
| `--line-strong` | `#505050` | Input and control borders. |

### Usage principles

1. Contrast signals importance; primary actions use high-contrast controls.
2. Surfaces are layered with neutral values, not decorative gradients.
3. Text has primary, secondary, and muted levels.
4. Light and dark themes preserve the same hierarchy.
5. Weather condition glyphs communicate forecast states; the Climano brand mark remains a monochrome cloud.

## 3. Typography

Use the native system sans-serif stack: `system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, Arial, sans-serif`.

The popup uses compact, readable type because a browser action popup has limited space. Hierarchy comes from size, weight, and contrast rather than multiple typefaces.

## 4. Layout and spacing

The popup is designed around a compact, approximately 400px-wide browser extension surface.

- Keep consistent outer padding and aligned section headings.
- Group location search and location method together.
- Make current conditions the primary information surface.
- Keep daily and hourly forecasts independently scannable.
- Put detailed measurements in a compact grid.
- Use a quiet footer for data-source and privacy context.
- Use a repeatable spacing vocabulary based on 8px, 12px, 16px, 20px, and 28px intervals.

## 5. Shape language and surfaces

Use soft, controlled geometry: approximately 28px for the app shell, 20px for main cards, 14px for fields and primary buttons, and 9–12px for secondary controls. Thin borders and surface contrast establish grouping; avoid heavy shadows and gradients.

## 6. Component direction

- **Brand header:** monochrome cloud mark, Climano wordmark, temperature unit, and theme control.
- **Intro:** concise forecast headline and supporting copy.
- **Location controls:** city search, detected location, and explicit device-location action.
- **Current conditions:** condition, temperature, feels-like value, daily high/low, and day/night state.
- **Measurements:** humidity, rain, and daylight state.
- **Daily forecast:** selectable days with weather condition, high/low, sunrise, and sunset.
- **Hourly forecast:** selectable hours with temperature and rain.
- **Weather details:** selected-hour humidity, apparent temperature, rain, visibility, cloud layers, sunshine duration, daylight, and wind measurements.
- **Footer:** weather provider, location lookup disclosure, and version.

## 7. Interaction and accessibility

- Keep transitions subtle, generally around 150–160ms.
- Provide visible keyboard focus, hover, active, and disabled states.
- The theme control cycles through System → Light → Dark.
- Respect `prefers-reduced-motion`.
- Use semantic buttons, accessible labels, and live status messaging.
- Do not request device location until the user chooses the device-location action.

## 8. Theme behavior

System follows the operating system preference. Light uses an off-white canvas and white cards. Dark uses a near-black canvas and charcoal cards. Component structure, dimensions, typography, and hierarchy remain consistent between themes.

## 9. Design attribution

The original visual reference supplied with the project records design guidance from **Unslop** by Damir Sokolovsky, under **Creative Commons Attribution 4.0 International (CC BY 4.0)**. This attribution is retained as a third-party design reference; it does not change the proprietary license of Climano's own code and branding.

- Author: https://x.com/heydamir
- Project: https://heydamir.design/unslop
- License: https://creativecommons.org/licenses/by/4.0/
