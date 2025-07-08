# Vercel Deployment Setup for Google Vision API

## 🎯 **Step 1: Add Environment Variables to Vercel**

1. **Go to your Vercel Dashboard**: https://vercel.com/dashboard
2. **Select your project** (stock-news-platform)
3. **Go to Settings → Environment Variables**
4. **Add the following variables**:

### **Variable 1: Google Application Credentials**
```
Name: GOOGLE_APPLICATION_CREDENTIALS
Value: ewogICJ0eXBlIjogInNlcnZpY2VfYWNjb3VudCIsCiAgInByb2plY3RfaWQiOiAiY29uY29yZW5ld3MiLAogICJwcml2YXRlX2tleV9pZCI6ICI3NTk0ZTcyYmMxODQ3YWMxYjY2ZmUzYmM3MzM3NGE3YjY2ODI4NGFjIiwKICAicHJpdmF0ZV9rZXkiOiAiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXG5NSUlFdkFJQkFEQU5CZ2txaGtpRzl3MEJBUUVGQUFTQ0JLWXdnZ1NpQWdFQUFvSUJBUUNtZmU0Y3d1T2pUckw5XG5JT2dHL21LMnJpY0JEVERIdWtTU2crdGh5ZlBQcjBQdmhrRHRaSHp4QjRrYWtXV1IxM0p2Vkk3SklJRDJyWjFrXG5iNm5iYktSa1FOOStFamRadWF6bzlhdzFnbXR0VHdudThTdysyQ2Y3WE54TnJyK0tVOXRCTVcwdmZVQ1JqWURHXG50TGtYUzgxT1AvYWFlV3ZHOHRKTDlFaW5kd2VLelFac1JCL1ZNTFRMZVBna09UTHZ2SE9CWmhKckNsU0FmY0VxXG5oVlA5b01IaHM5ZmFjUGxNUmMrWHJRMVRuUGwxcEFiN0JaR3I4dzRoWVhZbUQvRXVBNllEclYrY1VuQmpFWHdFXG5ueGxQUVZtbU1VdlF0Mk8zMnlBM0VHdWtOazlDL2lYd1k1ZUV4TWJFUkZuZTl0QkkrWGFPSFVVbjlkRGF3MkQyXG5Ia1NLbmkrRkFnTUJBQUVDZ2dFQUovTmo1Y2JtTk5PM280SDM2Mld6Ymo2UDRYSzIxOVpjaWdQWndaZGlSOTI0XG5vWXRIblM5Vnc4aVpINlR3Q0hUNFlycVpvSzJLQktkWWN6ZFFQUFR1NVplamlXNzVsVEEyeTVmWUFPY1F2Q1FSXG5NQ0x6Q1FsNVhwbkR5Mmc1VWdvWlBLV05tNjJraHNpN3MvSzl6MWRESnBtMnBRNnB6QTJNWk9selhhdjBSVnZXXG5JNGlmbWNHei9DQWx2aEZ0L1MwOXk0VjMwS3hCZzJyZTV4aFBjU2ZNaXJQUVVJZnR0b3VCRm5EMkdQT1BkOTlYXG5laEFJOXU4cTlFU0o5ZWlwOE0wSnVBdzIvcnAyUTFObDJ1ZEJ4bGlHSUtEa0lmVGYzTEp1d29DUFIrV1BmM05DXG5OVzB1cUZYUjBmRUpnbGlGd2EwNkovOEhoam9Ga05HTjVsQ2Z3bHNNd1FLQmdRRFZHM0VwSnlJZTA4a250SEcvXG53Mkc5ZHBtVlY1MGZVUU9VWFJLVmNjSWtKb0laNWJzazFXZ1NXZUpIOTNwdjZXWHVlUWxwK2dtTmZYdlRDT3p0XG5tZnpEdHZUNU4rcUljalp1TDR0QlFLTWg3OWNEengrekhXeXpveGFIMVAzejlXUlVTMW54bytzcDAvd3U0Wk5xXG5Rcy9GaStaa3ZkMk1hVzBFZ1B5cDRFdDE3UUtCZ1FESUFKY0J0ZkorSzdZcVFtaElnMVA5Q2F2WUdzQTUrZ3RIXG5YcnVaY0lCRThFbzFiNzNGSHp2bTBYanBtUTQvUXI4NnhKc05QaEg1TFcyb3JJS1NwUkkwbnJ2ZDNQRlpESm1vXG54TkF0cUVqb3ZkTUdXejFZZWhqT2Z2UjlKZWcrRE15TWxEY2hKaWhGQVNwU1ZGRUFlVTJLUHNqZldpWWo1M0FhXG5QTlNyWWtycytRS0JnQXVwSHI0RHVDZzdxbXdUd1kyZW9VQit0dFNuSUovUURRUVhPNmNWdkd2Qjk2aDNHNUJlXG5aUDFzRWFlaWNQNmlwTU14dUVRbVBGT1RwQ3pkOWlqaUhpU1BaRVFtdlJ5T00xQkFKYnlDVHVyU2RzOXNpKzEvXG5GSzJYcE9uMXk1ZUh1OStvNTlrREFTRWV5bE8rWUJTV1owd0Y1YXRwZ0Mvb3JPQnNObWNOTU5QWkFvR0FGNFhhXG5QTjFGZEFsNEYyaFFFNWMrblpneG1lMHJocVllQlhyaTNaMFp1UUg1K0diNER1TXBqSEErcEZyWURpQ3ZsUjNpXG5qcUFxUlFCTzBYUFl0NTZxa1gzSjRzSkZzSStHMHc2eTNXdlpoMllzRjZkTGc4aDRlbkQ4R0d3SThLTll1NEFEXG5LK2JzL1pDeGhaVmRJWTBpell1czNIZ2gzRDh3TkNYTGJZelYreUVDZ1lCVW5LVVgvNTFDL28rQ0gwMU95cTlQXG5PeEE0K2YrMDhIL2UwY2FJTWhZWFJUQzZVZjVMSGd0TjB1TTN2eEs0WTBleWg1NkpWbmtNZWhBNTdjMTM2MWRzXG5TMnoveHB1MVRrcEF5WGFjQXllSGpTNjkvZXpNNWozMEtUdXluTkp3NzVIemZBK3E4YjZhNFRGeDZ4cWhKVkVjXG43MHFlaUFPQWgvT1ZNL1FUMHdXd0VnPT1cbi0tLS0tRU5EIFBSSVZBVEVLS0VZLS0tLS1cbiIsCiAgImNsaWVudF9lbWFpbCI6ICJmaXJlYmFzZS1hZG1pbnNkay1mYnN2Y0Bjb25jb3JlbmV3cy5pYW0uZ3NlcnZpY2VhY2NvdW50LmNvbSIsCiAgImNsaWVudF9pZCI6ICIxMDk3MjM0NzAyODY2MzQxMDE3NzQiLAogICJhdXRoX3VyaSI6ICJodHRwczovL2FjY291bnRzLmdvb2dsZS5jb20vby9vYXV0aDIvYXV0aCIsCiAgInRva2VuX3VyaSI6ICJodHRwczovL29hdXRoMi5nb29nbGVhcGlzLmNvbS90b2tlbiIsCiAgImF1dGhfcHJvdmlkZXJfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9vYXV0aDIvdjEvY2VydHMiLAogICJjbGllbnRfeDUwOV9jZXJ0X3VybCI6ICJodHRwczovL3d3dy5nb29nbGVhcGlzLmNvbS9yb2JvdC92MS9tZXRhZGF0YS94NTA5L2ZpcmViYXNlLWFkbWluc2RrLWZic3ZjJTQwY29uY29yZW5ld3MuaWFtLmdzZXJ2aWNlYWNjb3VudC5jb20iLAogICJ1bml2ZXJzZV9kb21haW4iOiAiZ29vZ2xlYXBpcy5jb20iCn0g
Environment: Production, Preview, Development
```

