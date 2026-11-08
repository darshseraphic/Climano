'use strict';

const API = {
  forecast: 'https://api.open-meteo.com/v1/forecast',
  geocoding: 'https://geocoding-api.open-meteo.com/v1/search',
  ipLocation: 'https://ipapi.co/json/'
};

const FIELDS = {
  current: 'temperature_2m,relative_humidity_2m,rain,is_day,apparent_temperature,weather_code',
  hourly: 'temperature_2m,relative_humidity_2m,apparent_temperature,rain,visibility,cloud_cover_low,cloud_cover_mid,cloud_cover_high,is_day,sunshine_duration,wind_direction_180m,wind_speed_180m',
  daily: 'sunrise,sunset,weather_code,temperature_2m_max,temperature_2m_min'
};

const $ = (id) => document.getElementById(id);
const state = {
  location: null,
  forecast: null,
  selectedDate: null,
  selectedHourIndex: null,
  temperatureUnit: 'c',
  theme: 'system',
  requestId: 0
};

const WMO = {
  0: ['Clear sky', '☼'], 1: ['Mainly clear', '◉'], 2: ['Partly cloudy', '◐'], 3: ['Overcast', '☁'],
  45: ['Fog', '≋'], 48: ['Rime fog', '≋'], 51: ['Light drizzle', '☂'], 53: ['Drizzle', '☂'], 55: ['Dense drizzle', '☂'],
  56: ['Freezing drizzle', '❄'], 57: ['Freezing drizzle', '❄'], 61: ['Light rain', '☂'], 63: ['Rain', '☂'], 65: ['Heavy rain', '☂'],
  66: ['Freezing rain', '❄'], 67: ['Heavy freezing rain', '❄'], 71: ['Light snow', '❄'], 73: ['Snow', '❄'], 75: ['Heavy snow', '❄'],
  77: ['Snow grains', '❄'], 80: ['Rain showers', '☂'], 81: ['Rain showers', '☂'], 82: ['Heavy showers', '☂'],
  85: ['Snow showers', '❄'], 86: ['Heavy snow showers', '❄'], 95: ['Thunderstorm', 'ϟ'], 96: ['Thunderstorm with hail', 'ϟ'], 99: ['Thunderstorm with hail', 'ϟ']
};

function storageGet(keys) {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) return resolve({});
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });
}

function storageSet(values) {
  return new Promise((resolve) => {
    if (!chrome?.storage?.local) return resolve();
    chrome.storage.local.set(values, () => resolve());
  });
}

function setStatus(message) {
  $('statusMessage').textContent = message;
  $('statusMessage').hidden = false;
}

function hideStatus() { $('statusMessage').hidden = true; }

function setLoading(isLoading, message = 'Loading forecast…') {
  $('retryButton').disabled = isLoading;
  if (isLoading) {
    $('weatherContent').hidden = true;
    $('errorPanel').hidden = true;
    setStatus(message);
  }
}

function conditionFor(code) {
  return WMO[Number(code)] || ['Conditions unavailable', '·'];
}

function fmtNumber(value, digits = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toFixed(digits) : '—';
}

function tempValue(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '—';
  return Math.round(state.temperatureUnit === 'f' ? (n * 9 / 5) + 32 : n);
}

function setTemperatureUnit(unit) {
  state.temperatureUnit = unit === 'f' ? 'f' : 'c';
  $('unitButton').textContent = state.temperatureUnit === 'c' ? '°C' : '°F';
  $('unitButton').setAttribute('aria-label', `Temperature unit ${state.temperatureUnit === 'c' ? 'Celsius' : 'Fahrenheit'}. Click to switch.`);
  storageSet({ temperatureUnit: state.temperatureUnit });
  if (state.forecast) renderForecast();
}

