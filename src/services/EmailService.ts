interface EmailData {
  senderEmail: string;
  senderName: string;
  appPassword: string;
  recipients: string[];
  subject: string;
  template: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
  data?: {
    messageId: string;
    recipientCount: number;
    timestamp: string;
  };
  sentCount?: number;
  failedEmails?: string[];
}

interface ServerInfo {
  hostname: string;
  platform: string;
  architecture: string;
  port: number;
  networkInterfaces: Array<{
    interface: string;
    address: string;
    netmask: string;
  }>;
  primaryIP: string;
  urls: {
    local: string;
    network: string;
  };
  uptime: number;
  timestamp: string;
}

interface ServerInfoResponse {
  success: boolean;
  message: string;
  data?: ServerInfo;
}

export class EmailService {
  private static readonly API_BASE_URL = 'https://email-sender-orca.onrender.com'; // Backend API URL

  static async sendEmails(emailData: EmailData): Promise<EmailResponse> {
    try {
      // Validate email data
      const validation = this.validateEmailData(emailData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message || 'Invalid email data'
        };
      }

      // Filter out empty and invalid emails
      const validRecipients = emailData.recipients
        .filter(email => email.trim() !== '')
        .filter(email => this.isValidEmail(email.trim()));

      if (validRecipients.length === 0) {
        return {
          success: false,
          message: 'No valid recipient emails found'
        };
      }

      if (validRecipients.length > 25) {
        return {
          success: false,
          message: 'Maximum 25 recipients allowed'
        };
      }

      // Send email using the backend API
      const response = await this.sendEmailRequest({
        ...emailData,
        recipients: validRecipients,
        template: this.convertLineBreaksToHtml(emailData.template) // Convert line breaks to HTML
      });

      return response;
    } catch (error) {
      console.error('Error sending emails:', error);
      return {
        success: false,
        message: 'Failed to send emails. Please check your connection and try again.'
      };
    }
  }

  static async checkHealth(): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/health`);
      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Health check failed:', error);
      return {
        success: false,
        message: 'Failed to connect to email service'
      };
    }
  }

  static async getServerInfo(): Promise<ServerInfoResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/server-info`);
      
      if (!response.ok) {
        return {
          success: false,
          message: `Failed to fetch server info: ${response.status} ${response.statusText}`
        };
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Server info fetch failed:', error);
      return {
        success: false,
        message: 'Failed to retrieve server information'
      };
    }
  }

  private static async sendEmailRequest(emailData: EmailData): Promise<EmailResponse> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return {
          success: false,
          message: errorData.message || 'Failed to send emails'
        };
      }

      const result = await response.json();
      
      // Transform the response to match our interface
      return {
        success: result.success,
        message: result.message,
        data: result.data,
        sentCount: result.data?.recipientCount
      };

    } catch (error) {
      console.error('API call error:', error);
      
      // Fallback to mock if backend is not available
      console.warn('Backend not available, using mock response...');
      return this.mockEmailSending(emailData);
    }
  }

  private static async mockEmailSending(emailData: EmailData): Promise<EmailResponse> {
    // Mock implementation for development/testing
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate network delay
    
    // Mock validation of Gmail credentials format
    if (!emailData.senderEmail.includes('@gmail.com') && !emailData.senderEmail.includes('@googlemail.com')) {
      return {
        success: false,
        message: 'Please use a valid Gmail address'
      };
    }

    // Mock app password validation (should be 16 characters without spaces)
    if (emailData.appPassword.length < 8) {
      return {
        success: false,
        message: 'Gmail App Password should be at least 8 characters long'
      };
    }

    // Mock successful response
    return {
      success: true,
      message: `✨ DEMO MODE: Would send emails from "${emailData.senderName}" <${emailData.senderEmail}> to ${emailData.recipients.length} recipients (Backend not connected)`,
      sentCount: emailData.recipients.length,
      data: {
        messageId: `mock-${Date.now()}`,
        recipientCount: emailData.recipients.length,
        timestamp: new Date().toISOString()
      }
    };
  }

  private static convertLineBreaksToHtml(text: string): string {
    if (!text) return text;
    
    // Convert different types of line breaks to HTML <br> tags
    return text
      .replace(/\r\n/g, '<br>') // Windows line endings
      .replace(/\n/g, '<br>')   // Unix/Mac line endings
      .replace(/\r/g, '<br>');  // Old Mac line endings
  }

  private static validateEmailData(emailData: EmailData): { isValid: boolean; message?: string } {
    if (!emailData.senderEmail || !emailData.senderName || !emailData.appPassword) {
      return { isValid: false, message: 'Sender email, sender name, and app password are required' };
    }

    if (!emailData.subject || !emailData.template) {
      return { isValid: false, message: 'Subject and email template are required' };
    }

    if (!this.isValidEmail(emailData.senderEmail)) {
      return { isValid: false, message: 'Please enter a valid sender email address' };
    }

    return { isValid: true };
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  }

  static getEmailServiceInfo(): string {
    return `Using Email Service API at ${this.API_BASE_URL} with Gmail SMTP backend`;
  }

  static getServerInfoEndpoint(): string {
    return `${this.API_BASE_URL}/api/server-info`;
  }

  static getAppPasswordInstructions(): string {
    return `To use Gmail SMTP:
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security > App Passwords
3. Generate an App Password for "Mail"
4. Use the generated 16-character password (not your regular Gmail password)`;
  }
}
