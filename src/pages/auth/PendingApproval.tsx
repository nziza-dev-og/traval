import  { useAuth } from '../../context/AuthContext';
import { auth, signOut } from '../../firebase';
import { useNavigate } from 'react-router-dom';
import { Bus, AlertCircle } from 'lucide-react';

export const PendingApproval = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <Bus className="h-12 w-12 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Pending Approval</h2>
        
        <div className="mt-4 mb-6 bg-yellow-50 border border-yellow-200 text-yellow-700 px-4 py-3 rounded-md flex items-start">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-left">
            Your account is pending approval from an administrator. You'll be able to access the system once your account has been approved.
          </p>
        </div>
        
        <p className="text-gray-600 mb-6">
          This process usually takes 24-48 hours. You'll receive an email notification once your account is approved.
        </p>
        
        <button onClick={handleLogout} className="btn-secondary">
          Return to Login
        </button>
      </div>
    </div>
  );
};
 