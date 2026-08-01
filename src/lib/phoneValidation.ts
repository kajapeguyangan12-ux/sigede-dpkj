/**
 * Indonesian Phone Number Validation Utility
 * Supports various Indonesian phone number formats
 */

export const validateIndonesianPhoneNumber = (phoneNumber: string): { 
  isValid: boolean; 
  message?: string; 
  formatted?: string; 
} => {
  if (!phoneNumber || phoneNumber.trim() === '') {
    return { isValid: true }; // Optional field
  }

  // Clean the number (remove spaces, dashes, parentheses)
  const cleanNumber = phoneNumber.replace(/[^0-9+]/g, '');

  // Indonesian phone number patterns
  const patterns = [
    /^08[0-9]{8,11}$/,           // 08xxxxxxxxxx (08 + 8-11 digits)
    /^628[0-9]{8,11}$/,          // 628xxxxxxxxx (628 + 8-11 digits)
    /^\+628[0-9]{8,11}$/,        // +628xxxxxxxxx (+628 + 8-11 digits)
  ];

  // Check if matches any pattern
  const isValidPattern = patterns.some(pattern => pattern.test(cleanNumber));

  if (!isValidPattern) {
    return {
      isValid: false,
      message: 'Format nomor telepon tidak valid. Gunakan format: 08xxxxxxxxxx, 628xxxxxxxxx, atau +628xxxxxxxxx'
    };
  }

  // Length validation
  const phoneLength = cleanNumber.replace(/^\+/, '').length;
  if (phoneLength < 10 || phoneLength > 15) {
    return {
      isValid: false,
      message: 'Nomor telepon harus 10-15 digit'
    };
  }

  // Format the number (standardize to +62 format)
  let formatted = cleanNumber;
  if (cleanNumber.startsWith('08')) {
    formatted = '+628' + cleanNumber.substring(2);
  } else if (cleanNumber.startsWith('628')) {
    formatted = '+' + cleanNumber;
  } else if (!cleanNumber.startsWith('+628')) {
    formatted = '+628' + cleanNumber;
  }

  return {
    isValid: true,
    formatted
  };
};

// Test cases for validation
export const testCases = [
  // Valid numbers
  { number: '081234567890', expected: true },
  { number: '08123456789', expected: true },
  { number: '628123456789', expected: true },
  { number: '+628123456789', expected: true },
  { number: '0812-3456-789', expected: true }, // with dashes
  { number: '0812 3456 789', expected: true }, // with spaces
  
  // Invalid numbers
  { number: '07123456789', expected: false }, // Wrong prefix
  { number: '08123', expected: false }, // Too short
  { number: '081234567890123456', expected: false }, // Too long
  { number: 'abc123456789', expected: false }, // Contains letters
  { number: '62712345678', expected: false }, // Wrong format
  { number: '+62712345678', expected: false }, // Wrong format
  
  // Edge cases
  { number: '', expected: true }, // Empty (optional field)
  { number: '   ', expected: true }, // Whitespace only
];

// Function to run all test cases
export const runPhoneValidationTests = (): { passed: number; failed: number; total: number; results: any[] } => {
  const results = testCases.map(test => {
    const result = validateIndonesianPhoneNumber(test.number);
    const passed = result.isValid === test.expected;
    
    return {
      input: test.number,
      expected: test.expected,
      actual: result.isValid,
      passed,
      message: result.message,
      formatted: result.formatted
    };
  });

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  return {
    passed,
    failed,
    total: results.length,
    results
  };
};

// Quick validation function for forms
export const isValidIndonesianPhoneNumber = (phoneNumber: string): boolean => {
  return validateIndonesianPhoneNumber(phoneNumber).isValid;
};