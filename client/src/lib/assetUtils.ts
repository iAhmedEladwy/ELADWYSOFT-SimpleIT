/**
 * Asset Depreciation and Value Calculation Utilities
 * 
 * This module provides functions for calculating asset depreciation and current value
 * based on standard accounting methods.
 */

/**
 * Calculate the straight-line depreciation value of an asset
 * 
 * @param purchaseDate - The date when the asset was purchased
 * @param purchasePrice - The original purchase price of the asset
 * @param lifeSpanMonths - The expected lifespan of the asset in months
 * @param asOfDate - Optional date to calculate depreciation as of (defaults to current date)
 * @returns The current value of the asset after depreciation
 */
export function calculateAssetValue(
  purchaseDate: Date | string | null,
  purchasePrice: number | null,
  lifeSpanMonths: number | null,
  asOfDate: Date = new Date()
): {
  currentValue: number;
  depreciationAmount: number;
  depreciationPercentage: number;
  remainingLifePercentage: number;
  ageInMonths: number;
  isFullyDepreciated: boolean;
} {
  // Return zeros if any required parameter is missing
  if (!purchaseDate || !purchasePrice || !lifeSpanMonths) {
    return {
      currentValue: 0,
      depreciationAmount: 0,
      depreciationPercentage: 0,
      remainingLifePercentage: 100,
      ageInMonths: 0,
      isFullyDepreciated: false
    };
  }

  // Convert string date to Date object if needed
  const purchaseDateObj = typeof purchaseDate === 'string' 
    ? new Date(purchaseDate) 
    : purchaseDate;

  // Calculate the age of the asset in months
  const ageInMonths = calculateMonthsBetween(purchaseDateObj, asOfDate);
  
  // Calculate the depreciation percentage
  const depreciationPercentage = Math.min(100, Math.max(0, (ageInMonths / lifeSpanMonths) * 100));
  
  // Calculate remaining life percentage
  const remainingLifePercentage = Math.max(0, 100 - depreciationPercentage);
  
  // Calculate the depreciation amount
  const depreciationAmount = purchasePrice * (depreciationPercentage / 100);
  
  // Calculate the current value
  const currentValue = Math.max(0, purchasePrice - depreciationAmount);
  
  // Determine if the asset is fully depreciated
  const isFullyDepreciated = depreciationPercentage >= 100;

  return {
    currentValue,
    depreciationAmount,
    depreciationPercentage,
    remainingLifePercentage,
    ageInMonths,
    isFullyDepreciated
  };
}

/**
 * Calculate the number of months between two dates
 * 
 * @param startDate - The starting date
 * @param endDate - The ending date
 * @returns The number of months between the two dates
 */
export function calculateMonthsBetween(startDate: Date, endDate: Date): number {
  const years = endDate.getFullYear() - startDate.getFullYear();
  const months = endDate.getMonth() - startDate.getMonth();
  
  return (years * 12) + months;
}

/**
 * Format currency with the appropriate symbol and decimal places
 * 
 * @param amount - The amount to format
 * @param currency - The currency symbol to use (defaults to EGP)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number | null, currency: string = 'EGP'): string {
  if (amount === null) return '-';
  
  return `${amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })} ${currency}`;
}

/**
 * Calculate and return a color representing the health/status of an asset
 * based on its remaining life percentage
 * 
 * @param remainingLifePercentage - The percentage of remaining life for the asset
 * @returns A CSS color string
 */
export function getDepreciationStatusColor(remainingLifePercentage: number): string {
  if (remainingLifePercentage <= 0) return 'rgb(239, 68, 68)'; // Red
  if (remainingLifePercentage < 25) return 'rgb(249, 115, 22)'; // Orange
  if (remainingLifePercentage < 50) return 'rgb(234, 179, 8)'; // Yellow
  return 'rgb(34, 197, 94)'; // Green
}

/**
 * Get human readable status text for an asset's depreciation state
 * 
 * @param remainingLifePercentage - The percentage of remaining life for the asset
 * @returns A descriptive string of the asset's status
 */
export function getDepreciationStatusText(remainingLifePercentage: number): string {
  if (remainingLifePercentage <= 0) return 'Fully Depreciated';
  if (remainingLifePercentage < 25) return 'Near End of Life';
  if (remainingLifePercentage < 50) return 'Moderate Depreciation';
  if (remainingLifePercentage < 75) return 'Good Condition';
  return 'Excellent Condition';
}