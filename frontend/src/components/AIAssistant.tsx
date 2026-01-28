import React, { useState, useRef } from 'react';
import { useAuth, DEPARTMENTS } from '../contexts/AuthContext';
import { Bot, Upload, Send, X, FileText, CheckCircle, Download, Save, Eye } from 'lucide-react';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  options?: TaskOption[];
  documents?: DocumentResult[];
  documentAnalysis?: DocumentAnalysis;
}

interface DocumentResult {
  document_id: string;
  filename: string;
  department: string;
  summary: string;
  download_url: string;
  relevance_score?: number;
}

interface DocumentAnalysis {
  document_id: string;
  filename: string;
  department: string;
  summary: string;
  download_url: string;
}

interface TaskOption {
  id: string;
  label: string;
  value: string;
  description: string;
}

interface UploadContext {
  file: File | null;
  taskType: 'finished' | 'assign' | 'review' | null;
  targetDepartment: string | null;
  description: string;
  uploadedDocumentId?: string;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, onTaskUpdate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI assistant for the ${user.department?.name || 'your'} department. I can help you with:\n\n📤 **Upload Documents** - Upload and classify documents\n📖 **Review Documents** - Analyze and explain document contents\n🔍 **Search Documents** - Find relevant documents (e.g., "search for financial reports")\n📥 **Download & Save** - Download documents or save them to your department\n🏢 **Route Documents** - Assign tasks to other departments\n\nWhat would you like to do today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadContext, setUploadContext] = useState<UploadContext>({
    file: null,
    taskType: null,
    targetDepartment: null,
    description: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type: 'user' | 'assistant' | 'system', content: string, options?: TaskOption[], documents?: DocumentResult[], documentAnalysis?: DocumentAnalysis) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      type,
      content,
      timestamp: new Date(),
      options,
      documents,
      documentAnalysis
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadContext(prev => ({ ...prev, file }));
      
      addMessage('user', `📎 Selected file: ${file.name}`);
      
      setTimeout(() => {
        addMessage(
          'assistant',
          `Great! I've received "${file.name}". What would you like to do with this document?`,
          [
            {
              id: 'review',
              label: '📖 Review Document',
              value: 'review',
              description: 'Let me analyze and explain what\'s in this document'
            },
            {
              id: 'finished',
              label: '✅ Completed Work',
              value: 'finished',
              description: `A finished task or report from ${user.department?.name || 'your department'}`
            },
            {
              id: 'assign',
              label: '📤 Assign to Department',
              value: 'assign',
              description: 'Work that needs to be done by another department'
            }
          ]
        );
      }, 500);
    }
  };

  const handleTaskTypeSelection = async (taskType: 'finished' | 'assign' | 'review') => {
    setUploadContext(prev => ({ ...prev, taskType }));
    
    if (taskType === 'review') {
      addMessage('user', '📖 Review and explain this document');
      await handleDocumentReview();
    } else if (taskType === 'finished') {
      addMessage('user', '✅ This is completed work from my department');
      addMessage('assistant', 'Perfect! Would you like to add any notes or description about this completed work? (Optional - just type your notes or say "upload now")');
    } else {
      addMessage('user', '📤 This needs to be assigned to another department');
      setTimeout(() => {
        const departmentOptions: TaskOption[] = DEPARTMENTS
          .filter(dept => dept.id !== user.department?.id)
          .map(dept => ({
            id: dept.id,
            label: `${dept.icon} ${dept.name}`,
            value: dept.id,
            description: dept.description || ''
          }));
        
        addMessage(
          'assistant',
          'Which department should handle this work?',
          departmentOptions
        );
      }, 500);
    }
  };

  const handleDocumentReview = async () => {
    if (!uploadContext.file) {
      addMessage('assistant', '❌ No file selected.');
      return;
    }

    setIsProcessing(true);
    addMessage('system', '🔄 Uploading and analyzing document...');

    try {
      // First upload the document
      const formData = new FormData();
      formData.append('file', uploadContext.file);
      formData.append('user_id', user.username || 'anonymous');
      formData.append('source', 'ai_assistant_review');

      const uploadResponse = await fetch(import.meta.env.VITE_API_URL + '/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      const uploadResult = await uploadResponse.json();
      const documentId = uploadResult.document_id;

      // Now analyze the document
      const chatResponse = await fetch(import.meta.env.VITE_API_URL + '/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: 'Analyze this document',
          document_id: documentId
        }),
      });

      if (!chatResponse.ok) {
        throw new Error('Analysis failed');
      }

      const chatResult = await chatResponse.json();

      addMessage('assistant', chatResult.response, undefined, undefined, chatResult.document_analysis);

      // Reset context
      setUploadContext({
        file: null,
        taskType: null,
        targetDepartment: null,
        description: ''
      });

      onTaskUpdate();

    } catch (error: any) {
      console.error('Review error:', error);
      addMessage('assistant', `❌ **Review Failed**\n\n${error.message || 'An error occurred while analyzing the document.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDepartmentSelection = (deptId: string) => {
    const dept = DEPARTMENTS.find(d => d.id === deptId);
    setUploadContext(prev => ({ ...prev, targetDepartment: deptId }));
    addMessage('user', `→ Assigning to ${dept?.name || deptId}`);
    addMessage('assistant', 'Great! Would you like to add any instructions or description for this department? (Optional - just type your notes or say "upload now")');
  };

  const handleUploadDocument = async () => {
    if (!uploadContext.file) {
      addMessage('assistant', '❌ No file selected. Please upload a file first.');
      return;
    }

    if (!uploadContext.taskType) {
      addMessage('assistant', '❌ Please specify if this is completed work or an assignment.');
      return;
    }

    if (uploadContext.taskType === 'assign' && !uploadContext.targetDepartment) {
      addMessage('assistant', '❌ Please select a target department.');
      return;
    }

    setIsProcessing(true);
    addMessage('system', '🔄 Uploading and processing document...');

    try {
      const formData = new FormData();
      formData.append('file', uploadContext.file);
      formData.append('user_id', user.username || 'anonymous');
      formData.append('source', 'ai_assistant');
      formData.append('task_type', uploadContext.taskType);
      
      if (uploadContext.description) {
        formData.append('description', uploadContext.description);
      }
      
      if (uploadContext.taskType === 'assign' && uploadContext.targetDepartment) {
        formData.append('target_department', uploadContext.targetDepartment);
      } else if (uploadContext.taskType === 'finished' && user.department) {
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
      onTaskUpdate();

      const successMsg = uploadContext.taskType === 'finished'
        ? `✅ **Document Uploaded Successfully!**\n\n📄 File: ${uploadContext.file.name}\n🏢 Department: ${result.department}\n📊 Confidence: ${(result.confidence * 100).toFixed(1)}%\n📝 Summary: ${result.summary}\n\nThe document has been marked as completed work from ${user.department?.name}.`
        : `✅ **Document Assigned Successfully!**\n\n📄 File: ${uploadContext.file.name}\n📤 Assigned to: ${uploadContext.targetDepartment}\n📊 AI Analysis: ${result.department}\n📝 Summary: ${result.summary}\n\nThe document has been routed to ${DEPARTMENTS.find(d => d.id === uploadContext.targetDepartment)?.name}.`;

      addMessage('assistant', successMsg);

      setUploadContext({
        file: null,
        taskType: null,
        targetDepartment: null,
        description: ''
      });

    } catch (error: any) {
      console.error('Upload error:', error);
      addMessage('assistant', `❌ **Upload Failed**\n\n${error.message || 'An error occurred while uploading the document.'}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userInput = inputValue.trim();
    addMessage('user', userInput);
    setInputValue('');

    // Check if user is providing description
    if (uploadContext.file && uploadContext.taskType && uploadContext.taskType !== 'review') {
      if (userInput.toLowerCase() === 'skip' || userInput.toLowerCase() === 'upload now') {
        handleUploadDocument();
      } else {
        setUploadContext(prev => ({ ...prev, description: userInput }));
        addMessage('assistant', `Got it! I'll include that in the upload. Ready to upload now? (Say "upload now" or click the upload button)`);
      }
      return;
    }

    // Check if this is a search query
    const lowerInput = userInput.toLowerCase();
    if (lowerInput.includes('search') || lowerInput.includes('find') || 
        lowerInput.includes('look for') || lowerInput.includes('show me') ||
        lowerInput.includes('document about') || lowerInput.includes('documents about')) {
      await handleSearchDocuments(userInput);
      return;
    }

    // General conversation
    if (lowerInput.includes('help')) {
      addMessage('assistant', `I can help you with:\n\n📤 **Upload Documents**: Click the 📎 button to upload a document\n📖 **Review Documents**: Upload and ask me to review/analyze\n🔍 **Search**: Ask me to find documents (e.g., "search for financial reports")\n📋 **Tasks**: Manage department tasks\n\nWhat would you like to do?`);
    } else {
      // Send to AI chat endpoint
      await handleAIChat(userInput);
    }
  };

  const handleAIChat = async (message: string) => {
    setIsProcessing(true);
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error('Chat request failed');
      }

      const result = await response.json();
      addMessage('assistant', result.response, undefined, result.documents, result.document_analysis);

    } catch (error: any) {
      console.error('Chat error:', error);
      addMessage('assistant', `I understand you said: "${message}"\n\nI can help you with:\n\n🔍 **Search**: Ask me to find documents\n📖 **Review**: Upload a document for analysis\n📤 **Upload**: Use the upload button\n\nWhat would you like to do?`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSearchDocuments = async (query: string) => {
    setIsProcessing(true);
    addMessage('system', '🔍 Searching for relevant documents...');

    try {
      const response = await fetch(import.meta.env.VITE_API_URL + '/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: query }),
      });

      if (!response.ok) {
        throw new Error('Search failed');
      }

      const result = await response.json();
      addMessage('assistant', result.response, undefined, result.documents);

    } catch (error: any) {
      console.error('Search error:', error);
      addMessage('assistant', `❌ Search failed. Please try again.`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveDocument = async (documentId: string) => {
    try {
      if (!user.department?.id) {
        addMessage('system', '❌ Cannot save: No department selected');
        return;
      }

      const formData = new FormData();
      formData.append('department_id', user.department.id);

      const response = await fetch(`' + import.meta.env.VITE_API_URL + '/api/documents/${documentId}/save-to-department`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Save failed');
      }

      addMessage('system', `✅ Document saved to ${user.department.name} department!`);
      onTaskUpdate();

    } catch (error: any) {
      console.error('Save error:', error);
      addMessage('system', '❌ Failed to save document');
    }
  };

  const handleOptionClick = (option: TaskOption) => {
    if (option.id === 'finished' || option.id === 'assign' || option.id === 'review') {
      handleTaskTypeSelection(option.id as 'finished' | 'assign' | 'review');
    } else {
      handleDepartmentSelection(option.value);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Render modal
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={(e) => {
        e.stopPropagation();
        console.log('Backdrop clicked');
        onClose();
      }}
    >
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-3xl h-[700px] flex flex-col"
        onClick={(e) => {
          e.stopPropagation();
          console.log('Modal content clicked - preventing close');
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-t-xl">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <Bot className="w-7 h-7 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold">AI Assistant</h3>
              <p className="text-sm text-purple-100">{user.department?.name || 'Your'} Department</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('Close button clicked');
              onClose();
            }}
            className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/20 rounded-lg cursor-pointer"
            type="button"
            aria-label="Close AI Assistant"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div key={message.id} className="space-y-3">
              <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-lg shadow-sm ${
                    message.type === 'user'
                      ? 'bg-purple-600 text-white'
                      : message.type === 'system'
                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                  <div className={`text-xs mt-1 ${message.type === 'user' ? 'text-purple-200' : 'text-gray-500'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </div>

              {/* Options */}
              {message.options && message.options.length > 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[75%] space-y-2">
                    {message.options.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleOptionClick(option)}
                        className="w-full text-left p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all shadow-sm"
                      >
                        <div className="font-semibold text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Results */}
              {message.documents && message.documents.length > 0 && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] space-y-3">
                    {message.documents.map((doc, idx) => (
                      <div
                        key={doc.document_id}
                        className="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-purple-400 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <FileText className="h-5 w-5 text-purple-600" />
                              <h4 className="font-semibold text-gray-900">{doc.filename}</h4>
                            </div>
                            <p className="text-sm text-gray-600 mt-1">
                              📊 {doc.department}
                              {doc.relevance_score && (
                                <span className="ml-2 text-purple-600">
                                  • Relevance: {(doc.relevance_score * 100).toFixed(0)}%
                                </span>
                              )}
                            </p>
                            <p className="text-sm text-gray-700 mt-2 line-clamp-2">{doc.summary}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => window.open(doc.download_url, '_blank')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                          >
                            <Download className="h-4 w-4" />
                            Download
                          </button>
                          <button
                            onClick={() => window.open(doc.download_url, '_blank')}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <button
                            onClick={() => handleSaveDocument(doc.document_id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                          >
                            <Save className="h-4 w-4" />
                            Save
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Document Analysis */}
              {message.documentAnalysis && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-4 shadow-md">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="h-5 w-5 text-purple-600" />
                          <h4 className="font-semibold text-gray-900">{message.documentAnalysis.filename}</h4>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">📊 {message.documentAnalysis.department}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => window.open(message.documentAnalysis!.download_url, '_blank')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                      <button
                        onClick={() => window.open(message.documentAnalysis!.download_url, '_blank')}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleSaveDocument(message.documentAnalysis!.document_id)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 transition-colors"
                      >
                        <Save className="h-4 w-4" />
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Upload button for completing document upload */}
        {uploadContext.file && uploadContext.taskType && (
          <div className="px-5 py-3 bg-green-50 border-t border-green-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="h-5 w-5 text-green-600" />
                <div className="text-sm">
                  <p className="font-medium text-green-900">Ready to upload: {uploadContext.file.name}</p>
                  <p className="text-green-700">
                    {uploadContext.taskType === 'finished' ? 'Completed work' : `Assign to ${DEPARTMENTS.find(d => d.id === uploadContext.targetDepartment)?.name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={handleUploadDocument}
                disabled={isProcessing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors"
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    <span>Upload Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-gray-200 bg-white rounded-b-xl">
          <div className="flex items-end space-x-3">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Upload document"
            >
              <Upload className="h-5 w-5" />
            </button>
            <textarea
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              rows={2}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isProcessing}
              className="p-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-300 transition-colors"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
