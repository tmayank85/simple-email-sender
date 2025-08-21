import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EmailService } from '../services/EmailService';
import './MainPage.css';

const MainPage: React.FC = () => {
  const { logout } = useAuth();
  const [senderEmail, setSenderEmail] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [subject, setSubject] = useState('');
  const [template, setTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);

  // Get current server details
  const serverInfo = {
    host: window.location.hostname || 'localhost',
    port: window.location.port || '5173',
    protocol: window.location.protocol || 'http:'
  };

  const handleLogout = () => {
    logout();
  };

  // Get recipient count from textarea
  const getRecipientCount = () => {
    if (!recipientsText.trim()) return 0;
    return recipientsText.split('\n').filter((email: string) => email.trim() !== '').length;
  };

  const handleSendEmails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setLastResult('');

    try {
      // Parse recipients from textarea
      const validRecipients = recipientsText.split('\n')
        .map((email: string) => email.trim())
        .filter((email: string) => email !== '');

      if (validRecipients.length === 0) {
        setLastResult('Please add at least one recipient email');
        return;
      }

      if (validRecipients.length > 25) {
        setLastResult('Maximum 25 recipients allowed');
        return;
      }

      // Send emails using EmailService
      const emailData = {
        senderEmail: senderEmail.trim(),
        senderPassword: senderPassword.trim(),
        recipients: validRecipients,
        subject: subject.trim(),
        htmlBody: template.replace(/\n/g, '<br>'), // Convert line breaks to HTML
        textBody: template.trim()
      };

      const result = await EmailService.sendEmails(emailData);

      if (result.success) {
        setLastResult(`✅ ${result.message}`);
        // Reset form on success
        setRecipientsText('');
        setSubject('');
        setTemplate('');
      } else {
        setLastResult(`❌ ${result.message}`);
      }

    } catch {
      setLastResult('❌ An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="main-container">
      <header className="main-header">
        <div className="header-content">
          <div className="header-left">
            <h1>Simple Email Sender</h1>
            <div className="server-info">
              <span className="server-label">Server:</span>
              <span className="server-details">
                {serverInfo.protocol}//{serverInfo.host}:{serverInfo.port}
              </span>
            </div>
          </div>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <main className="main-content">
        <div className="email-form-container">
          <form onSubmit={handleSendEmails} className="email-form">
            {/* Sender Details Section */}
            <div className="form-section">
              <h2>Sender Details</h2>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="senderEmail">Sender Email *</label>
                  <input
                    type="email"
                    id="senderEmail"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    placeholder="your-email@gmail.com"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="senderPassword">App Password *</label>
                  <input
                    type="password"
                    id="senderPassword"
                    value={senderPassword}
                    onChange={(e) => setSenderPassword(e.target.value)}
                    placeholder="Your email app password"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Recipients Section */}
            <div className="form-section">
              <div className="section-header">
                <h2>Recipients (Max 25)</h2>
                <div className="recipient-counter">
                  {getRecipientCount()}/25 recipients
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="recipients">
                  Recipient Emails (one per line) *
                </label>
                <textarea
                  id="recipients"
                  value={recipientsText}
                  onChange={(e) => setRecipientsText(e.target.value)}
                  placeholder="Enter recipient emails, one per line:&#10;example1@email.com&#10;example2@email.com&#10;example3@email.com"
                  rows={8}
                  className="recipients-textarea"
                  required
                />
                <div className="help-text">
                  💡 Tip: Copy and paste multiple email addresses, each on a new line
                </div>
              </div>
            </div>

            {/* Email Template Section */}
            <div className="form-section">
              <h2>Email Template</h2>
              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input
                  type="text"
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter email subject"
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="template">Email Body *</label>
                <textarea
                  id="template"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  placeholder="Enter your email template here..."
                  rows={8}
                  required
                />
              </div>
            </div>

            {/* Gmail Instructions */}
            <div className="form-section">
              <div className="help-section">
                <button
                  type="button"
                  onClick={() => setShowInstructions(!showInstructions)}
                  className="help-toggle-btn"
                >
                  {showInstructions ? '▼' : '▶'} Gmail Setup Instructions
                </button>
                {showInstructions && (
                  <div className="help-content">
                    <p><strong>How to get Gmail App Password:</strong></p>
                    <ol>
                      <li>Enable 2-Factor Authentication on your Gmail account</li>
                      <li>Go to Google Account Settings → Security → App Passwords</li>
                      <li>Generate an App Password for "Mail"</li>
                      <li>Use the generated 16-character password (not your regular Gmail password)</li>
                    </ol>
                    <p><strong>Email Service:</strong> {EmailService.getEmailServiceInfo()}</p>
                    <p><strong>Privacy:</strong> All recipients will be added to BCC to protect their privacy.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Result Display */}
            {lastResult && (
              <div className={`result-message ${lastResult.startsWith('✅') ? 'success' : 'error'}`}>
                {lastResult}
              </div>
            )}

            {/* Send Button */}
            <div className="form-actions">
              <button
                type="submit"
                className="send-button"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Emails'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
};

export default MainPage;
