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
import { Student, User, UserRole } from '../../types';
import { Edit, Trash, Plus, Search, Book } from 'lucide-react';

export const StudentsManagement = () => {
  const { currentUser } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [parents, setParents] = useState<User[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentStudent, setCurrentStudent] = useState<Partial<Student>>({
    id: '',
    fullName: '',
    grade: '',
    school: '',
    parentId: '',
    driverId: '',
    homeLocation: { latitude: 0, longitude: 0 },
    adminId: ''
  });

  // Fetch students, parents and drivers data
  useEffect(() => {
    if (!currentUser) return;

    const fetchData = async () => {
      try {
        // Fetch students
        const studentsQuery = query(
          collection(db, 'students'),
          where('adminId', '==', currentUser.uid)
        );
        const studentsSnapshot = await getDocs(studentsQuery);
        const studentsData: Student[] = [];
        studentsSnapshot.forEach((doc) => {
          studentsData.push({ id: doc.id, ...doc.data() } as Student);
        });
        setStudents(studentsData);
        
        // Fetch parents
        const parentsQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.PARENT),
          where('adminId', '==', currentUser.uid)
        );
        const parentsSnapshot = await getDocs(parentsQuery);
        const parentsData: User[] = [];
        parentsSnapshot.forEach((doc) => {
          parentsData.push({ uid: doc.id, ...doc.data() } as User);
        });
        setParents(parentsData);
        
        // Fetch drivers
        const driversQuery = query(
          collection(db, 'users'),
          where('role', '==', UserRole.DRIVER),
          where('adminId', '==', currentUser.uid)
        );
        const driversSnapshot = await getDocs(driversQuery);
        const driversData: User[] = [];
        driversSnapshot.forEach((doc) => {
          driversData.push({ uid: doc.id, ...doc.data() } as User);
        });
        setDrivers(driversData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [currentUser]);

  const handleAddStudent = () => {
    setIsEditMode(false);
    setCurrentStudent({
      id: '',
      fullName: '',
      grade: '',
      school: '',
      parentId: '',
      driverId: '',
      homeLocation: { latitude: 0, longitude: 0 },
      adminId: currentUser?.uid
    });
    setIsModalOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setIsEditMode(true);
    setCurrentStudent({ ...student });
    setIsModalOpen(true);
  };

  const handleDeleteStudent = async (studentId: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteDoc(doc(db, 'students', studentId));
        setStudents(students.filter(s => s.id !== studentId));
      } catch (error) {
        console.error('Error deleting student:', error);
      }
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    try {
      if (isEditMode && currentStudent.id) {
        await updateDoc(doc(db, 'students', currentStudent.id), {
          fullName: currentStudent.fullName,
          grade: currentStudent.grade,
          school: currentStudent.school,
          parentId: currentStudent.parentId,
          driverId: currentStudent.driverId,
          homeLocation: currentStudent.homeLocation
        });
        
        setStudents(students.map(s => 
          s.id === currentStudent.id ? { ...s, ...currentStudent as Student } : s
        ));
      } else {
        const newStudentRef = doc(collection(db, 'students'));
        await setDoc(newStudentRef, {
          fullName: currentStudent.fullName,
          grade: currentStudent.grade,
          school: currentStudent.school,
          parentId: currentStudent.parentId,
          driverId: currentStudent.driverId,
          homeLocation: currentStudent.homeLocation,
          adminId: currentUser?.uid
        });
        
        const newStudent = {
          id: newStudentRef.id,
          ...currentStudent,
          adminId: currentUser?.uid
        } as Student;
        
        setStudents([...students, newStudent]);
      }
      
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving student:', error);
    }
  };

  const filteredStudents = students.filter(student => 
    student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.grade.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.school.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getParentName = (parentId: string) => {
    const parent = parents.find(p => p.uid === parentId);
    return parent ? parent.displayName : 'Not Assigned';
  };

  const getDriverName = (driverId: string) => {
    const driver = drivers.find(d => d.uid === driverId);
    return driver ? driver.displayName : 'Not Assigned';
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
        <button
          onClick={handleAddStudent}
          className="btn-primary flex items-center"
        >
          <Plus size={18} className="mr-1" />
          Add Student
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
              placeholder="Search students..."
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
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Grade
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  School
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Parent
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Driver
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((student) => (
                  <tr key={student.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Book className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.fullName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.grade}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.school}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getParentName(student.parentId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {getDriverName(student.driverId)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEditStudent(student)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDeleteStudent(student.id)}
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
                    No students found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {isEditMode ? 'Edit Student' : 'Add New Student'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <input
                  id="fullName"
                  type="text"
                  value={currentStudent.fullName}
                  onChange={(e) => setCurrentStudent({...currentStudent, fullName: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="grade" className="form-label">Grade</label>
                <input
                  id="grade"
                  type="text"
                  value={currentStudent.grade}
                  onChange={(e) => setCurrentStudent({...currentStudent, grade: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="school" className="form-label">School</label>
                <input
                  id="school"
                  type="text"
                  value={currentStudent.school}
                  onChange={(e) => setCurrentStudent({...currentStudent, school: e.target.value})}
                  className="form-input"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="parentId" className="form-label">Parent</label>
                <select
                  id="parentId"
                  value={currentStudent.parentId}
                  onChange={(e) => setCurrentStudent({...currentStudent, parentId: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select a parent</option>
                  {parents.map((parent) => (
                    <option key={parent.uid} value={parent.uid}>
                      {parent.displayName} ({parent.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="driverId" className="form-label">Driver</label>
                <select
                  id="driverId"
                  value={currentStudent.driverId}
                  onChange={(e) => setCurrentStudent({...currentStudent, driverId: e.target.value})}
                  className="form-input"
                  required
                >
                  <option value="">Select a driver</option>
                  {drivers.map((driver) => (
                    <option key={driver.uid} value={driver.uid}>
                      {driver.displayName} ({driver.email})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="form-label">Home Location</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="latitude" className="block text-xs text-gray-500 mb-1">Latitude</label>
                    <input
                      id="latitude"
                      type="number"
                      step="0.000001"
                      value={currentStudent.homeLocation?.latitude}
                      onChange={(e) => setCurrentStudent({
                        ...currentStudent,
                        homeLocation: {
                          ...currentStudent.homeLocation!,
                          latitude: parseFloat(e.target.value)
                        }
                      })}
                      className="form-input"
                      required
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="longitude" className="block text-xs text-gray-500 mb-1">Longitude</label>
                    <input
                      id="longitude"
                      type="number"
                      step="0.000001"
                      value={currentStudent.homeLocation?.longitude}
                      onChange={(e) => setCurrentStudent({
                        ...currentStudent,
                        homeLocation: {
                          ...currentStudent.homeLocation!,
                          longitude: parseFloat(e.target.value)
                        }
                      })}
                      className="form-input"
                      required
                    />
                  </div>
                </div>
              </div>
              
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
                  {isEditMode ? 'Update' : 'Add'} Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
 