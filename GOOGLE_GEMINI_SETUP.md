# Google Gemini API Setup Guide

## 🚀 **Quick Setup Instructions**

### **Step 1: Get Your Google Gemini API Key**

1. **Visit Google AI Studio**: https://aistudio.google.com/
2. **Sign in** with your Google account
3. **Click "Get API Key"** in the left sidebar
4. **Create a new API key** (or use existing)
5. **Copy the API key** (starts with `AIzaSy...`)

### **Step 2: Configure Backend Environment**

Edit `backend/.env` and add your API key:

```env
# Google Gemini API (Required for AI features)
GOOGLE_GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
```

### **Step 3: Configure Frontend Environment**

Edit `.env.local` and add your API key:

```env
# Google Gemini API Key (Required for AI features)
VITE_GOOGLE_GEMINI_API_KEY=AIzaSyC-your-actual-api-key-here
```

### **Step 4: Restart Both Servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
npm run dev
```

## ✅ **Verification**

### **Backend AI Working**
- Backend console should show: `✅ Google Gemini AI service initialized`
- No more warning about missing API key

### **Frontend AI Working**
- Contact form submissions get AI analysis
- ProjectModal submissions get AI analysis
- AdminPanel shows AI insights for leads

### **Test AI Integration**
1. Submit a contact form or project inquiry
2. Check AdminPanel for the new lead
3. Look for "AI Insight" section with analysis

## 🔍 **Troubleshooting**

### **Still Getting API Key Warning?**
- Check that you saved the `.env` files correctly
- Restart both backend and frontend servers
- Verify API key starts with `AIzaSy`

### **AI Analysis Not Working?**
- Check browser console for errors
- Verify API key is valid in Google AI Studio
- Check network tab for API request failures

### **Different API Keys for Backend vs Frontend?**
- You can use the same API key for both
- Or create separate keys for better tracking
- Both should work identically

## 🎯 **What Gets AI Analysis**

### **Backend AI (Primary)**
- All leads submitted through the API
- Automatic priority assignment (High/Medium/Low)
- Category classification
- Executive summary generation

### **Frontend AI (Fallback)**
- Used when backend is unavailable
- Contact form submissions
- ProjectModal submissions (now fixed!)
- Same analysis quality as backend

## 🔒 **Security Notes**

- **Never commit API keys** to version control
- **Use environment variables** only
- **Regenerate keys** if accidentally exposed
- **Monitor usage** in Google AI Studio

## 📊 **Expected AI Analysis Format**

```json
{
  "priority": "High|Medium|Low",
  "summary": "One sentence executive summary",
  "category": "Web Development|Mobile App|Consulting|etc"
}
```

## 🎉 **Success Indicators**

✅ Backend starts without API key warnings  
✅ Contact form submissions show AI analysis in AdminPanel  
✅ ProjectModal submissions go through backend API  
✅ AdminPanel shows "AI Insight" sections  
✅ Lead priority is automatically assigned  
✅ Fallback works when backend is offline  

Your Google Gemini AI integration is now fully functional!