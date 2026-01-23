import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import DepartmentDashboard from './components/DepartmentDashboard';
import DocumentSearch from './components/DocumentSearch';
import PrivateDocuments from './components/PrivateDocuments';
import AIAssistant from './components/AIAssistant';
import './App.css';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user.isAuthenticated || !user.department) {
    return <LoginPage />;
  }

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/department/:departmentId" element={<DepartmentDashboard />} />
        <Route path="/search" element={<DocumentSearch />} />
        <Route path="/private" element={<PrivateDocuments />} />
        <Route path="/ai" element={<AIAssistantPage />} />
      </Routes>
    </Layout>
  );
};

const AIAssistantPage: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">AI Assistant</h1>
      <AIAssistant isOpen={true} onClose={() => {}} onTaskUpdate={() => {}} />
    </div>
  );
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