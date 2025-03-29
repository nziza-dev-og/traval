import  { useEffect, useState, FormEvent } from 'react';
import { 
  db, 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  addDoc,
  Timestamp 
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { safeFirestoreQuery } from '../../utils/firebaseHelpers';
import { User, UserRole, Route, Student, Bus } from '../../types';
import { Edit, Trash, Plus, Search, Map, MapPin, User as UserIcon, Bus as BusIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export const RoutesManagement = () => {
  const { currentUser } = useAuth();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentRoute, setCurrentRoute] = useState<Partial<Route>>({
    id: '',
    name: '',
    driverId: '',
    busId: '',
    adminId: '',
    students: [],
    stops: []
  });
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [stopTimes, setStopTimes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        // Fetch routes for the current admin
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
        
        // Fetch drivers with approved status
        const driversData = await safeFirestoreQuery('users', 'role', '==', UserRole.DRIVER);
        const approvedDrivers = driversData.filter((driver: User) => driver.approved);
        setDrivers(approvedDrivers);
        
        // Fetch students
        const studentsData = await safeFirestoreQuery('students');
        setStudents(studentsData);
        
        // Fetch buses
        const busesData = await safeFirestoreQuery('buses');
        setBuses(busesData);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  const handleAddRoute = () => {
    setIsEditMode(false);
    setCurrentRoute({
      id: '',
      name: '',
      driverId: '',
      busId: '',
      adminId: currentUser?.uid || '',
      students: [],
      stops: []
    });
    setSelectedStudentIds([]);
    setStopTimes({});
    setIsModalOpen(true);
  };

  const handleEditRoute = (route: Route) => {
    setIsEditMode(true);
    setCurrentRoute({ ...route });
    setSelectedStudentIds(route.students || []);
    
    // Initialize stop times
    const times: Record<string, string> = {};
    route.stops?.forEach(stop => {
      const date = new Date(stop.estimatedTime as any);
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      times[stop.studentId] = `${hours}:${minutes}`;
    });
    setStopTimes(times);
    
    setIsModalOpen(true);
  };

  const handleDeleteRoute = async (routeId: string) => {
    if (confirm('Are you sure you want to delete this route?')) {
      try {
        await deleteDoc(doc(db, 'routes', routeId));
        setRoutes(routes.filter(r => r.id !== routeId));
      } catch (error) {
        console.error('Error deleting route:', error);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      // Prepare stops data
      const stops = selectedStudentIds.map(studentId => {
        const student = students.find(s => s.id === studentId);
        const timeString = stopTimes[studentId] || '08:00';
        const [hours, minutes] = timeString.split(':').map(Number);
        
        const estimatedTime = new Date();
        estimatedTime.setHours(hours, minutes, 0, 0);
        
        return {
          studentId,
          location: student?.homeLocation || { latitude: 0, longitude: 0 },
          estimatedTime
        };
      });
      
      if (isEditMode && currentRoute.id) {
        // Update existing route
        await updateDoc(doc(db, 'routes', currentRoute.id), {
          name: currentRoute.name,
          driverId: currentRoute.driverId,
          busId: currentRoute.busId,
          students: selectedStudentIds,
          stops,
          updatedAt: Timestamp.fromDate(new Date())
        });
        
        // Update all selected students with this driver ID
        for (const studentId of selectedStudentIds) {
          await updateDoc(doc(db, 'students', studentId), {
            driverId: currentRoute.driverId
          });
        }
        
        setRoutes(routes.map(r => 
          r.id === currentRoute.id ? { ...r, ...currentRoute as Route, students: selectedStudentIds, stops } : r
        ));
      } else {
        // Create new route
        const newRouteRef = doc(collection(db, 'routes'));
        await setDoc(newRouteRef, {
          name: currentRoute.name,
          driverId: currentRoute.driverId,
          busId: currentRoute.busId,
          adminId: currentUser?.uid,
          students: selectedStudentIds,
          stops,
          createdAt: Timestamp.fromDate(new Date())
        });
        
        // Update all selected students with this driver ID
        for (const studentId of selectedStudentIds) {
          await updateDoc(doc(db, 'students', studentId), {
            driverId: currentRoute.driverId
          });
        }
        
        const newRoute = {
          id: newRouteRef.id,
          ...currentRoute,
          students: selectedStudentIds,
          stops
        } as Route;
        
        setRoutes([...routes, newRoute]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving route:', error);
    }
  };

  const filteredRoutes = routes.filter(route => 
    route.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.uid === driverId);
    return driver ? driver.displayName : 'Not Assigned';
  };

  const getBusDetails = (busId: string) => {
    const bus = buses.find(b => b.id === busId);
    return bus ? `${bus.name} (${bus.licensePlate})` : 'Not Assigned';
  };

  const getStudentCount = (studentIds: string[]) => {
    return studentIds?.length || 0;
  };

  const toggleStudentSelection = (studentId: string) => {
    if (selectedStudentIds.includes(studentId)) {
      setSelectedStudentIds(selectedStudentIds.filter(id => id !== studentId));
      
      // Remove from stop times
      const newStopTimes = { ...stopTimes };
      delete newStopTimes[studentId];
      setStopTimes(newStopTimes);
    } else {
      setSelectedStudentIds([...selectedStudentIds, studentId]);
      
      // Initialize with default time
      setStopTimes({ ...stopTimes, [studentId]: '08:00' });
    }
  };

  const handleStopTimeChange = (studentId: string, time: string) => {
    setStopTimes({ ...stopTimes, [studentId]: time });
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Routes Management</h1>
        <button
          onClick={handleAddRoute}
          className="btn-primary flex items-center"
        >
          <Plus size={18} className="mr-1" />
          Add Route
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search routes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Route Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bus
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Students
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stops
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRoutes.length > 0 ? (
                filteredRoutes.map((route) => (
                  <tr key={route.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Map className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{route.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDriverName(route.driverId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getBusDetails(route.busId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getStudentCount(route.students)} students
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {route.stops?.length || 0} stops
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditRoute(route)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteRoute(route.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    No routes found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isEditMode ? 'Edit Route' : 'Add New Route'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="form-label">Route Name</label>
                <input
                  id="name"
                  type="text"
                  value={currentRoute.name}
                  onChange={(e) => setCurrentRoute({...currentRoute, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="driverId" className="form-label">Driver</label>
                <select
                  id="driverId"
                  value={currentRoute.driverId}
                  onChange={(e) => setCurrentRoute({...currentRoute, driverId: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select a driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.uid} value={driver.uid}>
                      {driver.displayName} ({driver.phoneNumber || 'No phone'})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="busId" className="form-label">Bus</label>
                <select
                  id="busId"
                  value={currentRoute.busId}
                  onChange={(e) => setCurrentRoute({...currentRoute, busId: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select a bus</option>
                  {buses.map((bus) => (
                    <option key={bus.id} value={bus.id}>
                      {bus.name} - {bus.model} ({bus.licensePlate})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="form-label">Select Students</label>
                <div className="mt-2 border border-gray-300 rounded-md p-2 max-h-48 overflow-y-auto">
                  {students.length > 0 ? (
                    students.map((student) => (
                      <div key={student.id} className="flex items-center p-2 hover:bg-gray-50">
                        <input
                          type="checkbox"
                          id={`student-${student.id}`}
                          checked={selectedStudentIds.includes(student.id)}
                          onChange={() => toggleStudentSelection(student.id)}
                          className="h-4 w-4 text-blue-600 rounded"
                        />
                        <label htmlFor={`student-${student.id}`} className="ml-2 flex-grow text-sm text-gray-700">
                          {student.fullName} - {student.grade}, {student.school}
                        </label>
                      </div>
                    ))
                  ) : (
                    <p className="p-2 text-sm text-gray-500">No students available</p>
                  )}
                </div>
              </div>
              
              {selectedStudentIds.length > 0 && (
                <div>
                  <label className="form-label">Route Stops & Times</label>
                  <div className="mt-2 border border-gray-300 rounded-md p-2 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Order
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Student
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Estimated Time
                          </th>
                          <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Location
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedStudentIds.map((studentId, index) => {
                          const student = students.find(s => s.id === studentId);
                          return (
                            <tr key={studentId}>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {index + 1}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                                {student?.fullName}
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap">
                                <input
                                  type="time"
                                  value={stopTimes[studentId] || '08:00'}
                                  onChange={(e) => handleStopTimeChange(studentId, e.target.value)}
                                  className="px-2 py-1 border border-gray-300 rounded-md text-sm"
                                  required
                                />
                              </td>
                              <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                                {student?.homeLocation ? (
                                  <span>
                                    {student.homeLocation.latitude.toFixed(6)}, {student.homeLocation.longitude.toFixed(6)}
                                  </span>
                                ) : (
                                  'No location'
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {isEditMode ? 'Update' : 'Create'} Route
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
 