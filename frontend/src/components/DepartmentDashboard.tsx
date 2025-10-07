import React, { useState, useEffect } from 'react';
import { useAuth, DEPARTMENTS } from '../contexts/AuthContext';
import AIAssistant from './AIAssistant';
import HamburgerMenu from './HamburgerMenu';
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
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'private' | 'search'>('tasks');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchDepartmentTasks();
  }, [user.department]);

  const fetchDepartmentTasks = async () => {
    try {
      setLoading(true);
      const departmentParam = encodeURIComponent(user.department?.id || '');
      const response = await fetch(`http://127.0.0.1:5000/api/documents?department=${departmentParam}`);
      
      if (response.ok) {
        const data = await response.json();
        const documents = data.documents || []; // Extract documents array from response
        
        console.log('Fetched documents for', user.department?.id, ':', documents.length);
        console.log('Sample document:', documents[0]);
        
        // Convert documents to tasks format
        const departmentTasks: Task[] = documents
          .map((doc: Document) => {
            // Extract meaningful work summary from content
            const content = doc.content || '';
            let workSummary = '';
            
            // Enhanced extraction patterns for different content types
            const extractionPatterns = [
              { pattern: /MAINTENANCE TASKS?:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'maintenance' },
              { pattern: /TASKS?:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'tasks' },
              { pattern: /ACTION ITEMS?:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'actions' },
              { pattern: /RECOMMENDATIONS?:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'recommendations' },
              { pattern: /ACHIEVEMENTS?:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'achievements' },
              { pattern: /PERFORMANCE SUMMARY:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'performance' },
              { pattern: /REVENUE SUMMARY:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'revenue' },
              { pattern: /INSPECTION SUMMARY:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'inspection' },
              { pattern: /KEY FINDINGS?:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'findings' },
              { pattern: /SUMMARY:?\s*\n([\s\S]*?)(?=\n[A-Z][A-Z\s]*:|$)/i, name: 'summary' }
            ];

            // Try each pattern to extract meaningful content
            for (const { pattern, name } of extractionPatterns) {
              const match = content.match(pattern);
              if (match && match[1]) {
                let extracted = match[1].trim();
                // Clean up and format the content
                const lines = extracted
                  .split('\n')
                  .map(line => line.trim())
                  .filter(line => line.length > 5 && !line.match(/^[A-Z\s]+:?$/))
                  .slice(0, 3);
                
                if (lines.length > 0) {
                  workSummary = lines
                    .map(line => line.replace(/^\d+\.\s*/, '').replace(/^-\s*/, '').replace(/^•\s*/, ''))
                    .join(' • ');
                  break;
                }
              }
            }
            
            // If no structured content found, look for work-related keywords in sentences
            if (!workSummary) {
              const workKeywords = /(?:replace|upgrade|implement|schedule|calibrate|update|inspect|review|analyze|process|handle|manage|coordinate|develop|create|maintain|monitor|assess|evaluate|track|report|prepare|execute|deliver|complete|finalize|optimize|improve|fix|repair|install|configure|setup|deploy|test|validate|verify|ensure|establish|define|design|plan|organize|structure|streamline|enhance|troubleshoot|resolve|address)\s+[^.]*[.!?]/gi;
              
              const workMatches = content.match(workKeywords);
              if (workMatches && workMatches.length > 0) {
                workSummary = workMatches
                  .slice(0, 2)
                  .map(match => match.trim().replace(/[.!?]$/, ''))
                  .join(' • ');
              }
            }
            
            // Final fallback - extract first meaningful sentences that contain work indicators
            if (!workSummary) {
              const sentences = content
                .replace(/\n+/g, ' ')
                .split(/[.!?]+/)
                .map(s => s.trim())
                .filter(s => {
                  const lowerS = s.toLowerCase();
                  return s.length > 20 && s.length < 150 && 
                         (lowerS.includes('task') || lowerS.includes('work') || 
                          lowerS.includes('report') || lowerS.includes('review') ||
                          lowerS.includes('analysis') || lowerS.includes('maintenance') ||
                          lowerS.includes('project') || lowerS.includes('schedule') ||
                          lowerS.includes('performance') || lowerS.includes('issue') ||
                          lowerS.includes('problem') || lowerS.includes('solution') ||
                          lowerS.includes('implement') || lowerS.includes('complete'));
                })
                .slice(0, 2);

              if (sentences.length > 0) {
                workSummary = sentences.join(' • ');
              } else {
                // Last resort - create meaningful task description from document context
                const dept = doc.assigned_department || doc.department || 'Department';
                if (doc.title && doc.title.toLowerCase().includes('maintenance')) {
                  workSummary = `Review ${dept} maintenance procedures and implementation requirements`;
                } else if (doc.title && doc.title.toLowerCase().includes('inspection')) {
                  workSummary = `Complete ${dept} inspection tasks and submit findings report`;
                } else if (doc.title && doc.title.toLowerCase().includes('report')) {
                  workSummary = `Analyze ${dept} report data and implement recommended actions`;
                } else {
                  workSummary = `Process ${dept} documentation and complete assigned tasks`;
                }
              }
            }
            
            // Clean up and format the work summary
            if (workSummary) {
              workSummary = workSummary
                .replace(/\\n/g, ' ') // Replace literal \n with space
                .replace(/\n/g, ' ') // Replace actual newlines with space
                .replace(/\s+/g, ' ') // Replace multiple spaces with single space
                .replace(/\s*•\s*/g, ' • ') // Clean up bullet formatting
                .trim()
                .substring(0, 200);
              
              // Ensure it ends cleanly if truncated
              if (workSummary.length === 200 && !workSummary.endsWith('•')) {
                const lastBullet = workSummary.lastIndexOf('•');
                if (lastBullet > 100) {
                  workSummary = workSummary.substring(0, lastBullet).trim() + '...';
                }
              }
            }
            
            return {
              id: doc.id,
              title: workSummary || `Review: ${doc.title}`,
              description: `${doc.source || 'Document'}`,
              department: doc.department,
              assignedDepartment: doc.assigned_department || doc.department,
              priority: doc.priority as 'urgent' | 'high' | 'normal' | 'low' || 'normal',
              deadline: doc.metadata?.deadline || getDefaultDeadline(doc.priority),
              completed: doc.completed || false,
              documentId: doc.id,
              fileName: doc.title,
              fileUrl: `/api/documents/${doc.id}`, // API endpoint to view document
              createdAt: doc.createdAt || new Date().toISOString()
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

      const response = await fetch(`http://127.0.0.1:5000/api/tasks/${taskId}/complete`, {
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
      window.open(`http://127.0.0.1:5000/api/documents/${documentId}?view=html`, '_blank');
    } catch (error) {
      console.error('Error viewing document:', error);
    }
  };

  const downloadDocument = async (task: Task) => {
    try {
      console.log('Downloading document:', task.documentId);
      const response = await fetch(`http://127.0.0.1:5000/api/download/${task.documentId}`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Hamburger Menu */}
      <HamburgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMenuOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              
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
              Global Search
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Tasks</p>
                    <p className="text-2xl font-semibold text-gray-900">{tasks.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Due Today</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(t => isDeadlineToday(t.deadline)).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Completed</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(t => t.completed).length}
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Overdue</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {tasks.filter(t => isOverdue(t.deadline) && !t.completed).length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Department Tasks</h3>
              </div>
              
              {error && (
                <div className="p-4 bg-red-50 border-l-4 border-red-400">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Task
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Deadline
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        File
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredTasks.map((task) => (
                      <tr 
                        key={task.id}
                        className={`${
                          isDeadlineToday(task.deadline) ? 'bg-red-50' : 
                          isOverdue(task.deadline) && !task.completed ? 'bg-red-100' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskCompletion(task.id)}
                              className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">
                                {task.title.includes('•') ? (
                                  <div>
                                    {task.title.split('•').map((item, index) => (
                                      index === 0 ? (
                                        <div key={index} className="font-medium">{item.trim()}</div>
                                      ) : (
                                        <div key={index} className="ml-2 mt-1">• {item.trim()}</div>
                                      )
                                    ))}
                                  </div>
                                ) : (
                                  task.title
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {task.description}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${
                            isDeadlineToday(task.deadline) ? 'text-red-600 font-bold' :
                            isOverdue(task.deadline) && !task.completed ? 'text-red-500' :
                            'text-gray-900'
                          }`}>
                            {new Date(task.deadline).toLocaleDateString()}
                            {isDeadlineToday(task.deadline) && (
                              <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                                TODAY
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => viewDocument(task.documentId)}
                              className="text-indigo-600 hover:text-indigo-900 text-sm flex items-center space-x-1"
                              title="View Document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                              <span>View</span>
                            </button>
                            <button
                              onClick={() => downloadDocument(task)}
                              className="text-green-600 hover:text-green-900 text-sm flex items-center space-x-1"
                              title="Download Document"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span>Download</span>
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            task.completed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.completed ? 'Completed' : 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => viewDocument(task.documentId)}
                            className="text-indigo-600 hover:text-indigo-900 mr-3"
                          >
                            View
                          </button>
                          <button
                            onClick={() => downloadDocument(task)}
                            className="text-green-600 hover:text-green-900"
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredTasks.length === 0 && (
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks found</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {searchQuery ? 'Try adjusting your search terms.' : 'No tasks assigned to your department yet.'}
                    </p>
                  </div>
                )}
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
          onClose={() => setAiOpen(false)}
          onTaskUpdate={fetchDepartmentTasks}
        />
      )}
    </div>
  );
};

export default DepartmentDashboard;