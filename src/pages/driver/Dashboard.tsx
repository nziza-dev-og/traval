import  { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  doc, 
  updateDoc, 
  Timestamp,
  addDoc,
  setDoc
} from '../../firebase';
import { safeFirestoreGet, safeFirestoreQuery } from '../../utils/firebaseHelpers';
import { Student, Trip, TripStatus, Route, RouteStop, BehaviorType, BehaviorReport, WeatherInfo } from '../../types';
import { 
  Play, Pause, Map, User, CheckCircle, XCircle, AlertCircle, MapPin, 
  Clock, MessageSquare, RefreshCw, LogOut, Cloud, Thermometer, ThumbsUp
} from 'lucide-react';
import { MapboxMap } from '../../components/MapboxMap';
import { WeatherDisplay } from '../../components/WeatherDisplay';
import { fetchWeather } from '../../utils/weatherApi';
import { BehaviorReportModal } from '../../components/BehaviorReportModal';
import { format } from 'date-fns';

export const DriverDashboard = () => {
  const { currentUser } = useAuth();
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
  const [assignedRoute, setAssignedRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentsStatus, setStudentsStatus] = useState<Record<string, 'waiting' | 'onboard' | 'exited'>>({});
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationUpdateInterval, setLocationUpdateInterval] = useState<number | null>(null);
  const [weatherInfo, setWeatherInfo] = useState<WeatherInfo | null>(null);
  const [showBehaviorModal, setShowBehaviorModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    const fetchDriverData = async () => {
      try {
        // Fetch assigned students
        const studentsData = await safeFirestoreQuery('students', 'driverId', '==', currentUser.uid);
        setAssignedStudents(studentsData as Student[]);
        
        // Initialize student status object
        const initialStatus: Record<string, 'waiting' | 'onboard' | 'exited'> = {};
        studentsData.forEach((student: Student) => {
          initialStatus[student.id] = 'waiting';
        });
        setStudentsStatus(initialStatus);
        
        // Fetch assigned route
        const routesData = await safeFirestoreQuery('routes', 'driverId', '==', currentUser.uid);
        if (routesData && routesData.length > 0) {
          setAssignedRoute(routesData[0] as Route);
        }
        
        // Set up listener for active trip
        const tripsQuery = query(
          collection(db, 'trips'),
          where('driverId', '==', currentUser.uid),
          where('status', '==', TripStatus.IN_PROGRESS)
        );
        
        const unsubscribe = onSnapshot(tripsQuery, async (snapshot) => {
          if (!snapshot.empty) {
            const tripDoc = snapshot.docs[0];
            const tripData = { id: tripDoc.id, ...tripDoc.data() } as Trip;
            
            // Update students status based on trip data
            if (tripData.studentsOnboard || tripData.studentsExited) {
              const updatedStatus: Record<string, 'waiting' | 'onboard' | 'exited'> = {};
              studentsData.forEach((student: Student) => {
                if (tripData.studentsExited?.includes(student.id)) {
                  updatedStatus[student.id] = 'exited';
                } else if (tripData.studentsOnboard?.includes(student.id)) {
                  updatedStatus[student.id] = 'onboard';
                } else {
                  updatedStatus[student.id] = 'waiting';
                }
              });
              setStudentsStatus(updatedStatus);
            }
            
            // Fetch weather data if we have a location but no weather info
            if (tripData.currentLocation && !tripData.weather) {
              try {
                const weatherData = await fetchWeather(
                  tripData.currentLocation.latitude,
                  tripData.currentLocation.longitude
                );
                if (weatherData) {
                  // Update trip with weather data
                  await updateDoc(doc(db, 'trips', tripData.id), {
                    weather: weatherData
                  });
                  
                  tripData.weather = weatherData;
                  setWeatherInfo(weatherData);
                }
              } catch (error) {
                console.error("Error fetching weather:", error);
              }
            } else if (tripData.weather) {
              setWeatherInfo(tripData.weather);
            }
            
            setCurrentTrip(tripData);
          } else {
            setCurrentTrip(null);
            setWeatherInfo(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error setting up trips listener:", error);
          setLoading(false);
        });
        
        // Get user location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              setUserLocation(newLocation);
              
              // Fetch initial weather data
              fetchWeather(newLocation.latitude, newLocation.longitude)
                .then(data => {
                  if (data) setWeatherInfo(data);
                })
                .catch(error => console.error("Error fetching weather:", error));
            },
            (error) => {
              console.error("Error getting location:", error);
            }
          );
        }
        
        return () => {
          unsubscribe();
          if (locationUpdateInterval) {
            clearInterval(locationUpdateInterval);
          }
        };
      } catch (error) {
        console.error('Error fetching driver data:', error);
        setLoading(false);
      }
    };
    
    fetchDriverData();
  }, [currentUser]);

  const startTrip = async () => {
    if (!currentUser || !assignedRoute) return;
    
    try {
      // Get current location
      let currentLocation = userLocation;
      
      if (!currentLocation && navigator.geolocation) {
        await new Promise<void>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              currentLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              resolve();
            },
            (error) => {
              console.error("Error getting location:", error);
              reject(error);
            }
          );
        });
      }
      
      // Fetch weather data for the current location
      let weatherData: WeatherInfo | null = null;
      if (currentLocation) {
        weatherData = await fetchWeather(currentLocation.latitude, currentLocation.longitude);
        setWeatherInfo(weatherData);
      }
      
      const tripData: Omit<Trip, 'id'> = {
        driverId: currentUser.uid,
        driverName: currentUser.displayName,
        startTime: new Date(),
        endTime: null,
        status: TripStatus.IN_PROGRESS,
        routeId: assignedRoute.id,
        studentsOnboard: [],
        studentsExited: [],
        currentLocation,
        adminId: assignedRoute.adminId,
        weather: weatherData || undefined
      };
      
      const tripRef = await addDoc(collection(db, 'trips'), {
        ...tripData,
        startTime: Timestamp.fromDate(new Date())
      });
      
      // Reset all student statuses
      const initialStatus: Record<string, 'waiting' | 'onboard' | 'exited'> = {};
      assignedStudents.forEach(student => {
        initialStatus[student.id] = 'waiting';
      });
      setStudentsStatus(initialStatus);
      
      // Set up location update interval
      if (navigator.geolocation) {
        const intervalId = window.setInterval(() => {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const newLocation = {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
              };
              setUserLocation(newLocation);
              
              // Update trip with new location
              try {
                await updateDoc(doc(db, 'trips', tripRef.id), {
                  currentLocation: newLocation
                });
                
                // Update weather every 15 minutes (this is usually more than enough for weather updates)
                const now = new Date();
                if (!weatherInfo || (now.getTime() - new Date(weatherInfo.updatedAt as any).getTime() > 15 * 60 * 1000)) {
                  const newWeather = await fetchWeather(newLocation.latitude, newLocation.longitude);
                  if (newWeather) {
                    await updateDoc(doc(db, 'trips', tripRef.id), {
                      weather: newWeather
                    });
                    setWeatherInfo(newWeather);
                  }
                }
              } catch (error) {
                console.error("Error updating location:", error);
              }
            },
            (error) => {
              console.error("Error getting updated location:", error);
            }
          );
        }, 30000); // Update every 30 seconds
        
        setLocationUpdateInterval(intervalId as unknown as number);
      }
      
      // Create notification for admins
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: assignedRoute.adminId,
          title: 'Trip Started',
          message: `Driver ${currentUser.displayName} has started their route.`,
          read: false,
          createdAt: Timestamp.fromDate(new Date()),
          type: 'trip_started',
          driverId: currentUser.uid
        });
      } catch (err) {
        console.error("Error creating notification:", err);
      }
    } catch (error) {
      console.error('Error starting trip:', error);
    }
  };

  const endTrip = async () => {
    if (!currentTrip) return;
    
    try {
      await updateDoc(doc(db, 'trips', currentTrip.id), {
        status: TripStatus.COMPLETED,
        endTime: Timestamp.fromDate(new Date())
      });
      
      // Clear location update interval
      if (locationUpdateInterval) {
        clearInterval(locationUpdateInterval);
        setLocationUpdateInterval(null);
      }
      
      // Create notification for admins
      try {
        await addDoc(collection(db, 'notifications'), {
          userId: assignedRoute?.adminId || '',
          title: 'Trip Ended',
          message: `Driver ${currentUser?.displayName} has completed their route.`,
          read: false,
          createdAt: Timestamp.fromDate(new Date()),
          type: 'trip_ended',
          driverId: currentUser?.uid
        });
      } catch (err) {
        console.error("Error creating notification:", err);
      }
      
      // Reset student statuses
      const resetStatus: Record<string, 'waiting' | 'onboard' | 'exited'> = {};
      assignedStudents.forEach(student => {
        resetStatus[student.id] = 'waiting';
      });
      setStudentsStatus(resetStatus);
    } catch (error) {
      console.error('Error ending trip:', error);
    }
  };

  const toggleStudentStatus = async (student: Student) => {
    if (!currentTrip) return;
    
    const currentStatus = studentsStatus[student.id];
    let newStatus: 'waiting' | 'onboard' | 'exited';
    
    // Determine the next status in the cycle: waiting -> onboard -> exited
    if (currentStatus === 'waiting') {
      newStatus = 'onboard';
    } else if (currentStatus === 'onboard') {
      newStatus = 'exited';
    } else {
      // If already exited, do nothing
      return;
    }
    
    try {
      // Update local state first for better UI responsiveness
      setStudentsStatus(prev => ({ ...prev, [student.id]: newStatus }));
      
      // Update the appropriate list in the trip document
      let updatedOnboard = [...(currentTrip.studentsOnboard || [])];
      let updatedExited = [...(currentTrip.studentsExited || [])];
      
      if (newStatus === 'onboard') {
        // Add to onboard list if not already there
        if (!updatedOnboard.includes(student.id)) {
          updatedOnboard.push(student.id);
        }
        // Remove from exited list if it was there
        updatedExited = updatedExited.filter(id => id !== student.id);
      } else if (newStatus === 'exited') {
        // Remove from onboard list
        updatedOnboard = updatedOnboard.filter(id => id !== student.id);
        // Add to exited list if not already there
        if (!updatedExited.includes(student.id)) {
          updatedExited.push(student.id);
        }
      }
      
      await updateDoc(doc(db, 'trips', currentTrip.id), {
        studentsOnboard: updatedOnboard,
        studentsExited: updatedExited
      });
      
      // Create a notification for the parent
      if (student.parentId) {
        try {
          await addDoc(collection(db, 'notifications'), {
            userId: student.parentId,
            title: newStatus === 'onboard' ? 'Student Boarded' : 'Student Dropped Off',
            message: `${student.fullName} has ${newStatus === 'onboard' ? 'boarded the bus' : 'been dropped off'}`,
            read: false,
            createdAt: Timestamp.fromDate(new Date()),
            type: newStatus === 'onboard' ? 'student_onboard' : 'student_dropoff',
            studentId: student.id,
            driverId: currentUser?.uid
          });
        } catch (error) {
          console.error('Error creating notification:', error);
        }
      }
    } catch (error) {
      console.error('Error updating student status:', error);
      // Revert UI state on error
      setStudentsStatus(prev => ({ ...prev, [student.id]: currentStatus }));
    }
  };

  const reportIssue = () => {
    const issue = prompt("Please describe the issue you're experiencing:");
    if (!issue) return;
    
    try {
      addDoc(collection(db, 'issues'), {
        driverId: currentUser?.uid,
        driverName: currentUser?.displayName,
        tripId: currentTrip?.id || null,
        description: issue,
        status: 'open',
        createdAt: Timestamp.fromDate(new Date())
      });
      
      alert("Your issue has been reported. An administrator will review it shortly.");
    } catch (error) {
      console.error('Error reporting issue:', error);
      alert("Failed to report issue. Please try again.");
    }
  };

  const handleReportBehavior = (student: Student) => {
    setSelectedStudent(student);
    setShowBehaviorModal(true);
  };

  const submitBehaviorReport = async (report: {
    studentId: string;
    type: BehaviorType;
    description: string;
  }) => {
    if (!currentUser || !currentTrip) {
      throw new Error("Cannot submit report: Driver or trip information missing");
    }
    
    // Create behavior report
    const behaviorReport: Omit<BehaviorReport, 'id'> = {
      studentId: report.studentId,
      driverId: currentUser.uid,
      driverName: currentUser.displayName,
      tripId: currentTrip.id,
      type: report.type,
      description: report.description,
      createdAt: new Date(),
      status: 'pending'
    };
    
    // Save to Firebase
    const reportRef = await addDoc(collection(db, 'behaviorReports'), {
      ...behaviorReport,
      createdAt: Timestamp.fromDate(new Date())
    });
    
    // Find student
    const student = assignedStudents.find(s => s.id === report.studentId);
    
    // Notification for admin
    if (assignedRoute?.adminId) {
      await addDoc(collection(db, 'notifications'), {
        userId: assignedRoute.adminId,
        title: 'Student Behavior Report',
        message: `${currentUser.displayName} reported ${report.type} behavior for ${student?.fullName || 'a student'}`,
        read: false,
        createdAt: Timestamp.fromDate(new Date()),
        type: 'student_behavior',
        studentId: report.studentId,
        driverId: currentUser.uid
      });
    }
    
    // Notification for parent if serious
    if (student?.parentId && report.type !== BehaviorType.POSITIVE) {
      await addDoc(collection(db, 'notifications'), {
        userId: student.parentId,
        title: 'Behavior Notification',
        message: `Your child's driver has reported ${report.type} behavior.`,
        read: false,
        createdAt: Timestamp.fromDate(new Date()),
        type: 'student_behavior',
        studentId: report.studentId,
        driverId: currentUser.uid
      });
    }
    
    return reportRef.id;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <RefreshCw className="h-8 w-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Driver Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="dashboard-card col-span-1">
          <div className="flex justify-between items-start">
            <h2 className="text-lg font-medium text-gray-900 mb-2">Trip Status</h2>
            {weatherInfo && (
              <WeatherDisplay 
                location={userLocation} 
                compact={true}
              />
            )}
          </div>
          
          <div className="flex flex-col items-center py-4">
            {currentTrip ? (
              <>
                <div className="mb-4 bg-green-100 text-green-700 rounded-full px-4 py-1 text-sm font-medium">
                  Trip In Progress
                </div>
                <p className="text-sm text-gray-600 mb-2">
                  Trip started at {currentTrip.startTime ? format(new Date(currentTrip.startTime as any), 'h:mm a') : 'N/A'}
                </p>
                <div className="flex space-x-3 text-sm text-gray-600 mb-6">
                  <span className="flex items-center">
                    <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                    {Object.values(studentsStatus).filter(status => status === 'onboard').length} onboard
                  </span>
                  <span className="flex items-center">
                    <LogOut className="h-4 w-4 text-blue-500 mr-1" />
                    {Object.values(studentsStatus).filter(status => status === 'exited').length} exited
                  </span>
                </div>
                <button 
                  onClick={endTrip} 
                  className="btn-danger flex items-center"
                >
                  <Pause size={18} className="mr-2" />
                  End Trip
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 bg-gray-100 text-gray-700 rounded-full px-4 py-1 text-sm font-medium">
                  No Active Trip
                </div>
                <p className="text-sm text-gray-600 mb-6">
                  Start a new trip to begin tracking
                </p>
                <button 
                  onClick={startTrip} 
                  className="btn-primary flex items-center"
                  disabled={!assignedRoute}
                >
                  <Play size={18} className="mr-2" />
                  Start Trip
                </button>
                {!assignedRoute && (
                  <p className="text-sm text-red-500 mt-2">
                    No route assigned yet
                  </p>
                )}
              </>
            )}
          </div>
        </div>
        
        <div className="dashboard-card col-span-1 lg:col-span-2">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Assigned Students</h2>
          
          {currentTrip && weatherInfo && (
            <div className="mb-4 grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="col-span-2">
                <MapboxMap
                  tripLocation={currentTrip.currentLocation}
                  routeStops={assignedRoute?.stops}
                  showFullRoute={true}
                  className="h-48 w-full rounded-lg"
                />
              </div>
              <div>
                <WeatherDisplay location={currentTrip.currentLocation || userLocation} />
              </div>
            </div>
          )}
          
          {assignedStudents.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {assignedStudents.map((student) => (
                <li key={student.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{student.fullName}</p>
                      <p className="text-xs text-gray-500">{student.grade} • {student.school}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {currentTrip && (
                      <>
                        <button
                          onClick={() => handleReportBehavior(student)}
                          className="flex items-center space-x-1 px-2 py-1 text-xs rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200"
                        >
                          <AlertCircle className="h-3 w-3" />
                          <span>Report</span>
                        </button>
                        
                        {studentsStatus[student.id] === 'waiting' && (
                          <button 
                            onClick={() => toggleStudentStatus(student)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                          >
                            <CheckCircle className="h-3 w-3" />
                            <span>Board</span>
                          </button>
                        )}
                        
                        {studentsStatus[student.id] === 'onboard' && (
                          <button 
                            onClick={() => toggleStudentStatus(student)}
                            className="flex items-center space-x-1 px-3 py-1 text-xs rounded-md text-green-700 bg-green-100 hover:bg-green-200"
                          >
                            <LogOut className="h-3 w-3" />
                            <span>Exit</span>
                          </button>
                        )}
                        
                        {studentsStatus[student.id] === 'exited' && (
                          <span className="px-3 py-1 text-xs rounded-md text-gray-700 bg-gray-100">
                            Exited
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No students assigned yet
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="dashboard-card col-span-1">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button 
              className="w-full py-2 px-3 bg-blue-50 text-blue-700 rounded-md flex items-center hover:bg-blue-100 transition"
              onClick={() => {
                if (assignedRoute) {
                  alert(`Route: ${assignedRoute.name}\nStudents: ${assignedRoute.students.length}\nStops: ${assignedRoute.stops.length}`);
                } else {
                  alert("No route assigned yet");
                }
              }}
            >
              <Map className="mr-2 h-5 w-5" />
              View Your Route
            </button>
            <button 
              className="w-full py-2 px-3 bg-yellow-50 text-yellow-700 rounded-md flex items-center hover:bg-yellow-100 transition"
              onClick={reportIssue}
            >
              <AlertCircle className="mr-2 h-5 w-5" />
              Report an Issue
            </button>
            <button 
              className="w-full py-2 px-3 bg-green-50 text-green-700 rounded-md flex items-center hover:bg-green-100 transition"
              onClick={() => {
                // This would actually send notifications to all parents
                alert("Sending notification to all parents that their children's bus is approaching");
                
                // For demo purposes only - in a real app this would send actual notifications
                assignedStudents.forEach(student => {
                  if (student.parentId && currentTrip) {
                    addDoc(collection(db, 'notifications'), {
                      userId: student.parentId,
                      title: 'Bus Approaching',
                      message: `The school bus is approaching your location in approximately 5-10 minutes.`,
                      read: false,
                      createdAt: Timestamp.fromDate(new Date()),
                      type: 'bus_approaching',
                      studentId: student.id,
                      driverId: currentUser?.uid
                    }).catch(err => console.error("Error sending notification:", err));
                  }
                });
              }}
            >
              <MessageSquare className="mr-2 h-5 w-5" />
              Notify Parents
            </button>
          </div>
        </div>
        
        <div className="dashboard-card col-span-1 lg:col-span-2">
          <div className="p-1 border-b border-gray-200 mb-4">
            <h2 className="text-lg font-medium text-gray-900">Your Route</h2>
          </div>
          
          {assignedRoute ? (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-md font-medium">{assignedRoute.name}</h3>
                <span className="px-3 py-1 text-xs rounded-full text-blue-700 bg-blue-100">
                  {assignedRoute.students.length} students • {assignedRoute.stops?.length || 0} stops
                </span>
              </div>
              
              <div className="bg-gray-100 rounded-lg p-4 mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Route Stops:</h4>
                <ul className="space-y-3 max-h-48 overflow-y-auto">
                  {assignedRoute.stops?.map((stop: RouteStop, index: number) => {
                    const student = assignedStudents.find(s => s.id === stop.studentId);
                    return (
                      <li key={index} className="flex items-start">
                        <MapPin className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium">{student?.fullName || "Unknown Student"}</p>
                          <div className="flex items-center text-xs text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            <span>
                              {format(new Date(stop.estimatedTime as any), 'h:mm a')}
                            </span>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Status: 
                            <span className={`ml-1 ${
                              studentsStatus[stop.studentId] === 'onboard' ? 'text-green-600' :
                              studentsStatus[stop.studentId] === 'exited' ? 'text-blue-600' :
                              'text-gray-600'
                            }`}>
                              {studentsStatus[stop.studentId] === 'onboard' ? 'On Board' :
                               studentsStatus[stop.studentId] === 'exited' ? 'Exited' :
                               'Waiting'}
                            </span>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
              
              {/* Weather warning if applicable */}
              {weatherInfo && (
                weatherInfo.condition === 'rain' || 
                weatherInfo.condition === 'snow' || 
                weatherInfo.condition === 'thunderstorm' || 
                weatherInfo.windSpeed > 8
              ) && (
                <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-800">Weather Alert</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        {weatherInfo.condition === 'rain' && 'Rain may cause slippery conditions. Drive with caution.'}
                        {weatherInfo.condition === 'snow' && 'Snow may affect road conditions. Reduce speed and maintain extra distance.'}
                        {weatherInfo.condition === 'thunderstorm' && 'Thunderstorm in the area. Be alert for heavy rain and lightning.'}
                        {weatherInfo.windSpeed > 8 && 'Strong winds reported. Drive with caution, especially in open areas.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-500">
              No route has been assigned to you yet.
            </div>
          )}
        </div>
      </div>
      
      {currentTrip && (
        <div className="fixed bottom-4 right-4 bg-green-100 border border-green-200 p-4 rounded-lg shadow-md z-10">
          <div className="flex items-center">
            <div className="h-2 w-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
            <p className="text-sm font-medium text-green-800">
              Location tracking is active
            </p>
          </div>
          <p className="text-xs text-green-700 mt-1">
            {userLocation ? 
              `Current coordinates: ${userLocation.latitude.toFixed(6)}, ${userLocation.longitude.toFixed(6)}` : 
              'Getting location...'}
          </p>
        </div>
      )}
      
      {showBehaviorModal && selectedStudent && (
        <BehaviorReportModal 
          student={selectedStudent}
          tripId={currentTrip?.id || ''}
          onSubmit={submitBehaviorReport}
          onClose={() => {
            setShowBehaviorModal(false);
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};
 