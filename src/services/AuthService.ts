// Authentication service with hardcoded credentials
export interface User {
  email: string;
  password: string;
  name: string;
}

export class AuthService {
  // Hardcoded user credentials
  private static readonly HARDCODED_USER: User = {
    email: 'arvindk@gmail.com',
    password: 'Arvind@123K',
    name: 'Arvind Kumar'
  };

  private static readonly STORAGE_KEY = 'emailSender_auth';

  /**
   * Authenticate user with hardcoded credentials
   */
  static authenticate(email: string, password: string): boolean {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    return (
      trimmedEmail === this.HARDCODED_USER.email.toLowerCase() &&
      trimmedPassword === this.HARDCODED_USER.password
    );
  }

  /**
   * Save authentication state to localStorage
   */
  static saveAuthState(email: string): void {
    const authData = {
      email: email.trim(),
      name: this.HARDCODED_USER.name,
      loginTime: new Date().toISOString(),
      isAuthenticated: true
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    localStorage.setItem('isLoggedIn', 'true'); // Backward compatibility
  }

  /**
   * Get saved authentication state from localStorage
   */
  static getAuthState(): { email: string; name: string; loginTime: string } | null {
    try {
      const authData = localStorage.getItem(this.STORAGE_KEY);
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.isAuthenticated) {
          return {
            email: parsed.email,
            name: parsed.name,
            loginTime: parsed.loginTime
          };
        }
      }
      return null;
    } catch (error) {
      console.error('Error reading auth state:', error);
      return null;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    const authState = this.getAuthState();
    return authState !== null;
  }

  /**
   * Clear authentication state (logout)
   */
  static clearAuthState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem('isLoggedIn'); // Backward compatibility
  }

  /**
   * Get hardcoded user info (for display purposes)
   */
  static getHardcodedUserInfo(): { email: string; name: string } {
    return {
      email: this.HARDCODED_USER.email,
      name: this.HARDCODED_USER.name
    };
  }

  /**
   * Validate email format
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  /**
   * Get login session duration
   */
  static getSessionDuration(): string {
    const authState = this.getAuthState();
    if (!authState) return 'Not logged in';

    const loginTime = new Date(authState.loginTime);
    const now = new Date();
    const diffMs = now.getTime() - loginTime.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) {
      return `${diffHours}h ${diffMins % 60}m ago`;
    } else {
      return `${diffMins}m ago`;
    }
  }
}
