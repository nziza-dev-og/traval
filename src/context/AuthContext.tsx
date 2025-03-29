import  { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, onAuthStateChanged, doc, getDoc } from '../firebase';
import { User, UserRole } from '../types';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ currentUser: null, loading: true });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Try to fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'uid'>;
            setCurrentUser({
              uid: user.uid,
              ...userData
            });
          } else {
            // If document doesn't exist or offline, use basic auth data
            // This allows some app functionality when offline
            setCurrentUser({
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || 'User',
              role: UserRole.PARENT, // Default role
              approved: true, // Default approval for offline mode
              phoneNumber: user.phoneNumber || ''
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          // Fallback to basic auth data on error
          setCurrentUser({
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'User',
            role: UserRole.PARENT, 
            approved: true,
            phoneNumber: user.phoneNumber || ''
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
 