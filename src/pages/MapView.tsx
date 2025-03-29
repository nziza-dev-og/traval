import  { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot,
  doc,
  getDoc,
  getDocs
} from '../firebase';
import { safeFirestoreGet } from '../utils/firebaseHelpers';
import { Trip, TripStatus, Student, User, Route, RouteStop } from '../types';
import { ArrowLeft, Bus, User as UserIcon, Phone, Clock, Map as MapIcon } from 'lucide-react';
import { MapboxMap } from '../components/MapboxMap';
import { WeatherDisplay } from '../components/WeatherDisplay';
import { fetchWeather } from '../utils/weatherApi';
import { format } from 'date-fns';

export const MapView = () => {
  const { studentId } = useParams();
  const [student, setStudent] = useState<Student | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [driver, setDriver] = useState<User | null>(null);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [routeStops, setRouteStops] = useState<RouteStop[] | null>(null);

  useEffect(() => {
    if (!studentId) {
      setError("Student ID is required");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Fetch student data
        const studentData = await safeFirestoreGet('students', studentId);
        if (!studentData) {
          setError("Student not found");
          setLoading(false);
          return;
        }
        
        setStudent(studentData as Student);
        
        // Fetch driver data
        if (studentData.driverId) {
          const driverData = await safeFirestoreGet('users', studentData.driverId);
          setDriver(driverData as User);
          
          // Fetch route data
          const routesQuery = query(
            collection(db, 'routes'),
            where('driverId', '==', studentData.driverId)
          );
          
          const routesSnapshot = await getDocs(routesQuery);
          if (!routesSnapshot.empty) {
            const routeData = { id: routesSnapshot.docs[0].id, ...routesSnapshot.docs[0].data() } as Route;
            setRoute(routeData);
            
            // Filter route stops to include only the current student and nearby stops
            if (routeData.stops && routeData.stops.length > 0) {
              const studentStopIndex = routeData.stops.findIndex(stop => stop.studentId === studentId);
              
              if (studentStopIndex !== -1) {
                // Get a few stops before and after the student's stop
                const startIndex = Math.max(0, studentStopIndex - 2);
                const endIndex = Math.min(routeData.stops.length, studentStopIndex + 3);
                setRouteStops(routeData.stops.slice(startIndex, endIndex));
              } else {
                setRouteStops(routeData.stops);
              }
            }
          }
          
          // Set up real-time listener for active trip
          const tripsQuery = query(
            collection(db, 'trips'),
            where('driverId', '==', studentData.driverId),
            where('status', '==', TripStatus.IN_PROGRESS)
          );
          
          const unsubscribe = onSnapshot(tripsQuery, async (snapshot) => {
            if (!snapshot.empty) {
              const tripDoc = snapshot.docs[0];
              const tripData = { id: tripDoc.id, ...tripDoc.data() } as Trip;
              
              // Fetch weather data if we have a location
              if (tripData.currentLocation && !tripData.weather) {
                try {
                  const weatherData = await fetchWeather(
                    tripData.currentLocation.latitude,
                    tripData.currentLocation.longitude
                  );
                  if (weatherData) {
                    tripData.weather = weatherData;
                  }
                } catch (weatherErr) {
                  console.error("Error fetching weather:", weatherErr);
                }
              }
              
              setTrip(tripData);
            } else {
              setTrip(null);
            }
            setLoading(false);
          }, (error) => {
            console.error("Error setting up trips listener:", error);
            setError("Failed to fetch trip data");
            setLoading(false);
          });
          
          return unsubscribe;
        } else {
          setError("No driver assigned to this student");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
        setLoading(false);
      }
    };
    
    fetchData();
  }, [studentId]);

  const getStudentStatus = () => {
    if (!trip) {
      return "No active trip";
    }
    
    if (trip.studentsOnboard?.includes(studentId as string)) {
      return "On the bus";
    }
    
    if (trip.studentsExited?.includes(studentId as string)) {
      return "Exited the bus";
    }
    
    return "Waiting for pickup";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "On the bus":
        return "bg-green-100 text-green-800";
      case "Exited the bus":
        return "bg-blue-100 text-blue-800";
      case "Waiting for pickup":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading map view...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link to="/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-800">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link to="/dashboard" className="text-gray-500 hover:text-gray-700 mr-4">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Bus Tracking</h1>
            </div>
            
            {trip && trip.currentLocation && (
              <WeatherDisplay 
                location={trip.currentLocation} 
                compact={true}
              />
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UserIcon className="h-5 w-5 text-blue-600" />
              </div>
              <div className="ml-3">
                <h2 className="text-lg font-medium text-gray-900">{student?.fullName}</h2>
                <p className="text-sm text-gray-500">{student?.grade} • {student?.school}</p>
              </div>
              <div className="ml-auto">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(getStudentStatus())}`}>
                  {getStudentStatus()}
                </span>
              </div>
            </div>
          </div>
          
          {driver && (
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="md:flex md:items-center md:justify-between">
                <div className="flex items-center">
                  <Bus className="h-5 w-5 text-gray-500 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Driver: {driver.displayName}</p>
                    {driver.phoneNumber && (
                      <div className="flex items-center mt-1">
                        <Phone className="h-4 w-4 text-gray-400 mr-1" />
                        <a href={`tel:${driver.phoneNumber}`} className="text-xs text-blue-600">
                          {driver.phoneNumber}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
                {trip && (
                  <div className="mt-2 md:mt-0 md:text-right">
                    <div className="flex items-center md:justify-end">
                      <Clock className="h-4 w-4 text-gray-400 mr-1" />
                      <p className="text-xs text-gray-500">
                        Trip started: {trip.startTime ? format(new Date(trip.startTime as any), 'h:mm a') : 'N/A'}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {trip.studentsOnboard?.length || 0} students onboard
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="p-4">
            <MapboxMap
              tripLocation={trip?.currentLocation}
              studentLocation={student?.homeLocation}
              routeStops={routeStops || undefined}
              showFullRoute={true}
              className="h-96 w-full rounded-lg shadow-sm"
            />
            
            {trip && trip.currentLocation && (
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="col-span-1 md:col-span-2 bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Current Location</h3>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-600">
                        Latitude: {trip.currentLocation.latitude.toFixed(6)}
                      </p>
                      <p className="text-xs text-gray-600">
                        Longitude: {trip.currentLocation.longitude.toFixed(6)}
                      </p>
                      <p className="text-sm font-medium text-blue-600 mt-2">
                        {getEstimatedArrival()}
                      </p>
                    </div>
                    <img 
                      src="https://images.unsplash.com/photo-1577086664693-894d8405334a?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBidXMlMjB0cmFuc3BvcnRhdGlvbiUyMHRyYWNraW5nJTIwbWFwJTIwbWFwYm94fGVufDB8fHx8MTc0MzIxMzU4NHww&ixlib=rb-4.0.3&fit=fillmax&h=80&w=80"
                      alt="Map icon"
                      className="w-20 h-20 rounded-md object-cover"
                    />
                  </div>
                </div>
                
                <div>
                  <WeatherDisplay location={trip.currentLocation} />
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Trip Information</h2>
          </div>
          <div className="p-4">
            {trip ? (
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700">Route</p>
                  <p className="text-sm text-gray-500">{route?.name || 'Route information unavailable'}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Estimated Arrival</p>
                  <p className="text-sm text-gray-500">{getEstimatedArrival()}</p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Weather Conditions</p>
                  <p className="text-sm text-gray-500">
                    {trip.weather ? 
                      `${Math.round(trip.weather.temperature)}°C, ${trip.weather.description}` : 
                      'Weather information unavailable'
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-sm font-medium text-gray-700">Real-time Updates</p>
                  <p className="text-sm text-gray-500">
                    Location updates every 30 seconds
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No active trip information available
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
  
  function getEstimatedArrival() {
    if (!trip || !trip.currentLocation || !student) return "Unknown";
    
    // This would normally calculate the ETA based on distance, traffic, etc.
    // For demo purposes, we'll just return a random time between 5-20 minutes
    const minutes = Math.floor(Math.random() * 16) + 5;
    
    return `Estimated arrival in ${minutes} minutes`;
  }
};
 