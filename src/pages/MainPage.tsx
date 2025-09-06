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
  
  // New states for enhanced functionality
  const [sendMode, setSendMode] = useState<'instant' | 'background'>('instant');
  const [selectedServerId, setSelectedServerId] = useState<string>('');
  const [priority, setPriority] = useState<number>(1);
  const [userServers, setUserServers] = useState<any[]>([]);
  const [activeJobs, setActiveJobs] = useState<any[]>([]);
  const [showJobMonitor, setShowJobMonitor] = useState(false);

  // Helper function to format uptime
  const formatUptime = (uptimeInSeconds: number): string => {
    const minutes = Math.floor(uptimeInSeconds / 60);
    
    if (minutes < 60) {
      return `${minutes}min`;
    } else if (minutes < 1440) { // Less than 24 hours (1440 minutes)
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
    } else { // 24+ hours
      const days = Math.floor(minutes / 1440);
      const remainingHours = Math.floor((minutes % 1440) / 60);
      const remainingMinutes = minutes % 60;
      
      let result = `${days}d`;
      if (remainingHours > 0) result += ` ${remainingHours}h`;
      if (remainingMinutes > 0 && days < 7) result += ` ${remainingMinutes}min`; // Show minutes only for less than a week
      
      return result;
    }
  };

  // Helper function to update local email count
  const updateLocalEmailCount = (additionalCount: number) => {
    if (headerServerInfo && headerServerInfo !== 'Unavailable|No IP|Unknown|0|0') {
      const parts = headerServerInfo.split('|');
      if (parts.length >= 5) {
        const currentCount = parseInt(parts[4]) || 0;
        const newCount = currentCount + additionalCount;
        parts[4] = newCount.toString();
        setHeaderServerInfo(parts.join('|'));
      }
    }
  };

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
        const uptime = formatUptime(result.data.uptime || 0); // Use formatted uptime
        const emailCount = result.data.newServerEmailCount || 0; // Get email sent count
        
        setHeaderServerInfo(`${serverName}|${serverIP}|${platform}|${uptime}|${emailCount}`);
      } else {
        setHeaderServerInfo('Unavailable|No IP|Unknown|0min|0');
      }
    } catch {
      setHeaderServerInfo('Unavailable|No IP|Unknown|0min|0');
    }
  };

  // Load server info on component mount
  useEffect(() => {
    loadHeaderServerInfo();
    loadUserServers();
    loadActiveJobs();
  }, []);

  // Load user's configured servers
  const loadUserServers = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/user/servers`, {
        headers: {
          'Authorization': `Bearer ${AuthService.getToken()}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setUserServers(result.data.servers || []);
          // Set default server if available
          if (result.data.defaultServerId && !selectedServerId) {
            setSelectedServerId(result.data.defaultServerId);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load user servers:', error);
    }
  };

  // Load active email jobs
  const loadActiveJobs = async () => {
    try {
      const result = await EmailService.getEmailJobs('processing', 10);
      if (result.success && result.data) {
        setActiveJobs(result.data);
      }
    } catch (error) {
      console.error('Failed to load active jobs:', error);
    }
  };

  // Refresh jobs periodically when monitoring
  useEffect(() => {
    if (showJobMonitor) {
      const interval = setInterval(loadActiveJobs, 5000); // Refresh every 5 seconds
      return () => clearInterval(interval);
    }
  }, [showJobMonitor]);

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

      // Prepare email data
      const emailData = {
        senderEmail: senderEmail.trim(),
        senderName: senderName.trim(),
        appPassword: senderPassword.trim(),
        recipients: validRecipients,
        subject: subject.trim(),
        template: template.trim(),
        serverId: selectedServerId || undefined, // Include server selection
        priority: sendMode === 'background' ? priority : undefined
      };

      let result;

      if (sendMode === 'background') {
        // Use background email sending
        result = await EmailService.sendEmailsBackground(emailData);
        
        if (result.success) {
          const successMessage = `✅ Background job created successfully! Job ID: ${result.data?.jobId}`;
          setLastResult(successMessage);
          
          // Show browser alert for immediate notification
          alert(`Background Email Job Created!\n\nJob ID: ${result.data?.jobId}\nTotal Emails: ${validRecipients.length}\nEstimated Completion: ${result.data?.estimatedCompletionTime || 'Unknown'}\n\nYou can monitor progress in the Job Monitor.`);
          
          // Refresh active jobs
          loadActiveJobs();
        } else {
          setLastResult(`❌ ${result.message}`);
        }
      } else {
        // Use instant email sending
        result = await EmailService.sendEmails(emailData);

        if (result.success) {
          const successMessage = `✅ ${result.message}`;
          setLastResult(successMessage);
          
          // Update local email count based on number of recipients
          updateLocalEmailCount(validRecipients.length);
          
          // Show browser alert for immediate notification
          alert(`Success! ${result.message}`);
          // Scroll to top to show the success message
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          setLastResult(`❌ ${result.message}`);
        }
      }

    } catch (error) {
      console.error('Send email error:', error);
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
              {headerServerInfo && headerServerInfo !== 'Unavailable|No IP|Unknown|0min|0' && (
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
                      ⏱️ {headerServerInfo.split('|')[3]} uptime
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

            {/* Compact Send Options in Header */}
            <div className="header-send-options">
              <div className="send-mode-compact">
                <label className="compact-radio">
                  <input
                    type="radio"
                    value="instant"
                    checked={sendMode === 'instant'}
                    onChange={(e) => setSendMode(e.target.value as 'instant' | 'background')}
                  />
                  <span>⚡ Instant</span>
                </label>
                <label className="compact-radio">
                  <input
                    type="radio"
                    value="background"
                    checked={sendMode === 'background'}
                    onChange={(e) => setSendMode(e.target.value as 'instant' | 'background')}
                  />
                  <span>🔄 Background</span>
                </label>
              </div>
              
              {userServers.length > 0 && (
                <div className="server-select-compact">
                  <select
                    value={selectedServerId}
                    onChange={(e) => setSelectedServerId(e.target.value)}
                    title="Select server or leave auto for load balancing"
                  >
                    <option value="">🎯 Auto-Select Server</option>
                    {userServers.map((server) => (
                      <option key={server.serverId} value={server.serverId}>
                        {server.isActive ? '🟢' : '🔴'} {server.serverName} 
                        {server.isBusy ? ' (Busy)' : ''} ({server.emailCount || 0})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {sendMode === 'background' && (
                <div className="priority-select-compact">
                  <select
                    value={priority}
                    onChange={(e) => setPriority(Number(e.target.value))}
                    title="Job priority for background processing"
                  >
                    <option value={1}>🔥 High Priority</option>
                    <option value={2}>⚡ Normal Priority</option>
                    <option value={3}>🐌 Low Priority</option>
                  </select>
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
            {/* Compact Job Monitor Toggle */}
            {activeJobs.length > 0 && (
              <button
                type="button"
                onClick={() => setShowJobMonitor(!showJobMonitor)}
                className="compact-job-monitor"
                title={`${activeJobs.length} active background jobs`}
              >
                🔄 Jobs ({activeJobs.length})
              </button>
            )}

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

      {/* Compact Job Monitor Panel */}
      {showJobMonitor && activeJobs.length > 0 && (
        <div className="compact-job-monitor-panel">
          <div className="job-monitor-content">
            <h3>Active Background Jobs</h3>
            <div className="jobs-grid">
              {activeJobs.map((job) => (
                <div key={job.jobId} className="compact-job-item">
                  <div className="job-info">
                    <span className="job-id">#{job.jobId.slice(-6)}</span>
                    <span className={`job-status ${job.status}`}>{job.status}</span>
                  </div>
                  <div className="job-progress-compact">
                    <div className="progress-bar-mini">
                      <div 
                        className="progress-fill-mini"
                        style={{ width: `${job.progress || 0}%` }}
                      ></div>
                    </div>
                    <span className="progress-text-mini">
                      {job.sentEmails}/{job.totalEmails} ({Math.round(job.progress || 0)}%)
                    </span>
                  </div>
                  <div className="job-actions-compact">
                    {job.status === 'processing' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await EmailService.pauseJob(job.jobId);
                          if (result.success) loadActiveJobs();
                        }}
                        className="job-action-mini pause"
                        title="Pause job"
                      >
                        ⏸️
                      </button>
                    )}
                    {job.status === 'paused' && (
                      <button
                        type="button"
                        onClick={async () => {
                          const result = await EmailService.resumeJob(job.jobId);
                          if (result.success) loadActiveJobs();
                        }}
                        className="job-action-mini resume"
                        title="Resume job"
                      >
                        ▶️
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

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
                      type="text"
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
                {isLoading 
                  ? (sendMode === 'background' ? 'Creating Job...' : 'Sending...') 
                  : (sendMode === 'background' ? 'Create Background Job' : 'Send Emails Instantly')
                }
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default MainPage;
