// src/components/WeatherWidget.tsx
import React, { useEffect, useState } from 'react';
import { getWeather } from '../services/api';
import './WeatherWidget.css';

// Map WMO codes to Emojis
const getWeatherIcon = (code: number, isDay: boolean) => {
  // Clear / Sunny
  if (code === 0) return isDay ? '☀️' : '🌙';
  // Partly Cloudy
  if (code === 1 || code === 2 || code === 3) return isDay ? '⛅' : '☁️';
  // Fog
  if (code >= 45 && code <= 48) return '🌫️';
  // Drizzle
  if (code >= 51 && code <= 57) return '🌦️';
  // Rain
  if (code >= 61 && code <= 67) return '🌧️';
  // Snow
  if (code >= 71 && code <= 77) return '❄️';
  // Showers
  if (code >= 80 && code <= 82) return '🌧️';
  // Snow Showers
  if (code >= 85 && code <= 86) return '🌨️';
  // Thunderstorm
  if (code >= 95 && code <= 99) return '⛈️';
  
  return '🌡️';
};

const WeatherWidget: React.FC = () => {
  const [weather, setWeather] = useState<{ temp: number; icon: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const { data } = await getWeather(latitude, longitude);
          
          if (data.success) {
            setWeather({
              temp: Math.round(data.data.temperature),
              icon: getWeatherIcon(data.data.weatherCode, data.data.isDay)
            });
          }
        } catch (error) {
          // Silent fail for weather
          console.error("Weather fetch failed", error);
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        // Permission denied or timeout
        setLoading(false);
      },
      { timeout: 10000 }
    );
  }, []);

  if (loading || !weather) return null;

  return (
    <div className="weather-widget" title="Local Weather">
      <span className="weather-icon">{weather.icon}</span>
      <span className="weather-temp">{weather.temp}°C</span>
    </div>
  );
};

export default WeatherWidget;
