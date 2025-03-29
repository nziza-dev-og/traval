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
  addDoc 
} from '../../firebase';
import { useAuth } from '../../context/AuthContext';
import { safeFirestoreQuery } from '../../utils/firebaseHelpers';
import { Bus } from '../../types';
import { Edit, Trash, Plus, Search, Bus as BusIcon } from 'lucide-react';

export const BusesManagement = () => {
  const { currentUser } = useAuth();
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentBus, setCurrentBus] = useState<Partial<Bus>>({
    id: '',
    name: '',
    model: '',
    licensePlate: '',
    capacity: 0,
    adminId: '',
    year: new Date().getFullYear(),
    status: 'active'
  });

  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        // Fetch buses for the current admin
        const busesQuery = query(
          collection(db, 'buses'),
          where('adminId', '==', currentUser.uid)
        );
        const busesSnapshot = await getDocs(busesQuery);
        const busesData: Bus[] = [];
        busesSnapshot.forEach((doc) => {
          busesData.push({ id: doc.id, ...doc.data() } as Bus);
        });
        setBuses(busesData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching buses:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  const handleAddBus = () => {
    setIsEditMode(false);
    setCurrentBus({
      id: '',
      name: '',
      model: '',
      licensePlate: '',
      capacity: 0,
      adminId: currentUser?.uid || '',
      year: new Date().getFullYear(),
      status: 'active'
    });
    setIsModalOpen(true);
  };

  const handleEditBus = (bus: Bus) => {
    setIsEditMode(true);
    setCurrentBus({ ...bus });
    setIsModalOpen(true);
  };

  const handleDeleteBus = async (busId: string) => {
    if (confirm('Are you sure you want to delete this bus?')) {
      try {
        await deleteDoc(doc(db, 'buses', busId));
        setBuses(buses.filter(b => b.id !== busId));
      } catch (error) {
        console.error('Error deleting bus:', error);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditMode && currentBus.id) {
        // Update existing bus
        await updateDoc(doc(db, 'buses', currentBus.id), {
          name: currentBus.name,
          model: currentBus.model,
          licensePlate: currentBus.licensePlate,
          capacity: Number(currentBus.capacity),
          year: Number(currentBus.year),
          status: currentBus.status
        });
        
        setBuses(buses.map(b => 
          b.id === currentBus.id ? { ...b, ...currentBus as Bus } : b
        ));
      } else {
        // Create new bus
        const newBusRef = doc(collection(db, 'buses'));
        await setDoc(newBusRef, {
          name: currentBus.name,
          model: currentBus.model,
          licensePlate: currentBus.licensePlate,
          capacity: Number(currentBus.capacity),
          adminId: currentUser?.uid,
          year: Number(currentBus.year),
          status: 'active'
        });
        
        const newBus = {
          id: newBusRef.id,
          ...currentBus
        } as Bus;
        
        setBuses([...buses, newBus]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving bus:', error);
    }
  };

  const filteredBuses = buses.filter(bus => 
    bus.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bus.licensePlate.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Buses Management</h1>
        <button
          onClick={handleAddBus}
          className="btn-primary flex items-center"
        >
          <Plus size={18} className="mr-1" />
          Add Bus
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
              placeholder="Search buses..."
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
                  Bus Info
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  License Plate
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Model
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBuses.length > 0 ? (
                filteredBuses.map((bus) => (
                  <tr key={bus.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <BusIcon className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{bus.name}</div>
                          <div className="text-xs text-gray-500">Year: {bus.year}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {bus.licensePlate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bus.model}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bus.capacity} seats
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(bus.status)}`}>
                        {bus.status.charAt(0).toUpperCase() + bus.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditBus(bus)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteBus(bus.id)}
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
                    No buses found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bus Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">
              {isEditMode ? 'Edit Bus' : 'Add New Bus'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="form-label">Bus Name</label>
                <input
                  id="name"
                  type="text"
                  value={currentBus.name}
                  onChange={(e) => setCurrentBus({...currentBus, name: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="model" className="form-label">Model</label>
                <input
                  id="model"
                  type="text"
                  value={currentBus.model}
                  onChange={(e) => setCurrentBus({...currentBus, model: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="licensePlate" className="form-label">License Plate</label>
                <input
                  id="licensePlate"
                  type="text"
                  value={currentBus.licensePlate}
                  onChange={(e) => setCurrentBus({...currentBus, licensePlate: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="capacity" className="form-label">Capacity</label>
                  <input
                    id="capacity"
                    type="number"
                    min="1"
                    value={currentBus.capacity}
                    onChange={(e) => setCurrentBus({...currentBus, capacity: parseInt(e.target.value)})}
                    className="form-input"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="year" className="form-label">Year</label>
                  <input
                    id="year"
                    type="number"
                    min="1990"
                    max={new Date().getFullYear()}
                    value={currentBus.year}
                    onChange={(e) => setCurrentBus({...currentBus, year: parseInt(e.target.value)})}
                    className="form-input"
                    required
                  />
                </div>
              </div>
              
              {isEditMode && (
                <div>
                  <label htmlFor="status" className="form-label">Status</label>
                  <select
                    id="status"
                    value={currentBus.status}
                    onChange={(e) => setCurrentBus({...currentBus, status: e.target.value})}
                    className="form-input"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="maintenance">Under Maintenance</option>
                    <option value="inactive">Inactive</option>
                  </select>
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
                  {isEditMode ? 'Update' : 'Add'} Bus
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
 