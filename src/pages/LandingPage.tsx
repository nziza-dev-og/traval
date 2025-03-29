import  { Link } from 'react-router-dom';
import { ChevronRight, Check, Bus, MapPin, Bell, Users } from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Bus className="h-8 w-8 text-blue-600" />
              <span className="ml-2 text-xl font-bold text-blue-600">SchoolTrack</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Sign In
              </Link>
              <Link to="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gray-50 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-12 lg:gap-8">
            <div className="sm:text-center md:max-w-2xl md:mx-auto lg:col-span-6 lg:text-left">
              <h1>
                <span className="block text-sm font-semibold uppercase tracking-wide text-blue-600">
                  Safe Transportation
                </span>
                <span className="mt-1 block text-4xl tracking-tight font-extrabold sm:text-5xl xl:text-6xl">
                  <span className="block text-gray-900">Track Your Child's</span>
                  <span className="block text-blue-600">School Bus Journey</span>
                </span>
              </h1>
              <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-xl lg:text-lg xl:text-xl">
                Real-time GPS tracking for school buses. Know exactly when your child boards the bus and when they'll arrive home. Peace of mind for parents, efficiency for schools.
              </p>
              <div className="mt-8 sm:mt-12">
                <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                  Get Started
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
                <Link to="/login" className="ml-4 inline-flex items-center justify-center px-5 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                  Sign In
                </Link>
              </div>
            </div>
            <div className="mt-12 relative sm:max-w-lg sm:mx-auto lg:mt-0 lg:max-w-none lg:mx-0 lg:col-span-6 lg:flex lg:items-center">
              <div className="relative mx-auto w-full rounded-lg shadow-lg lg:max-w-md">
                <img
                  className="w-full rounded-lg"
                  src="https://images.unsplash.com/photo-1503676382389-4809596d5290?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwyfHxzY2hvb2wlMjBidXMlMjB0cmFuc3BvcnRhdGlvbiUyMHRyYWNraW5nfGVufDB8fHx8MTc0MzIxMzU4NHww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
                  alt="Student ready for school"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">Features</h2>
            <p className="mt-1 text-3xl font-extrabold text-gray-900 sm:text-4xl sm:tracking-tight">
              Everything you need for safe transportation
            </p>
            <p className="max-w-xl mt-5 mx-auto text-xl text-gray-500">
              Our comprehensive solution keeps parents informed and children safe
            </p>
          </div>

          <div className="mt-12">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <MapPin className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Real-time GPS Tracking</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Track school buses in real-time with accurate GPS location. Know exactly when the bus will arrive at your stop.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <Bell className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Instant Notifications</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Receive alerts when your child boards or exits the bus, when the bus is approaching, or if there are any delays.
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <div className="flow-root bg-gray-50 rounded-lg px-6 pb-8">
                  <div className="-mt-6">
                    <div>
                      <span className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-md shadow-lg">
                        <Users className="h-6 w-6 text-white" />
                      </span>
                    </div>
                    <h3 className="mt-8 text-lg font-medium text-gray-900 tracking-tight">Multi-user Access</h3>
                    <p className="mt-5 text-base text-gray-500">
                      Different dashboards for parents, drivers, and administrators with role-specific features and permissions.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefits Section with updated images */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center mb-16">
            <div>
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">For Parents</h2>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">Peace of mind for every journey</p>
              <p className="mt-4 text-lg text-gray-500">Know where your child is at all times during their journey to and from school.</p>
              <div className="mt-8">
                <ul className="space-y-3">
                  {['Real-time bus location', 'Pickup & drop-off notifications', 'Direct communication with drivers', 'Trip history access'].map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-blue-100 rounded-full text-blue-600">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="ml-3 text-base text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwxfHxzY2hvb2wlMjBidXMlMjB0cmFuc3BvcnRhdGlvbiUyMHRyYWNraW5nfGVufDB8fHx8MTc0MzIxNDM2MXww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
                  alt="Collection of books for learning"
                  className="w-full h-auto"
                />
              </div>
            </div>
          </div>
          
          <div className="lg:grid lg:grid-cols-2 lg:gap-8 items-center mt-16">
            <div className="order-2 lg:order-1">
              <div className="rounded-lg overflow-hidden shadow-lg">
                <img 
                  src="https://images.unsplash.com/photo-1501349800519-48093d60bde0?ixid=M3w3MjUzNDh8MHwxfHNlYXJjaHwzfHxzY2hvb2wlMjBidXMlMjB0cmFuc3BvcnRhdGlvbiUyMHRyYWNraW5nfGVufDB8fHx8MTc0MzIxNDM2MXww&ixlib=rb-4.0.3&fit=fillmax&h=600&w=800"
                  alt="School supplies and pencils"
                  className="w-full h-auto"
                />
              </div>
            </div>
            <div className="order-1 lg:order-2 mb-10 lg:mb-0">
              <h2 className="text-base font-semibold text-blue-600 tracking-wide uppercase">For Schools</h2>
              <p className="mt-2 text-2xl font-extrabold text-gray-900">Comprehensive oversight</p>
              <p className="mt-4 text-lg text-gray-500">Complete management and reporting tools for school administrators.</p>
              <div className="mt-8">
                <ul className="space-y-3">
                  {['Fleet management', 'Student database', 'Trip reports and analytics', 'Parental communication tools'].map((benefit, index) => (
                    <li key={index} className="flex items-start">
                      <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center bg-blue-100 rounded-full text-blue-600">
                        <Check className="h-4 w-4" />
                      </span>
                      <span className="ml-3 text-base text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-blue-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Ready to get started?</span>
            <span className="block text-blue-200">Join our transportation network today.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link to="/register" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50">
                Sign up
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <Link to="/login" className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-700 hover:bg-blue-800">
                Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <div className="mt-8 flex justify-center space-x-6">
            <p className="text-center text-base text-gray-500">
              &copy; 2023 SchoolTrack. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
 