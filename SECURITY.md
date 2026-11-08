# Climano Security and Privacy

This document explains the security-relevant behavior of the current Climano Chrome extension. It is not a guarantee that the extension or third-party services are free of vulnerabilities.

## Security design

- Climano is a client-side Chrome Manifest V3 extension.
- It requests only the Chrome permissions currently needed: `storage` and `geolocation`.
- It declares host access for Open-Meteo forecast and geocoding endpoints and ipapi.co IP geolocation.
- The extension does not bundle an application-owned backend, telemetry pipeline, or analytics implementation.
- User preferences, last location, and cached forecast data are stored in `chrome.storage.local`.
- The device geolocation API is invoked only after the user selects **Use device location**.

## Data shared with external services

| Service | Data sent | Purpose |
|---|---|---|
| ipapi.co | The network request exposes the user's public IP address to the provider. | Approximate IP-based location. |
| Open-Meteo Geocoding API | City/place search text. | Resolve a searched place to coordinates. |
| Open-Meteo Forecast API | Latitude and longitude. | Retrieve weather data for the selected location. |

IP-derived location may be inaccurate. Device geolocation can be more precise. Users should only enable device location if they are comfortable sharing the resulting coordinates with the weather provider when requesting a forecast.

## Permission behavior

Chrome does not support `geolocation` as an `optional_permissions` entry for this extension. It is therefore declared under the regular `permissions` list. Chrome may show a location-related permission warning at install/update time. Although the permission is declared, Climano does not call `navigator.geolocation.getCurrentPosition()` until the user chooses the device-location control.

## User recommendations

- Install Climano only from a repository or release you trust.
- Review Chrome's extension permissions before installation.
- Do not share screenshots or diagnostic logs containing precise coordinates or other private information.
- Keep Chrome updated.
- If you do not want to share device coordinates, use city search or the approximate IP location instead.
- Clear Climano's extension storage from Chrome's extension details if you want to remove locally cached preferences and forecast/location data.

## Reporting a vulnerability

Please report suspected security vulnerabilities privately. Do not publish exploit details in a public issue before the maintainer has had a reasonable opportunity to investigate.

Contact: **Darshseraphic** — **Darsh.seraphic@gmail.com**

Include a concise description, affected file or feature, reproduction steps, potential impact, and any suggested mitigation. Do not include real user coordinates, passwords, tokens, or unrelated personal data. Please allow time for review before public disclosure.

## Scope and limitations

This document describes the current project implementation and known data flows; it is not a formal security audit. Open-Meteo, ipapi.co, Chrome, and any other third-party services operate under their own security, privacy, and service terms. Climano cannot guarantee their availability, accuracy, or handling of data.
