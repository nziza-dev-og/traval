export  interface User {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  approved: boolean;
  phoneNumber?: string;
  photo?: string;
  adminId?: string;
}

export enum UserRole {
  ADMIN = 'admin',
  DRIVER = 'driver',
  PARENT = 'parent',
  STUDENT = 'student'
}

export interface Student {
  id: string;
  fullName: string;
  grade: string;
  school: string;
  parentId: string;
  driverId: string;
  homeLocation: GeoPoint;
  photo?: string;
  adminId?: string;
  behaviorReports?: BehaviorReport[];
}

export interface Trip {
  id: string;
  driverId: string;
  driverName: string;
  startTime: Date | null;
  endTime: Date | null;
  status: TripStatus;
  routeId: string;
  busId?: string;
  studentsOnboard: string[];
  studentsExited: string[];
  currentLocation: GeoPoint | null;
  adminId?: string;
  weather?: WeatherInfo;
}

export enum TripStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export interface Route {
  id: string;
  name: string;
  driverId: string;
  busId: string;
  adminId: string;
  students: string[];
  stops: RouteStop[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RouteStop {
  studentId: string;
  location: GeoPoint;
  estimatedTime: Date;
}

export interface Bus {
  id: string;
  name: string;
  model: string;
  licensePlate: string;
  capacity: number;
  year: number;
  status: string;
  adminId: string;
  maintenance?: {
    lastDate: Date;
    nextDate: Date;
    notes: string;
  };
}

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: Date;
  type: NotificationType;
  studentId?: string;
  driverId?: string;
  adminId?: string;
}

export enum NotificationType {
  TRIP_STARTED = 'trip_started',
  TRIP_ENDED = 'trip_ended',
  BUS_APPROACHING = 'bus_approaching',
  STUDENT_ONBOARD = 'student_onboard',
  STUDENT_DROPOFF = 'student_dropoff',
  STUDENT_BEHAVIOR = 'student_behavior',
  EMERGENCY = 'emergency',
  WEATHER_ALERT = 'weather_alert'
}

export interface BehaviorReport {
  id: string;
  studentId: string;
  driverId: string;
  driverName: string;
  tripId: string;
  type: BehaviorType;
  description: string;
  createdAt: Date;
  status: 'pending' | 'reviewed' | 'resolved';
}

export enum BehaviorType {
  MISCONDUCT = 'misconduct',
  BULLYING = 'bullying',
  DISRUPTIVE = 'disruptive',
  POSITIVE = 'positive',
  OTHER = 'other'
}

export interface WeatherInfo {
  temperature: number;
  condition: string; // clear, rainy, snowy, etc.
  description: string;
  icon: string;
  windSpeed: number;
  humidity: number;
  updatedAt: Date;
}
 