function formatClock(value) {
  if (!value) return '—';
  const [hourString, minuteString = '00'] = String(value).slice(11, 16).split(':');
  const hour = Number(hourString);
  if (!Number.isFinite(hour)) return String(value).slice(11, 16) || '—';
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minuteString} ${suffix}`;
}

function formatDay(dateString, includeWeekday = true) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day, 12);
  return new Intl.DateTimeFormat(undefined, includeWeekday
    ? { weekday: 'short', month: 'short', day: 'numeric' }
    : { month: 'short', day: 'numeric' }).format(date);
}

function directionName(degrees) {
  const d = Number(degrees);
  if (!Number.isFinite(d)) return '—';
  const points = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return `${points[Math.round(((d % 360) / 45)) % 8]} · ${Math.round(d)}°`;
}

function weatherForHour(hour) {
  if (Number(hour.rain) >= 0.1) return '☂';
  const clouds = (Number(hour.cloud_cover_low) + Number(hour.cloud_cover_mid) + Number(hour.cloud_cover_high)) / 3;
  if (Number(hour.is_day) === 1 && clouds < 20) return '☼';
  if (clouds < 55) return '◐';
  return '☁';
}

async function fetchForecast(latitude, longitude) {
  const url = new URL(API.forecast);
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: FIELDS.daily,
    hourly: FIELDS.hourly,
    current: FIELDS.current,
    past_days: '3',
    forecast_days: '3',
    timezone: 'auto'
  }).toString();

  const response = await fetch(url.toString());
  if (!response.ok) throw new Error(`Weather service returned ${response.status}.`);
  const data = await response.json();
  if (!data.current || !data.daily || !data.hourly) throw new Error('The weather service returned incomplete forecast data.');
  return data;
}

async function loadForecast(location) {
  const requestId = ++state.requestId;
  setLoading(true, 'Loading local forecast…');
  $('locationName').textContent = location.name || `${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)}`;
  $('locationMethod').textContent = location.method === 'device' ? 'DEVICE LOCATION' : 'IP ESTIMATE';

  try {
    const data = await fetchForecast(location.latitude, location.longitude);
    if (requestId !== state.requestId) return;
    state.location = location;
    state.forecast = data;
    const today = data.current.time.slice(0, 10);
    state.selectedDate = data.daily.time.includes(state.selectedDate) ? state.selectedDate : today;
    await storageSet({ lastLocation: location, lastForecast: data });
    renderForecast();
  } catch (error) {
    if (requestId !== state.requestId) return;
    $('statusMessage').hidden = true;
    if (!state.forecast) $('weatherContent').hidden = true;
    $('errorText').textContent = state.forecast
      ? `Could not refresh the forecast. Showing the last saved data. ${error.message || ''}`.trim()
      : (error.message || 'Check your internet connection and try again.');
    $('errorPanel').hidden = false;
  }
}

function renderForecast() {
  const data = state.forecast;
  if (!data) return;
  hideStatus();
  $('errorPanel').hidden = true;
  $('weatherContent').hidden = false;
  renderCurrent(data);
  renderDaily(data);
  renderHourly(data);
  renderHourlyDetails(data);
  renderSun(data);
}

function renderCurrent(data) {
  const current = data.current;
  const [condition, icon] = conditionFor(current.weather_code);
  const todayIndex = data.daily.time.indexOf(current.time.slice(0, 10));
  $('currentCondition').textContent = condition;
  $('currentWeatherIcon').textContent = icon;
  $('currentTemperature').textContent = tempValue(current.temperature_2m);
  $('currentFeelsLike').textContent = tempValue(current.apparent_temperature);
  $('todayHigh').textContent = todayIndex >= 0 ? tempValue(data.daily.temperature_2m_max[todayIndex]) : '—';
  $('todayLow').textContent = todayIndex >= 0 ? tempValue(data.daily.temperature_2m_min[todayIndex]) : '—';
  $('currentHumidity').textContent = `${fmtNumber(current.relative_humidity_2m)}%`;
  $('currentRain').textContent = fmtNumber(current.rain, 1);
  $('currentSunState').textContent = Number(current.is_day) === 1 ? 'Daylight' : 'Night';
  $('dayState').textContent = Number(current.is_day) === 1 ? 'Daytime conditions' : 'Night-time conditions';
  $('updatedAt').textContent = `Updated ${formatClock(current.time)}`;
  $('dateRangeLabel').textContent = `${data.daily.time.length} days · local time`;
}

function renderDaily(data) {
  const container = $('dailyForecast');
  container.replaceChildren();
  data.daily.time.forEach((date, index) => {
    const [condition, icon] = conditionFor(data.daily.weather_code[index]);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'daily-card';
    button.setAttribute('aria-pressed', String(date === state.selectedDate));
    button.setAttribute('aria-label', `${formatDay(date)}, ${condition}, high ${tempValue(data.daily.temperature_2m_max[index])} degrees, low ${tempValue(data.daily.temperature_2m_min[index])} degrees`);

    const dateEl = document.createElement('span'); dateEl.className = 'daily-date'; dateEl.textContent = formatDay(date);
    const iconEl = document.createElement('span'); iconEl.className = 'daily-icon'; iconEl.textContent = icon;
    const conditionEl = document.createElement('span'); conditionEl.className = 'daily-condition'; conditionEl.textContent = condition;
    const temps = document.createElement('span'); temps.className = 'daily-temps';
    temps.textContent = `${tempValue(data.daily.temperature_2m_max[index])}°`;
    const low = document.createElement('span'); low.textContent = `${tempValue(data.daily.temperature_2m_min[index])}°`; temps.append(low);
    const sun = document.createElement('span'); sun.className = 'daily-sun';
    const sunrise = document.createElement('span'); sunrise.textContent = `↗ ${formatClock(data.daily.sunrise[index])}`;
    const sunset = document.createElement('span'); sunset.textContent = `↘ ${formatClock(data.daily.sunset[index])}`;
    sun.append(sunrise, sunset);
    button.append(dateEl, iconEl, conditionEl, temps, sun);
    button.addEventListener('click', () => {
      state.selectedDate = date;
      state.selectedHourIndex = null;
      renderDaily(data);
      renderHourly(data);
      renderHourlyDetails(data);
      renderSun(data);
    });
    container.append(button);
  });
}

function getSelectedHours(data) {
  const date = state.selectedDate || data.current.time.slice(0, 10);
  const times = data.hourly.time;
  const indices = [];
  times.forEach((time, index) => { if (time.startsWith(date)) indices.push(index); });
  if (!indices.length) return [];
  let selectedIndex = state.selectedHourIndex;
  if (selectedIndex === null || !indices.includes(selectedIndex)) {
    const currentTime = data.current.time;
    selectedIndex = indices.find((index) => times[index] >= currentTime) ?? indices[0];
    state.selectedHourIndex = selectedIndex;
  }
  return indices;
}

function renderHourly(data) {
  const container = $('hourlyForecast');
  container.replaceChildren();
  const indices = getSelectedHours(data);
  $('selectedDateLabel').textContent = state.selectedDate ? formatDay(state.selectedDate) : '';
  indices.forEach((index) => {
    const hour = Object.fromEntries(Object.keys(data.hourly).map((key) => [key, data.hourly[key][index]]));
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'hour-card';
    button.setAttribute('aria-pressed', String(index === state.selectedHourIndex));
    button.setAttribute('aria-label', `${formatClock(hour.time)}, ${tempValue(hour.temperature_2m)} degrees, rain ${fmtNumber(hour.rain, 1)} millimetres`);
    const time = document.createElement('span'); time.className = 'hour-time'; time.textContent = formatClock(hour.time);
    const symbol = document.createElement('span'); symbol.className = 'hour-symbol'; symbol.textContent = weatherForHour(hour);
    const temp = document.createElement('strong'); temp.className = 'hour-temp'; temp.textContent = `${tempValue(hour.temperature_2m)}°`;
    const rain = document.createElement('span'); rain.className = 'hour-rain'; rain.textContent = `${fmtNumber(hour.rain, 1)} mm`;
    button.append(time, symbol, temp, rain);
    button.addEventListener('click', () => {
      state.selectedHourIndex = index;
      renderHourly(data);
      renderHourlyDetails(data);
    });
    container.append(button);
  });
}

function renderHourlyDetails(data) {
  const index = state.selectedHourIndex;
  const hour = index === null ? null : Object.fromEntries(Object.keys(data.hourly).map((key) => [key, data.hourly[key][index]]));
  if (!hour) return;
  $('selectedHourLabel').textContent = formatClock(hour.time);
  const sunshineMinutes = Number(hour.sunshine_duration) / 60;
  const details = [
    ['Feels like', `${tempValue(hour.apparent_temperature)}°`],
    ['Humidity', `${fmtNumber(hour.relative_humidity_2m)}%`],
    ['Rain', `${fmtNumber(hour.rain, 1)} mm`],
    ['Visibility', formatVisibility(hour.visibility)],
    ['Low cloud', `${fmtNumber(hour.cloud_cover_low)}%`],
    ['Mid cloud', `${fmtNumber(hour.cloud_cover_mid)}%`],
    ['High cloud', `${fmtNumber(hour.cloud_cover_high)}%`],
    ['Sunshine', formatDuration(sunshineMinutes)],
    ['Light', Number(hour.is_day) === 1 ? 'Daylight' : 'Night'],
    ['Wind · 180 m', `${fmtNumber(hour.wind_speed_180m, 1)} km/h`],
    ['Wind direction · 180 m', directionName(hour.wind_direction_180m)],
    ['Temperature', `${tempValue(hour.temperature_2m)}°`]
  ];
  const container = $('hourlyDetails');
  container.replaceChildren();
  details.forEach(([label, value]) => {
    const item = document.createElement('div'); item.className = 'detail-item';
    const labelEl = document.createElement('span'); labelEl.className = 'detail-label'; labelEl.textContent = label;
    const valueEl = document.createElement('strong'); valueEl.className = 'detail-value'; valueEl.textContent = value;
    item.append(labelEl, valueEl); container.append(item);
  });
}

function formatVisibility(meters) {
  const n = Number(meters);
  if (!Number.isFinite(n)) return '—';
  return n >= 1000 ? `${(n / 1000).toFixed(1)} km` : `${Math.round(n)} m`;
}

function formatDuration(minutes) {
  if (!Number.isFinite(minutes)) return '—';
  if (minutes < 60) return `${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const remaining = Math.round(minutes % 60);
  return remaining ? `${hours} h ${remaining} m` : `${hours} h`;
}

