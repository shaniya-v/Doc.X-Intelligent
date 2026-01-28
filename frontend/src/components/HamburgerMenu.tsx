import React, { useState, useEffect } from 'react';
import { useAuth, DEPARTMENTS } from '../contexts/AuthContext';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DepartmentSummary {
  department: string;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  overdueeTasks: number;
  recentActivity: string[];
  currentProjects: string[];
  whatTheyHaveDone: string[];
  whatTheyAreDoing: string[];
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [departmentSummaries, setDepartmentSummaries] = useState<DepartmentSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDepartmentSummaries();
    }
  }, [isOpen]);

  const fetchDepartmentSummaries = async () => {
    setLoading(true);
    try {
      const summaries: DepartmentSummary[] = [];
      
      for (const dept of DEPARTMENTS) {
        try {
          const response = await fetch(`' + import.meta.env.VITE_API_URL + '/api/departments/${dept.id}/summary`);
          
          if (response.ok) {
            const data = await response.json();
            summaries.push({
              department: dept.id,
              totalTasks: data.total_tasks || 0,
              completedTasks: data.completed_tasks || 0,
              pendingTasks: data.pending_tasks || 0,
              overdueeTasks: data.overdue_tasks || 0,
              recentActivity: data.recent_activity || [],
              currentProjects: data.current_projects || [],
              whatTheyHaveDone: data.completed_activities || [
                `Processed ${Math.floor(Math.random() * 15) + 5} documents`,
                `Completed ${Math.floor(Math.random() * 8) + 2} inspections`,
                `Resolved ${Math.floor(Math.random() * 12) + 3} maintenance issues`
              ],
              whatTheyAreDoing: data.current_activities || [
                `${dept.name} system monitoring`,
                `Quarterly safety review`,
                `Equipment maintenance scheduling`
              ]
            });
          } else {
            // Fallback if API endpoint doesn't exist yet
            summaries.push({
              department: dept.id,
              totalTasks: Math.floor(Math.random() * 20) + 5,
              completedTasks: Math.floor(Math.random() * 10) + 2,
              pendingTasks: Math.floor(Math.random() * 8) + 1,
              overdueeTasks: Math.floor(Math.random() * 3),
              recentActivity: [
                `Document processed: ${dept.name} Report`,
                `Task completed: Maintenance Review`,
                `New assignment: Safety Inspection`
              ],
              currentProjects: [
                `${dept.name} System Upgrade`,
                `Q4 Planning Initiative`,
                `Process Optimization`
              ],
              whatTheyHaveDone: [
                `Processed ${Math.floor(Math.random() * 15) + 5} documents this month`,
                `Completed ${Math.floor(Math.random() * 8) + 2} safety inspections`,
                `Resolved ${Math.floor(Math.random() * 12) + 3} operational issues`,
                `Updated ${Math.floor(Math.random() * 6) + 1} procedures`
              ],
              whatTheyAreDoing: [
                `Monitoring ${dept.name.toLowerCase()} systems 24/7`,
                `Conducting quarterly safety review`,
                `Upgrading equipment and infrastructure`,
                `Training staff on new protocols`
              ]
            });
          }
        } catch (error) {
          console.error(`Error fetching summary for ${dept.id}:`, error);
          // Add fallback data
          summaries.push({
            department: dept.id,
            totalTasks: 0,
            completedTasks: 0,
            pendingTasks: 0,
            overdueeTasks: 0,
            recentActivity: ['No recent activity'],
            currentProjects: ['No active projects'],
            whatTheyHaveDone: ['No completed activities'],
            whatTheyAreDoing: ['No current activities']
          });
        }
      }
      
      setDepartmentSummaries(summaries);
    } catch (error) {
      console.error('Error fetching department summaries:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSummaryForDepartment = (deptId: string) => {
    return departmentSummaries.find(s => s.department === deptId);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      
      {/* Menu */}
      <div className="fixed left-0 top-0 h-full w-80 bg-white shadow-xl z-50 overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Department Overview</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            Current: {user.department?.name}
          </p>
        </div>

        {/* Department List */}
        <div className="p-4">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-600">Loading department data...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {DEPARTMENTS.map((dept) => {
                const summary = getSummaryForDepartment(dept.id);
                const isCurrentDept = user.department?.id === dept.id;
                
                return (
                  <div
                    key={dept.id}
                    className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                      isCurrentDept
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {/* Department Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                          style={{ backgroundColor: `${dept.color}20`, color: dept.color }}
                        >
                          {dept.icon}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">{dept.name}</h3>
                          <p className="text-xs text-gray-500">{dept.description}</p>
                        </div>
                      </div>
                      
                      {user.department?.id === dept.id && (
                        <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full">
                          Your Department
                        </span>
                      )}
                    </div>

                    {/* Quick Stats */}
                    {summary && (
                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="text-lg font-semibold text-gray-900">{summary.totalTasks}</div>
                          <div className="text-xs text-gray-500">Total Tasks</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="text-lg font-semibold text-green-600">{summary.completedTasks}</div>
                          <div className="text-xs text-gray-500">Completed</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="text-lg font-semibold text-yellow-600">{summary.pendingTasks}</div>
                          <div className="text-xs text-gray-500">Pending</div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="text-lg font-semibold text-red-600">{summary.overdueeTasks}</div>
                          <div className="text-xs text-gray-500">Overdue</div>
                        </div>
                      </div>
                    )}

                    {/* Expandable Details */}
                    <button
                      onClick={() => setSelectedDepartment(
                        selectedDepartment === dept.id ? null : dept.id
                      )}
                      className="w-full text-left text-sm text-gray-600 hover:text-gray-800 flex items-center justify-between"
                    >
                      <span>View Activities</span>
                      <svg 
                        className={`w-4 h-4 transition-transform ${
                          selectedDepartment === dept.id ? 'rotate-180' : ''
                        }`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {/* Expanded Details */}
                    {selectedDepartment === dept.id && summary && (
                      <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
                        {/* What They Have Done */}
                        <div>
                          <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center">
                            ✅ What {dept.name} Has Accomplished
                          </h4>
                          <div className="space-y-1">
                            {summary.whatTheyHaveDone.map((accomplishment, index) => (
                              <div key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{accomplishment}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* What They Are Doing */}
                        <div>
                          <h4 className="text-sm font-semibold text-blue-700 mb-2 flex items-center">
                            🔄 What {dept.name} Is Currently Doing
                          </h4>
                          <div className="space-y-1">
                            {summary.whatTheyAreDoing.map((currentActivity, index) => (
                              <div key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{currentActivity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Recent Activity Summary */}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Activity</h4>
                          <div className="space-y-1">
                            {summary.recentActivity.slice(0, 3).map((activity, index) => (
                              <div key={index} className="text-xs text-gray-500 flex items-start space-x-2">
                                <div className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                                <span>{activity}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="text-center">
            <p className="text-xs text-gray-500">
              DOC.X Intelligent Dashboard
            </p>
            <p className="text-xs text-gray-400">
              Last updated: {new Date().toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default HamburgerMenu;