/**
 * Validate email format
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate cron expression format
 * Basic validation - checks if it has 5 fields separated by spaces
 */
export const validateCronExpression = (cron: string): boolean => {
  if (!cron || typeof cron !== 'string') {
    return false;
  }

  const parts = cron.trim().split(/\s+/);
  
  // Cron should have exactly 5 fields: minute hour day month day-of-week
  if (parts.length !== 5) {
    return false;
  }

  // Validate each field
  const [minute, hour, day, month, dayOfWeek] = parts;

  // Helper function to validate cron field
  const isValidCronField = (field: string, min: number, max: number): boolean => {
    // Allow wildcards
    if (field === '*') return true;

    // Allow ranges (e.g., 1-5)
    if (field.includes('-')) {
      const [start, end] = field.split('-');
      const startNum = parseInt(start, 10);
      const endNum = parseInt(end, 10);
      return !isNaN(startNum) && !isNaN(endNum) && startNum >= min && endNum <= max && startNum <= endNum;
    }

    // Allow step values (e.g., */15)
    if (field.includes('/')) {
      const [base, step] = field.split('/');
      const stepNum = parseInt(step, 10);
      if (isNaN(stepNum) || stepNum <= 0) return false;
      if (base === '*') return true;
      const baseNum = parseInt(base, 10);
      return !isNaN(baseNum) && baseNum >= min && baseNum <= max;
    }

    // Allow lists (e.g., 1,3,5)
    if (field.includes(',')) {
      return field.split(',').every((f) => {
        const num = parseInt(f, 10);
        return !isNaN(num) && num >= min && num <= max;
      });
    }

    // Allow single numbers
    const num = parseInt(field, 10);
    return !isNaN(num) && num >= min && num <= max;
  };

  // Validate each field with appropriate ranges
  return (
    isValidCronField(minute, 0, 59) &&
    isValidCronField(hour, 0, 23) &&
    isValidCronField(day, 1, 31) &&
    isValidCronField(month, 1, 12) &&
    isValidCronField(dayOfWeek, 0, 6)
  );
};

/**
 * Validate report name
 */
export const validateReportName = (name: string): boolean => {
  if (!name || typeof name !== 'string') {
    return false;
  }
  const trimmed = name.trim();
  return trimmed.length > 0 && trimmed.length <= 255;
};

/**
 * Validate email list
 */
export const validateEmailList = (emails: string[]): boolean => {
  if (!Array.isArray(emails) || emails.length === 0) {
    return false;
  }
  return emails.every((email) => validateEmail(email));
};
