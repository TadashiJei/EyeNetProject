interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  country: string;
  phoneNumber: string;
}

export function validateRegistration(data: RegistrationData): string | null {
  const { firstName, lastName, email, password, country, phoneNumber } = data;

  // Check required fields
  if (!firstName || !lastName || !email || !password || !country || !phoneNumber) {
    return 'All fields are requi2red';
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Invalid email format';
  }

  // Validate password strength
  if (password.length < 8) {
    return 'Password must be at least 8 characters long';
  }
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  if (!(hasUpperCase && hasLowerCase && hasNumbers && hasSpecialChar)) {
    return 'Password must contain uppercase, lowercase, numbers, and special characters';
  }

  // Validate phone number (basic validation)
  const phoneRegex = /^\+?[\d\s-]{8,}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return 'Invalid phone number format';
  }

  return null;
}
