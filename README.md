# Atmos — Weather Dashboard ☀️

A redesigned, responsive weather application built using **HTML, CSS, and vanilla JavaScript**.

## Features
- Current conditions with local time, feels-like temperature, high/low and rain chance
- Scrollable next-24-hours outlook with precipitation probabilities
- 7-day forecast with high/low temperatures
- Humidity, wind speed/direction, UV index, cloud cover, precipitation and pressure
- Sunrise, sunset and daylight duration
- Search cities worldwide, or (with browser permission) use your location
- Toggle between Celsius and Fahrenheit (wind speeds also convert)
- Remembers the last searched location locally
- Accessible search, status/error messages, keyboard focus styles and mobile-friendly layout

## Data
Uses [Open-Meteo Forecast API](https://open-meteo.com/en/docs) and [Geocoding API](https://open-meteo.com/en/docs/geocoding-api). **No API key required for non-commercial use under the provider's terms.** Internet access is required; forecasts are model estimates and not emergency weather alerts. The UV figure shows the current matching hourly forecast; if missing, it displays an unavailable value.

## Run
Open `index.html` in a browser with internet access. Geolocation generally requires HTTPS or localhost. The legacy `WeatherForecast/index.html` URL also loads the redesigned dashboard.

## Technical notes
- No build tooling or dependencies are required beyond optional hosted web fonts.
- All weather data is requested client-side; no API keys or other secrets are committed.
- HTML/CSS/JS assets live under `WeatherForecast/` and the root entry point is `index.html`.
- If hosting with GitHub Pages, select the branch you want to publish in repository Settings → Pages.

[More projects](https://github.com/aashish-siingh/myportfolio)
