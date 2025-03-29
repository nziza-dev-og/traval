import  { useEffect, useState } from 'react';
import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  limit,
  doc,
  updateDoc 
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { safeFirestoreQuery } from '../../utils/firebaseHelpers';
import { User, UserRole, Trip, TripStatus, Student, Route, Bus, BehaviorReport, BehaviorType } from '../../types';
import { Users, Bus as BusIcon, Map, AlertCircle, RefreshCw, Calendar, Cloud, ThumbsUp, Flag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { MapboxMap } from '../../components/MapboxMap';
import { WeatherDisplay } from '../../components/WeatherDisplay';

export const AdminDashboard = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalParents: 0,
    totalDrivers: 0,
    totalBuses: 0,
    activeTrips: 0,
    pendingApprovals: 0,
    totalRoutes: 0,
    behaviorReports: 0
  });
  
  const [recentActivity, setRecentActivity] = useState<{id: string, text: string, time: Date}[]>([]);
  const [activeTrips, setActiveTrips] = useState<Trip[]>([]);
  const [behaviorReports, setBehaviorReports] = useState<BehaviorReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const fetchStats = async () => {
      try {
        // Count students with offline fallback
        const studentsQuery = query(
          collection(db, 'students'),
          where('adminId', '==', currentUser.uid)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const totalStudents = studentsSnapshot.size;
        
        // Count parents with offline fallback
        const parentsQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.PARENT),
          where('adminId', '==', currentUser.uid)
        );
        const parentsSnapshot = await getDocs(parentsQuery);
        const totalParents = parentsSnapshot.size;
        
        // Count drivers with offline fallback
        const driversQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.DRIVER),
          where('adminId', '==', currentUser.uid)
        );
        const driversSnapshot = await getDocs(driversQuery);
        const totalDrivers = driversSnapshot.size;
        
        // Count buses
        const busesQuery = query(
          collection(db, 'buses'),
          where('adminId', '==', currentUser.uid)
        );
        const busesSnapshot = await getDocs(busesQuery);
        const totalBuses = busesSnapshot.size;
        
        // Count pending behavior reports
        const behaviorQuery = query(
          collection(db, 'behaviorReports'),
          where('status', '==', 'pending'),
          limit(5)
        );
        const behaviorSnapshot = await getDocs(behaviorQuery);
        const behaviorReports = behaviorSnapshot.size;
        
        // Fetch behavior reports for display
        const behaviorData: BehaviorReport[] = [];
        behaviorSnapshot.forEach((doc) => {
          behaviorData.push({ id: doc.id, ...doc.data() } as BehaviorReport);
        });
        setBehaviorReports(behaviorData);
        
        // Count active trips with offline fallback
        const routesQuery = query(
          collection(db, 'routes'),
          where('adminId', '==', currentUser.uid)
        );
        const routesSnapshot = await getDocs(routesQuery);
        const routes = routesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const driverIds = routes.map(route => route.driverId);
        
        if (driverIds.length > 0) {
          const activeTripsQuery = query(
            collection(db, 'trips'),
            where('driverId', 'in', driverIds),
            where('status', '==', TripStatus.IN_PROGRESS)
          );
          const activeTripsSnapshot = await getDocs(activeTripsQuery);
          const activeTripsData = activeTripsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Trip[];
          setActiveTrips(activeTripsData);
          
          // Count pending approvals with offline fallback
          const pendingApprovalsQuery = query(
            collection(db, 'users'),
            where('approved', '==', false),
            where('adminId', '==', currentUser.uid)
          );
          const pendingApprovalsSnapshot = await getDocs(pendingApprovalsQuery);
          const pendingApprovals = pendingApprovalsSnapshot.size;
          
          setStats({
            totalStudents,
            totalParents,
            totalDrivers,
            totalBuses,
            activeTrips: activeTripsData.length,
            pendingApprovals,
            totalRoutes: routes.length,
            behaviorReports
          });
        } else {
          setStats({
            totalStudents,
            totalParents,
            totalDrivers,
            totalBuses,
            activeTrips: 0,
            pendingApprovals: 0,
            totalRoutes: routes.length,
            behaviorReports
          });
        }

        // Generate recent activity using fetched data
        const activityItems = [];
        
        // Add trip starts to activity
        for (const trip of activeTripsData) {
          activityItems.push({
            id: `trip-${trip.id}`,
            text: `Driver ${trip.driverName} started a trip`,
            time: new Date(trip.startTime as any)
          });
        }
        
        // Add behavior reports to activity
        for (const report of behaviorData) {
          const reportType = report.type.charAt(0).toUpperCase() + report.type.slice(1);
          activityItems.push({
            id: `behavior-${report.id}`,
            text: `${report.driverName} reported ${reportType} behavior`,
            time: new Date(report.createdAt as any)
          });
        }
        
        // Sort by time, most recent first
        activityItems.sort((a, b) => b.time.getTime() - a.time.getTime());
        
        setRecentActivity(activityItems);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
    
    // Set up real-time listener for active trips
    const fetchActiveTrips = async () => {
      try {
        const routesQuery = query(
          collection(db, 'routes'),
          where('adminId', '==', currentUser.uid)
        );
        const routesSnapshot = await getDocs(routesQuery);
        const routes = routesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const driverIds = routes.map(route => route.driverId);
        
        if (driverIds.length > 0) {
          const tripsQuery = query(
            collection(db, 'trips'),
            where('driverId', 'in', driverIds),
            where('status', '==', TripStatus.IN_PROGRESS)
          );
          
          const unsubscribe = onSnapshot(tripsQuery, (snapshot) => {
            const tripsData: Trip[] = [];
            snapshot.forEach((doc) => {
              tripsData.push({ id: doc.id, ...doc.data() } as Trip);
            });
            setActiveTrips(tripsData);
            setStats(prev => ({ ...prev, activeTrips: tripsData.length }));
          }, (error) => {
            console.error("Error listening to trips:", error);
          });
          
          return unsubscribe;
        }
      } catch (error) {
        console.error("Error setting up trips listener:", error);
      }
    };
    
    // Set up real-time listener for behavior reports
    const fetchBehaviorReports = async () => {
      try {
        const reportsQuery = query(
          collection(db, 'behaviorReports'),
          where('status', '==', 'pending'),
          limit(5)
        );
        
        const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
          const reportsData: BehaviorReport[] = [];
          snapshot.forEach((doc) => {
            reportsData.push({ id: doc.id, ...doc.data() } as BehaviorReport);
          });
          setBehaviorReports(reportsData);
          setStats(prev => ({ ...prev, behaviorReports: reportsData.length }));
        }, (error) => {
          console.error("Error listening to behavior reports:", error);
        });
        
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up behavior reports listener:", error);
      }
    };
    
    const tripListener = fetchActiveTrips();
    const behaviorListener = fetchBehaviorReports();
    
    return () => {
      if (tripListener) tripListener.then(unsubscribe => unsubscribe && unsubscribe());
      if (behaviorListener) behaviorListener.then(unsubscribe => unsubscribe && unsubscribe());
    };
  }, [currentUser]);

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    
    return Math.floor(seconds) + " seconds ago";
  };

  const handleReviewBehaviorReport = async (reportId: string, newStatus: 'reviewed' | 'resolved') => {
    try {
      await updateDoc(doc(db, 'behaviorReports', reportId), {
        status: newStatus
      });
      
      // Update local state
      setBehaviorReports(prev => prev.filter(report => report.id !== reportId));
      setStats(prev => ({ ...prev, behaviorReports: prev.behaviorReports - 1 }));
    } catch (error) {
      console.error('Error updating behavior report:', error);
    }
  };

  const getBehaviorTypeBadgeClass = (type: BehaviorType) => {
    switch (type) {
      case BehaviorType.MISCONDUCT:
        return 'bg-red-100 text-red-800';
      case BehaviorType.BULLYING:
        return 'bg-red-100 text-red-800';
      case BehaviorType.DISRUPTIVE:
        return 'bg-orange-100 text-orange-800';
      case BehaviorType.POSITIVE:
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
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
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 mb-8">
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Students</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Parents</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalParents}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <Users size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Drivers</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalDrivers}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-orange-100 text-orange-600">
              <BusIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Buses</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalBuses}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <BusIcon size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Trips</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeTrips}</p>
            </div>
          </div>
        </div>
        
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <AlertCircle size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Pending Approvals</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingApprovals}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-indigo-100 text-indigo-600">
              <Map size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Routes</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalRoutes}</p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-pink-100 text-pink-600">
              <Flag size={24} />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Behavior Reports</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.behaviorReports}</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Quick Access Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/dashboard/routes" className="dashboard-card hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <Map className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Manage Routes</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Create and manage bus routes, assign drivers and buses, and schedule pickup and dropoff times.
          </p>
          <div className="text-blue-600 text-sm font-medium">View Routes →</div>
        </Link>
        
        <Link to="/dashboard/buses" className="dashboard-card hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <BusIcon className="h-6 w-6 text-yellow-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Manage Buses</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add and manage your fleet of buses, track maintenance schedules, and assign buses to routes.
          </p>
          <div className="text-blue-600 text-sm font-medium">View Buses →</div>
        </Link>
        
        <Link to="/dashboard/students" className="dashboard-card hover:shadow-md transition-shadow">
          <div className="flex items-center mb-4">
            <Users className="h-6 w-6 text-green-600 mr-2" />
            <h2 className="text-lg font-medium text-gray-900">Manage Students</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Add new students, update information, assign to routes, and manage student accounts.
          </p>
          <div className="text-blue-600 text-sm font-medium">View Students →</div>
        </Link>
      </div>
      
      {/* Alerts Section */}
      <div className="mb-8 space-y-4">
        {/* Pending Approvals Alert */}
        {stats.pendingApprovals > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  You have {stats.pendingApprovals} user{stats.pendingApprovals === 1 ? '' : 's'} pending approval.
                  <Link to="/dashboard/users?filter=pending" className="font-medium underline text-yellow-700 hover:text-yellow-600 ml-1">
                    View users
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Behavior Reports Alert */}
        {behaviorReports.length > 0 && (
          <div className="bg-pink-50 border-l-4 border-pink-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Flag className="h-5 w-5 text-pink-400" />
              </div>
              <div className="ml-3 flex-grow">
                <p className="text-sm font-medium text-pink-700">
                  You have {behaviorReports.length} pending behavior {behaviorReports.length === 1 ? 'report' : 'reports'} to review.
                </p>
                <div className="mt-2 space-y-2">
                  {behaviorReports.slice(0, 3).map(report => (
                    <div key={report.id} className="bg-white p-3 rounded-md shadow-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${getBehaviorTypeBadgeClass(report.type)}`}>
                            {report.type}
                          </span>
                          <p className="text-sm mt-1">{report.description.substring(0, 100)}{report.description.length > 100 ? '...' : ''}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            Reported by {report.driverName} on {format(new Date(report.createdAt as any), 'MMM d, h:mm a')}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button 
                            onClick={() => handleReviewBehaviorReport(report.id, 'reviewed')}
                            className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded hover:bg-blue-200"
                          >
                            Review
                          </button>
                          <button 
                            onClick={() => handleReviewBehaviorReport(report.id, 'resolved')}
                            className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded hover:bg-green-200"
                          >
                            Resolve
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {behaviorReports.length > 3 && (
                  <p className="text-xs text-pink-600 mt-2">
                    + {behaviorReports.length - 3} more reports to review
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Active Trips and Map Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Active Bus Locations</h2>
            </div>
            <div className="p-4">
              {activeTrips.length > 0 ? (
                <div>
                  <MapboxMap
                    tripLocation={activeTrips[0]?.currentLocation}
                    className="h-[400px] w-full rounded-lg mb-4"
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <img
                        src="https://images.unsplash.com/photo-1577086664693-894d8405334a?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBidXMlMjB0cmFuc3BvcnRhdGlvbiUyMHRyYWNraW5nJTIwbWFwJTIwbWFwYm94fGVufDB8fHx8MTc0MzIxMzU4NHww&ixlib=rb-4.0.3&fit=fillmax&h=300&w=500"
                        alt="Route map"
                        className="w-full h-auto rounded-lg object-cover"
                      />
                    </div>
                    <div className="flex flex-col space-y-4">
                      {activeTrips[0]?.weather && (
                        <WeatherDisplay 
                          location={activeTrips[0].currentLocation} 
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-200 map-container flex items-center justify-center">
                  <div className="text-center p-6">
                    <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      No active buses at this time
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm h-full overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Active Trips ({activeTrips.length})</h2>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: "400px" }}>
              {activeTrips.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {activeTrips.map((trip) => (
                    <li key={trip.id} className="p-4 hover:bg-gray-50">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <BusIcon className="h-5 w-5 text-yellow-500" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {trip.driverName || "Driver"}
                          </p>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                            <p className="text-xs text-gray-500">
                              Started: {format(new Date(trip.startTime as any), 'h:mm a')}
                            </p>
                          </div>
                          <div className="flex justify-between items-center mt-1">
                            <p className="text-xs text-green-600">
                              {trip.studentsOnboard?.length || 0} students onboard
                            </p>
                            {trip.weather && (
                              <div className="flex items-center text-xs text-gray-500">
                                <Cloud className="h-3 w-3 mr-1" />
                                <span>{Math.round(trip.weather.temperature)}°C</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <Link 
                          to={`/dashboard/trips/${trip.id}`} 
                          className="ml-auto text-xs text-blue-600 hover:text-blue-800"
                        >
                          View
                        </Link>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  No active trips at this time
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Recent Activity & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="dashboard-card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
          {recentActivity.length > 0 ? (
            <ul className="space-y-3">
              {recentActivity.map((activity) => (
                <li key={activity.id} className="flex items-start">
                  <span className="flex-shrink-0 h-2 w-2 mt-2 rounded-full bg-blue-500"></span>
                  <div className="ml-3">
                    <p className="text-sm text-gray-700">{activity.text}</p>
                    <p className="text-xs text-gray-500">{getTimeAgo(activity.time)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500">No recent activities to display.</p>
          )}
        </div>
        
        <div className="dashboard-card">
          <h2 className="text-lg font-medium text-gray-900 mb-4">System Alerts</h2>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    Bus #103 is running 10 minutes behind schedule
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    5 minutes ago
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-red-50 border-l-4 border-red-400 rounded-r-md">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">
                    Driver Michael Smith reported traffic delay on Route #2
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    15 minutes ago
                  </p>
                </div>
              </div>
            </div>
            
            {activeTrips.length > 0 && activeTrips[0].weather && (
              activeTrips[0].weather.condition === 'rain' || 
              activeTrips[0].weather.condition === 'snow' || 
              activeTrips[0].weather.condition === 'thunderstorm'
            ) && (
              <div className="p-3 bg-blue-50 border-l-4 border-blue-400 rounded-r-md">
                <div className="flex">
                  <Cloud className="h-5 w-5 text-blue-400" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-blue-800">
                      Weather alert: {activeTrips[0].weather.description}
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Current temperature: {Math.round(activeTrips[0].weather.temperature)}°C
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
 