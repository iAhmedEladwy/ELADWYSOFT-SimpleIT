/**
 * Priority calculation utilities following ITIL best practices
 * Priority is automatically calculated based on Impact × Urgency matrix
 */

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type UrgencyLevel = 'Low' | 'Medium' | 'High' | 'Critical';
export type ImpactLevel = 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * ITIL Priority Matrix
 * Calculates priority based on the combination of urgency and impact
 * 
 * @param urgency - How quickly the issue needs to be resolved
 * @param impact - How many users/business processes are affected
 * @returns Calculated priority level
 */
export function calculatePriority(urgency: UrgencyLevel, impact: ImpactLevel): PriorityLevel {
  // ITIL Priority Matrix
  // Rows: Urgency, Columns: Impact
  const priorityMatrix: Record<UrgencyLevel, Record<ImpactLevel, PriorityLevel>> = {
    'Critical': {
      'Low': 'Medium',
      'Medium': 'High', 
      'High': 'High',
      'Critical': 'Critical'
    },
    'High': {
      'Low': 'Low',
      'Medium': 'Medium',
      'High': 'High', 
      'Critical': 'High'
    },
    'Medium': {
      'Low': 'Low',
      'Medium': 'Low',
      'High': 'Medium',
      'Critical': 'Medium'
    },
    'Low': {
      'Low': 'Low',
      'Medium': 'Low',
      'High': 'Low',
      'Critical': 'Low'
    }
  };

  return priorityMatrix[urgency][impact];
}

/**
 * Get priority color for UI display
 * @param priority - Priority level
 * @returns CSS color class or hex color
 */
export function getPriorityColor(priority: PriorityLevel): string {
  const colors: Record<PriorityLevel, string> = {
    'Low': '#22c55e',      // Green
    'Medium': '#f59e0b',   // Orange  
    'High': '#ef4444',     // Red
    'Critical': '#dc2626'  // Dark Red
  };
  
  return colors[priority];
}

/**
 * Get priority badge variant for UI components
 * @param priority - Priority level
 * @returns Badge variant string
 */
export function getPriorityBadgeVariant(priority: PriorityLevel): string {
  const variants: Record<PriorityLevel, string> = {
    'Low': 'success',
    'Medium': 'warning', 
    'High': 'destructive',
    'Critical': 'destructive'
  };
  
  return variants[priority];
}

/**
 * Get SLA response time in hours based on priority
 * @param priority - Priority level
 * @returns Response time in hours
 */
export function getSLAResponseTime(priority: PriorityLevel): number {
  const responseTimes: Record<PriorityLevel, number> = {
    'Critical': 1,    // 1 hour
    'High': 4,        // 4 hours
    'Medium': 24,     // 1 day
    'Low': 72         // 3 days
  };
  
  return responseTimes[priority];
}

/**
 * Validate if the provided priority matches the calculated priority
 * @param urgency - Ticket urgency
 * @param impact - Ticket impact  
 * @param providedPriority - Priority provided by user/system
 * @returns True if priority is correct, false otherwise
 */
export function validatePriority(
  urgency: UrgencyLevel, 
  impact: ImpactLevel, 
  providedPriority: PriorityLevel
): boolean {
  const calculatedPriority = calculatePriority(urgency, impact);
  return calculatedPriority === providedPriority;
}

/**
 * Get priority explanation for users
 * @param urgency - Ticket urgency
 * @param impact - Ticket impact
 * @returns Human-readable explanation of priority calculation
 */
export function getPriorityExplanation(urgency: UrgencyLevel, impact: ImpactLevel): string {
  const priority = calculatePriority(urgency, impact);
  return `Priority "${priority}" calculated from Urgency: ${urgency} × Impact: ${impact}`;
}