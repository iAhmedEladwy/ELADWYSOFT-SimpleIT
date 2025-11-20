export function applyCustomEmployeeFilter(
  employees: any[],
  filterType: string | null,
  assets?: any[]
) {
  if (!filterType || !employees) return employees;

  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  switch (filterType) {
    case 'pendingExit':
      // Active employees with exit date set
      return employees.filter(emp => 
        emp.status === 'Active' && 
        emp.exitDate !== null && 
        emp.exitDate !== undefined
      );

    case 'pendingAssetReturn':
      // Active with exit date AND has assets
      return employees.filter(emp => {
        const hasExitDate = emp.exitDate !== null && emp.exitDate !== undefined;
        const isActive = emp.status === 'Active';
        const hasAssets = assets ? assets.some(asset => 
          asset.assignedTo === emp.id || 
          asset.assignedEmployeeId === emp.id || 
          asset.assignedToId === emp.id ||
          asset.assignedTo === emp.empId
        ) : false;
        return isActive && hasExitDate && hasAssets;
      });

    case 'pendingOffboarding':
    case 'offboardedWithAssets':
    // Resigned or Terminated employees who still have assets
    return employees.filter(emp => {
        // Check if employee is resigned or terminated
        const isOffboarded = emp.status === 'Resigned' || emp.status === 'Terminated';
        
        // Check if employee has assets assigned
        const hasAssets = assets ? assets.some(asset => {
        // Check multiple possible fields for assignment
        return (
            (asset.assignedTo && asset.assignedTo === emp.id) ||
            (asset.assignedEmployeeId && asset.assignedEmployeeId === emp.id) ||
            (asset.assignedToId && asset.assignedToId === emp.id) ||
            (asset.assignedTo && asset.assignedTo === emp.empId) ||
            (asset.assignedEmployee && asset.assignedEmployee === emp.id)
        );
        }) : false;
        
        return isOffboarded && hasAssets;
  });
      // Not active but still has assets
      return employees.filter(emp => {
        const isInactive = emp.status !== 'Active';
        const hasAssets = assets ? assets.some(asset => 
          asset.assignedTo === emp.id || 
          asset.assignedEmployeeId === emp.id || 
          asset.assignedToId === emp.id ||
          asset.assignedTo === emp.empId
        ) : false;
        return isInactive && hasAssets;
      });

    case 'recentlyAdded':
      // Joined within last 30 days
      return employees.filter(emp => {
        if (!emp.joiningDate) return false;
        const joiningDate = new Date(emp.joiningDate);
        return joiningDate >= thirtyDaysAgo;
      });

    case 'fullTimeWithoutAssets':
      // Full-time employees with no assets
      return employees.filter(emp => {
        const isFullTime = emp.employmentType === 'Full-time';
        const hasAssets = assets ? assets.some(asset => 
          asset.assignedTo === emp.id || 
          asset.assignedEmployeeId === emp.id || 
          asset.assignedToId === emp.id ||
          asset.assignedTo === emp.empId
        ) : false;
        return isFullTime && !hasAssets;
      });

    case 'overdueExit':
      // Exit date passed but still active
      return employees.filter(emp => {
        if (!emp.exitDate || emp.status !== 'Active') return false;
        const exitDate = new Date(emp.exitDate);
        return exitDate < today;
      });

    case 'allWithAssets':
      // Anyone who has assets assigned
      return employees.filter(emp => {
        return assets ? assets.some(asset => 
          asset.assignedTo === emp.id || 
          asset.assignedEmployeeId === emp.id || 
          asset.assignedToId === emp.id ||
          asset.assignedTo === emp.empId
        ) : false;
      });

    default:
      return employees;
  }
}