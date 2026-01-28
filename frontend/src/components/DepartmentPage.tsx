import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { documentApi } from '../utils/api';
import { getDepartmentByName, PRIORITY_COLORS, formatDate, getFileTypeIcon } from '../utils/constants';
import { Document } from '../types';

const DepartmentPage: React.FC = () => {
  const { deptName } = useParams<{ deptName: string }>();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [multiDeptTasks, setMultiDeptTasks] = useState<Array<{
    document: Document;
    tasks: string[];
    otherDepartments: string[];
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [expandedDocs, setExpandedDocs] = useState<Set<string>>(new Set());

  const department = getDepartmentByName(deptName || '');

  useEffect(() => {
    const fetchDepartmentData = async () => {
      if (!deptName) return;
      
      try {
        setLoading(true);
        
        // Try to get department-specific tasks (including multi-department)
        try {
          const taskData = await documentApi.getDepartmentTasks(deptName);
          console.log('✅ Department tasks data:', taskData);
          setDocuments(taskData.documents);
          setMultiDeptTasks(taskData.multiDepartmentTasks || []);
        } catch (taskError) {
          // Fallback to regular document fetch if new endpoint not available
          console.warn('Department tasks endpoint not available, using fallback:', taskError);
          const docs = await documentApi.getDocumentsByDepartment(deptName);
          console.log('📄 Fallback documents:', docs);
          setDocuments(docs);
          setMultiDeptTasks([]);
        }
      } catch (err) {
        setError('Failed to fetch department data');
        console.error('Error fetching department data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDepartmentData();
  }, [deptName]);

  const filteredDocuments = documents.filter(doc => {
    if (selectedPriority !== 'all' && doc.priority !== selectedPriority) return false;
    if (selectedSource !== 'all' && doc.source !== selectedSource) return false;
    return true;
  });

  const priorityCount = documents.reduce((acc, doc) => {
    acc[doc.priority] = (acc[doc.priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!department) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Department not found</h2>
        <p className="mt-2 text-gray-600">The requested department could not be found.</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          Return to Dashboard
        </Link>
      </div>
    );
  }

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
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Error Loading Department Data</h2>
        <p className="mt-2 text-gray-600">{error}</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Department Header */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-center space-x-4">
          <div className={`w-16 h-16 ${department.color} rounded-lg flex items-center justify-center text-3xl`}>
            {department.icon}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">{department.displayName}</h1>
            <p className="text-lg text-gray-600">{department.malayalamName}</p>
            <p className="mt-2 text-gray-600">{department.description}</p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-gray-900">{documents.length}</div>
            <div className="text-sm text-gray-500">Total Documents</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Urgent</p>
              <p className="text-2xl font-bold text-red-600">{priorityCount.urgent || 0}</p>
            </div>
            <div className="text-2xl">🚨</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">High Priority</p>
              <p className="text-2xl font-bold text-orange-600">{priorityCount.high || 0}</p>
            </div>
            <div className="text-2xl">⚡</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Normal</p>
              <p className="text-2xl font-bold text-blue-600">{priorityCount.normal || 0}</p>
            </div>
            <div className="text-2xl">📋</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Low Priority</p>
              <p className="text-2xl font-bold text-gray-600">{priorityCount.low || 0}</p>
            </div>
            <div className="text-2xl">📄</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <select
              value={selectedPriority}
              onChange={(e) => setSelectedPriority(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">Urgent</option>
              <option value="high">High</option>
              <option value="normal">Normal</option>
              <option value="low">Low</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="all">All Sources</option>
              <option value="gmail">Gmail</option>
              <option value="sharepoint">SharePoint</option>
              <option value="maximo">Maximo</option>
              <option value="whatsapp">WhatsApp</option>
            </select>
          </div>
          
          <div className="flex-1"></div>
          
          <div className="text-sm text-gray-600">
            Showing {filteredDocuments.length} of {documents.length} documents
          </div>
        </div>
      </div>

      {/* Documents List - Table View */}
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
              {filteredDocuments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                    <div className="text-4xl mb-4">📭</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                    <p className="text-gray-600">
                      {documents.length === 0 
                        ? `No documents have been assigned to ${department.displayName} yet.`
                        : 'Try adjusting your filters to see more documents.'
                      }
                    </p>
                  </td>
                </tr>
              ) : (
                filteredDocuments.map((doc) => {
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
                              {doc.metadata?.sender && (
                                <p className="text-xs text-gray-500">From: {doc.metadata.sender}</p>
                              )}
                            </div>
                          </div>
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
                          {formatDate(doc.created_at)}
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
                            <Link
                              to={`/document/${doc.id}`}
                              className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                            >
                              Details
                            </Link>
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-blue-50">
                          <td colSpan={5} className="px-6 py-4">
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
                              {doc.metadata?.recommended_actions && doc.metadata.recommended_actions.length > 0 && (
                                <div className="mt-3">
                                  <h5 className="text-xs font-semibold text-gray-700 mb-2">⚠️ Actions Required:</h5>
                                  <ul className="text-sm text-gray-700 list-disc list-inside space-y-1">
                                    {doc.metadata.recommended_actions.map((action: string, index: number) => (
                                      <li key={index}>{action}</li>
                                    ))}
                                  </ul>
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
  );
};

export default DepartmentPage;