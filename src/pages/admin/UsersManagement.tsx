import  { useEffect, useState } from 'react';
import { 
  db, 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc 
} from '../../firebase';
import { User, UserRole } from '../../types';
import { 
  Check, 
  X, 
  ChevronDown, 
  Filter, 
  User as UserIcon,
  Search 
} from 'lucide-react';

export const UsersManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [filterApproval, setFilterApproval] = useState<'all' | 'approved' | 'pending'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const usersData: User[] = [];
        usersSnapshot.forEach((doc) => {
          usersData.push({ uid: doc.id, ...doc.data() } as User);
        });
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, []);

  const handleApproveUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), {
        approved: true
      });
      
      setUsers(users.map(user => 
        user.uid === uid ? { ...user, approved: true } : user
      ));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (confirm('Are you sure you want to delete this user?')) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        setUsers(users.filter(user => user.uid !== uid));
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const filteredUsers = users.filter(user => {
    // Apply search filter
    const matchesSearch = 
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Apply role filter
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    
    // Apply approval filter
    const matchesApproval = 
      filterApproval === 'all' || 
      (filterApproval === 'approved' && user.approved) || 
      (filterApproval === 'pending' && !user.approved);
    
    return matchesSearch && matchesRole && matchesApproval;
  });

  const getRoleBadgeClass = (role: UserRole) => {
    switch (role) {
      case UserRole.ADMIN:
        return 'bg-purple-100 text-purple-800';
      case UserRole.DRIVER:
        return 'bg-blue-100 text-blue-800';
      case UserRole.PARENT:
        return 'bg-green-100 text-green-800';
      case UserRole.STUDENT:
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Users Management</h1>
      
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
          <div className="relative flex-grow max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-input pl-10 w-full"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
            >
              <Filter size={18} />
              <span>Filter</span>
              <ChevronDown size={16} />
            </button>
            
            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                <div className="py-1 p-2">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase">Role</p>
                    <div className="mt-1 space-y-1">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="roleFilter"
                          checked={filterRole === 'all'}
                          onChange={() => setFilterRole('all')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">All</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="roleFilter"
                          checked={filterRole === UserRole.ADMIN}
                          onChange={() => setFilterRole(UserRole.ADMIN)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Administrators</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="roleFilter"
                          checked={filterRole === UserRole.DRIVER}
                          onChange={() => setFilterRole(UserRole.DRIVER)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Drivers</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="roleFilter"
                          checked={filterRole === UserRole.PARENT}
                          onChange={() => setFilterRole(UserRole.PARENT)}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Parents</span>
                      </label>
                    </div>
                  </div>
                  
                  <div className="px-3 py-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                    <div className="mt-1 space-y-1">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="approvalFilter"
                          checked={filterApproval === 'all'}
                          onChange={() => setFilterApproval('all')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">All</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="approvalFilter"
                          checked={filterApproval === 'approved'}
                          onChange={() => setFilterApproval('approved')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Approved</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="approvalFilter"
                          checked={filterApproval === 'pending'}
                          onChange={() => setFilterApproval('pending')}
                          className="h-4 w-4 text-blue-600"
                        />
                        <span className="ml-2 text-sm text-gray-700">Pending Approval</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
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
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.uid}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          {user.photo ? (
                            <img src={user.photo} alt={user.displayName} className="h-10 w-10 rounded-full" />
                          ) : (
                            <UserIcon className="h-5 w-5 text-blue-600" />
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.displayName}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.approved ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Approved
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {!user.approved && (
                        <button
                          onClick={() => handleApproveUser(user.uid)}
                          className="text-green-600 hover:text-green-900 mr-3"
                          title="Approve User"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteUser(user.uid)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete User"
                      >
                        <X size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
 