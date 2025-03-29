import  { UserRole, Student, Trip, TripStatus } from '../types';

// Fallback data to use when offline
export const offlineData = {
  // Mock user data for testing when offline
  users: [
    {
      uid: 'admin1',
      email: 'admin@schooltrack.com',
      displayName: 'Admin User',
      role: UserRole.ADMIN,
      approved: true
    },
    {
      uid: 'driver1',
      email: 'driver@schooltrack.com',
      displayName: 'John Driver',
      role: UserRole.DRIVER,
      approved: true,
      phoneNumber: '555-123-4567'
    },
    {
      uid: 'parent1',
      email: 'parent@schooltrack.com',
      displayName: 'Sarah Parent',
      role: UserRole.PARENT,
      approved: true,
      phoneNumber: '555-987-6543'
    }
  ],
  
  // Mock students for testing
  students: [
    {
      id: 'student1',
      fullName: 'Emma Thompson',
      grade: '5th Grade',
      school: 'Lincoln Elementary',
      parentId: 'parent1',
      driverId: 'driver1',
      homeLocation: { latitude: 40.7128, longitude: -74.0060 }
    },
    {
      id: 'student2',
      fullName: 'Noah Johnson',
      grade: '3rd Grade',
      school: 'Lincoln Elementary',
      parentId: 'parent1',
      driverId: 'driver1',
      homeLocation: { latitude: 40.7148, longitude: -74.0090 }
    }
  ],
  
  // Mock trips for testing
  trips: [
    {
      id: 'trip1',
      driverId: 'driver1',
      driverName: 'John Driver',
      startTime: new Date(),
      endTime: null,
      status: TripStatus.IN_PROGRESS,
      routeId: 'route1',
      studentsOnboard: ['student1'],
      currentLocation: { latitude: 40.7200, longitude: -74.0100 }
    }
  ],
  
  // Mock routes for testing
  routes: [
    {
      id: 'route1',
      name: 'North Route - Morning',
      driverId: 'driver1',
      students: ['student1', 'student2'],
      stops: [
        {
          studentId: 'student1',
          location: { latitude: 40.7128, longitude: -74.0060 },
          estimatedTime: new Date()
        },
        {
          studentId: 'student2',
          location: { latitude: 40.7148, longitude: -74.0090 },
          estimatedTime: new Date()
        }
      ]
    }
  ]
};

// Helper function to get offline data by collection
export const getOfflineData = (collection: string, queryParams?: any) => {
  switch (collection) {
    case 'users':
      if (queryParams?.uid) {
        return offlineData.users.find(u => u.uid === queryParams.uid) || null;
      }
      if (queryParams?.role) {
        return offlineData.users.filter(u => u.role === queryParams.role);
      }
      return offlineData.users;
      
    case 'students':
      if (queryParams?.id) {
        return offlineData.students.find(s => s.id === queryParams.id) || null;
      }
      if (queryParams?.parentId) {
        return offlineData.students.filter(s => s.parentId === queryParams.parentId);
      }
      if (queryParams?.driverId) {
        return offlineData.students.filter(s => s.driverId === queryParams.driverId);
      }
      return offlineData.students;
      
    case 'trips':
      if (queryParams?.id) {
        return offlineData.trips.find(t => t.id === queryParams.id) || null;
      }
      if (queryParams?.driverId && queryParams?.status) {
        return offlineData.trips.filter(
          t => t.driverId === queryParams.driverId && t.status === queryParams.status
        );
      }
      return offlineData.trips;
      
    case 'routes':
      if (queryParams?.id) {
        return offlineData.routes.find(r => r.id === queryParams.id) || null;
      }
      if (queryParams?.driverId) {
        return offlineData.routes.filter(r => r.driverId === queryParams.driverId);
      }
      return offlineData.routes;
      
    default:
      return [];
  }
};
 