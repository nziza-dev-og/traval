import  { useState, useEffect } from 'react';
import { AlertCircle, Wifi, WifiOff } from 'lucide-react';

export const NetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Show reconnected message for a few seconds
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg shadow-lg flex items-center space-x-3 z-50 ${
        isOnline ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
      }`}
    >
      <div className="flex-shrink-0">
        {isOnline ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium">
          {isOnline 
            ? 'You are back online! Syncing data...' 
            : 'You are currently offline. Limited functionality is available.'}
        </p>
      </div>
      <div>
        <button 
          onClick={() => setShowBanner(false)}
          className="ml-4 text-sm font-medium hover:text-opacity-75"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
};
 