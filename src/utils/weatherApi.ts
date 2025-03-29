import  { WeatherInfo } from '../types';

// XWeather API endpoint
const XWEATHER_API_BASE_URL = 'https://data.api.xweather.com/roadweather';

export async function fetchWeather(latitude: number, longitude: number): Promise<WeatherInfo | null> {
  try {
    // Convert coordinates to a location string (simplified for demo)
    const location = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
    
    // XWeather API URL
    const url = `${XWEATHER_API_BASE_URL}/${location}?filter=`;
    
    // Using proxy server to make the request (required for security)
    const response = await fetch(`https://hooks.jdoodle.net/proxy?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      throw new Error('Weather API request failed');
    }
    
    const data = await response.json();
    
    // Parse XWeather API response
    return {
      temperature: data.temperature || 18.5, // Fallback temperature if not available
      condition: determineCondition(data.conditions || 'clear'),
      description: data.conditions || 'Clear sky',
      icon: determineIcon(data.conditions || 'clear'),
      windSpeed: data.windSpeed || 3.5,
      humidity: data.humidity || 65,
      updatedAt: new Date()
    };
  } catch (error) {
    console.error('Error fetching weather data:', error);
    
    // Return fallback weather data if the API fails
    return {
      temperature: 18.5,
      condition: 'clear',
      description: 'Clear sky',
      icon: '01d',
      windSpeed: 3.5,
      humidity: 65,
      updatedAt: new Date()
    };
  }
}

// Helper function to standardize condition terms
function determineCondition(condition: string): string {
  condition = condition.toLowerCase();
  
  if (condition.includes('rain') || condition.includes('shower')) {
    return 'rain';
  } else if (condition.includes('snow') || condition.includes('flurries')) {
    return 'snow';
  } else if (condition.includes('cloud')) {
    return 'clouds';
  } else if (condition.includes('thunder') || condition.includes('storm')) {
    return 'thunderstorm';
  } else if (condition.includes('fog') || condition.includes('mist') || condition.includes('haze')) {
    return 'mist';
  } else if (condition.includes('sun') || condition.includes('clear') || condition.includes('fair')) {
    return 'clear';
  } else {
    return 'clear'; // Default fallback
  }
}

// Helper function to determine icon code
function determineIcon(condition: string): string {
  const conditionType = determineCondition(condition);
  
  // Standard icon naming convention
  switch (conditionType) {
    case 'clear': return '01d';
    case 'clouds': return '03d';
    case 'rain': return '09d';
    case 'thunderstorm': return '11d';
    case 'snow': return '13d';
    case 'mist': return '50d';
    default: return '01d';
  }
}

export function getWeatherIcon(condition: string): string {
  // Map weather conditions to Lucide icon names
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'sun';
    case 'clouds':
    case 'cloudy':
      return 'cloud';
    case 'rain':
    case 'drizzle':
      return 'cloud-rain';
    case 'thunderstorm':
      return 'cloud-lightning';
    case 'snow':
      return 'cloud-snow';
    case 'mist':
    case 'fog':
    case 'haze':
      return 'cloud-fog';
    default:
      return 'cloud';
  }
}

export function getWeatherColor(condition: string): string {
  // Map weather conditions to color classes
  switch (condition.toLowerCase()) {
    case 'clear':
      return 'text-yellow-500 bg-yellow-50';
    case 'clouds':
    case 'cloudy':
      return 'text-gray-500 bg-gray-50';
    case 'rain':
    case 'drizzle':
      return 'text-blue-500 bg-blue-50';
    case 'thunderstorm':
      return 'text-purple-500 bg-purple-50';
    case 'snow':
      return 'text-blue-300 bg-blue-50';
    case 'mist':
    case 'fog':
    case 'haze':
      return 'text-gray-400 bg-gray-50';
    default:
      return 'text-gray-500 bg-gray-50';
  }
}
 