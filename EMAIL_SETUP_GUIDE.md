# 📧 Email Notifications Setup Guide

## 🚀 **Quick Setup Instructions**

Your portfolio now includes **automatic email notifications** when leads are created! Here's how to set it up:

### **Step 1: Choose Your Email Provider**

#### **Option A: Gmail (Recommended)**
1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
   - Copy the 16-character password

#### **Option B: Other SMTP Providers**
- **Outlook/Hotmail**: `smtp-mail.outlook.com:587`
- **Yahoo**: `smtp.mail.yahoo.com:587`
- **Custom SMTP**: Use your hosting provider's settings

### **Step 2: Configure Backend Environment**

Edit `backend/.env` and add your email settings:

```env
# Email Configuration (Required for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-character-app-password

# Email addresses
NOTIFICATION_EMAIL=your-email@gmail.com
```

### **Step 3: Restart Backend Server**

```bash
cd backend
npm run dev
```

## ✅ **Verification**

### **Backend Console**
- Should show: `✅ Email service initialized successfully`
- No warnings about missing SMTP settings

### **Test Email Functionality**
1. Submit a contact form or project inquiry
2. Check your email for:
   - **Lead notification** (to you)
   - **Confirmation email** (to the person who submitted)

## 📧 **What Emails Are Sent**

### **1. Lead Notification Email (To You)**
- 🚀 **Subject**: "New Project Lead: [Name]" or "New Contact Lead: [Name]"
- **Contains**: All lead details, AI analysis, priority
- **Purpose**: Immediate notification of new inquiries

### **2. Confirmation Email (To Lead)**
- 👋 **Subject**: "Thank you for reaching out, [Name]!"
- **Contains**: Professional thank you, next steps, your contact info
- **Purpose**: Professional auto-response, builds trust

## 🔧 **Email Configuration Options**

### **Gmail Setup (Most Common)**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
NOTIFICATION_EMAIL=your-email@gmail.com
```

### **Outlook/Hotmail Setup**
```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@outlook.com
SMTP_PASS=your-password
NOTIFICATION_EMAIL=your-email@outlook.com
```

### **Custom SMTP Setup**
```env
SMTP_HOST=mail.yourdomain.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your-password
NOTIFICATION_EMAIL=ian@yourdomain.com
```

## 🔍 **Troubleshooting**

### **"Email service not configured" Warning**
- Check that all SMTP settings are filled in
- Restart the backend server
- Verify no typos in environment variables

### **"Authentication failed" Error**
- **Gmail**: Make sure you're using App Password, not regular password
- **Other providers**: Verify username/password are correct
- Check if 2FA is required for your email provider

### **Emails Not Being Sent**
- Check backend console for error messages
- Verify SMTP settings with your email provider
- Test with a simple email client first

### **Emails Going to Spam**
- Add your domain to email whitelist
- Consider using a professional email service
- Set up SPF/DKIM records for your domain

## 🎯 **Email Features**

### **Professional Design**
- ✅ Beautiful HTML emails with your branding
- ✅ Mobile-responsive design
- ✅ Plain text fallback for all clients

### **Smart Content**
- ✅ AI analysis included in notifications
- ✅ Priority-based styling (High/Medium/Low)
- ✅ Project details automatically formatted
- ✅ Professional confirmation messages

### **Reliable Delivery**
- ✅ Async processing (doesn't slow down forms)
- ✅ Error handling (form works even if email fails)
- ✅ Comprehensive logging for debugging

## 🔒 **Security Best Practices**

### **Email Security**
- ✅ Use App Passwords instead of regular passwords
- ✅ Enable 2-Factor Authentication
- ✅ Store credentials in environment variables only
- ✅ Never commit email credentials to version control

### **Privacy Considerations**
- ✅ Only sends necessary information
- ✅ Professional confirmation messages
- ✅ No tracking pixels or analytics
- ✅ Respects user privacy

## 📊 **Expected Behavior**

### **When Someone Submits Contact Form**
1. ✅ Lead stored in database
2. ✅ AI analysis performed
3. ✅ **Email sent to you** with lead details
4. ✅ **Confirmation sent to them** with professional response
5. ✅ AdminPanel updated with new lead

### **When Someone Submits Project Inquiry**
1. ✅ Project lead stored in database
2. ✅ AI analysis performed (priority, category)
3. ✅ **Email sent to you** with project details and budget
4. ✅ **Confirmation sent to them** with next steps
5. ✅ AdminPanel shows new project lead

## 🎉 **Success Indicators**

✅ Backend starts with "Email service initialized successfully"  
✅ Contact form submissions trigger email notifications  
✅ Project inquiries send detailed email alerts  
✅ Users receive professional confirmation emails  
✅ All emails have beautiful HTML formatting  
✅ AdminPanel shows email status in logs  

## 🚀 **Next Steps**

1. **Configure your email settings** in `backend/.env`
2. **Restart the backend server**
3. **Test with a real submission**
4. **Check both your inbox and spam folder**
5. **Customize email templates** if needed (in `emailService.ts`)

Your portfolio now has **professional email notifications** that will alert you instantly when new leads come in, while providing a great experience for your potential clients!

## 📞 **Need Help?**

If you run into issues:
1. Check the backend console for error messages
2. Verify your email provider's SMTP settings
3. Test your credentials with a simple email client
4. Make sure your email provider allows SMTP access

The email system is designed to be robust - even if emails fail, your leads will still be saved and you can see them in the AdminPanel.