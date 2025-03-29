import  { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordResetEmail, auth } from '../../firebase';
import { Bus, Mail } from 'lucide-react';

export const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Check your email for password reset instructions');
    } catch (error: any) {
      setError('Failed to reset password: ' + (error.message || 'Unknown error'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="auth-card">
        <div className="text-center mb-8">
          <div className="flex justify-center">
            <Bus className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">Reset Password</h2>
          <p className="mt-2 text-gray-600">We'll send you instructions to reset your password</p>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        {message && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
            {message}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="form-label">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="form-input pl-10"
                placeholder="Enter your email"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex justify-center"
          >
            {loading ? 'Sending...' : 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Remember your password?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
 