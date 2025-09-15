// Priority calculation utility for v0.4.0 Ticketing System
// Automatically calculates ticket priority based on urgency × impact matrix

export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ImpactLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';

// Priority Matrix: Urgency × Impact = Priority
const PRIORITY_MATRIX: Record<UrgencyLevel, Record<ImpactLevel, PriorityLevel>> = {
  Low: {
    Low: 'Low',
    Medium: 'Low',
    High: 'Medium',
    Critical: 'Medium',
  },
  Medium: {
    Low: 'Low',
    Medium: 'Medium',
    High: 'Medium',
    Critical: 'High',
  },
  High: {
    Low: 'Medium',
    Medium: 'Medium',
    High: 'High',
    Critical: 'High',
  },
  Critical: {
    Low: 'Medium',
    Medium: 'High',
    High: 'High',
    Critical: 'Critical',
  },
};

/**
 * Calculate ticket priority based on urgency and impact
 * @param urgency - How urgent is the issue (Low, Medium, High, Critical)
 * @param impact - How much impact does it have (Low, Medium, High, Critical)
 * @returns Calculated priority level
 */
export const calculatePriority = (
  urgency: UrgencyLevel,
  impact: ImpactLevel
): PriorityLevel => {
  return PRIORITY_MATRIX[urgency][impact];
};

/**
 * Get priority color for UI components
 * @param priority - Priority level
 * @returns Tailwind CSS color classes
 */
export const getPriorityColor = (priority: PriorityLevel): string => {
  const colors = {
    Low: 'bg-green-100 text-green-800 border-green-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[priority];
};

/**
 * Get urgency color for UI components
 * @param urgency - Urgency level
 * @returns Tailwind CSS color classes
 */
export const getUrgencyColor = (urgency: UrgencyLevel): string => {
  const colors = {
    Low: 'bg-blue-100 text-blue-800 border-blue-200',
    Medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    High: 'bg-orange-100 text-orange-800 border-orange-200',
    Critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[urgency];
};

/**
 * Get impact color for UI components
 * @param impact - Impact level
 * @returns Tailwind CSS color classes
 */
export const getImpactColor = (impact: ImpactLevel): string => {
  const colors = {
    Low: 'bg-slate-100 text-slate-800 border-slate-200',
    Medium: 'bg-blue-100 text-blue-800 border-blue-200',
    High: 'bg-purple-100 text-purple-800 border-purple-200',
    Critical: 'bg-red-100 text-red-800 border-red-200',
  };
  return colors[impact];
};

/**
 * Get status color for UI components
 * @param status - Ticket status
 * @returns Tailwind CSS color classes
 */
export const getStatusColor = (status: string): string => {
  const colors = {
    Open: 'bg-blue-100 text-blue-800 border-blue-200',
    'In Progress': 'bg-yellow-100 text-yellow-800 border-yellow-200',
    Resolved: 'bg-green-100 text-green-800 border-green-200',
    Closed: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get type color for UI components
 * @param type - Ticket type
 * @returns Tailwind CSS color classes
 */
export const getTypeColor = (type: string): string => {
  const colors = {
    Incident: 'bg-red-100 text-red-800 border-red-200',
    'Service Request': 'bg-blue-100 text-blue-800 border-blue-200',
    Problem: 'bg-orange-100 text-orange-800 border-orange-200',
    Change: 'bg-purple-100 text-purple-800 border-purple-200',
  };
  return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Get category color for UI components
 * @param category - Ticket category
 * @returns Tailwind CSS color classes
 */
export const getCategoryColor = (category: string): string => {
  const colors = {
    Hardware: 'bg-amber-100 text-amber-800 border-amber-200',
    Software: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Network: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    Access: 'bg-violet-100 text-violet-800 border-violet-200',
    Other: 'bg-gray-100 text-gray-800 border-gray-200',
  };
  return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 border-gray-200';
};

/**
 * Priority ordering for sorting (higher number = higher priority)
 */
export const PRIORITY_ORDER = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

/**
 * Sort tickets by priority (Critical first)
 * @param tickets - Array of tickets
 * @returns Sorted tickets array
 */
export const sortByPriority = (tickets: any[]): any[] => {
  return [...tickets].sort((a, b) => {
    const priorityA = PRIORITY_ORDER[a.priority as PriorityLevel] || 0;
    const priorityB = PRIORITY_ORDER[b.priority as PriorityLevel] || 0;
    return priorityB - priorityA; // Descending order (Critical first)
  });
};

/**
 * Calculate SLA target based on priority and type
 * @param priority - Priority level
 * @param type - Ticket type
 * @returns SLA target in hours
 */
export const calculateSLATarget = (priority: PriorityLevel, type: string): number => {
  // SLA matrix in hours
  const slaMatrix = {
    Critical: {
      Incident: 1, // 1 hour for critical incidents
      'Service Request': 4,
      Problem: 8,
      Change: 24,
    },
    High: {
      Incident: 4, // 4 hours for high incidents
      'Service Request': 8,
      Problem: 24,
      Change: 72,
    },
    Medium: {
      Incident: 8, // 8 hours for medium incidents
      'Service Request': 24,
      Problem: 72,
      Change: 168, // 1 week
    },
    Low: {
      Incident: 24, // 24 hours for low incidents
      'Service Request': 72,
      Problem: 168,
      Change: 336, // 2 weeks
    },
  };

  return slaMatrix[priority][type as keyof typeof slaMatrix[typeof priority]] || 24;
};

/**
 * Format time spent for display
 * @param minutes - Time in minutes
 * @returns Formatted time string
 */
export const formatTimeSpent = (minutes: number | null): string => {
  if (!minutes || minutes === 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours === 0) return `${remainingMinutes}m`;
  if (remainingMinutes === 0) return `${hours}h`;
  return `${hours}h ${remainingMinutes}m`;
};