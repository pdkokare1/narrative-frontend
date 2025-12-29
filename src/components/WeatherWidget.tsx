// src/components/WeatherWidget.tsx
import React, { useEffect, useState } from 'react';
import { getWeather } from '../services/api';
import './WeatherWidget.css';

// Helper to get formatted date (e.g., "Mon, Dec 29")
const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
};

// Map WMO codes to Emojis (No changes here)
const getWeatherIcon = (code: number, isDay: boolean) => {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code === 1 || code === 2 || code === 3) return isDay ? '⛅' : '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 57) return '🌦️';
  if (code >= 61 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
  if (code >= 85 && code <= 86) return '🌨️';
  if (code >= 95 && code <= 99) return '⛈️';
  return '🌡️';
};

interface WeatherState {
    temp: number;
    icon: string;
    city: string;
}

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<WeatherState | null>(null);
  // We can calculate date immediately, no need for state
  const todayDate = getFormattedDate();

  useEffect(() => {
    // Basic check for geolocation support
    if (!navigator.geolocation) {
      console.warn("Geolocation not supported by browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          // API now returns city name too
          const { data } = await getWeather(latitude, longitude);
          
          if (data.success && data.data) {
            setWeather({
              temp: Math.round(data.data.temperature),
              icon: getWeatherIcon(data.data.weatherCode, data.data.isDay),
              city: data.data.city
            });
          }
        } catch (error) {
          console.error("Weather fetch failed gracefully", error);
          // We just don't show the widget if it fails.
        }
      },
      (error) => {
        console.warn("Location permission denied or timed out.", error.message);
      },
      { timeout: 15000, maximumAge: 60000 } // increased timeout slightly, allow cached position
    );
  }, []);

  if (!weather) return null;

  return (
    <div className="weather-widget">
      {/* Top row: City and Date */}
      <div className="weather-meta">
          <div className="weather-city" title={weather.city}>{weather.city}</div>
          <div className="weather-date">{todayDate}</div>
      </div>
      {/* Bottom row: Icon and Temp */}
      <div className="weather-main">
          <span className="weather-icon">{weather.icon}</span>
          <span className="weather-temp">{weather.temp}°C</span>
      </div>
    </div>
  );
};

export default WeatherWidget;
