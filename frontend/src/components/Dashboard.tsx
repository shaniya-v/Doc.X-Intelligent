import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { documentApi } from '../utils/api';
import { DEPARTMENTS, PRIORITY_COLORS, formatDate } from '../utils/constants';
import { Document, DepartmentStats } from '../types';

const Dashboard: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [stats, setStats] = useState<DepartmentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const documentsResponse = await documentApi.getDocuments();
        
        setDocuments(documentsResponse.documents);
        // Mock stats for now
        setStats({
          total_documents: documentsResponse.documents.length,
          department_breakdown: {},
          priority_distribution: { urgent: 0, high: 0, normal: 0, low: 0 }
        });
      } catch (err) {
        setError('Failed to fetch data. Please check if the backend is running.');
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error Loading Data</h3>
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
    .slice(0, 10);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Document Management Dashboard</h1>
        <p className="mt-2 text-gray-600">
          KMRL intelligent document processing and routing system
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                📄
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.department_stats ? 
                  Object.values(stats.department_stats).reduce((sum, dept) => sum + dept.total, 0) : 
                  0
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                🏢
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Departments</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.department_stats ? Object.keys(stats.department_stats).length : 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-md flex items-center justify-center">
                ⚡
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Urgent Documents</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats?.department_stats ? 
                  Object.values(stats.department_stats).reduce((sum, dept) => sum + (dept.urgent || 0), 0) : 
                  0
                }
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-md flex items-center justify-center">
                📊
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Sources</p>
              <p className="text-2xl font-bold text-gray-900">
                {documents ? new Set(documents.map(doc => doc.source)).size : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Department Cards */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Departments</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEPARTMENTS.slice(0, 3).map((dept) => {
            const docCount = stats?.department_stats?.[dept.name]?.total || 0;
            return (
              <Link
                key={dept.name}
                to={`/department/${encodeURIComponent(dept.name)}`}
                className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow border p-6 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 ${dept.color} rounded-lg flex items-center justify-center text-2xl`}>
                      {dept.icon}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {dept.displayName}
                      </h3>
                      <p className="text-sm text-gray-500">{dept.malayalamName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900">{docCount}</p>
                    <p className="text-sm text-gray-500">documents</p>
                  </div>
                </div>
                <p className="mt-4 text-sm text-gray-600">{dept.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Recent Documents */}
      <div>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Recent Documents</h2>
          <Link
            to="/documents"
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            View all →
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow border">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-2xl mr-3">
                          {doc.title?.toLowerCase().includes('.pdf') ? '📄' : '📎'}
                        </div>
                        <div>
                          <Link
                            to={`/document/${doc.id}`}
                            className="text-sm font-medium text-gray-900 hover:text-blue-600"
                          >
                            {doc.title}
                          </Link>
                          <p className="text-sm text-gray-500">
                            {doc.title}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        to={`/department/${encodeURIComponent(doc.assigned_department)}`}
                        className="text-sm text-blue-600 hover:text-blue-800"
                      >
                        {doc.assigned_department}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[doc.priority]}`}>
                        {doc.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                      {doc.source}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(doc.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;