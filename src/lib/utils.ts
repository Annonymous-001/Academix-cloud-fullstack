import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { BSToAD } from 'bikram-sambat-js'


const getLatestMonday = (): Date => {
  const today = new Date();
  const dayOfWeek = today.getDay();
  
  // If today is Sunday (0), go back 6 days; else go back to Monday
  const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const latestMonday = new Date();
  latestMonday.setDate(today.getDate() - daysSinceMonday);
  return latestMonday;
};

export const adjustScheduleToCurrentWeek = (
  lessons: { title: string; start: Date; end: Date }[]
): { title: string; start: Date; end: Date }[] => {
  const latestMonday = getLatestMonday();

  return lessons.map((lesson) => {
    const lessonDayOfWeek = lesson.start.getDay();
    
    // Map Sunday (0) to Saturday (6)
    const daysFromMonday = lessonDayOfWeek === 0 ? 6 : lessonDayOfWeek - 1;

    const adjustedStartDate = new Date(latestMonday);
    adjustedStartDate.setDate(latestMonday.getDate() + daysFromMonday);
    adjustedStartDate.setHours(
      lesson.start.getHours(),
      lesson.start.getMinutes(),
      lesson.start.getSeconds()
    );

    const adjustedEndDate = new Date(adjustedStartDate);
    adjustedEndDate.setHours(
      lesson.end.getHours(),
      lesson.end.getMinutes(),
      lesson.end.getSeconds()
    );

    return {
      title: lesson.title,
      start: adjustedStartDate,
      end: adjustedEndDate,
    };
  });
};


export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Converts a Bikram Sambat (BS) date to Anno Domini (AD) date
 * @param bsDate - BS date in format "YYYY-MM-DD" or "YYYY/MM/DD"
 * @returns AD date string in ISO format
 */
export function convertBSToAD(bsDate: string): string {
  try {
    // Normalize the date format to YYYY-MM-DD
    const normalizedDate = bsDate.replace(/\//g, '-');
    const adDate = BSToAD(normalizedDate);
    return new Date(adDate).toISOString();
  } catch (error) {
    console.error('Error converting BS date to AD:', error);
    throw new Error(`Invalid BS date format: ${bsDate}`);
  }
}

/**
 * Validates if a string is a valid BS date format
 * @param dateString - Date string to validate
 * @returns boolean indicating if the date is valid
 */
export function isValidBSDate(dateString: string): boolean {
  try {
    const normalizedDate = dateString.replace(/\//g, '-');
    BSToAD(normalizedDate);
    return true;
  } catch {
    return false;
  }
}
