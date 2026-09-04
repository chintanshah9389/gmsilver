export function nameError(value: string): string {
  if (!value.trim()) return 'Full name is required';
  if (value.trim().length < 2) return 'Name must be at least 2 characters';
  return '';
}

export function companyNameError(value: string): string {
  if (!value.trim()) return 'Company name is required';
  if (value.trim().length < 2) return 'Company name must be at least 2 characters';
  return '';
}

export function cityError(value: string): string {
  if (!value.trim()) return 'City / destination is required';
  if (value.trim().length < 2) return 'City / destination must be at least 2 characters';
  return '';
}

export function emailError(value: string): string {
  if (!value.trim()) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Enter a valid email address';
  return '';
}

export function phoneError(value: string): string {
  const digits = value.replace(/\D/g, '');
  if (!value.trim()) return 'Mobile number is required';
  if (digits.length < 10) return 'Mobile number must be at least 10 digits';
  return '';
}

export function identifierError(value: string): string {
  if (!value.trim()) return 'Email or mobile number is required';
  if (value.includes('@')) return emailError(value);
  return phoneError(value);
}

export function passwordError(value: string): string {
  if (!value) return 'Password is required';
  if (/\s/.test(value)) return 'Password cannot contain spaces';
  if (value.length < 6) return 'Password must be at least 6 characters';
  return '';
}

export function confirmPasswordError(value: string, password: string): string {
  if (!value) return 'Confirm your password';
  if (value !== password) return 'Passwords do not match';
  return '';
}

export function mpinError(value: string): string {
  if (!value) return 'MPIN is required';
  if (!/^\d{6}$/.test(value)) return 'MPIN must be exactly 6 digits';
  return '';
}

export function confirmMpinError(value: string, mpin: string): string {
  if (!value) return 'Confirm your MPIN';
  if (!/^\d{6}$/.test(value)) return 'MPIN must be exactly 6 digits';
  if (value !== mpin) return 'MPINs do not match';
  return '';
}

export function securityQuestionError(value: string): string {
  if (!value) return 'Select a security question';
  return '';
}

export function securityAnswerError(value: string): string {
  if (!value.trim()) return 'Security answer is required';
  if (value.trim().length < 2) return 'Answer must be at least 2 characters';
  return '';
}

export function mapApiErrorToSignupField(message: string): { field?: string; text: string } {
  const text = message.trim();
  const lower = text.toLowerCase();
  if (lower.includes('email already')) return { field: 'email', text: 'Email is already registered' };
  if (lower.includes('mobile number already') || lower.includes('phone already')) {
    return { field: 'phone', text: 'Mobile number is already registered' };
  }
  if (lower.includes('company')) return { field: 'companyName', text };
  if (lower.includes('city') || lower.includes('destination')) return { field: 'city', text };
  if (lower.includes('email')) return { field: 'email', text };
  if (lower.includes('mobile') || lower.includes('phone')) return { field: 'phone', text };
  if (lower.includes('mpin')) return { field: 'mpin', text };
  if (lower.includes('password')) return { field: 'password', text };
  if (lower.includes('security question')) return { field: 'securityQuestion', text };
  if (lower.includes('answer')) return { field: 'securityAnswer', text };
  return { text };
}
