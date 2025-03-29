import  { useEffect, useState } from 'react';
import { GeoPoint, WeatherInfo } from '../types';
import { fetchWeather, getWeatherIcon, getWeatherColor } from '../utils/weatherApi';
import { Cloud, Thermometer, Wind, Droplets, Sun, CloudRain, CloudSnow, CloudLightning } from 'lucide-react';

interface WeatherDisplayProps {
  location: GeoPoint | null;
  className?: string;
  compact?: boolean;
}

export const WeatherDisplay = ({ 
  location, 
  className = '',
  compact = false
}: WeatherDisplayProps) => {
  const [weather, setWeather] = useState<WeatherInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!location) return;

    const getWeatherData = async () => {
      setLoading(true);
      setError(null);

      try {
        const weatherData = await fetchWeather(location.latitude, location.longitude);
        setWeather(weatherData);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('Unable to load weather information');
      } finally {
        setLoading(false);
      }
    };

    getWeatherData();
  }, [location]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-2 ${className}`}>
        <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 rounded-full mr-2"></div>
        <span className="text-sm text-gray-500">Loading weather...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-sm text-gray-500 py-2 ${className}`}>
        Weather information unavailable
      </div>
    );
  }

  if (!weather) {
    return (
      <div className={`text-sm text-gray-500 py-2 ${className}`}>
        No weather data
      </div>
    );
  }

  const weatherColor = getWeatherColor(weather.condition);
  
  // Select appropriate weather icon component
  const WeatherIconComponent = () => {
    switch (weather.condition.toLowerCase()) {
      case 'clear':
        return <Sun className="h-10 w-10" />;
      case 'rain':
      case 'drizzle':
        return <CloudRain className="h-10 w-10" />;
      case 'snow':
        return <CloudSnow className="h-10 w-10" />;
      case 'thunderstorm':
        return <CloudLightning className="h-10 w-10" />;
      default:
        return <Cloud className="h-10 w-10" />;
    }
  };
  
  if (compact) {
    return (
      <div className={`inline-flex items-center rounded-full px-3 py-1 ${weatherColor} ${className}`}>
        {weather.condition === 'clear' ? 
          <Sun className="h-4 w-4 mr-1" /> : 
          <Cloud className="h-4 w-4 mr-1" />
        }
        <span className="text-xs font-medium">
          {Math.round(weather.temperature)}°C, {weather.description}
        </span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-3 ${weatherColor} ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">{weather.description}</div>
          <div className="flex items-center mt-1">
            <Thermometer className="h-4 w-4 mr-1" />
            <span className="text-lg font-semibold">{Math.round(weather.temperature)}°C</span>
          </div>
        </div>
        <WeatherIconComponent />
      </div>
      
      <div className="flex items-center justify-between mt-2 text-xs">
        <div className="flex items-center">
          <Wind className="h-3 w-3 mr-1" />
          <span>{weather.windSpeed} m/s</span>
        </div>
        <div className="flex items-center">
          <Droplets className="h-3 w-3 mr-1" />
          <span>{weather.humidity}%</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-200 border-opacity-30">
        <p className="text-xs">Road conditions updated in real-time</p>
      </div>
    </div>
  );
}
 