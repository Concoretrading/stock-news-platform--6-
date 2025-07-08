# Google Vision API Setup Guide

## Option 1: Use Firebase Service Account (Recommended)

1. **Download Service Account Key:**
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Select your "concorenews" project
   - Go to Project Settings → Service Accounts
   - Click "Generate new private key"
   - Save as `concorenews-firebase-adminsdk.json` in your project root

2. **Environment Variable is Already Set:**
   ```
   GOOGLE_APPLICATION_CREDENTIALS=./concorenews-firebase-adminsdk.json
   ```

3. **Test the Admin Earnings Upload:**
   - Go to http://localhost:3004/calendar
   - Click "Admin" tab (if you're logged in as handrigannick@gmail.com)
   - Try uploading an earnings calendar screenshot

## Option 2: Deploy the Existing Cloud Function

You already have a Cloud Function ready! To deploy it:

```bash
cd google-cloud-function
npm install
gcloud functions deploy ocrProcessor --runtime nodejs18 --trigger http --allow-unauthenticated
```

## Option 3: Use Direct API Key (Alternative)

Instead of service account, add this to `.env.local`:
```
GOOGLE_CLOUD_VISION_API_KEY=your_api_key_here
```

## Current Status

✅ Next.js API route configured with error handling
✅ Environment variables set up
❌ Service account key file needed
❌ Cloud Function not deployed (optional)

## Test Commands

```bash
# Test current setup
curl http://localhost:3004/api/admin-earnings-upload

# Test after adding credentials
# Upload a screenshot via the Admin panel
``` 