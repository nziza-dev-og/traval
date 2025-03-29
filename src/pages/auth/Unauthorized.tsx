import  { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';

export const Unauthorized = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow rounded-lg p-8 text-center">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="h-16 w-16 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        <p className="text-gray-600 mb-6">
          You don't have permission to access this page. Please contact the administrator if you believe this is an error.
        </p>
        <button 
          onClick={() => navigate('/dashboard')} 
          className="btn-primary"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};
 