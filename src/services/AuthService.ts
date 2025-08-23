// Authentication service using API endpoints
export interface User {
  id: string;
  userName: string;
  email: string;
  activeTill: string;
  isActive: boolean;
  orcaServerUrl: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data?: {
    token: string;
    user: User;
  };
  error?: string;
}

export class AuthService {
  private static readonly STORAGE_KEY = 'emailSender_auth';
  private static readonly TOKEN_KEY = 'emailSender_token';

  /**
   * Authenticate user via API
   */
  static async authenticate(email: string, password: string): Promise<LoginResponse> {
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      const data: LoginResponse = await response.json();

      if (data.success && data.data) {
        // Save authentication state
        this.saveAuthState(data.data.user, data.data.token);
        return data;
      } else {
        return {
          success: false,
          message: data.message || 'Login failed',
          error: data.error,
        };
      }
    } catch (error) {
      console.error('Authentication error:', error);
      return {
        success: false,
        message: 'Network error. Please check your connection and try again.',
        error: 'Network error',
      };
    }
  }

  /**
   * Save authentication state to localStorage
   */
  static saveAuthState(user: User, token: string): void {
    const authData = {
      email: user.email,
      name: user.userName,
      loginTime: new Date().toISOString(),
      isAuthenticated: true,
      user: user,
    };

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(authData));
    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem('isLoggedIn', 'true'); // Backward compatibility
  }

  /**
   * Get saved authentication state from localStorage
   */
  static getAuthState(): { email: string; name: string; loginTime: string; user?: User } | null {
    try {
      const authData = localStorage.getItem(this.STORAGE_KEY);
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.isAuthenticated) {
          return {
            email: parsed.email,
            name: parsed.name,
            loginTime: parsed.loginTime,
            user: parsed.user,
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
   * Get stored JWT token
   */
  static getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  /**
   * Check if user is currently authenticated
   */
  static isAuthenticated(): boolean {
    const authState = this.getAuthState();
    const token = this.getToken();
    return authState !== null && token !== null;
  }

  /**
   * Clear authentication state (logout)
   */
  static clearAuthState(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('isLoggedIn'); // Backward compatibility
  }

  /**
   * Get user profile information via API
   */
  static async getUserProfile(): Promise<{ success: boolean; data?: User; message?: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch('/api/user/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return { success: false, message: 'Network error' };
    }
  }

  /**
   * Update user profile via API
   */
  static async updateUserProfile(updates: Partial<User>): Promise<{ success: boolean; message: string }> {
    try {
      const token = this.getToken();
      if (!token) {
        return { success: false, message: 'No authentication token found' };
      }

      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, message: 'Network error' };
    }
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
