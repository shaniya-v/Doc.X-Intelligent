import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  department: string;
  priority: string;
  created_at: string;
  fileName?: string;
  excerpt?: string;
  match_score?: number;
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
      const params = new URLSearchParams({
        q: searchQuery,
        type: searchType,
        department: departmentFilter
      });

      const response = await fetch(`http://localhost:8000/api/documents/search?${params}`);
      
      if (response.ok) {
        const results = await response.json();
        setSearchResults(results);
      } else {
        console.error('Search failed:', response.statusText);
        setSearchResults([]);
      }
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

  const highlightText = (text: string, query: string): string => {
    if (!query) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  const openDocument = (documentId: string) => {
    window.open(`/document/${documentId}`, '_blank');
  };

  const downloadDocument = (result: SearchResult) => {
    if (result.fileName) {
      // Assuming we have a download endpoint
      window.open(`http://localhost:8000/api/documents/${result.id}/download`, '_blank');
    } else {
      openDocument(result.id);
    }
  };

  const getDepartmentColor = (department: string): string => {
    const colors: { [key: string]: string } = {
      engineering: 'bg-blue-100 text-blue-800',
      finance: 'bg-green-100 text-green-800',
      hr: 'bg-purple-100 text-purple-800',
      admin: 'bg-yellow-100 text-yellow-800',
      safety: 'bg-red-100 text-red-800',
      operations: 'bg-cyan-100 text-cyan-800'
    };
    return colors[department] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Global Document Search</h2>
        <p className="text-gray-600 mb-6">
          Search across all departments and documents in the system. Find documents by content, title, or metadata.
        </p>

        {/* Search Input */}
        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for documents, content, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-lg"
            />
            <svg 
              className="absolute left-4 top-3.5 h-6 w-6 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {loading && (
              <div className="absolute right-4 top-3.5">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
              </div>
            )}
          </div>

          {/* Search Filters */}
          <div className="flex flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search Type</label>
              <select
                value={searchType}
                onChange={(e) => setSearchType(e.target.value as 'all' | 'content' | 'title')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Fields</option>
                <option value="content">Content Only</option>
                <option value="title">Title Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Departments</option>
                <option value="engineering">Engineering</option>
                <option value="finance">Finance</option>
                <option value="hr">Human Resources</option>
                <option value="admin">Administration</option>
                <option value="safety">Safety</option>
                <option value="operations">Operations</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Search Results */}
      <div className="space-y-4">
        {searchQuery && (
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Search Results {searchResults.length > 0 && `(${searchResults.length})`}
              </h3>
              {searchQuery && (
                <span className="text-sm text-gray-500">
                  Searching for: "<strong>{searchQuery}</strong>"
                </span>
              )}
            </div>
          </div>
        )}

        {searchResults.map((result) => (
          <div key={result.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
            <div className="p-6">
              {/* Result Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h4 
                    className="text-lg font-medium text-gray-900 mb-1 cursor-pointer hover:text-indigo-600"
                    onClick={() => openDocument(result.id)}
                    dangerouslySetInnerHTML={{ 
                      __html: highlightText(result.title || 'Untitled Document', searchQuery) 
                    }}
                  />
                  <div className="flex items-center space-x-3 text-sm text-gray-500">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDepartmentColor(result.department)}`}>
                      {result.department}
                    </span>
                    <span>{new Date(result.created_at).toLocaleDateString()}</span>
                    {result.fileName && (
                      <span className="flex items-center space-x-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span>{result.fileName}</span>
                      </span>
                    )}
                    {result.match_score && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {Math.round(result.match_score * 100)}% match
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => openDocument(result.id)}
                    className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:border-indigo-300 rounded"
                  >
                    View
                  </button>
                  {result.fileName && (
                    <button
                      onClick={() => downloadDocument(result)}
                      className="px-3 py-1 text-sm text-green-600 hover:text-green-800 border border-green-200 hover:border-green-300 rounded"
                    >
                      Download
                    </button>
                  )}
                </div>
              </div>

              {/* Content Preview */}
              <div className="text-gray-700">
                <div 
                  className="line-clamp-3"
                  dangerouslySetInnerHTML={{ 
                    __html: highlightText(
                      result.excerpt || result.content?.substring(0, 300) + '...' || 'No content preview available',
                      searchQuery
                    ) 
                  }}
                />
              </div>

              {/* Priority Badge */}
              {result.priority && (
                <div className="mt-3">
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    result.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    result.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                    result.priority === 'normal' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {result.priority} priority
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* No Results */}
        {searchQuery && !loading && searchResults.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No documents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No documents match your search criteria. Try adjusting your search terms or filters.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p><strong>Search Tips:</strong></p>
              <ul className="text-left mt-2 space-y-1">
                <li>• Try different keywords or synonyms</li>
                <li>• Remove filters to search all departments</li>
                <li>• Use partial words or phrases</li>
                <li>• Check spelling and try simpler terms</li>
              </ul>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!searchQuery && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">Ready to search</h3>
            <p className="mt-1 text-sm text-gray-500">
              Enter keywords, phrases, or document titles to search across all departments.
            </p>
            <div className="mt-4 text-sm text-gray-500">
              <p><strong>You can search for:</strong></p>
              <ul className="text-left mt-2 space-y-1">
                <li>• Document content and text</li>
                <li>• File names and titles</li>
                <li>• Department-specific documents</li>
                <li>• Keywords and metadata</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSearch;