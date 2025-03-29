import  { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signOut, auth } from '../firebase';
import { UserRole } from '../types';
import { Notifications } from '../components/Notifications';
import { Menu, X, LogOut, Settings, User, Home, MapPin, Bus, Users, Book, Calendar, Cloud } from 'lucide-react';

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
          <div className="flex items-center">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <Link to="/" className="flex items-center space-x-2">
              <Bus className="text-blue-600" size={24} />
              <span className="text-xl font-bold text-blue-600">SchoolTrack</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Notifications />
            <div className="relative">
              <div className="flex items-center space-x-3">
                <div className="text-sm font-medium text-gray-700 hidden md:block">
                  {currentUser?.displayName}
                </div>
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                  {currentUser?.displayName?.charAt(0).toUpperCase() || <User size={16} />}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        <aside className={`bg-white w-64 shadow-md fixed inset-y-0 z-20 pt-16 transition-transform duration-300 md:translate-x-0 md:static md:inset-auto md:h-auto md:pt-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="h-full overflow-y-auto py-4 px-3">
            <nav className="space-y-1">
              <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard') ? 'active' : ''}`}>
                <Home size={20} />
                <span>Dashboard</span>
              </Link>
              
              {currentUser?.role === UserRole.ADMIN && (
                <>
                  <Link to="/dashboard/students" className={`sidebar-link ${isActive('/dashboard/students') ? 'active' : ''}`}>
                    <Book size={20} />
                    <span>Students</span>
                  </Link>
                  <Link to="/dashboard/users" className={`sidebar-link ${isActive('/dashboard/users') ? 'active' : ''}`}>
                    <Users size={20} />
                    <span>Users</span>
                  </Link>
                  <Link to="/dashboard/routes" className={`sidebar-link ${isActive('/dashboard/routes') ? 'active' : ''}`}>
                    <MapPin size={20} />
                    <span>Routes</span>
                  </Link>
                  <Link to="/dashboard/buses" className={`sidebar-link ${isActive('/dashboard/buses') ? 'active' : ''}`}>
                    <Bus size={20} />
                    <span>Buses</span>
                  </Link>
                  <Link to="/dashboard/weather" className={`sidebar-link ${isActive('/dashboard/weather') ? 'active' : ''}`}>
                    <Cloud size={20} />
                    <span>Weather</span>
                  </Link>
                </>
              )}
              
              {currentUser?.role === UserRole.DRIVER && (
                <>
                  <Link to="/dashboard/my-route" className={`sidebar-link ${isActive('/dashboard/my-route') ? 'active' : ''}`}>
                    <MapPin size={20} />
                    <span>My Route</span>
                  </Link>
                  <Link to="/dashboard/trip" className={`sidebar-link ${isActive('/dashboard/trip') ? 'active' : ''}`}>
                    <Bus size={20} />
                    <span>Manage Trip</span>
                  </Link>
                  <Link to="/dashboard/weather" className={`sidebar-link ${isActive('/dashboard/weather') ? 'active' : ''}`}>
                    <Cloud size={20} />
                    <span>Weather</span>
                  </Link>
                </>
              )}
              
              {currentUser?.role === UserRole.PARENT && (
                <>
                  <Link to="/dashboard/my-children" className={`sidebar-link ${isActive('/dashboard/my-children') ? 'active' : ''}`}>
                    <Users size={20} />
                    <span>My Children</span>
                  </Link>
                  <Link to="/dashboard/track-bus" className={`sidebar-link ${isActive('/dashboard/track-bus') ? 'active' : ''}`}>
                    <Bus size={20} />
                    <span>Track Bus</span>
                  </Link>
                  <Link to="/dashboard/trip-history" className={`sidebar-link ${isActive('/dashboard/trip-history') ? 'active' : ''}`}>
                    <Calendar size={20} />
                    <span>Trip History</span>
                  </Link>
                  <Link to="/dashboard/weather" className={`sidebar-link ${isActive('/dashboard/weather') ? 'active' : ''}`}>
                    <Cloud size={20} />
                    <span>Weather</span>
                  </Link>
                </>
              )}
              
              <Link to="/dashboard/profile" className={`sidebar-link ${isActive('/dashboard/profile') ? 'active' : ''}`}>
                <User size={20} />
                <span>Profile</span>
              </Link>
              
              <Link to="/dashboard/settings" className={`sidebar-link ${isActive('/dashboard/settings') ? 'active' : ''}`}>
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              
              <button onClick={handleLogout} className="sidebar-link text-red-600 hover:bg-red-50">
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </nav>
          </div>
        </aside>

        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
 