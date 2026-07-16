export function validateEmail(email: string): string {
  if (!email) return 'Email is required';
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) return 'Enter a valid email';
  return '';
}

export function validatePassword(password: string): string {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  return '';
}

export function validateConfirmPassword(password: string, confirmPassword: string): string {
  if (!confirmPassword) return 'Please confirm your password';
  if (password !== confirmPassword) return 'Passwords do not match';
  return '';
}

export function validateName(name: string): string {
  if (!name.trim()) return 'Name is required';
  return '';
}