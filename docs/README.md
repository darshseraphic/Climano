# Climano website

A responsive, static landing page for the Climano Chrome weather extension. The content is written specifically for Climano: local conditions, hourly weather detail, a six-day daily data range (three past days plus three forecast days), location options, privacy disclosures, and the current installation path.

## Preview locally

Open `index.html` in a browser. No build step, package installation, or external font is required. The site uses local CSS, JavaScript, and SVG assets.

## Deploy

Upload the contents of this folder to any static web host, or place the files in the publishing directory for GitHub Pages or another static hosting service. Keep the relative file structure intact so the stylesheet and `assets/climano-mark.svg` resolve correctly.

## Files

- `index.html` — page structure, Climano product information, installation guide, FAQ, and metadata
- `styles.css` — responsive monochrome visual system, light/dark/system themes, layout, and reduced-motion support
- `script.js` — theme persistence, accessible mobile navigation, and footer year
- `assets/climano-mark.svg` — local Climano cloud mark

## Product details represented

The site reflects the current project README and Manifest V3 implementation. Climano is a Chrome extension with current conditions, hourly and daily forecasts, city search, approximate IP-based location, optional device geolocation, Celsius/Fahrenheit switching, System/Light/Dark themes, and local preference/forecast caching.

The current extension is not published on the Chrome Web Store. The page therefore explains the existing Developer mode / Load unpacked installation path instead of presenting a non-existent store download link. The site also explains the current third-party data flows for ipapi.co and Open-Meteo.

## Notes before publishing

- The installation guide clones the public repository at https://github.com/darshseraphic/Climano and loads the cloned folder through Chrome's Developer mode.
- Review `LICENSE.txt` in the extension project for Climano's proprietary source-available terms.
- Weather and IP-geolocation services are third-party services. Their own terms and privacy policies apply.

## Design attribution

The monochrome, considered interface direction was informed by **Unslop** by Damir Sokolovsky, licensed under CC BY 4.0: https://www.heydamir.design/unslop
