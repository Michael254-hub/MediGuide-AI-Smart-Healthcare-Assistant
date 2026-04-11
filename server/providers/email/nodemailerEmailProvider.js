const nodemailer = require('nodemailer');

class NodemailerEmailProvider {
  constructor(smtpConfig) {
    this.transporter = nodemailer.createTransport(smtpConfig);
  }

  async sendVerificationCode({ to, code, expiresInMinutes }) {
    try {
      const mailOptions = {
        from: this.transporter.options.from || process.env.NODEMAILER_FROM_EMAIL,
        to,
        subject: 'Your MediGuide Verification Code',
        html: this.getEmailTemplate(code, expiresInMinutes),
        text: `Your verification code is: ${code}. This code expires in ${expiresInMinutes} minutes.`,
      };

      const info = await this.transporter.sendMail(mailOptions);

      return {
        provider: 'nodemailer',
        delivered: true,
        messageId: info.messageId,
        response: info.response,
      };
    } catch (error) {
      console.error('[NodemailerEmailProvider] Error sending email:', error.message);
      throw new Error(`Nodemailer failed to send email: ${error.message}`);
    }
  }

  getEmailTemplate(code, expiresInMinutes) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
              line-height: 1.6;
              color: #0f172a;
              background-color: #f8fafc;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              border-radius: 8px;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 32px 24px;
              text-align: center;
            }
            .header h1 {
              margin: 0;
              font-size: 28px;
              font-weight: 700;
            }
            .content {
              padding: 32px 24px;
            }
            .content p {
              margin: 0 0 16px 0;
            }
            .code-box {
              background-color: #f1f5f9;
              border: 2px solid #e2e8f0;
              border-radius: 6px;
              padding: 24px;
              text-align: center;
              margin: 24px 0;
            }
            .code-box .code {
              font-size: 36px;
              font-weight: 700;
              letter-spacing: 4px;
              color: #667eea;
              font-family: 'Courier New', monospace;
            }
            .footer {
              background-color: #f8fafc;
              border-top: 1px solid #e2e8f0;
              padding: 16px 24px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
            }
            .warning {
              color: #dc2626;
              font-weight: 600;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>MediGuide</h1>
              <p style="margin: 8px 0 0 0;">Account Verification</p>
            </div>

            <div class="content">
              <p>Hello,</p>
              
              <p>Thank you for signing up for MediGuide. To complete your registration and verify your email address, please use the verification code below:</p>

              <div class="code-box">
                <div class="code">${code}</div>
              </div>

              <p>This verification code:</p>
              <ul>
                <li>Expires in <strong>${expiresInMinutes} minutes</strong></li>
                <li>Can only be used once</li>
                <li>Is case-sensitive</li>
              </ul>

              <p>If you didn't create this account, please ignore this email.</p>

              <p>
                <span class="warning">⚠️ Security Notice:</span> Never share this code with anyone. MediGuide staff will never ask for your verification code.
              </p>
            </div>

            <div class="footer">
              <p>© 2026 MediGuide. All rights reserved.</p>
              <p>This is an automated message. Please do not reply to this email.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      console.log('[NodemailerEmailProvider] SMTP connection verified successfully');
      return true;
    } catch (error) {
      console.error('[NodemailerEmailProvider] SMTP connection failed:', error.message);
      return false;
    }
  }
}

module.exports = NodemailerEmailProvider;
