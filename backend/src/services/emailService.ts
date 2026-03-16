import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface LeadEmailData {
  name: string;
  email: string;
  message: string;
  type: 'contact' | 'project';
  projectType?: string;
  budget?: string;
  aiAnalysis?: {
    priority: string;
    summary: string;
    category: string;
  };
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || options.html.replace(/<[^>]*>/g, '')
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email sent successfully', { messageId: result.messageId, to: options.to });
      return true;
    } catch (error) {
      logger.error('Failed to send email', { error, to: options.to });
      return false;
    }
  }

  async sendLeadNotification(leadData: LeadEmailData): Promise<boolean> {
    const priorityColor = leadData.aiAnalysis?.priority === 'High' ? '#ff4d00' : 
                         leadData.aiAnalysis?.priority === 'Medium' ? '#ff8c00' : '#4CAF50';
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Lead Notification</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #0a0a0a; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333; }
          .header { background: linear-gradient(135deg, #ff4d00, #ff8c00); padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: white; }
          .content { padding: 30px; }
          .priority-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; text-transform: uppercase; margin-bottom: 20px; }
          .lead-info { background: #2a2a2a; padding: 20px; border-radius: 12px; margin: 20px 0; }
          .lead-info h3 { margin: 0 0 15px 0; color: #ff4d00; font-size: 18px; }
          .info-row { margin: 10px 0; }
          .label { font-weight: bold; color: #ccc; }
          .value { color: #fff; margin-left: 10px; }
          .ai-analysis { background: #ff4d00; background: linear-gradient(135deg, #ff4d00, #ff8c00); padding: 20px; border-radius: 12px; margin: 20px 0; }
          .ai-analysis h4 { margin: 0 0 10px 0; color: white; font-size: 16px; }
          .ai-analysis p { margin: 0; color: white; font-style: italic; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚀 New Lead Alert</h1>
          </div>
          <div class="content">
            ${leadData.aiAnalysis ? `
              <div class="priority-badge" style="background-color: ${priorityColor}; color: white;">
                ${leadData.aiAnalysis.priority} Priority
              </div>
            ` : ''}
            
            <div class="lead-info">
              <h3>${leadData.type === 'project' ? '💼 Project Inquiry' : '📧 Contact Request'}</h3>
              <div class="info-row">
                <span class="label">Name:</span>
                <span class="value">${leadData.name}</span>
              </div>
              <div class="info-row">
                <span class="label">Email:</span>
                <span class="value">${leadData.email}</span>
              </div>
              ${leadData.projectType ? `
                <div class="info-row">
                  <span class="label">Project Type:</span>
                  <span class="value">${leadData.projectType}</span>
                </div>
              ` : ''}
              ${leadData.budget ? `
                <div class="info-row">
                  <span class="label">Budget:</span>
                  <span class="value">${leadData.budget}</span>
                </div>
              ` : ''}
            </div>

            ${leadData.aiAnalysis ? `
              <div class="ai-analysis">
                <h4>🤖 AI Analysis</h4>
                <p>"${leadData.aiAnalysis.summary}"</p>
                <div style="margin-top: 10px; font-size: 12px; opacity: 0.9;">
                  Category: ${leadData.aiAnalysis.category}
                </div>
              </div>
            ` : ''}

            <div class="lead-info">
              <h3>💬 Message</h3>
              <p style="line-height: 1.6; margin: 0;">${leadData.message}</p>
            </div>
          </div>
          <div class="footer">
            Ian Smith Portfolio • Elite Engineering Solutions
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: 'leemeeya851@gmail.com',
      subject: `🚀 New ${leadData.type === 'project' ? 'Project' : 'Contact'} Lead: ${leadData.name}${leadData.aiAnalysis?.priority === 'High' ? ' [HIGH PRIORITY]' : ''}`,
      html
    });
  }

  async sendLeadConfirmation(leadData: LeadEmailData): Promise<boolean> {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Thank You - Ian Smith</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #0a0a0a; color: #ffffff; }
          .container { max-width: 600px; margin: 0 auto; background: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #333; }
          .header { background: linear-gradient(135deg, #ff4d00, #ff8c00); padding: 30px; text-align: center; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 900; color: white; }
          .content { padding: 30px; }
          .message-box { background: #2a2a2a; padding: 20px; border-radius: 12px; margin: 20px 0; }
          .cta-button { display: inline-block; background: #ff4d00; color: white; padding: 15px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Message Received</h1>
          </div>
          <div class="content">
            <p>Hi ${leadData.name},</p>
            
            <div class="message-box">
              <p>Thank you for reaching out! I've received your ${leadData.type === 'project' ? 'project inquiry' : 'message'} and I'm excited to learn more about your needs.</p>
              
              <p><strong>What happens next:</strong></p>
              <ul>
                <li>I'll review your requirements within 24 hours</li>
                <li>You'll receive a personalized response with next steps</li>
                <li>We can schedule a call to discuss your project in detail</li>
              </ul>
            </div>

            ${leadData.type === 'project' ? `
              <p>For project inquiries, I typically provide:</p>
              <ul>
                <li>🎯 Strategic technical consultation</li>
                <li>📋 Detailed project roadmap and timeline</li>
                <li>💰 Transparent pricing and milestone structure</li>
                <li>🚀 High-performance, scalable solutions</li>
              </ul>
            ` : ''}

            <div style="text-align: center;">
              <a href="tel:+256748550372" class="cta-button">📞 Call Me Directly</a>
            </div>

            <p>Best regards,<br>
            <strong>Ian Smith</strong><br>
            Full-Stack Engineer<br>
            📧 leemeeya851@gmail.com<br>
            📱 +256748550372</p>
          </div>
          <div class="footer">
            Ian Smith Portfolio • Engineering Digital Excellence
          </div>
        </div>
      </body>
      </html>
    `;

    return this.sendEmail({
      to: leadData.email,
      subject: `✅ Thanks for reaching out, ${leadData.name}! - Ian Smith`,
      html
    });
  }
}

export const emailService = new EmailService();