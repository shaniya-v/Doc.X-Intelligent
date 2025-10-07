import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
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

      {/* Multi-Department Tasks Section */}
      {multiDeptTasks.length > 0 && (
        <div className="bg-white rounded-lg shadow border">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">🤝</span>
              <h2 className="text-xl font-bold text-gray-900">Multi-Department Coordination Tasks</h2>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {multiDeptTasks.length} tasks requiring coordination
              </span>
            </div>
            <p className="mt-1 text-sm text-gray-600">
              Tasks assigned to {department?.displayName} from documents that require multiple departments
            </p>
          </div>
          
          <div className="p-6 space-y-4">
            {multiDeptTasks.map((task, index) => (
              <div key={`${task.document.id}-${index}`} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <Link
                      to={`/document/${task.document.id}`}
                      className="text-lg font-medium text-gray-900 hover:text-blue-600"
                    >
                      {task.document.title}
                    </Link>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[task.document.priority]}`}>
                        {task.document.priority}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(task.document.created_at)}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Department-specific tasks */}
                <div className="bg-white rounded p-4 mb-3 border border-blue-100">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900 flex items-center">
                      <span className="text-lg mr-2">{department?.icon}</span>
                      Tasks for {department?.displayName}
                    </h4>
                    <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                      {task.tasks.length} task{task.tasks.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-3">
                    {task.tasks.map((taskItem, taskIndex) => (
                      <div key={taskIndex} className="flex items-start space-x-3 p-2 bg-gray-50 rounded">
                        <div className="flex items-center h-5">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            onChange={(e) => {
                              // TODO: Handle task completion
                              console.log(`Task ${taskIndex} ${e.target.checked ? 'completed' : 'uncompleted'}`);
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-700">{taskItem}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <span className="text-xs text-gray-500">
                              📅 Due: Within 24 hours
                            </span>
                            <span className="text-xs text-red-600">
                              ⚠️ Urgent
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Document Summary for this department */}
                  {task.document.metadata?.ai_analysis?.summary && (
                    <div className="mt-3 p-3 bg-blue-50 rounded border border-blue-200">
                      <h5 className="text-xs font-medium text-blue-900 mb-1">Document Summary:</h5>
                      <p className="text-xs text-blue-800">
                        {task.document.metadata.ai_analysis.summary.substring(0, 200)}
                        {task.document.metadata.ai_analysis.summary.length > 200 ? '...' : ''}
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Other departments involved */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Also involves:</span>
                  <div className="flex flex-wrap gap-1">
                    {task.otherDepartments.map((dept, deptIndex) => (
                      <span
                        key={deptIndex}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700"
                      >
                        {dept}
                      </span>
                    ))}
                  </div>
                  <Link
                    to={`/document/${task.document.id}`}
                    className="text-xs text-blue-600 hover:text-blue-800 ml-auto"
                  >
                    View full coordination details →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

      {/* Documents List */}
      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <div className="bg-white rounded-lg shadow border p-8 text-center">
            <div className="text-4xl mb-4">📭</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600">
              {documents.length === 0 
                ? `No documents have been assigned to ${department.displayName} yet.`
                : 'Try adjusting your filters to see more documents.'
              }
            </p>
          </div>
        ) : (
          filteredDocuments.map((doc) => (
            <div key={doc.id} className="bg-white rounded-lg shadow border hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="text-3xl">
                      📄
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Link
                          to={`/document/${doc.id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-blue-600 truncate"
                        >
                          {doc.title}
                        </Link>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PRIORITY_COLORS[doc.priority]}`}>
                          {doc.priority}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-3">
                        <p className="truncate">Document ID: {doc.id}</p>
                      </div>
                      
                      {/* Key Points */}
                      {doc.metadata?.ai_analysis?.key_topics && doc.metadata.ai_analysis.key_topics.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Key Points:</h4>
                          <div className="flex flex-wrap gap-1">
                            {doc.metadata.ai_analysis.key_topics.slice(0, 3).map((topic: string, index: number) => (
                              <span
                                key={index}
                                className="inline-flex items-center px-2 py-1 rounded-md text-xs bg-blue-100 text-blue-800"
                              >
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Summary */}
                      {doc.metadata?.ai_analysis?.summary && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Summary:</h4>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {doc.metadata.ai_analysis.summary}
                          </p>
                        </div>
                      )}
                      
                      {/* Recommended Actions */}
                      {doc.metadata?.recommended_actions && doc.metadata.recommended_actions.length > 0 && (
                        <div className="mb-3">
                          <h4 className="text-sm font-medium text-gray-900 mb-2">Actions Required:</h4>
                          <div className="space-y-2">
                            {doc.metadata.recommended_actions.slice(0, 3).map((action: string, index: number) => (
                              <div key={index} className="flex items-start space-x-2 p-2 bg-orange-50 rounded border border-orange-200">
                                <div className="flex items-center h-5 mt-0.5">
                                  <input
                                    type="checkbox"
                                    className="h-3 w-3 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                    onChange={(e) => {
                                      console.log(`Action ${index} ${e.target.checked ? 'completed' : 'uncompleted'}`);
                                    }}
                                  />
                                </div>
                                <div className="flex-1">
                                  <p className="text-xs text-gray-700">{action}</p>
                                  <span className="text-xs text-orange-600">📅 Due: 48 hours</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Sender Info */}
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        {doc.metadata?.sender && (
                          <div className="flex items-center space-x-1">
                            <span>📧</span>
                            <span>From: {doc.metadata.sender}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-1">
                          <span>📊</span>
                          <span>Source: {doc.source}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>🕒</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <span>📅</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col space-y-2 ml-4">
                    <Link
                      to={`/document/${doc.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
                
                {/* Action Required Badge */}
                {doc.metadata?.recommended_actions && doc.metadata.recommended_actions.length > 0 && (
                  <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-center space-x-2">
                      <span className="text-yellow-600">⚠️</span>
                      <span className="text-sm font-medium text-yellow-800">Action Required</span>
                    </div>
                    <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
                      {doc.metadata.recommended_actions.slice(0, 3).map((action: string, index: number) => (
                        <li key={index}>{action}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DepartmentPage;