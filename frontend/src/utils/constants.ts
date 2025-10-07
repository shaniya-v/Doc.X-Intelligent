import { Department } from '../types';

export const DEPARTMENTS: Department[] = [
  {
    name: 'Engineering',
    displayName: 'Engineering',
    malayalamName: 'എഞ്ചിനീയറിംഗ്',
    color: 'bg-blue-600',
    icon: '🔧',
    description: 'Track maintenance, signal systems, infrastructure, and technical operations'
  },
  {
    name: 'Finance',
    displayName: 'Finance',
    malayalamName: 'ധനകാര്യം',
    color: 'bg-green-600',
    icon: '💰',
    description: 'Budget management, procurement, vendor payments, and financial reporting'
  },
  {
    name: 'Human Resources',
    displayName: 'Human Resources',
    malayalamName: 'മാനവ വിഭവശേഷി',
    color: 'bg-purple-600',
    icon: '👥',
    description: 'Employee management, training, recruitment, and HR policies'
  },
  {
    name: 'Operations',
    displayName: 'Operations',
    malayalamName: 'പ്രവർത്തനങ്ങൾ',
    color: 'bg-orange-600',
    icon: '🚇',
    description: 'Train operations, scheduling, passenger services, and station management'
  },
  {
    name: 'Safety & Security',
    displayName: 'Safety & Security',
    malayalamName: 'സുരക്ഷ',
    color: 'bg-red-600',
    icon: '🛡️',
    description: 'Safety incidents, security protocols, emergency response, and investigations'
  },
  {
    name: 'Administration',
    displayName: 'Administration',
    malayalamName: 'ഭരണം',
    color: 'bg-gray-600',
    icon: '📋',
    description: 'General administration, documentation, facility management, and office procedures'
  }
];

export const PRIORITY_COLORS = {
  urgent: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-800 border-gray-200',
};

export const SOURCE_COLORS = {
  gmail: 'bg-red-100 text-red-800',
  sharepoint: 'bg-blue-100 text-blue-800',
  maximo: 'bg-green-100 text-green-800',
  whatsapp: 'bg-green-100 text-green-800',
  cloud: 'bg-purple-100 text-purple-800',
  scan: 'bg-yellow-100 text-yellow-800',
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const getFileTypeIcon = (mimeType: string): string => {
  if (mimeType?.includes('pdf')) return '📄';
  if (mimeType?.includes('word')) return '📝';
  if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) return '📊';
  if (mimeType?.includes('image')) return '🖼️';
  if (mimeType?.includes('text')) return '📃';
  return '📎';
};

export const getDepartmentByName = (name: string): Department | undefined => {
  return DEPARTMENTS.find(dept => dept.name === name || dept.displayName === name);
};