// src/components/WeatherWidget.tsx
import React, { useEffect, useState } from 'react';
import { getWeather } from '../services/api';
import './WeatherWidget.css';

// Fallback: New York (Prevents empty UI on error/block)
const DEFAULT_LOCATION = { lat: 40.7128, lon: -74.0060 };

const getFormattedDate = () => {
    const date = new Date();
    return `${date.toLocaleString('en-US', { month: 'short' })} ${date.getDate()}`;
};

const getWeatherIcon = (code: number, isDay: boolean) => {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code >= 1 && code <= 3) return isDay ? '⛅' : '☁️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 67) return '🌧️';
  if (code >= 71 && code <= 77) return '❄️';
  if (code >= 80 && code <= 82) return '🌧️';
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
  const [loading, setLoading] = useState(true);
  const todayDate = getFormattedDate();

  const fetchLocalWeather = async (lat: number, lon: number) => {
      try {
          const { data } = await getWeather(lat, lon);
          if (data.success && data.data) {
            setWeather({
              temp: Math.round(data.data.temperature),
              icon: getWeatherIcon(data.data.weatherCode, data.data.isDay),
              // Use returned city or fallback
              city: data.data.city || "Local" 
            });
          }
      } catch (e) {
          console.error("Weather load error", e);
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      fetchLocalWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => fetchLocalWeather(pos.coords.latitude, pos.coords.longitude),
      (err) => {
        console.warn("Geo access denied, using default.");
        fetchLocalWeather(DEFAULT_LOCATION.lat, DEFAULT_LOCATION.lon);
      },
      { timeout: 5000 }
    );
  }, []);

  if (loading) {
      return (
        <div className="weather-widget" style={{ opacity: 0.7 }}>
            <div className="weather-meta">
                <span className="weather-city">...</span>
            </div>
             <div className="weather-main">
                <span className="weather-temp">--°C</span>
            </div>
        </div>
      );
  }

  if (!weather) return null;

  return (
    <div className="weather-widget">
      {/* Top: City Left, Date Right */}
      <div className="weather-meta">
          <span className="weather-city" title={weather.city}>{weather.city}</span>
          <span className="weather-date">{todayDate}</span>
      </div>
      {/* Bottom: Icon Left, Temp Right */}
      <div className="weather-main">
          <span className="weather-icon">{weather.icon}</span>
          <span className="weather-temp">{weather.temp}°C</span>
      </div>
    </div>
  );
};

export default WeatherWidget;
