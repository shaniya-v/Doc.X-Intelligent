import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentApi } from '../utils/api';
import { DEPARTMENTS, PRIORITY_COLORS, formatDate } from '../utils/constants';
import { Document, DepartmentStats } from '../types';
import { TrendingUp, FileText, AlertCircle, Clock, Upload, ArrowRight, BarChart3, Bot, ChevronDown, ChevronUp } from 'lucide-react';

interface SystemStats {
  total_documents: number;
  total_departments: number;
  department_stats: Record<string, any>;
  recent_uploads_24h: number;
  priority_distribution: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
  sources: string[];
  active_users: number;
}

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  console.log('Dashboard: Rendering', { loading, error, documents: documents.length });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch documents
        const documentsResponse = await documentApi.getDocuments();
        setDocuments(documentsResponse.documents);
        
        // Fetch system stats
        const statsResponse = await fetch(import.meta.env.VITE_API_URL + '/api/stats/overview');
        if (statsResponse.ok) {
          const stats = await statsResponse.json();
          setSystemStats(stats);
        }
      } catch (err) {
        setError('Failed to fetch data. Please check if the backend is running.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <span className="mt-4 block text-gray-600 font-medium">Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="h-6 w-6 text-red-400 mt-0.5" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Dashboard</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const recentDocuments = documents
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 8);

  const totalDocs = systemStats?.total_documents || 0;
  const urgentDocs = systemStats?.priority_distribution?.urgent || 0;
  const recentUploads = systemStats?.recent_uploads_24h || 0;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Document Management Dashboard</h1>
          <p className="mt-2 text-gray-600">
            KMRL Intelligent Document Processing & Routing System
          </p>
        </div>
        <div className="flex space-x-3">
          <Link
            to="/upload"
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          >
            <Upload className="h-5 w-5" />
            <span className="font-medium">Upload Document</span>
          </Link>
          <Link
            to="/ai"
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-md"
          >
            <Bot className="h-5 w-5" />
            <span className="font-medium">AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Documents */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Documents</p>
              <p className="text-3xl font-bold mt-2">{totalDocs}</p>
              <div className="flex items-center mt-2 text-blue-100 text-sm">
                <TrendingUp className="h-4 w-4 mr-1" />
                <span>{recentUploads} today</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <FileText className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Active Departments */}
        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Departments</p>
              <p className="text-3xl font-bold mt-2">{systemStats?.total_departments || 0}</p>
              <div className="flex items-center mt-2 text-green-100 text-sm">
                <span>All operational</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center text-2xl">
              🏢
            </div>
          </div>
        </div>

        {/* Urgent Documents */}
        <div className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm font-medium">Urgent Items</p>
              <p className="text-3xl font-bold mt-2">{urgentDocs}</p>
              <div className="flex items-center mt-2 text-orange-100 text-sm">
                <AlertCircle className="h-4 w-4 mr-1" />
                <span>Require attention</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Data Sources */}
        <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Data Sources</p>
              <p className="text-3xl font-bold mt-2">{systemStats?.sources?.length || 0}</p>
              <div className="flex items-center mt-2 text-purple-100 text-sm">
                <span>{systemStats?.active_users || 0} active users</span>
              </div>
            </div>
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
              <BarChart3 className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Department Distribution Chart */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-6">Documents by Department</h2>
        <div className="space-y-4">
          {DEPARTMENTS
            .map((dept) => ({
              ...dept,
              count: systemStats?.department_stats?.[dept.id]?.total || 0
            }))
            .sort((a, b) => b.count - a.count)
            .map((dept) => {
              const percentage = totalDocs > 0 ? (dept.count / totalDocs) * 100 : 0;
              
              // Map department colors to proper bar colors
              const barColorMap: Record<string, string> = {
                'bg-blue-100': 'bg-blue-500',
                'bg-green-100': 'bg-green-500',
                'bg-purple-100': 'bg-purple-500',
                'bg-orange-100': 'bg-orange-500',
                'bg-red-100': 'bg-red-500',
                'bg-yellow-100': 'bg-yellow-500',
                'bg-indigo-100': 'bg-indigo-500',
                'bg-pink-100': 'bg-pink-500',
              };
              
              const barColor = barColorMap[dept.color] || 'bg-blue-500';
              
              return (
                <div key={dept.id}>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-xl">{dept.icon}</span>
                      <span className="text-sm font-medium text-gray-900">{dept.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900">{dept.count} ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`${barColor} h-3 rounded-full transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
        </div>
      </div>

      {/* Department Overview */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Departments Overview</h2>
          <Link to="/departments" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEPARTMENTS.map((dept) => {
            const deptStats = systemStats?.department_stats?.[dept.id] || { total: 0, urgent: 0, high: 0 };
            return (
              <Link
                key={dept.id}
                to={`/department/${dept.id}`}
                className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200 p-6 group hover:border-blue-300"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-14 h-14 ${dept.color} rounded-xl flex items-center justify-center text-2xl shadow-md group-hover:scale-110 transition-transform`}>
                      {dept.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {dept.name}
                      </h3>
                      <p className="text-sm text-gray-500">{dept.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{deptStats.total}</p>
                    <p className="text-xs text-gray-500">documents</p>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center space-x-4 text-sm">
                  {deptStats.urgent > 0 && (
                    <span className="flex items-center text-red-600">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {deptStats.urgent} urgent
                    </span>
                  )}
                  {deptStats.high > 0 && (
                    <span className="text-orange-600">
                      {deptStats.high} high
                    </span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Documents Table */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Documents</h2>
          <Link to="/search" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center">
            View all
            <ArrowRight className="h-4 w-4 ml-1" />
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Department
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
                {recentDocuments.length > 0 ? (
                  recentDocuments.map((doc) => {
                    const isExpanded = expandedDocs.has(doc.id);
                    return (
                      <React.Fragment key={doc.id}>
                        <tr className="hover:bg-blue-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedDocs);
                                  if (isExpanded) {
                                    newExpanded.delete(doc.id);
                                  } else {
                                    newExpanded.add(doc.id);
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
                                  {doc.title || doc.filename || 'Untitled'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Link
                              to={`/department/${doc.department || doc.assigned_department}`}
                              className="text-sm font-medium text-blue-600 hover:text-blue-800"
                            >
                              {doc.department || doc.assigned_department}
                            </Link>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                              doc.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                              doc.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              doc.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {doc.priority || 'normal'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-600 capitalize">
                              {doc.source || 'manual'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {formatDate(doc.created_at || doc.upload_date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <a
                                href={`' + import.meta.env.VITE_API_URL + '/api/documents/${doc.id}/download`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-3 py-1.5 border border-blue-300 rounded-md text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                              >
                                View File
                              </a>
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="bg-blue-50">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="pl-12">
                                <h4 className="text-sm font-semibold text-gray-900 mb-2">📝 Document Summary</h4>
                                <p className="text-sm text-gray-700 leading-relaxed">
                                  {doc.summary || doc.metadata?.ai_analysis?.summary || 'No summary available for this document.'}
                                </p>
                                {doc.metadata?.ai_analysis?.key_topics && doc.metadata.ai_analysis.key_topics.length > 0 && (
                                  <div className="mt-3">
                                    <h5 className="text-xs font-semibold text-gray-700 mb-2">Key Topics:</h5>
                                    <div className="flex flex-wrap gap-2">
                                      {doc.metadata.ai_analysis.key_topics.map((topic: string, idx: number) => (
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
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-lg font-medium">No documents yet</p>
                      <p className="text-sm">Upload your first document to get started</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;