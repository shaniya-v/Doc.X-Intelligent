import React, { useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskUpdate: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose, onTaskUpdate }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `Hello! I'm your AI assistant for the ${user.department?.name} department. I can help you with:\n\n• Upload and process documents\n• Search through all documents\n• Verify document content\n• Add documents to database\n• Manage department tasks\n\nWhat would you like to do today?`,
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadMode, setUploadMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadMode(true);
      setInputValue(`Tell me what you want to do with "${file.name}"`);
    }
  };

  const handleChatUpload = async (file: File, prompt: string): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prompt', prompt);
      formData.append('department', user.department?.id || 'General');
      formData.append('user_id', user.username || 'anonymous');

      const response = await fetch('http://127.0.0.1:5000/api/chat/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }

      const data = await response.json();
      onTaskUpdate(); // Refresh the dashboard if document was uploaded
      return data.answer;
    } catch (error) {
      console.error('Chat upload error:', error);
      throw error;
    }
  };

  const uploadDocument = async (file: File): Promise<string> => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('department', user.department?.id || '');
      formData.append('source', 'ai_upload');

      const response = await fetch('http://127.0.0.1:5000/api/upload', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        onTaskUpdate(); // Refresh the dashboard
        
        if (result.routing_method === 'OpenRouter RAG' && result.original_department !== result.department) {
          return `Document "${file.name}" uploaded successfully! 

📋 **Smart Routing Applied:**
• Originally selected: ${result.original_department}
• AI Analysis routed to: ${result.department}
• Method: ${result.routing_method}

The document has been automatically classified and assigned to the most appropriate department based on its content analysis.

Document ID: ${result.document_id}`;
        } else {
          return `Document "${file.name}" uploaded successfully to the ${result.department} department! Document ID: ${result.document_id}`;
        }
      } else {
        const error = await response.json();
        return `Failed to upload document: ${error.error || 'Unknown error'}`;
      }
    } catch (error) {
      return `Error uploading document: ${error}`;
    }
  };

  const searchDocuments = async (query: string): Promise<string> => {
    try {
      const response = await fetch(`http://127.0.0.1:5000/api/search?q=${encodeURIComponent(query)}`);
      
      if (response.ok) {
        const results = await response.json();
        
        if (results.length === 0) {
          return `No documents found matching "${query}".`;
        }

        let resultText = `Found ${results.length} documents matching "${query}":\n\n`;
        results.slice(0, 5).forEach((doc: any, index: number) => {
          resultText += `${index + 1}. **${doc.title || 'Untitled'}**\n`;
          resultText += `   Department: ${doc.department}\n`;
          resultText += `   Priority: ${doc.priority}\n`;
          resultText += `   Created: ${new Date(doc.created_at).toLocaleDateString()}\n`;
          if (doc.excerpt) {
            resultText += `   Preview: ${doc.excerpt}...\n`;
          }
          resultText += `\n`;
        });

        if (results.length > 5) {
          resultText += `... and ${results.length - 5} more results.`;
        }

        return resultText;
      } else {
        return `Search failed. Please try again.`;
      }
    } catch (error) {
      return `Error searching documents: ${error}`;
    }
  };

  const verifyDocumentContent = async (query: string): Promise<string> => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/verify-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          query,
          department: user.department?.id 
        })
      });

      if (response.ok) {
        const result = await response.json();
        
        if (result.found) {
          let verificationText = `✅ Found matching content in ${result.documents.length} document(s):\n\n`;
          result.documents.forEach((doc: any, index: number) => {
            verificationText += `${index + 1}. **${doc.title}** (${doc.department})\n`;
            verificationText += `   Match: "${doc.match}"\n`;
            verificationText += `   Confidence: ${doc.confidence}%\n\n`;
          });
          return verificationText;
        } else {
          return `❌ No documents contain the specified content: "${query}"`;
        }
      } else {
        return `Verification failed. Please try again.`;
      }
    } catch (error) {
      return `Error verifying content: ${error}`;
    }
  };

  const getOpenRouterResponse = async (message: string): Promise<string> => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/chat/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message,
          department: user.department?.id,
          context: 'ai_assistant'
        })
      });

      if (response.ok) {
        const result = await response.json();
        return result.response || 'I apologize, but I could not process your request at the moment.';
      } else {
        return 'I\'m experiencing some technical difficulties. Please try again.';
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      return 'I\'m currently unable to process your request. Please try again later.';
    }
  };

  const processUserMessage = async (message: string): Promise<string> => {
    const lowerMessage = message.toLowerCase();

    // Handle file upload
    if (selectedFile) {
      const result = await uploadDocument(selectedFile);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return result;
    }

    // Handle search queries
    if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      const searchTerm = message.replace(/search|find|for|documents?|about/gi, '').trim();
      if (searchTerm) {
        return await searchDocuments(searchTerm);
      }
      return 'Please specify what you want to search for. Example: "Search maintenance reports"';
    }

    // Handle verification queries
    if (lowerMessage.includes('verify') || lowerMessage.includes('check') || lowerMessage.includes('contain')) {
      const verifyTerm = message.replace(/verify|check|does|any|document|contain|mentioned|have/gi, '').trim();
      if (verifyTerm) {
        return await verifyDocumentContent(verifyTerm);
      }
      return 'Please specify what content you want to verify. Example: "Verify if any document mentions budget approval"';
    }

    // Handle upload prompts
    if (lowerMessage.includes('upload') || lowerMessage.includes('add document')) {
      return 'Please click the 📎 button to select a file to upload, or drag and drop a file here.';
    }

    // Handle general help and queries with OpenRouter
    if (lowerMessage.includes('help')) {
      return `I can help you with several tasks:\n\n📤 **Upload Documents**: Click the 📎 button or say "upload document"\n🔍 **Search**: Type "search [keyword]" to find documents\n✅ **Verify Content**: Ask "verify [content]" to check if documents contain specific information\n📋 **Task Management**: I can help you manage your department tasks\n\nWhat would you like to do?`;
    }

    // For all other queries, use OpenRouter AI for intelligent responses
    return await getOpenRouterResponse(message);
  };

  const sendMessage = async () => {
    if (!inputValue.trim() && !selectedFile) return;

    // Determine the message content to display
    let displayContent = inputValue;
    if (selectedFile && uploadMode) {
      displayContent = `📎 ${selectedFile.name}\n💬 ${inputValue}`;
    } else if (selectedFile) {
      displayContent = `📎 Upload: ${selectedFile.name}`;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: displayContent,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      let response: string;

      // Handle file upload with prompt
      if (selectedFile && uploadMode) {
        response = await handleChatUpload(selectedFile, inputValue);
      } 
      // Handle regular file upload (legacy)
      else if (selectedFile) {
        response = await uploadDocument(selectedFile);
      }
      // Handle text-only messages
      else {
        response = await processUserMessage(inputValue);
      }
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, I encountered an error: ${error}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }

    // Reset form
    setInputValue('');
    setSelectedFile(null);
    setUploadMode(false);
    setIsProcessing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-sm text-gray-500">{user.department?.name} Department</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 p-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
                <p className="text-xs mt-1 opacity-70">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isProcessing && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                  <span>Processing...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-2">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.xlsx,.xls"
            />
            
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-gray-500 hover:text-gray-700 border border-gray-300 rounded-md"
              title="Upload file"
            >
              📎
            </button>
            
            <div className="flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  uploadMode && selectedFile 
                    ? `Tell me what you want to do with "${selectedFile.name}"...` 
                    : selectedFile 
                    ? `Selected: ${selectedFile.name}` 
                    : "Ask me anything..."
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isProcessing}
              />
            </div>
            
            <button
              onClick={sendMessage}
              disabled={isProcessing || (!inputValue.trim() && !selectedFile)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadMode && selectedFile ? 'Upload & Process' : 'Send'}
            </button>
          </div>
          
          {selectedFile && (
            <div className="mt-2 space-y-2">
              <div className="p-2 bg-blue-50 border border-blue-200 rounded-md flex items-center justify-between">
                <span className="text-sm text-blue-800">
                  📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </span>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setUploadMode(false);
                    setInputValue('');
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Remove
                </button>
              </div>
              
              {uploadMode && (
                <div className="p-2 bg-green-50 border border-green-200 rounded-md">
                  <div className="text-xs text-green-800 font-medium mb-1">💡 Upload Instructions:</div>
                  <div className="text-xs text-green-700">
                    Tell me what you want to do with this document:
                    <br />• "Upload this globally" - Share with all departments
                    <br />• "Upload this privately" - Only for me
                    <br />• "Analyze this document" - Get analysis without uploading
                    <br />• "Summarize this file" - Get summary
                    <br />• Ask specific questions about the content
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;