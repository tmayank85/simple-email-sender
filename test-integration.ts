// Test script for Email Service API integration
import { EmailService } from './src/services/EmailService';

async function testEmailServiceIntegration() {
  console.log('Testing Email Service API Integration...\n');

  // Test 1: Health Check
  console.log('1. Testing Health Check...');
  try {
    const healthResult = await EmailService.checkHealth();
    console.log('Health Check Result:', healthResult);
  } catch (error) {
    console.error('Health Check Error:', error);
  }

  // Test 1.5: Server Info
  console.log('\n1.5. Testing Server Info...');
  try {
    const serverInfoResult = await EmailService.getServerInfo();
    console.log('Server Info Result:', serverInfoResult);
  } catch (error) {
    console.error('Server Info Error:', error);
  }

  // Test 2: Send Email (with mock data - won't actually send)
  console.log('\n2. Testing Send Email API...');
  const testEmailData = {
    senderEmail: 'test@gmail.com',
    appPassword: 'testpassword123',
    recipients: ['recipient@example.com'],
    subject: 'Test Email',
    template: '<h1>Test Email</h1><p>This is a test email from the integration.</p>'
  };

  try {
    const sendResult = await EmailService.sendEmails(testEmailData);
    console.log('Send Email Result:', sendResult);
  } catch (error) {
    console.error('Send Email Error:', error);
  }

  // Test 3: Validation Tests
  console.log('\n3. Testing Validation...');
  const invalidEmailData = {
    senderEmail: '',
    appPassword: '',
    recipients: [],
    subject: '',
    template: ''
  };

  try {
    const validationResult = await EmailService.sendEmails(invalidEmailData);
    console.log('Validation Result:', validationResult);
  } catch (error) {
    console.error('Validation Error:', error);
  }

  console.log('\n✅ Integration test completed!');
  console.log('📝 Note: This test uses the integrated EmailService which will:');
  console.log('   - Try to connect to the backend API at https://email-sender-orca.onrender.com');
  console.log('   - Fall back to mock responses if the backend is not available');
}

export { testEmailServiceIntegration };
