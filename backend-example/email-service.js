// Backend Email API Service (Node.js + Express)
// This would run on your server, not in the browser

const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// POST /api/send-emails
app.post('/api/send-emails', async (req, res) => {
  try {
    const { senderEmail, senderPassword, recipients, subject, htmlBody, textBody } = req.body;

    // Create Gmail SMTP transporter
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: senderEmail,
        pass: senderPassword // App Password from Gmail
      }
    });

    // Verify connection
    await transporter.verify();

    // Send email with all recipients in BCC for privacy
    const mailOptions = {
      from: senderEmail,
      to: senderEmail, // Send to self
      bcc: recipients.join(','), // All recipients in BCC for privacy
      subject: subject,
      text: textBody,
      html: htmlBody
    };

    const info = await transporter.sendMail(mailOptions);

    res.json({
      success: true,
      message: `Successfully sent emails to ${recipients.length} recipients`,
      sentCount: recipients.length,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Email sending error:', error);
    
    let errorMessage = 'Failed to send emails';
    if (error.code === 'EAUTH') {
      errorMessage = 'Invalid Gmail credentials or App Password';
    } else if (error.code === 'ESOCKET') {
      errorMessage = 'Network connection error';
    }

    res.status(500).json({
      success: false,
      message: errorMessage
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Email service running on port ${PORT}`);
});

module.exports = app;
