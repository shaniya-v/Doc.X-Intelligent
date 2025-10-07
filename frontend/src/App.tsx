import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import DepartmentDashboard from './components/DepartmentDashboard';
import './App.css';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user.isAuthenticated || !user.department) {
    return <LoginPage />;
  }

  return <DepartmentDashboard />;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;