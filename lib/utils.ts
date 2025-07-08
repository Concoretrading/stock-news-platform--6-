import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getQuarterFromDate(dateString: string): number {
  const date = new Date(dateString);
  return Math.floor((date.getMonth() + 3) / 3);
}

export function getCategoryFromEventType(eventType: string): string {
  const categoryMap: Record<string, string> = {
    'product_launch': 'Product Launch',
    'earnings': 'Earnings',
    'regulatory': 'Regulatory',
    'partnership': 'Partnership',
    'acquisition': 'M&A',
    'management_change': 'Management',
    'investor_day': 'Investor Relations',
    'conference': 'Conference',
    'other': 'Other'
  };
  return categoryMap[eventType] || 'Other';
}

export function getImpactFromConfidence(confidence: number): string {
  if (confidence >= 0.8) return 'high';
  if (confidence >= 0.6) return 'medium';
  return 'low';
}
