import  { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  createUserWithEmailAndPassword, 
  auth, 
  db, 
  setDoc, 
  doc,
  updateProfile
} from '../../firebase';
import { User, UserRole } from '../../types';
import { Bus, Mail, Lock, User as UserIcon } from 'lucide-react';

export const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>(UserRole.PARENT);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      await updateProfile(userCredential.user, {
        displayName: name
      });

      // For simplicity, we're setting the admin's own ID as adminId
      // In a real app, this would be the ID of the admin who approved them
      const userData: Omit<User, 'uid'> = {
        email,
        displayName: name,
        role,
        approved: role === UserRole.ADMIN, // Auto-approve admin accounts
        phoneNumber,
        adminId: userCredential.user.uid // Self-reference for admins
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      if (role === UserRole.ADMIN) {
        navigate('/dashboard');
      } else {
        navigate('/pending-approval');
      }
    } catch (error: any) {
      setError('Failed to create an account: ' + (error.message || 'Unknown error'));
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="auth-card">
        <div className="text-center mb-6">
          <div className="flex justify-center">
            <Bus className="h-12 w-12 text-blue-600" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">SchoolTrack</h2>
          <p className="mt-2 text-gray-600">Create your account</p>
        </div>
        
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="form-label">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <UserIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="form-input pl-10"
                placeholder="Enter your full name"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="email" className="form-label">Email Address</label>
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

          <div>
            <label htmlFor="phone" className="form-label">Phone Number</label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="form-input"
              placeholder="Enter your phone number"
            />
          </div>

          <div>
            <label htmlFor="role" className="form-label">Register as</label>
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as UserRole)}
              className="form-input"
            >
              <option value={UserRole.PARENT}>Parent</option>
              <option value={UserRole.DRIVER}>Driver</option>
              <option value={UserRole.ADMIN}>Administrator</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="password" className="form-label">Password</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="form-input pl-10"
                placeholder="Create a password"
              />
            </div>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="form-input"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex justify-center mt-6"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
 