function renderSun(data) {
  const index = data.daily.time.indexOf(state.selectedDate || data.current.time.slice(0, 10));
  $('sunriseTime').textContent = index >= 0 ? formatClock(data.daily.sunrise[index]) : '—';
  $('sunsetTime').textContent = index >= 0 ? formatClock(data.daily.sunset[index]) : '—';
}

async function locateByIP() {
  setLoading(true, 'Estimating your location from your IP address…');
  try {
    const response = await fetch(API.ipLocation, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error('IP location lookup failed.');
    const place = await response.json();
    const latitude = Number(place.latitude);
    const longitude = Number(place.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) throw new Error('Your approximate location could not be determined.');
    const name = [place.city, place.region, place.country_name].filter(Boolean).join(', ') || 'Approximate location';
    const location = { latitude, longitude, name, method: 'ip' };
    await loadForecast(location);
  } catch (error) {
    const saved = await storageGet(['lastLocation', 'lastForecast']);
    if (saved.lastLocation && saved.lastForecast) {
      state.location = saved.lastLocation;
      state.forecast = saved.lastForecast;
      state.selectedDate = saved.lastForecast.current.time.slice(0, 10);
      $('locationName').textContent = saved.lastLocation.name || 'Saved location';
      $('locationMethod').textContent = 'SAVED LOCATION';
      renderForecast();
      return;
    }
    throw error;
  }
}

async function locateByDevice() {
  if (!navigator.geolocation) {
    $('errorText').textContent = 'Device location is not available in this browser context.';
    $('errorPanel').hidden = false;
    return;
  }

  // Chrome does not support geolocation as an optional extension permission.
  // It is declared in manifest.json, and coordinates are only read after this
  // explicit user action.
  setLoading(true, 'Requesting device location…');
  navigator.geolocation.getCurrentPosition(async (position) => {
    const latitude = position.coords.latitude;
    const longitude = position.coords.longitude;
    const location = { latitude, longitude, name: 'Your device location', method: 'device' };
    await loadForecast(location);
  }, (error) => {
    $('weatherContent').hidden = true;
    $('statusMessage').hidden = true;
    $('errorText').textContent = error.code === 1
      ? 'Device location was denied. Continue with IP-based location or search for a city.'
      : 'Device location could not be read. Try again or search for a city.';
    $('errorPanel').hidden = false;
  }, { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 });
}

async function searchCities(query) {
  const url = new URL(API.geocoding);
  url.search = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' }).toString();
  const response = await fetch(url.toString());
  if (!response.ok) throw new Error('Place search is unavailable right now.');
  const data = await response.json();
  return data.results || [];
}

function showSearchResults(results) {
  const container = $('searchResults');
  container.replaceChildren();
  if (!results.length) {
    const empty = document.createElement('div');
    empty.className = 'search-result';
    empty.textContent = 'No matching places found.';
    container.append(empty);
  } else {
    results.forEach((place) => {
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'search-result';
      const name = document.createElement('span'); name.textContent = place.name;
      const context = document.createElement('small'); context.textContent = [place.admin1, place.country].filter(Boolean).join(', ');
      button.append(name, context);
      button.addEventListener('click', async () => {
        container.hidden = true;
        $('cityInput').value = '';
        const location = {
          latitude: Number(place.latitude), longitude: Number(place.longitude),
          name: [place.name, place.admin1, place.country].filter(Boolean).join(', '), method: 'search'
        };
        await loadForecast(location);
      });
      container.append(button);
    });
  }
  container.hidden = false;
}

async function handleSearch(event) {
  event.preventDefault();
  const query = $('cityInput').value.trim();
  if (query.length < 2) return;
  $('searchResults').hidden = true;
  setStatus('Searching for that place…');
  try {
    const results = await searchCities(query);
    showSearchResults(results);
    hideStatus();
  } catch (error) {
    $('errorText').textContent = error.message;
    $('errorPanel').hidden = false;
    $('statusMessage').hidden = true;
  }
}

function setTheme(theme) {
  state.theme = theme;
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
  $('themeLabel').textContent = theme[0].toUpperCase() + theme.slice(1);
  $('themeButton').setAttribute('aria-label', `Theme: ${theme}. Click to change theme.`);
  storageSet({ theme });
}

function cycleTheme() {
  const options = ['system', 'light', 'dark'];
  setTheme(options[(options.indexOf(state.theme) + 1) % options.length]);
}

async function init() {
  const saved = await storageGet(['theme', 'temperatureUnit', 'lastLocation', 'lastForecast']);
  setTheme(saved.theme || 'system');
  setTemperatureUnit(saved.temperatureUnit || 'c');
  $('themeButton').addEventListener('click', cycleTheme);
  $('unitButton').addEventListener('click', () => setTemperatureUnit(state.temperatureUnit === 'c' ? 'f' : 'c'));
  $('deviceLocationButton').addEventListener('click', locateByDevice);
  $('retryButton').addEventListener('click', () => state.location ? loadForecast(state.location) : locateByIP());
  $('searchForm').addEventListener('submit', handleSearch);
  $('cityInput').addEventListener('input', () => { if (!$('cityInput').value.trim()) $('searchResults').hidden = true; });
  document.addEventListener('click', (event) => {
    if (!$('searchForm').contains(event.target) && !$('searchResults').contains(event.target)) $('searchResults').hidden = true;
  });

  if (saved.lastLocation && saved.lastForecast) {
    state.location = saved.lastLocation;
    state.forecast = saved.lastForecast;
    state.selectedDate = saved.lastForecast.current.time.slice(0, 10);
    $('locationName').textContent = saved.lastLocation.name || 'Saved location';
    $('locationMethod').textContent = saved.lastLocation.method === 'device' ? 'DEVICE LOCATION' : 'SAVED LOCATION';
    renderForecast();
    // Refresh saved coordinates on every open. Re-resolve IP-derived locations so they can follow network changes.
    if (saved.lastLocation.method === 'ip') {
      try { await locateByIP(); } catch (error) { /* Keep the cached forecast visible when the lookup is offline. */ }
    } else {
      await loadForecast(saved.lastLocation);
    }
  } else {
    try {
      await locateByIP();
    } catch (error) {
      $('statusMessage').hidden = true;
      $('errorText').textContent = `${error.message || 'Location lookup failed.'} Use device location or search for a city.`;
      $('errorPanel').hidden = false;
    }
  }
}

document.addEventListener('DOMContentLoaded', init);
