import  { useState, useEffect } from 'react';
import { 
  db, 
  collection, 
  query, 
  where, 
  onSnapshot, 
  updateDoc,
  doc,
  Timestamp,
  getDocs
} from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Bell, X, CheckCircle } from 'lucide-react';
import { Notification as NotificationType } from '../types';

export const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<NotificationType[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!currentUser) return;

    try {
      // Set up real-time listener for notifications
      const notificationsQuery = query(
        collection(db, 'notifications'),
        where('userId', '==', currentUser.uid)
      );
      
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        const notificationsData: NotificationType[] = [];
        snapshot.forEach((doc) => {
          notificationsData.push({ id: doc.id, ...doc.data() } as NotificationType);
        });
        
        // Sort by creation date descending (newest first)
        notificationsData.sort((a, b) => {
          const aTime = a.createdAt ? new Date(a.createdAt as any).getTime() : 0;
          const bTime = b.createdAt ? new Date(b.createdAt as any).getTime() : 0;
          return bTime - aTime;
        });
        
        setNotifications(notificationsData);
        setUnreadCount(notificationsData.filter(n => !n.read).length);
      }, (error) => {
        console.error("Error setting up notifications listener:", error);
      });
      
      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up notifications listener:", error);
    }
  }, [currentUser]);

  const markAsRead = async (notificationId: string) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: true
      });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      const promises = unreadNotifications.map(notification => 
        updateDoc(doc(db, 'notifications', notification.id), { read: true })
      );
      await Promise.all(promises);
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const notificationDate = new Date(date as any);
    
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInSecs = Math.floor(diffInMs / 1000);
    const diffInMins = Math.floor(diffInSecs / 60);
    const diffInHours = Math.floor(diffInMins / 60);
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInSecs < 60) {
      return "Just now";
    } else if (diffInMins < 60) {
      return `${diffInMins} ${diffInMins === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffInDays < 7) {
      return `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 text-gray-500 hover:text-gray-600 hover:bg-gray-100 rounded-full relative"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-20">
          <div className="p-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
            <h3 className="text-sm font-medium text-gray-700">Notifications</h3>
            {unreadCount > 0 && (
              <button 
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Mark all as read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length > 0 ? (
              <ul className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`p-3 hover:bg-gray-50 transition ${!notification.read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex justify-between">
                      <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                      {!notification.read && (
                        <button 
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Mark as read"
                        >
                          <CheckCircle size={16} />
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {formatDate(notification.createdAt)}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="p-4 text-center text-gray-500">
                No notifications
              </div>
            )}
          </div>
          
          <div className="p-2 border-t border-gray-200 text-center">
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {isOpen && (
        <div 
          className="fixed inset-0 z-10"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </div>
  );
};
 