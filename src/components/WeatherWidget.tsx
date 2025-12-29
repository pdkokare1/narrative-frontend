// src/components/WeatherWidget.tsx
import React, { useEffect, useState } from 'react';
import { getWeather } from '../services/api';
import './WeatherWidget.css';

// Fallback location (New York) if geo is denied
const DEFAULT_LOCATION = { lat: 40.7128, lon: -74.0060 };

// Helper to get formatted date (e.g., "Mon, Dec 29")
const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
    };
    return new Date().toLocaleDateString('en-US', options);
};

// Map WMO codes to Emojis
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
  const [isLoading, setIsLoading] = useState(true);
  const todayDate = getFormattedDate();

  // Reusable fetch function
  const fetchLocalWeather = async (lat: number, lon: number) => {
      try {
          const { data } = await getWeather(lat, lon);
          if (data.success && data.data) {
            setWeather({
              temp: Math.round(data.data.temperature),
              icon: getWeatherIcon(data.data.weatherCode, data.data.isDay),
              city: data.data.city || "Local Weather"
            });
          }
      } catch (e) {
          console.error("Weather load failed", e);
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    // 1. Check if browser supports Geo
    if (!navigator.geolocation) {
      fetchLocalWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
      return;
    }

    // 2. Try to get position
    navigator.geolocation.getCurrentPosition(
      (position) => {
        // Success: Use real location
        fetchLocalWeather(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        // Error/Denied: Use Default
        console.warn("Location access denied/failed, using default.", error.message);
        fetchLocalWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
      },
      { timeout: 5000 }
    );
  }, []);

  // Render Loading State
  if (isLoading) {
      return (
        <div className="weather-widget">
            <div className="weather-meta">
                <div className="weather-city">Loading...</div>
            </div>
        </div>
      );
  }

  // Render Empty if still null (rare)
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
