import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => {
    return location.pathname === path ? 'text-blue-600 border-blue-600' : 'text-gray-600 hover:text-gray-900';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">D</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">DOC.X Intelligent</h1>
                  <p className="text-xs text-gray-500">KMRL Document Management</p>
                </div>
              </Link>
            </div>
            
            <nav className="flex space-x-8 items-center">
              <Link
                to="/"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors ${isActive('/')}`}
              >
                Dashboard
              </Link>
              <Link
                to="/department/Engineering"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors ${isActive('/department/Engineering')}`}
              >
                Engineering
              </Link>
              <Link
                to="/department/Finance"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors ${isActive('/department/Finance')}`}
              >
                Finance
              </Link>
              <Link
                to="/department/Operations"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors ${isActive('/department/Operations')}`}
              >
                Operations
              </Link>
              <Link
                to="/department/Safety & Security"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors ${isActive('/department/Safety & Security')}`}
              >
                Safety
              </Link>
              <Link
                to="/department/Human Resources"
                className={`px-3 py-2 text-sm font-medium border-b-2 border-transparent transition-colors ${isActive('/department/Human Resources')}`}
              >
                HR
              </Link>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-sm text-gray-600">Live</span>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <p className="text-gray-500 text-sm">
              © 2025 DOC.X Intelligent - KMRL Document Management System
            </p>
            <div className="flex space-x-4 text-sm text-gray-500">
              <span>Smart India Hackathon 2025</span>
              <span>•</span>
              <span>Version 2.0</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;