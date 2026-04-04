# 🚀 ConcoreNews Deployment Checklist

## 📋 Pre-Deployment Setup

### ✅ **Environment Variables**
- [ ] Copy `env.example` to `.env.local`
- [ ] Fill in Supabase credentials:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Add Google Cloud Function URL:
  - `GOOGLE_CLOUD_FUNCTION_URL`
- [ ] Set app configuration:
  - `NEXT_PUBLIC_BASE_URL`
  - `NEXT_PUBLIC_APP_NAME`

### ✅ **Supabase Setup**
- [ ] Create Supabase project
- [ ] Run database setup scripts:
  ```sql
  \i scripts/create-tables.sql
  \i scripts/create-alert-tables.sql
  \i scripts/manual-news-tables.sql
  \i scripts/twitter-integration-tables.sql
  \i scripts/complete-database-setup.sql
  ```
- [ ] Enable Row Level Security (RLS)
- [ ] Configure authentication providers (Google OAuth)
- [ ] Test database connections

### ✅ **Google Cloud Setup**
- [ ] Create Google Cloud project
- [ ] Enable Vision API
- [ ] Create service account and download JSON key
- [ ] Deploy Cloud Function:
  ```bash
  cd google-cloud-function
  npm install
  gcloud functions deploy ocr-processor \
    --runtime nodejs18 \
    --trigger-http \
    --allow-unauthenticated \
    --region us-central1
  ```

## 🌐 **Web App Deployment (Vercel)**

### ✅ **GitHub Setup**
- [ ] Initialize Git repository
- [ ] Push code to GitHub:
  ```bash
  git init
  git add .
  git commit -m "Initial commit"
  git remote add origin https://github.com/yourusername/concore-news.git
  git push -u origin main
  ```

### ✅ **Vercel Deployment**
- [ ] Connect GitHub repo to Vercel
- [ ] Add environment variables in Vercel dashboard
- [ ] Deploy to production
- [ ] Test all features:
  - [ ] User registration/login
  - [ ] Screenshot upload and analysis
  - [ ] News ingestion and storage
  - [ ] Stock ticker detection

### ✅ **Post-Deployment Testing**
- [ ] Test authentication flow
- [ ] Test screenshot analyzer with real images
- [ ] Verify OCR and ticker detection
- [ ] Check news storage in Supabase
- [ ] Test responsive design on mobile
- [ ] Verify dark/light theme switching

## 🖥️ **Desktop App Deployment (Electron)**

### ✅ **Local Testing**
- [ ] Install Electron dependencies:
  ```bash
  cd electron-app
  npm install
  ```
- [ ] Set web app URL:
  ```bash
  export CONCORE_WEB_URL="https://your-vercel-app.vercel.app"
  ```
- [ ] Test native features:
  - [ ] Screenshot capture (`Cmd/Ctrl + Shift + S`)
  - [ ] Clipboard paste (`Cmd/Ctrl + Shift + V`)
  - [ ] Drag and drop files
  - [ ] File picker dialog

### ✅ **Packaging**
- [ ] Build for development:
  ```bash
  npm run package
  ```
- [ ] Build installers:
  ```bash
  npm run make
  ```
- [ ] Test installers on target platforms
- [ ] Sign applications (optional, for distribution)

## 🔒 **Security Review**

### ✅ **Environment Variables**
- [ ] All sensitive keys are in environment variables
- [ ] No hardcoded credentials in code
- [ ] Production keys are different from development

### ✅ **API Security**
- [ ] Supabase RLS policies are configured
- [ ] Google Cloud Function has proper authentication
- [ ] CORS is properly configured
- [ ] Rate limiting is in place (if needed)

### ✅ **Data Protection**
- [ ] User data is properly isolated
- [ ] Images are processed securely
- [ ] No sensitive data in logs

## 📊 **Performance Optimization**

### ✅ **Web App**
- [ ] Images are optimized
- [ ] Code splitting is working
- [ ] API responses are cached appropriately
- [ ] Bundle size is reasonable

### ✅ **Desktop App**
- [ ] App startup time is acceptable
- [ ] Memory usage is reasonable
- [ ] Screenshot capture is fast
- [ ] File operations are efficient

## 🧪 **Final Testing**

### ✅ **End-to-End Testing**
- [ ] Complete user journey: signup → upload → analysis → results
- [ ] Error handling for all scenarios
- [ ] Edge cases (large files, network issues, etc.)
- [ ] Cross-browser compatibility (web app)

### ✅ **User Experience**
- [ ] Loading states are clear
- [ ] Error messages are helpful
- [ ] Success feedback is provided
- [ ] Navigation is intuitive

## 📈 **Monitoring & Analytics**

### ✅ **Error Tracking**
- [ ] Set up error monitoring (Sentry, etc.)
- [ ] Configure logging for production
- [ ] Set up alerts for critical errors

### ✅ **Performance Monitoring**
- [ ] Monitor API response times
- [ ] Track user engagement metrics
- [ ] Monitor resource usage

## 🚀 **Launch Checklist**

### ✅ **Pre-Launch**
- [ ] All tests pass
- [ ] Documentation is complete
- [ ] Support channels are ready
- [ ] Backup strategy is in place

### ✅ **Launch Day**
- [ ] Monitor deployment closely
- [ ] Watch for any errors
- [ ] Be ready to rollback if needed
- [ ] Announce to users

### ✅ **Post-Launch**
- [ ] Monitor user feedback
- [ ] Track performance metrics
- [ ] Plan for scaling if needed
- [ ] Schedule regular maintenance

---

## 🆘 **Troubleshooting**

### **Common Issues**

**Build Failures**
- Check environment variables are set
- Verify all dependencies are installed
- Check for TypeScript errors

**Deployment Issues**
- Verify Vercel environment variables
- Check Google Cloud Function is deployed
- Test Supabase connections

**Runtime Errors**
- Check browser console for errors
- Verify API endpoints are working
- Test authentication flow

**Desktop App Issues**
- Check Electron version compatibility
- Verify native permissions (screenshots)
- Test on target platforms

---

**🎉 You're ready to launch!**

Once you complete this checklist, you'll have a fully functional, production-ready stock news analysis platform with both web and desktop versions. 