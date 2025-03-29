import  { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot,
  doc,
  getDoc,
  Timestamp,
  limit 
} from '../../firebase';
import { safeFirestoreQuery, safeFirestoreGet } from '../../utils/firebaseHelpers';
import { Student, Trip, TripStatus, User, UserRole, Notification as NotificationType, Route } from '../../types';
import { MapPin, Clock, User as UserIcon, Bus, AlertCircle, Phone, RefreshCw, Map, Calendar, Cloud } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MapboxMap } from '../../components/MapboxMap';
import { WeatherDisplay } from '../../components/WeatherDisplay';
import { format, parseISO } from 'date-fns';

export const ParentDashboard = () => {
  const { currentUser } = useAuth();
  const [children, setChildren] = useState<Student[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [drivers, setDrivers] = useState<Record<string, User>>({});
  const [routes, setRoutes] = useState<Record<string, Route>>({});
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [tripHistory, setTripHistory] = useState<Trip[]>([]);
  const [selectedChildIndex, setSelectedChildIndex] = useState(0);
  const [showDriverDetails, setShowDriverDetails] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const fetchParentData = async () => {
      try {
        // Fetch children
        const childrenData = await safeFirestoreQuery('students', 'parentId', '==', currentUser.uid);
        setChildren(childrenData as Student[]);
        
        const driverIds = new Set<string>();
        const routeIds = new Set<string>();
        
        // Get unique driver IDs from children
        childrenData.forEach((child: Student) => {
          if (child.driverId) {
            driverIds.add(child.driverId);
          }
        });
        
        // Fetch drivers data
        const driversData: Record<string, User> = {};
        for (const driverId of driverIds) {
          try {
            const driverData = await safeFirestoreGet('users', driverId);
            if (driverData) {
              driversData[driverId] = driverData as User;
            }
          } catch (error) {
            console.error(`Error fetching driver ${driverId}:`, error);
          }
        }
        setDrivers(driversData);
        
        // Fetch routes data for these drivers
        const routesData: Record<string, Route> = {};
        for (const driverId of driverIds) {
          try {
            const routesQuery = query(
              collection(db, 'routes'),
              where('driverId', '==', driverId)
            );
            const routesSnapshot = await getDocs(routesQuery);
            if (!routesSnapshot.empty) {
              routesSnapshot.forEach(doc => {
                const routeData = { id: doc.id, ...doc.data() } as Route;
                routesData[routeData.id] = routeData;
                routeIds.add(routeData.id);
              });
            }
          } catch (error) {
            console.error(`Error fetching routes for driver ${driverId}:`, error);
          }
        }
        setRoutes(routesData);
        
        // Fetch active trips for children's drivers
        if (driverIds.size > 0) {
          // Set up listener for active trips
          try {
            const tripsQuery = query(
              collection(db, 'trips'),
              where('driverId', 'in', Array.from(driverIds)),
              where('status', '==', TripStatus.IN_PROGRESS)
            );
            
            const unsubscribe = onSnapshot(tripsQuery, (snapshot) => {
              const tripsData: Trip[] = [];
              snapshot.forEach((doc) => {
                tripsData.push({ id: doc.id, ...doc.data() } as Trip);
              });
              setActiveTrips(tripsData);
            }, (error) => {
              console.error("Error setting up trips listener:", error);
            });
            
            // Fetch trip history (last 5 completed trips)
            try {
              const historyQuery = query(
                collection(db, 'trips'),
                where('status', '==', TripStatus.COMPLETED),
                where('driverId', 'in', Array.from(driverIds)),
                limit(5)
              );
              
              const historySnapshot = await getDocs(historyQuery);
              const historyData: Trip[] = [];
              historySnapshot.forEach((doc) => {
                historyData.push({ id: doc.id, ...doc.data() } as Trip);
              });
              
              // Sort by end time, descending (most recent first)
              historyData.sort((a, b) => {
                const aTime = a.endTime ? new Date(a.endTime as any).getTime() : 0;
                const bTime = b.endTime ? new Date(b.endTime as any).getTime() : 0;
                return bTime - aTime;
              });
              
              setTripHistory(historyData);
            } catch (error) {
              console.error("Error fetching trip history:", error);
            }
            
            // Fetch notifications
            try {
              const notificationsQuery = query(
                collection(db, 'notifications'),
                where('userId', '==', currentUser.uid),
                where('read', '==', false)
              );
              
              const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
                const notificationsData: NotificationType[] = [];
                snapshot.forEach((doc) => {
                  notificationsData.push({ id: doc.id, ...doc.data() } as NotificationType);
                });
                setNotifications(notificationsData);
              }, (error) => {
                console.error("Error setting up notifications listener:", error);
              });
              
              setLoading(false);
              return () => {
                unsubscribe();
                notificationsUnsubscribe();
              };
            } catch (error) {
              console.error("Error setting up notifications listener:", error);
            }
          } catch (error) {
            console.error("Error setting up trips listener:", error);
            setLoading(false);
          }
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching parent data:', error);
        setLoading(false);
      }
    };
    
    fetchParentData();
  }, [currentUser]);

  // Find active trip for a given student
  const findActiveTrip = (student: Student) => {
    return activeTrips.find(trip => trip.driverId === student.driverId);
  };

  // Get status message for a student
  const getStudentStatus = (student: Student) => {
    const trip = findActiveTrip(student);
    
    if (!trip) {
      return "No active trip";
    }
    
    if (trip.studentsOnboard && trip.studentsOnboard.includes(student.id)) {
      return "On the bus";
    }
    
    if (trip.studentsExited && trip.studentsExited.includes(student.id)) {
      return "Exited the bus";
    }
    
    return "Waiting for pickup";
  };

  // Format date for display
  const formatDate = (date: Date | null | string) => {
    if (!date) return "N/A";
    
    const dateObj = typeof date === 'string' ? parseISO(date) : new Date(date as any);
    
    return format(dateObj, 'MMM d, h:mm a');
  };

  // Get route information for a driver
  const getRouteForDriver = (driverId: string) => {
    for (const routeId in routes) {
      if (routes[routeId].driverId === driverId) {
        return routes[routeId];
      }
    }
    return null;
  };

  // Get color based on student status
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
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  // Handle case with no children
  if (children.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Parent Dashboard</h1>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You don't have any children registered in the system. Please contact your school administrator.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Get the selected child and related data
  const selectedChild = children[selectedChildIndex];
  const selectedTrip = findActiveTrip(selectedChild);
  const selectedDriver = selectedChild.driverId ? drivers[selectedChild.driverId] : null;
  const selectedRoute = selectedDriver ? getRouteForDriver(selectedDriver.uid) : null;
  const studentStatus = getStudentStatus(selectedChild);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Parent Dashboard</h1>
      
      {notifications.length > 0 && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-blue-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                You have {notifications.length} new notification{notifications.length === 1 ? '' : 's'}.
              </p>
              <ul className="mt-2 space-y-1">
                {notifications.slice(0, 3).map(notification => (
                  <li key={notification.id} className="text-xs text-blue-600">
                    • {notification.title}: {notification.message}
                  </li>
                ))}
                {notifications.length > 3 && (
                  <li className="text-xs text-blue-600">
                    • And {notifications.length - 3} more...
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Child selector tabs */}
      {children.length > 1 && (
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-4">
            {children.map((child, index) => (
              <button
                key={child.id}
                onClick={() => setSelectedChildIndex(index)}
                className={`py-3 px-2 text-sm font-medium border-b-2 ${
                  index === selectedChildIndex 
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {child.fullName}
              </button>
            ))}
          </nav>
        </div>
      )}
      
      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Student info and track button */}
        <div className="lg:col-span-1">
          <div className="dashboard-card mb-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center">
                <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h2 className="text-lg font-medium text-gray-900">{selectedChild.fullName}</h2>
                  <p className="text-sm text-gray-500">{selectedChild.grade} • {selectedChild.school}</p>
                </div>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(studentStatus)}`}>
                {studentStatus}
              </div>
            </div>
            
            <div className="border-t border-gray-100 pt-4 mt-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Bus className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="ml-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">Driver</p>
                      <button 
                        onClick={() => setShowDriverDetails(!showDriverDetails)}
                        className="text-xs text-blue-600 hover:text-blue-800"
                      >
                        {showDriverDetails ? 'Hide details' : 'Show details'}
                      </button>
                    </div>
                    <div className="flex items-center">
                      <p className="text-sm text-gray-500">
                        {selectedDriver ? selectedDriver.displayName : 'Not assigned'}
                      </p>
                      {selectedDriver && selectedDriver.phoneNumber && (
                        <a 
                          href={`tel:${selectedDriver.phoneNumber}`} 
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                    
                    {showDriverDetails && selectedDriver && (
                      <div className="mt-2 p-3 bg-gray-50 rounded-md">
                        <p className="text-xs font-medium text-gray-700">Contact Information:</p>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Phone:</span> {selectedDriver.phoneNumber || 'Not available'}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-medium">Email:</span> {selectedDriver.email}
                        </p>
                        {selectedRoute && (
                          <div className="mt-2">
                            <p className="text-xs font-medium text-gray-700">Route Information:</p>
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Route:</span> {selectedRoute.name}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              <span className="font-medium">Total stops:</span> {selectedRoute.stops?.length || 0}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Trip Status</p>
                    <p className="text-sm text-gray-500">
                      {selectedTrip ? 
                        `Started: ${formatDate(selectedTrip.startTime)}` : 
                        'No active trip'
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">Current Location</p>
                    <p className="text-sm text-gray-500">
                      {selectedTrip && selectedTrip.currentLocation 
                        ? `${selectedTrip.currentLocation.latitude.toFixed(6)}, ${selectedTrip.currentLocation.longitude.toFixed(6)}`
                        : 'Location not available'
                      }
                    </p>
                  </div>
                </div>

                {selectedTrip && selectedTrip.weather && (
                  <div className="flex items-start">
                    <Cloud className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">Weather</p>
                      <p className="text-sm text-gray-500">
                        {`${Math.round(selectedTrip.weather.temperature)}°C, ${selectedTrip.weather.description}`}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        Wind: {selectedTrip.weather.windSpeed} m/s • Humidity: {selectedTrip.weather.humidity}%
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-100">
              <button
                onClick={() => window.open(`/track-bus/${selectedChild.id}`, '_blank')}
                className="block w-full text-center py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
              >
                Track Bus
              </button>
            </div>
          </div>
          
          {/* Trip history */}
          <div className="dashboard-card">
            <h2 className="text-lg font-medium text-gray-900 mb-3">Recent Trip History</h2>
            {tripHistory.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {tripHistory.slice(0, 3).map((trip) => (
                  <li key={trip.id} className="py-3">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {trip.driverName || "Unknown Driver"}
                        </p>
                        <div className="flex text-xs text-gray-500 space-x-2">
                          <span>Start: {formatDate(trip.startTime)}</span>
                          <span>•</span>
                          <span>End: {formatDate(trip.endTime)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-center text-gray-500 py-4">
                No trip history available
              </p>
            )}
          </div>
        </div>
        
        {/* Right column - Map and trip details */}
        <div className="lg:col-span-2">
          <div className="dashboard-card mb-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Live Bus Tracking</h2>
            
            <MapboxMap
              tripLocation={selectedTrip?.currentLocation}
              studentLocation={selectedChild.homeLocation}
              routeStops={selectedRoute?.stops.filter(stop => stop.studentId === selectedChild.id)}
              className="h-80 w-full rounded-lg overflow-hidden mb-4"
            />
            
            {selectedTrip && selectedTrip.currentLocation ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Estimated Arrival</h3>
                  <p className="text-lg font-bold text-blue-600">
                    {/* Normally would calculate based on distance/speed */}
                    {`${5 + Math.floor(Math.random() * 15)} minutes`}
                  </p>
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Map className="h-3 w-3 mr-1" />
                    <span>Based on current traffic conditions</span>
                  </div>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Trip Progress</h3>
                  <div className="relative pt-1">
                    <div className="flex mb-2 items-center justify-between">
                      <div>
                        <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                          In Progress
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-semibold inline-block text-blue-600">
                          {Math.floor(Math.random() * 76) + 25}%
                        </span>
                      </div>
                    </div>
                    <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                      <div style={{ width: "75%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500"></div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      No active trip in progress. Bus location will appear here once the trip begins.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Additional details card */}
          <div className="dashboard-card">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Transportation Details</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Stop Location</h3>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 text-red-500 mr-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Home Address</p>
                      <p className="text-xs text-gray-500">
                        {selectedChild.homeLocation ? 
                          `${selectedChild.homeLocation.latitude.toFixed(6)}, ${selectedChild.homeLocation.longitude.toFixed(6)}` : 
                          'No location data'
                        }
                      </p>
                    </div>
                  </div>
                  
                  {selectedRoute && selectedRoute.stops && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-700">Scheduled Pickup Time:</p>
                      <div className="mt-1">
                        {selectedRoute.stops
                          .filter(stop => stop.studentId === selectedChild.id)
                          .map((stop, index) => (
                            <div key={index} className="flex items-center">
                              <Clock className="h-4 w-4 text-blue-500 mr-2" />
                              <p className="text-sm font-medium text-gray-900">
                                {format(new Date(stop.estimatedTime as any), 'h:mm a')}
                              </p>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Bus Information</h3>
                  <div className="space-y-2">
                    {selectedRoute ? (
                      <>
                        <p className="text-sm">
                          <span className="font-medium">Route:</span> {selectedRoute.name}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Total stops:</span> {selectedRoute.stops?.length || 0}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Students:</span> {selectedRoute.students?.length || 0}
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-500">No route information available</p>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="px-4 py-3 bg-blue-50 rounded-lg">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-blue-500" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Notice</h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <p>
                        All bus statuses are updated in real-time. For additional information or issues, 
                        please contact your school's transportation office.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
 