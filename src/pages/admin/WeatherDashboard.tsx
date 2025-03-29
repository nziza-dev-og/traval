import  { useState, useEffect } from 'react';
import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { Trip, TripStatus, Route, RouteStop, WeatherInfo } from '../../types';
import { fetchWeather } from '../../utils/weatherApi';
import { MapboxMap } from '../../components/MapboxMap';
import { Cloud, AlertCircle, Map, RefreshCw, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';

export const WeatherDashboard = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [weatherAlerts, setWeatherAlerts] = useState<{location: string, alert: string, severity: 'low' | 'medium' | 'high'}[]>([]);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    const fetchWeatherData = async () => {
      try {
        // Fetch routes first
        const routesQuery = query(
          collection(db, 'routes'),
          where('adminId', '==', currentUser.uid)
        );
        const routesSnapshot = await getDocs(routesQuery);
        const routesData: Route[] = [];
        routesSnapshot.forEach((doc) => {
          routesData.push({ id: doc.id, ...doc.data() } as Route);
        });
        setRoutes(routesData);
        
        // Get driver IDs from routes
        const driverIds = routesData.map(route => route.driverId);
        
        if (driverIds.length > 0) {
          // Fetch active trips for these drivers
          const tripsQuery = query(
            collection(db, 'trips'),
            where('driverId', 'in', driverIds),
            where('status', '==', TripStatus.IN_PROGRESS)
          );
          
          const unsubscribe = onSnapshot(tripsQuery, async (snapshot) => {
            const tripsData: Trip[] = [];
            
            for (const doc of snapshot.docs) {
              const tripData = { id: doc.id, ...doc.data() } as Trip;
              
              // Fetch weather data if we have a location but no weather info
              if (tripData.currentLocation && !tripData.weather) {
                try {
                  const weatherData = await fetchWeather(
                    tripData.currentLocation.latitude,
                    tripData.currentLocation.longitude
                  );
                  if (weatherData) {
                    tripData.weather = weatherData;
                  }
                } catch (error) {
                  console.error("Error fetching weather:", error);
                }
              }
              
              tripsData.push(tripData);
            }
            
            setActiveTrips(tripsData);
            
            // Generate weather alerts based on conditions
            const alerts: {location: string, alert: string, severity: 'low' | 'medium' | 'high'}[] = [];
            
            tripsData.forEach(trip => {
              if (trip.weather) {
                // Check for severe weather conditions
                if (trip.weather.condition === 'thunderstorm') {
                  alerts.push({
                    location: `Route with driver ${trip.driverName}`,
                    alert: 'Thunderstorm detected on route',
                    severity: 'high'
                  });
                } else if (trip.weather.condition === 'snow') {
                  alerts.push({
                    location: `Route with driver ${trip.driverName}`,
                    alert: 'Snowy conditions may affect visibility and road safety',
                    severity: 'medium'
                  });
                } else if (trip.weather.condition === 'rain' && trip.weather.windSpeed > 5) {
                  alerts.push({
                    location: `Route with driver ${trip.driverName}`,
                    alert: 'Heavy rain with wind may affect driving conditions',
                    severity: 'medium'
                  });
                } else if (trip.weather.condition === 'mist' || trip.weather.condition === 'fog') {
                  alerts.push({
                    location: `Route with driver ${trip.driverName}`,
                    alert: 'Reduced visibility due to fog/mist',
                    severity: 'medium'
                  });
                } else if (trip.weather.windSpeed > 8) {
                  alerts.push({
                    location: `Route with driver ${trip.driverName}`,
                    alert: 'High winds may affect larger vehicles',
                    severity: 'low'
                  });
                }
              }
            });
            
            setWeatherAlerts(alerts);
            setLoading(false);
          });
          
          return () => unsubscribe();
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching weather data:', error);
        setLoading(false);
      }
    };
    
    fetchWeatherData();
  }, [currentUser]);

  // Get alert background color based on severity
  const getAlertBgColor = (severity: 'low' | 'medium' | 'high') => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-400';
      case 'medium':
        return 'bg-yellow-50 border-yellow-400';
      case 'low':
        return 'bg-blue-50 border-blue-400';
      default:
        return 'bg-gray-50 border-gray-400';
    }
  };

  // Get the route matching the selected trip, if any
  const getSelectedRoute = () => {
    if (routes.length === 0) return null;
    return routes[selectedRouteIndex];
  };

  // Find trip for a given route
  const findTripForRoute = (route: Route) => {
    return activeTrips.find(trip => trip.driverId === route.driverId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  const selectedRoute = getSelectedRoute();
  const selectedTrip = selectedRoute ? findTripForRoute(selectedRoute) : null;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Weather Monitoring</h1>
      
      {/* Weather Alerts */}
      {weatherAlerts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-3">
            Weather Alerts ({weatherAlerts.length})
          </h2>
          <div className="space-y-3">
            {weatherAlerts.map((alert, index) => (
              <div 
                key={index} 
                className={`p-4 border-l-4 rounded-r-md ${getAlertBgColor(alert.severity)}`}
              >
                <div className="flex">
                  <AlertCircle className={`h-5 w-5 ${alert.severity === 'high' ? 'text-red-400' : alert.severity === 'medium' ? 'text-yellow-400' : 'text-blue-400'}`} />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{alert.location}</p>
                    <p className="text-sm text-gray-600 mt-1">{alert.alert}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Route Selector */}
      {routes.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-3">Select Route to Monitor</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route, index) => {
              const trip = findTripForRoute(route);
              return (
                <div 
                  key={route.id}
                  onClick={() => setSelectedRouteIndex(index)}
                  className={`p-4 rounded-lg border cursor-pointer ${selectedRouteIndex === index ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900">{route.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">Driver: {trip?.driverName || 'Not assigned'}</p>
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${trip ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {trip ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Selected Route Weather Map */}
      <div className="dashboard-card mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-3">
          {selectedRoute ? `${selectedRoute.name} Weather Conditions` : 'Route Weather Map'}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <MapboxMap
              tripLocation={selectedTrip?.currentLocation}
              routeStops={selectedRoute?.stops}
              showFullRoute={true}
              className="h-96 w-full rounded-lg"
            />
          </div>
          
          <div>
            {selectedTrip && selectedTrip.weather ? (
              <div>
                <div className="p-4 bg-gray-50 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-gray-900">Current Weather</h3>
                    <span className="text-xs text-gray-500">
                      Updated: {format(new Date(selectedTrip.weather.updatedAt as any), 'h:mm a')}
                    </span>
                  </div>
                  
                  <div className="flex items-center mb-3">
                    <Cloud className="h-8 w-8 text-blue-500 mr-3" />
                    <div>
                      <div className="text-lg font-medium text-gray-900">
                        {Math.round(selectedTrip.weather.temperature)}°C
                      </div>
                      <div className="text-sm text-gray-600">
                        {selectedTrip.weather.description}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="p-2 bg-white rounded">
                      <div className="text-gray-500">Humidity</div>
                      <div className="font-medium text-gray-900">{selectedTrip.weather.humidity}%</div>
                    </div>
                    <div className="p-2 bg-white rounded">
                      <div className="text-gray-500">Wind</div>
                      <div className="font-medium text-gray-900">{selectedTrip.weather.windSpeed} m/s</div>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Road Conditions</h3>
                  
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                      <span className="text-sm">Visibility: Good</span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full ${selectedTrip.weather.condition === 'rain' || selectedTrip.weather.condition === 'snow' ? 'bg-yellow-500' : 'bg-green-500'} mr-2`}></div>
                      <span className="text-sm">
                        Road Surface: {selectedTrip.weather.condition === 'rain' ? 'Wet' : selectedTrip.weather.condition === 'snow' ? 'Slippery' : 'Dry'}
                      </span>
                    </div>
                    
                    <div className="flex items-center">
                      <div className={`h-2 w-2 rounded-full ${selectedTrip.weather.windSpeed > 8 ? 'bg-yellow-500' : 'bg-green-500'} mr-2`}></div>
                      <span className="text-sm">
                        Wind Effect: {selectedTrip.weather.windSpeed > 8 ? 'Moderate' : 'Low'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <img
                      src="https://images.unsplash.com/photo-1577086664693-894d8405334a?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBidXMlMjB0cmFuc3BvcnRhdGlvbiUyMHRyYWNraW5nJTIwbWFwJTIwbWFwYm94fGVufDB8fHx8MTc0MzIxMzU4NHww&ixlib=rb-4.0.3&fit=fillmax&h=150&w=300"
                      alt="Road map visualization"
                      className="w-full h-auto rounded-md object-cover"
                    />
                    <p className="text-xs text-center text-gray-500 mt-1">Road condition visualization</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full bg-gray-50 rounded-lg p-6 text-center">
                <Cloud className="h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-600">
                  {routes.length > 0 ? 
                    'No active trip data available for selected route' : 
                    'No routes available to monitor'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Weather Forecast */}
      <div className="dashboard-card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Weekly Weather Forecast</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {Array(5).fill(0).map((_, i) => (
            <div key={i} className="p-3 bg-gray-50 rounded-lg text-center">
              <div className="text-sm font-medium text-gray-900 mb-2">
                {new Date(Date.now() + i * 86400000).toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <Cloud className="h-8 w-8 mx-auto text-blue-500 mb-2" />
              <div className="text-sm">
                {Math.round(18 - i * 0.5)}°C
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {['Sunny', 'Cloudy', 'Partly Cloudy', 'Rainy', 'Cloudy'][i]}
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex items-center justify-center mt-6">
          <img
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBidXMlMjB0cmFuc3BvcnRhdGlvbiUyMHRyYWNraW5nJTIwd2VhdGhlciUyMGZvcmVjYXN0fGVufDB8fHx8MTc0MzIxNDg3NXww&ixlib=rb-4.0.3&fit=fillmax&h=400&w=600"
            alt="Weather forecast visualization"
            className="rounded-lg max-w-full h-auto"
          />
        </div>
        
        <p className="text-sm text-center text-gray-500 mt-2">
          Weather data provided by XWeather API
        </p>
      </div>
    </div>
  );
};
 