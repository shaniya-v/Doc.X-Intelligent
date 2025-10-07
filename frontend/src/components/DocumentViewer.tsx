import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { documentApi } from '../utils/api';
import { PRIORITY_COLORS, formatDate, getDepartmentByName } from '../utils/constants';
import { Document } from '../types';

const DocumentViewer: React.FC = () => {
  const { documentId } = useParams<{ documentId: string }>();
  const [document, setDocument] = useState<Document | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFullContent, setShowFullContent] = useState(false);

  useEffect(() => {
    const fetchDocument = async () => {
      if (!documentId) return;
      
      try {
        setLoading(true);
        const doc = await documentApi.getDocument(documentId);
        setDocument(doc);
      } catch (err) {
        setError('Failed to fetch document');
        console.error('Error fetching document:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading document...</span>
      </div>
    );
  }

  if (error || !document) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-red-600">Error Loading Document</h2>
        <p className="mt-2 text-gray-600">{error || 'Document not found'}</p>
        <Link to="/" className="mt-4 inline-block text-blue-600 hover:text-blue-800">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  const department = getDepartmentByName(document.assigned_department);
  const aiAnalysis = document.metadata?.ai_analysis;
  const isMultiDepartment = document.metadata?.multi_department;
  const departmentsDetected = document.metadata?.departments_detected || [];
  const departmentTasks = document.metadata?.department_tasks || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <span className="text-2xl">{department?.icon || '📄'}</span>
              <h1 className="text-2xl font-bold text-gray-900">{document.title}</h1>
            </div>
            
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
              <span>📅 {formatDate(document.created_at)}</span>
              <span>📧 {document.source}</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${PRIORITY_COLORS[document.priority]}`}>
                {document.priority.toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="flex flex-col space-y-2">
            {/* File Actions */}
            <div className="flex space-x-2">
              <button 
                onClick={() => {
                  // TODO: Implement file download
                  alert('File download functionality to be implemented');
                }}
                className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
              >
                📄 Download File
              </button>
              <button 
                onClick={() => {
                  // TODO: Implement file preview
                  alert('File preview functionality to be implemented');
                }}
                className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md shadow-sm text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
              >
                👁️ Preview
              </button>
            </div>
            
            <Link
              to={`/department/${document.assigned_department}`}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <span className="mr-2">{department?.icon}</span>
              {department?.displayName}
            </Link>
          </div>
        </div>
      </div>

      {/* Multi-Department Coordination */}
      {isMultiDepartment && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 p-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <span className="text-xl mr-2">🏢</span>
            Multi-Department Coordination Required
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departmentsDetected.map((dept, index) => {
              const deptInfo = getDepartmentByName(dept);
              const tasks = departmentTasks[dept] || [];
              
              return (
                <div key={index} className="bg-white rounded-lg p-4 border border-blue-100">
                  <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                    <span className="text-lg mr-2">{deptInfo?.icon}</span>
                    {deptInfo?.displayName || dept}
                  </h3>
                  
                  {tasks.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-600">Tasks for this department:</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded">
                          {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      {tasks.map((task, taskIndex) => (
                        <div key={taskIndex} className="flex items-start space-x-3 p-3 bg-gray-50 rounded border">
                          <div className="flex items-center h-5 mt-0.5">
                            <input
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              onChange={(e) => {
                                // TODO: Implement task completion tracking
                                console.log(`${dept} task ${taskIndex} ${e.target.checked ? 'completed' : 'uncompleted'}`);
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700">{task}</p>
                            <div className="flex items-center space-x-4 mt-1">
                              <span className="text-xs text-gray-500">
                                📅 Due: 24 hours
                              </span>
                              <span className="text-xs text-red-600">
                                ⚠️ High Priority
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Analysis Summary */}
      {aiAnalysis && (
        <div className="bg-white rounded-lg shadow border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="text-xl mr-2">🤖</span>
            Analysis Summary
          </h2>
          
          <div className="space-y-4">
            <p className="text-gray-700 leading-relaxed">{aiAnalysis.summary}</p>
            
            {aiAnalysis.key_topics && aiAnalysis.key_topics.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-900 mb-2">Key Topics:</h3>
                <div className="flex flex-wrap gap-2">
                  {aiAnalysis.key_topics.map((topic, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Document Content */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Document Content</h2>
            <button
              onClick={() => setShowFullContent(!showFullContent)}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              {showFullContent ? 'Show Less' : 'Show Full Content'}
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="prose max-w-none">
            {document.content ? (
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {showFullContent 
                  ? document.content 
                  : `${document.content.substring(0, 500)}${document.content.length > 500 ? '...' : ''}`
                }
              </div>
            ) : (
              <p className="text-gray-500 italic">No content available for this document.</p>
            )}
          </div>
        </div>
      </div>

      {/* Document Information */}
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Document Information</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Language:</span>
              <p className="text-sm text-gray-900">{document.language}</p>
            </div>
            
            <div>
              <span className="text-sm font-medium text-gray-500">Status:</span>
              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                document.status === 'completed' ? 'bg-green-100 text-green-800' :
                document.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {document.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm font-medium text-gray-500">Analysis Confidence:</span>
              <div className="flex items-center space-x-2">
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${document.confidence}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-900">{document.confidence}%</span>
              </div>
            </div>
            
            {document.metadata?.attachments_count > 0 && (
              <div>
                <span className="text-sm font-medium text-gray-500">Attachments:</span>
                <p className="text-sm text-gray-900">{document.metadata.attachments_count} file(s)</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Link
          to={`/department/${document.assigned_department}`}
          className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
        >
          ← Back to {department?.displayName} Department
        </Link>
        
        <Link
          to="/"
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700"
        >
          Dashboard →
        </Link>
      </div>
    </div>
  );
};

export default DocumentViewer;