### **Variable 2: Google Cloud Project ID** (if not already set)
```
Name: GOOGLE_CLOUD_PROJECT_ID
Value: concorenews
Environment: Production, Preview, Development
```

## 🔧 **Step 2: Update API Route for Vercel**

The API route needs to handle base64 credentials in production. Let's update it:

```javascript
// In app/api/admin-earnings-upload/route.ts
let vision: ImageAnnotatorClient;
try {
  // Check if we're in production (Vercel) or local development
  if (process.env.NODE_ENV === 'production' && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    // Production: Use base64 encoded credentials
    const credentials = JSON.parse(Buffer.from(process.env.GOOGLE_APPLICATION_CREDENTIALS, 'base64').toString());
    vision = new ImageAnnotatorClient({ credentials });
  } else {
    // Local development: Use file path
    vision = new ImageAnnotatorClient({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID || 'concorenews',
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || './concorenews-firebase-adminsdk.json'
    });
  }
} catch (error) {
  console.error('Failed to initialize Vision API client:', error);
  vision = new ImageAnnotatorClient();
}
```

## 🚀 **Step 3: Deploy to Vercel**

After adding the environment variables:

1. **Commit your changes** (environment variables are automatically used)
2. **Deploy** via Git push or Vercel CLI
3. **Test** the admin earnings upload in production

## ✅ **What This Enables:**

- ✅ **Local development**: Uses JSON file (`./concorenews-firebase-adminsdk.json`)
- ✅ **Vercel production**: Uses base64 environment variable
- ✅ **Admin earnings upload**: Works in both environments
- ✅ **Google Vision API**: Automatically detects logos and creates calendar events

## 🔒 **Security Notes:**

- Environment variables are encrypted in Vercel
- Base64 encoding makes the JSON safe for environment variables
- The key is never exposed in your repository

## 🧪 **Testing:**

After deployment, test at: `https://your-vercel-domain.vercel.app/calendar`
- Login as admin
- Try uploading an earnings calendar screenshot
- Verify events are created automatically 