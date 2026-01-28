import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { documentApi } from '../utils/api';
import { Search, Filter, Download, FileText, Clock, ChevronRight } from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  department: string;
  priority: string;
  created_at: string;
  fileName?: string;
  filename?: string;
  excerpt?: string;
  match_score?: number;
  summary?: string;
}

const DocumentSearch: React.FC = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchType, setSearchType] = useState<'all' | 'content' | 'title'>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const response = await documentApi.searchDocuments(
        searchQuery,
        departmentFilter === 'all' ? undefined : departmentFilter,
        50
      );
      
      setSearchResults(response.documents || []);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, searchType, departmentFilter]);

  const openDocument = async (documentId: string) => {
    try {
      const url = await documentApi.getDownloadUrl(documentId);
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error opening document:', error);
    }
  };

  const downloadDocument = async (result: SearchResult) => {
    try {
      const url = await documentApi.getDownloadUrl(result.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.fileName || result.filename || 'document';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  };

  const getDepartmentColor = (department: string): string => {
    const colors: { [key: string]: string } = {
      Engineering: 'bg-blue-100 text-blue-800',
      Finance: 'bg-green-100 text-green-800',
      HR: 'bg-purple-100 text-purple-800',
      Admin: 'bg-yellow-100 text-yellow-800',
      Safety: 'bg-red-100 text-red-800',
      Operations: 'bg-cyan-100 text-cyan-800',
      Security: 'bg-indigo-100 text-indigo-800'
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Document Search</h2>
            <p className="text-sm text-gray-600">
              Search across {user.department ? user.department.name + ' and all' : 'all'} departments
            </p>
          </div>
        </div>

        {/* Search Input */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search for documents, content, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
            />
            {loading && (
              <div className="absolute right-4 top-3.5">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Search Filters */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filters:</span>
            </div>
            
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            >
              <option value="all">All Departments</option>
              <option value="Engineering">Engineering</option>
              <option value="Finance">Finance</option>
              <option value="HR">Human Resources</option>
              <option value="Admin">Administration</option>
              <option value="Safety">Safety</option>
              <option value="Operations">Operations</option>
              <option value="Security">Security</option>
            </select>

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Clear search
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {searchQuery && (
          <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-gray-500" />
                {loading ? 'Searching...' : `Found ${searchResults.length} result${searchResults.length !== 1 ? 's' : ''}`}
              </h3>
              {searchQuery && !loading && (
                <span className="text-sm text-gray-500">
                  for "<strong className="text-gray-700">{searchQuery}</strong>"
                </span>
              )}
            </div>
          </div>
        )}

        {searchResults.map((result, index) => (
          <div key={result.id || index} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-200">
            <div className="p-6">
              {/* Result Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-start space-x-3">
                    <div className="text-3xl mt-1">📄</div>
                    <div className="flex-1">
                      <h4 
                        className="text-lg font-semibold text-gray-900 mb-2 cursor-pointer hover:text-blue-600 transition-colors"
                        onClick={() => openDocument(result.id)}
                      >
                        {result.title || result.fileName || result.filename || 'Untitled Document'}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getDepartmentColor(result.department)}`}>
                          {result.department}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(result.created_at).toLocaleDateString()}
                        </span>
                        {result.match_score && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                            {Math.round(result.match_score * 100)}% match
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => openDocument(result.id)}
                    className="flex items-center space-x-1 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
                  >
                    <span>View</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => downloadDocument(result)}
                    className="flex items-center space-x-1 px-4 py-2 text-sm text-green-600 hover:text-green-800 border border-green-200 hover:border-green-300 rounded-lg transition-colors"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download</span>
                  </button>
                </div>
              </div>

              {/* Content Preview */}
              {(result.summary || result.excerpt || result.content) && (
                <div className="text-gray-700 bg-gray-50 rounded-lg p-4 mt-4">
                  <p className="text-sm line-clamp-3">
                    {result.summary || result.excerpt || result.content?.substring(0, 300) + '...' || 'No content preview available'}
                  </p>
                </div>
              )}

              {/* Priority Badge */}
              {result.priority && (
                <div className="mt-4">
                  <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                    result.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    result.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    result.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.priority.toUpperCase()} Priority
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* No Results */}
        {searchQuery && !loading && searchResults.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-12 text-center border border-gray-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No documents found</h3>
            <p className="text-gray-600 mb-6">
              No documents match your search criteria. Try adjusting your search terms or filters.
            </p>
            <div className="bg-blue-50 rounded-lg p-6 text-left max-w-md mx-auto">
              <p className="font-semibold text-blue-900 mb-3">💡 Search Tips:</p>
              <ul className="space-y-2 text-sm text-blue-800">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Try different keywords or synonyms</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Remove filters to search all departments</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use partial words or phrases</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Check spelling and try simpler terms</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-12 text-center border border-blue-200">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Search className="h-10 w-10 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to search</h3>
            <p className="text-gray-700 mb-8 text-lg">
              Enter keywords, phrases, or document titles to search across all departments
            </p>
            <div className="bg-white rounded-lg p-6 text-left max-w-lg mx-auto shadow-sm">
              <p className="font-semibold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-blue-600" />
                You can search for:
              </p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 text-xl">📝</span>
                  <span><strong>Document content</strong> - Full-text search through all documents</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 text-xl">📁</span>
                  <span><strong>File names and titles</strong> - Find documents by name</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 text-xl">🏢</span>
                  <span><strong>Department-specific</strong> - Filter by department</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-3 text-xl">🔍</span>
                  <span><strong>Keywords and metadata</strong> - Search by any relevant term</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSearch;