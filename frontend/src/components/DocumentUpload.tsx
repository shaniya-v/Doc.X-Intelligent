import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, DEPARTMENTS } from '../contexts/AuthContext';
import { documentApi } from '../utils/api';
import { Upload, FileText, CheckCircle, Send, AlertCircle, X } from 'lucide-react';

type TaskType = 'finished' | 'assign' | '';

const DocumentUpload: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [taskType, setTaskType] = useState<TaskType>('');
  const [targetDepartment, setTargetDepartment] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      setUploadSuccess(false);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setUploadError('Please select a file to upload');
      return;
    }

    if (!taskType) {
      setUploadError('Please select task type');
      return;
    }

    if (taskType === 'assign' && !targetDepartment) {
      setUploadError('Please select target department');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('user_id', user.username || 'anonymous');
      formData.append('user_email', user.email || `${user.department?.id}@kmrl.com`);
      formData.append('source', 'manual_upload');
      formData.append('task_type', taskType);
      formData.append('description', description);
      formData.append('is_private', isPrivate.toString());
      
      if (taskType === 'assign' && targetDepartment) {
        formData.append('target_department', targetDepartment);
      } else if (taskType === 'finished' && user.department) {
        formData.append('source_department', user.department.id);
      }

      const response = await fetch(import.meta.env.VITE_API_URL + '/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || 'Upload failed');
      }

      const result = await response.json();
      setUploadResult(result);
      setUploadSuccess(true);

      // Reset form after 3 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setTaskType('');
        setTargetDepartment('');
        setDescription('');
        setUploadSuccess(false);
        setUploadResult(null);
      }, 5000);

    } catch (error: any) {
      console.error('Upload error:', error);
      setUploadError(error.message || 'Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setTaskType('');
    setTargetDepartment('');
    setDescription('');
    setUploadError(null);
    setUploadSuccess(false);
    setUploadResult(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <Upload className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Upload Document</h1>
            <p className="text-sm text-gray-600">
              Upload and manage your department documents
            </p>
          </div>
        </div>
      </div>

      {/* Upload Form */}
      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="p-6 space-y-6">
          
          {/* File Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Select Document *
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="file-upload"
                className="hidden"
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {selectedFile ? (
                  <>
                    <FileText className="h-12 w-12 text-green-500 mb-3" />
                    <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        setSelectedFile(null);
                      }}
                      className="mt-3 text-sm text-red-600 hover:text-red-800"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm font-medium text-gray-900">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PDF, DOC, DOCX, TXT, CSV, XLSX (MAX. 10MB)
                    </p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Task Type Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              What is this document for? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Finished Task Option */}
              <button
                type="button"
                onClick={() => {
                  setTaskType('finished');
                  setTargetDepartment('');
                }}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  taskType === 'finished'
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-green-300'
                }`}
              >
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                    taskType === 'finished' ? 'bg-green-500' : 'bg-gray-100'
                  }`}>
                    <CheckCircle className={`h-6 w-6 ${
                      taskType === 'finished' ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Completed Work
                    </h3>
                    <p className="text-sm text-gray-600">
                      This is a finished task or report from my department ({user.department?.name || 'your department'})
                    </p>
                  </div>
                </div>
              </button>

              {/* Assign Task Option */}
              <button
                type="button"
                onClick={() => setTaskType('assign')}
                className={`p-6 border-2 rounded-lg text-left transition-all ${
                  taskType === 'assign'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center mr-4 ${
                    taskType === 'assign' ? 'bg-blue-500' : 'bg-gray-100'
                  }`}>
                    <Send className={`h-6 w-6 ${
                      taskType === 'assign' ? 'text-white' : 'text-gray-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 mb-1">
                      Assign to Department
                    </h3>
                    <p className="text-sm text-gray-600">
                      This work needs to be assigned to another department
                    </p>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Department Selection (if assigning) */}
          {taskType === 'assign' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Select Target Department *
              </label>
              <select
                value={targetDepartment}
                onChange={(e) => setTargetDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select Department --</option>
                {DEPARTMENTS.filter(dept => dept.id !== user.department?.id).map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.icon} {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Description or Notes (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder={
                taskType === 'finished'
                  ? 'Add any notes about the completed work...'
                  : taskType === 'assign'
                  ? 'Describe what needs to be done by the other department...'
                  : 'Add any additional information about this document...'
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
          </div>

          {/* Privacy Checkbox */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex-1">
                <span className="text-sm font-semibold text-gray-700">🔒 Mark as Private</span>
                <p className="text-xs text-gray-600 mt-1">
                  Only you will be able to see this document. It won't appear in department or global search.
                </p>
              </div>
            </label>
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-sm font-medium text-red-800">Upload Error</p>
                <p className="text-sm text-red-700 mt-1">{uploadError}</p>
              </div>
            </div>
          )}

          {/* Success Message */}
          {uploadSuccess && uploadResult && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Document Uploaded Successfully!</p>
                  <div className="mt-3 space-y-2 text-sm text-green-700">
                    <p><strong>Department:</strong> {uploadResult.department}</p>
                    {uploadResult.summary && (
                      <p><strong>Summary:</strong> {uploadResult.summary}</p>
                    )}
                    <p><strong>Confidence:</strong> {(uploadResult.confidence * 100).toFixed(1)}%</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-2 text-gray-700 hover:text-gray-900 font-medium"
            >
              Reset
            </button>
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => navigate('/')}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpload}
                disabled={!selectedFile || !taskType || uploading || (taskType === 'assign' && !targetDepartment)}
                className={`px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
                  !selectedFile || !taskType || uploading || (taskType === 'assign' && !targetDepartment)
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-5 w-5" />
                    <span>Upload Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Information Panel */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h3 className="font-semibold text-blue-900 mb-3 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Upload Guidelines
        </h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Completed Work:</strong> Select this if you're uploading a finished report, completed task, or documentation from your department</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span><strong>Assign to Department:</strong> Select this if the document contains work that needs to be done by another department</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>The AI will automatically analyze your document and classify it appropriately</span>
          </li>
          <li className="flex items-start">
            <span className="mr-2">•</span>
            <span>All uploads are tracked and can be viewed in the dashboard</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentUpload;
