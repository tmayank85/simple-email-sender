import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { EmailService } from '../services/EmailService';
import { AuthService } from '../services/AuthService';
import './MainPage.css';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '';

const MainPage: React.FC = () => {
  const { logout, userInfo } = useAuth();
  const [senderEmail, setSenderEmail] = useState('');
  const [senderName, setSenderName] = useState('');
  const [senderPassword, setSenderPassword] = useState('');
  const [recipientsText, setRecipientsText] = useState('');
  const [subject, setSubject] = useState('');
  const [template, setTemplate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string>('');
  const [showInstructions, setShowInstructions] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('');
  const [headerServerInfo, setHeaderServerInfo] = useState<string>('');

  // Test comprehensive server availability
  const testServerAvailability = async () => {
    try {
      setConnectionStatus('Testing server availability...');
      
      const token = AuthService.getToken();
      if (!token) {
        setConnectionStatus('❌ Authentication required. Please login again.');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/health/comprehensive`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        const { mediator, user, orcaServer } = result;
        let status = '✅ All systems operational\n';
        status += `📡 Mediator: ${mediator.status} (DB: ${mediator.database})\n`;
        status += `👤 User: ${user.email} (${user.isActive ? 'Active' : 'Inactive'})\n`;
        status += `🖥️ Orca Server: ${orcaServer.status}`;
        
        if (orcaServer.url) {
          status += ` (${orcaServer.url})`;
        }
        
        setConnectionStatus(status);
      } else {
        const { mediator, orcaServer } = result;
        let status = '⚠️ System issues detected\n';
        status += `📡 Mediator: ${mediator?.status || 'unknown'}\n`;
        status += `🖥️ Orca Server: ${orcaServer?.status || 'unknown'}`;
        
        if (orcaServer?.error) {
          status += ` - ${orcaServer.error}`;
        }
        
        setConnectionStatus(status);
      }
    } catch (error) {
      console.error('Server availability test failed:', error);
      setConnectionStatus('❌ Failed to test server availability');
    }
  };

  // Get simplified server info for header
  const loadHeaderServerInfo = async () => {
    try {
      const result = await EmailService.getServerInfo();
      if (result.success && result.data) {
        const serverName = result.data.hostname || 'Unknown Server';
        const serverIP = result.data.primaryIp || 'No IP';
        const platform = result.data.platform || 'Unknown';
        const uptime = result.data.uptime ? Math.floor(result.data.uptime / 60) : 0; // Convert to minutes
        const emailCount = result.data.newServerEmailCount || 0; // Get email sent count
        
        setHeaderServerInfo(`${serverName}|${serverIP}|${platform}|${uptime}|${emailCount}`);
      } else {
        setHeaderServerInfo('Unavailable|No IP|Unknown|0|0');
      }
    } catch {
      setHeaderServerInfo('Unavailable|No IP|Unknown|0|0');
    }
  };

  // Load server info on component mount
  useEffect(() => {
    loadHeaderServerInfo();
  }, []);

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
        senderName: senderName.trim(),
        appPassword: senderPassword.trim(),
        recipients: validRecipients,
        subject: subject.trim(),
        template: template.trim() // Send as plain text, HTML processing happens on backend
      };

      const result = await EmailService.sendEmails(emailData);

      if (result.success) {
        const successMessage = `✅ ${result.message}`;
        setLastResult(successMessage);
        // Show browser alert for immediate notification
        alert(`Success! ${result.message}`);
        // Scroll to top to show the success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setLastResult(`❌ ${result.message}`);
      }

    } catch {
      setLastResult('❌ An unexpected error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetForm = () => {
    setSenderName('');
    setRecipientsText('');
    setSubject('');
    setTemplate('');
    setLastResult('');
  };

  return (
    <div className="main-container">
      <header className="main-header">
        <div className="header-content">
          <div className="header-left">
            <div className="title-section">
              <h1>Simple Email Sender</h1>
              {headerServerInfo && headerServerInfo !== 'Unavailable|No IP|Unknown|0' && (
                <div className="backend-server-info">
                  <span className="server-label">Backend Server:</span>
                  <div className="server-details-group">
                    <span 
                      className="server-detail-item"
                      title="Server Hostname"
                    >
                      🖥️ {headerServerInfo.split('|')[0]}
                    </span>
                    <span 
                      className="server-detail-item"
                      title="Server IP Address"
                    >
                      🌐 {headerServerInfo.split('|')[1]}
                    </span>
                    <span 
                      className="server-detail-item"
                      title={`Server Platform: ${headerServerInfo.split('|')[2]} | Full Backend Details`}
                    >
                      ⏱️ {headerServerInfo.split('|')[3]}min uptime
                    </span>
                    <span 
                      className="server-detail-item"
                      title="Total Emails Sent from Server"
                    >
                      📧 {headerServerInfo.split('|')[4]} sent
                    </span>
                  </div>
                </div>
              )}
            </div>
            <div className="api-status">
              <button 
                type="button" 
                onClick={testServerAvailability} 
                className="test-connection-btn"
                style={{ 
                  fontSize: '0.8rem', 
                  padding: '4px 8px', 
                  marginLeft: '10px',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Test Server Availability
              </button>
              {connectionStatus && (
                <div style={{ 
                  fontSize: '0.8rem', 
                  marginTop: '4px', 
                  color: connectionStatus.includes('✅') ? '#28a745' : '#dc3545',
                  whiteSpace: 'pre-line',
                  lineHeight: '1.3'
                }}>
                  {connectionStatus}
                </div>
              )}
            </div>
          </div>
          <div className="user-section">
            {userInfo && (
              <div className="user-info">
                <div className="user-details">
                  <span className="user-name">{userInfo.name}</span>
                  <span className="user-email">{userInfo.email}</span>
                  <span className="session-time" title={`Logged in: ${new Date(userInfo.loginTime).toLocaleString()}`}>
                    {AuthService.getSessionDuration()}
                  </span>
                </div>
              </div>
            )}
            <button onClick={handleLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="email-form-container">
          <form onSubmit={handleSendEmails} className="email-form" id="email-form">
            {/* Result Display - Moved to top for better visibility */}
            {lastResult && (
              <div className="result-section-top">
                <div className={`result-message ${lastResult.startsWith('✅') ? 'success' : 'error'}`}>
                  {lastResult}
                </div>
              </div>
            )}
            
            <div className="form-columns">
              {/* Left Column - Sender & Recipients */}
              <div className="left-column">
                {/* Sender Details Section */}
                <div className="form-section">
                  <h2>Sender Details</h2>
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
                    <label htmlFor="senderName">Sender Name *</label>
                    <input
                      type="text"
                      id="senderName"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      placeholder="Your Full Name"
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
                      placeholder="Your Gmail app password"
                      required
                    />
                  </div>
                </div>

                {/* Recipients Section */}
                <div className="form-section">
                  <div className="section-header">
                    <h2>Recipients</h2>
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
                      rows={12}
                      className="recipients-textarea"
                      required
                    />
                    <div className="help-text">
                      💡 Tip: Copy and paste multiple email addresses, each on a new line
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column - Subject & Template */}
              <div className="right-column">
                {/* Email Template Section */}
                <div className="form-section">
                  <h2>Email Content</h2>
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
                      placeholder="Enter your email template here...&#10;&#10;You can use HTML tags like:&#10;&lt;h1&gt;Header&lt;/h1&gt;&#10;&lt;p&gt;Paragraph&lt;/p&gt;&#10;&lt;a href=&quot;url&quot;&gt;Link&lt;/a&gt;"
                      rows={18}
                      required
                    />
                    <div className="help-text">
                      💡 Line breaks will be automatically converted to HTML &lt;br&gt; tags for proper email formatting
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Gmail Instructions */}
            <div className="form-section instructions-section">
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
                    <p><strong>Sender Name:</strong> The sender name will appear as the "From" display name in recipients' inboxes.</p>
                    <p><strong>Privacy:</strong> All recipients will be added to BCC to protect their privacy.</p>
                  </div>
                )}
              </div>
            </div>
          </form>

          {/* Fixed Action Buttons */}
          <div className="send-button-fixed">
            <div className="action-buttons">
              <button
                type="button"
                onClick={handleResetForm}
                className="reset-button"
                disabled={isLoading}
              >
                Reset Form
              </button>
              <button
                type="submit"
                form="email-form"
                className="send-button"
                disabled={isLoading}
              >
                {isLoading ? 'Sending...' : 'Send Emails'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainPage;
