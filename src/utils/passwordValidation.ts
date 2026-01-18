/**
 * Password validation utilities for frontend
 */

export interface PasswordValidation {
  valid: boolean;
  errors: string[];
  score: number;
  strength: string;
}

export interface UsernameValidation {
  valid: boolean;
  errors: string[];
}

export function validatePasswordStrength(password: string): PasswordValidation {
  const errors: string[] = [];
  let score = 0;

  // Check minimum length
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  } else {
    score += 1;
  }

  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  } else {
    score += 1;
  }

  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  } else {
    score += 1;
  }

  // Check for number
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  } else {
    score += 1;
  }

  // Check for special character (optional but recommended)
  if (/[^A-Za-z0-9]/.test(password)) {
    score += 1;
  }

  // Bonus for length
  if (password.length >= 12) {
    score = Math.min(score + 1, 5);
  }

  return {
    valid: errors.length === 0,
    errors,
    score,
    strength: getStrengthLabel(score),
  };
}

export function getStrengthLabel(score: number): string {
  if (score <= 1) return 'Very Weak';
  if (score === 2) return 'Weak';
  if (score === 3) return 'Fair';
  if (score === 4) return 'Strong';
  return 'Very Strong';
}

export function getStrengthColor(score: number): string {
  if (score <= 1) return '#d32f2f';
  if (score === 2) return '#f57c00';
  if (score === 3) return '#fbc02d';
  if (score === 4) return '#689f38';
  return '#388e3c';
}

export function validateUsername(username: string): UsernameValidation {
  const errors: string[] = [];

  // Check length
  if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (username.length > 30) {
    errors.push('Username must be 30 characters or less');
  }

  // Check format (alphanumeric and underscores only)
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    errors.push('Username can only contain letters, numbers, and underscores');
  }

  // Check doesn't start with number
  if (username && /^[0-9]/.test(username)) {
    errors.push('Username cannot start with a number');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
