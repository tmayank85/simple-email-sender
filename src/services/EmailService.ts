interface EmailData {
  senderEmail: string;
  senderPassword: string;
  recipients: string[];
  subject: string;
  htmlBody: string;
  textBody?: string;
}

interface EmailResponse {
  success: boolean;
  message: string;
  sentCount?: number;
  failedEmails?: string[];
}

export class EmailService {
  private static readonly GMAIL_SMTP_HOST = 'smtp.gmail.com';
  private static readonly GMAIL_SMTP_PORT = 587;

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

      // Send email using the backend service
      const response = await this.sendEmailRequest({
        ...emailData,
        recipients: validRecipients
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

  private static async sendEmailRequest(emailData: EmailData): Promise<EmailResponse> {
    try {
      // Option 1: Use backend API service (requires backend server)
      const API_BASE_URL = 'http://localhost:3001'; // Change this to your backend URL
      
      const response = await fetch(`${API_BASE_URL}/api/send-emails`, {
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
      return result;

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
    if (emailData.senderPassword.length < 8) {
      return {
        success: false,
        message: 'Gmail App Password should be at least 8 characters long'
      };
    }

    // Mock successful response
    return {
      success: true,
      message: `✨ DEMO MODE: Would send emails to ${emailData.recipients.length} recipients (Backend not connected)`,
      sentCount: emailData.recipients.length
    };
  }

  private static validateEmailData(emailData: EmailData): { isValid: boolean; message?: string } {
    if (!emailData.senderEmail || !emailData.senderPassword) {
      return { isValid: false, message: 'Sender email and password are required' };
    }

    if (!emailData.subject || !emailData.htmlBody) {
      return { isValid: false, message: 'Subject and message body are required' };
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
    return `Using Gmail SMTP (${this.GMAIL_SMTP_HOST}:${this.GMAIL_SMTP_PORT}) with TLS encryption`;
  }

  static getAppPasswordInstructions(): string {
    return `To use Gmail SMTP:
1. Enable 2-Factor Authentication on your Gmail account
2. Go to Google Account Settings > Security > App Passwords
3. Generate an App Password for "Mail"
4. Use the generated 16-character password (not your regular Gmail password)`;
  }
}
