import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useAuth, DEPARTMENTS } from '../contexts/AuthContext';
import AIAssistant from './AIAssistant';
import DocumentSearch from './DocumentSearch';
import PrivateDocuments from './PrivateDocuments';

interface Task {
  id: string;
  title: string;
  description: string;
  department: string;
  assignedDepartment: string;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  deadline: string;
  completed: boolean;
  documentId: string;
  fileName?: string;
  fileUrl?: string;
  createdAt: string;
}

interface Document {
  id: string;
  title: string;
  content: string;
  department?: string;
  assigned_department?: string;
  priority: string;
  deadline?: string;
  fileName?: string;
  fileUrl?: string;
  completed?: boolean;
  createdAt?: string;
  metadata?: {
    deadline?: string;
    [key: string]: any;
  };
  status?: string;
  source?: string;
}

const DepartmentDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const { departmentId } = useParams<{ departmentId: string }>();
  const currentDepartment = DEPARTMENTS.find(d => d.id === departmentId) || user.department;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [aiOpen, setAiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'private' | 'search'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (currentDepartment) {
      fetchDepartmentTasks();
    }
  }, [currentDepartment]);

  const fetchDepartmentTasks = async () => {
    if (!currentDepartment) return;
    try {
      setLoading(true);
      const departmentParam = encodeURIComponent(currentDepartment.id);
      const response = await fetch(`' + import.meta.env.VITE_API_URL + '/api/departments/${departmentParam}/documents`);
      
      if (response.ok) {
        const data = await response.json();
        const documents = data.documents || []; // Extract documents array from response
        
        console.log('Fetched documents for', currentDepartment.id, ':', documents.length);
        console.log('Sample document:', documents[0]);
        
        // Convert documents to tasks format
        const departmentTasks: Task[] = documents
          .map((doc: Document) => {
            return {
              id: doc.id,
              title: doc.filename || doc.title || 'Untitled Document',
              description: doc.summary || 'No summary available',
              summary: doc.summary || doc.metadata?.ai_analysis?.summary || 'No summary available',
              metadata: doc.metadata,
              department: doc.department,
              assignedDepartment: doc.assigned_department || doc.department,
              priority: doc.priority as 'urgent' | 'high' | 'normal' | 'low' || 'normal',
              deadline: doc.metadata?.deadline || getDefaultDeadline(doc.priority),
              completed: doc.completed || false,
              documentId: doc.id,
              fileName: doc.filename || doc.title,
              fileUrl: `' + import.meta.env.VITE_API_URL + '/api/documents/${doc.id}/download`,
              createdAt: doc.created_at || doc.upload_date || new Date().toISOString()
            };
          });
        
        // Sort by priority and deadline
        departmentTasks.sort((a, b) => {
          // Urgent tasks first
          if (a.priority === 'urgent' && b.priority !== 'urgent') return -1;
          if (b.priority === 'urgent' && a.priority !== 'urgent') return 1;
          
          // Then by deadline
          const aDeadline = new Date(a.deadline);
          const bDeadline = new Date(b.deadline);
          return aDeadline.getTime() - bDeadline.getTime();
        });
        
        setTasks(departmentTasks);
      } else {
        setError('Failed to fetch department tasks');
      }
    } catch (err) {
      setError('Error connecting to server');
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultDeadline = (priority: string): string => {
    const now = new Date();
    switch (priority) {
      case 'urgent':
        now.setDate(now.getDate() + 1);
        break;
      case 'high':
        now.setDate(now.getDate() + 3);
        break;
      case 'normal':
        now.setDate(now.getDate() + 7);
        break;
      default:
        now.setDate(now.getDate() + 14);
    }
    return now.toISOString().split('T')[0];
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const response = await fetch(`' + import.meta.env.VITE_API_URL + '/api/tasks/${taskId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          department: user.department?.id,
          notes: 'Task completed via dashboard'
        })
      });

      if (response.ok) {
        setTasks(tasks.map(t => 
          t.id === taskId ? { ...t, completed: !t.completed } : t
        ));
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const viewDocument = async (documentId: string) => {
    try {
      console.log('Viewing document:', documentId);
      // Open document in new tab for viewing with HTML format
      window.open(`' + import.meta.env.VITE_API_URL + '/api/documents/${documentId}`, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const downloadDocument = async (task: Task) => {
    try {
      console.log('Downloading document:', task.documentId);
      const response = await fetch(`' + import.meta.env.VITE_API_URL + '/api/documents/${task.documentId}/download`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = task.fileName || 'document.txt';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Download failed' }));
        console.error('Download error:', errorData.error);
        alert(`Download failed: ${errorData.error}`);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document. Please try again.');
    }
  };

  const isDeadlineToday = (deadline: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return deadline === today;
  };

  const isOverdue = (deadline: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return deadline < today;
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'normal': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTasks = tasks.filter(task => 
    task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    task.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            {/* Left side */}
            <div className="flex items-center space-x-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                style={{ 
                  backgroundColor: `${user.department?.color}20`, 
                  color: user.department?.color 
                }}
              >
                {user.department?.icon}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  {user.department?.name} Dashboard
                </h1>
                <p className="text-sm text-gray-500">Welcome, {user.username}</p>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <svg 
                  className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'tasks'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Department Tasks
            </button>
            <button
              onClick={() => setActiveTab('private')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'private'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Private Documents
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'search'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Document Search
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Department Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div 
                    className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                    style={{ 
                      backgroundColor: `${currentDepartment?.color}20`, 
                      color: currentDepartment?.color 
                    }}
                  >
                    {currentDepartment?.icon}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {currentDepartment?.name} Department
                    </h2>
                    <p className="text-gray-600">{currentDepartment?.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => setAiOpen(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-4l-4 4-4-4z" />
                  </svg>
                  AI Assistant
                </button>
              </div>
            </div>

            {/* Documents Table */}
            <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Document
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Source
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tasks.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                          <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="text-lg font-medium">No documents yet</p>
                          <p className="text-sm">Documents assigned to this department will appear here</p>
                        </td>
                      </tr>
                    ) : (
                      tasks.map((task) => {
                        const isExpanded = expandedDocs.has(task.id);
                        return (
                          <React.Fragment key={task.id}>
                            <tr className="hover:bg-blue-50 transition-colors">
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <button
                                    onClick={() => {
                                      const newExpanded = new Set(expandedDocs);
                                      if (isExpanded) {
                                        newExpanded.delete(task.id);
                                      } else {
                                        newExpanded.add(task.id);
                                      }
                                      setExpandedDocs(newExpanded);
                                    }}
                                    className="mr-2 text-gray-400 hover:text-gray-600 transition-colors"
                                    aria-label={isExpanded ? 'Collapse' : 'Expand'}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-5 w-5" />
                                    ) : (
                                      <ChevronDown className="h-5 w-5" />
                                    )}
                                  </button>
                                  <div className="text-2xl mr-3">
                                    📄
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 hover:text-blue-600">
                                      {task.title || task.fileName || 'Untitled'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                                  task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                  task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                  task.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {task.priority || 'normal'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-sm text-gray-600 capitalize">
                                  {task.department || 'manual'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {task.createdAt ? new Date(task.createdAt).toLocaleDateString() : 'N/A'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {task.fileUrl && (
                                    <a
                                      href={task.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                                    >
                                      View File
                                    </a>
                                  )}
                                  <button
                                    onClick={async () => {
                                      try {
                                        const userEmail = `${currentDepartment?.id}@kmrl.com`;
                                        const formData = new FormData();
                                        formData.append('user_email', userEmail);
                                        
                                        const response = await fetch(`' + import.meta.env.VITE_API_URL + '/api/documents/${task.documentId}/mark-private`, {
                                          method: 'POST',
                                          body: formData
                                        });
                                        
                                        if (response.ok) {
                                          const result = await response.json();
                                          console.log('Document marked private:', result);
                                          alert(`Document saved to your private collection!\n\nFind it in the "My Documents" tab.`);
                                          // Remove from current list since it's now private
                                          setTasks(prev => prev.filter(t => t.documentId !== task.documentId));
                                        } else {
                                          const error = await response.json();
                                          console.error('Failed to mark private:', error);
                                          alert('Failed to mark document as private. Please try again.');
                                        }
                                      } catch (error) {
                                        console.error('Error marking private:', error);
                                        alert('Error marking document as private. Please try again.');
                                      }
                                    }}
                                    className="inline-flex items-center px-3 py-1.5 border border-purple-300 rounded-md text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors"
                                  >
                                    🔒 Save Private
                                  </button>
                                </div>
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr className="bg-blue-50">
                                <td colSpan={5} className="px-6 py-4">
                                  <div className="pl-12">
                                    <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 Document Summary</h4>
                                    <p className="text-sm text-gray-700 leading-relaxed">
                                      {task.summary || task.metadata?.ai_analysis?.summary || task.description || 'No summary available for this document.'}
                                    </p>
                                    {task.metadata?.ai_analysis?.key_topics && task.metadata.ai_analysis.key_topics.length > 0 && (
                                      <div className="mt-3">
                                        <h5 className="text-xs font-semibold text-gray-700 mb-2">Key Topics:</h5>
                                        <div className="flex flex-wrap gap-2">
                                          {task.metadata.ai_analysis.key_topics.map((topic: string, idx: number) => (
                                            <span key={idx} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                                              {topic}
                                            </span>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'private' && <PrivateDocuments />}
        {activeTab === 'search' && <DocumentSearch />}
      </main>

      {/* Floating AI Assistant */}
      <button
        onClick={() => setAiOpen(true)}
        className="fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

      {/* AI Assistant Modal */}
      {aiOpen && (
        <AIAssistant 
          isOpen={aiOpen} 
          onClose={() => {
            console.log('DepartmentDashboard: Closing AI Assistant');
            setAiOpen(false);
          }}
          onTaskUpdate={fetchDepartmentTasks}
        />
      )}
    </div>
  );
};

export default DepartmentDashboard;