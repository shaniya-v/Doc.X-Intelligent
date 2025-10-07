import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface Department {
  id: string;
  name: string;
  color: string;
  icon: string;
  description: string;
}

export const DEPARTMENTS: Department[] = [
  { id: 'Engineering', name: 'Engineering', color: '#3B82F6', icon: '⚙️', description: 'Technical maintenance and infrastructure' },
  { id: 'Finance', name: 'Finance', color: '#10B981', icon: '💰', description: 'Budget, payments, and financial management' },
  { id: 'Human Resources', name: 'Human Resources', color: '#8B5CF6', icon: '👥', description: 'Employee management and policies' },
  { id: 'Information Technology', name: 'Information Technology', color: '#F59E0B', icon: '�', description: 'IT systems and technology' },
  { id: 'Safety & Security', name: 'Safety & Security', color: '#EF4444', icon: '🛡️', description: 'Safety protocols and security' },
  { id: 'Operations', name: 'Operations', color: '#06B6D4', icon: '🚇', description: 'Metro operations and scheduling' },
  { id: 'Public Relations', name: 'Public Relations', color: '#EC4899', icon: '📢', description: 'Public communications and media' }
];

interface User {
  username: string;
  department: Department | null;
  isAuthenticated: boolean;
}

interface AuthContextType {
  user: User;
  login: (username: string, password: string, department: Department) => boolean;
  logout: () => void;
  updateDepartment: (department: Department) => void;
  getDepartmentById: (id: string) => Department | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User>({
    username: '',
    department: null,
    isAuthenticated: false
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('docx_auth');
    if (savedAuth) {
      try {
        const authData = JSON.parse(savedAuth);
        if (authData.isAuthenticated && authData.department) {
          setUser({
            username: authData.username,
            department: authData.department,
            isAuthenticated: true
          });
        }
      } catch (error) {
        console.error('Error loading auth data:', error);
        localStorage.removeItem('docx_auth');
      }
    }
  }, []);

  const login = (username: string, password: string, department: Department): boolean => {
    // Simple authentication - username: department123, password: 456
    if (username === 'department123' && password === '456') {
      const newUser = {
        username,
        department,
        isAuthenticated: true
      };
      
      setUser(newUser);
      
      // Save to localStorage
      localStorage.setItem('docx_auth', JSON.stringify(newUser));
      
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser({
      username: '',
      department: null,
      isAuthenticated: false
    });
    localStorage.removeItem('docx_auth');
  };

  const updateDepartment = (department: Department) => {
    const updatedUser = {
      ...user,
      department
    };
    setUser(updatedUser);
    localStorage.setItem('docx_auth', JSON.stringify(updatedUser));
  };

  const getDepartmentById = (id: string): Department | undefined => {
    return DEPARTMENTS.find(dept => dept.id === id);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateDepartment, getDepartmentById }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;