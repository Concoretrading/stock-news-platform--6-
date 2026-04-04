# Twitter OAuth Setup Guide

## 🐦 **Setting Up Twitter API for Split Screen Integration**

### **Step 1: Create Twitter Developer Account**

1. Go to [Twitter Developer Portal](https://developer.twitter.com/en/portal/dashboard)
2. Sign in with your Twitter account
3. Apply for a developer account (usually approved instantly for basic use)

### **Step 2: Create a New App**

1. In the Developer Portal, click **"+ Create App"**
2. Fill in app details:
   - **App Name**: `ConcoreNews Split Screen`
   - **Description**: `Stock news platform with Twitter integration`
   - **Website URL**: `https://your-domain.com` (or `http://localhost:3000` for development)

### **Step 3: Configure OAuth Settings**

1. Go to your app's **Settings** tab
2. Click **"Set up"** under **User authentication settings**
3. Configure OAuth 2.0:
   - **App permissions**: `Read`
   - **Type of App**: `Web App`
   - **Callback URLs**: 
     - Production: `https://your-domain.com/split-screen`
     - Development: `http://localhost:3000/split-screen`
   - **Website URL**: Same as above

### **Step 4: Get API Credentials**

1. Go to **"Keys and tokens"** tab
2. Copy these values:
   - **Client ID** (OAuth 2.0)
   - **Client Secret** (OAuth 2.0)

### **Step 5: Update Environment Variables**

Add these to your `.env.local` file:

```bash
# Twitter OAuth 2.0 Credentials
TWITTER_CLIENT_ID=your_client_id_here
TWITTER_CLIENT_SECRET=your_client_secret_here
```

### **Step 6: Test the Integration**

1. Restart your development server: `npm run dev`
2. Go to `/split-screen` page
3. Click **"Sign in with X"** button
4. You should be redirected to Twitter for authorization

## 🔒 **Security Notes**

- **Client Secret** should NEVER be exposed to the frontend
- All OAuth flows happen through secure backend APIs
- User tokens are stored locally in browser localStorage
- State parameter prevents CSRF attacks
- PKCE (Proof Key for Code Exchange) provides additional security

## 🚀 **Features Enabled**

Once connected, users can:
- ✅ Authenticate with their real Twitter account
- ✅ See their Twitter profile information
- ✅ Maintain session across browser refreshes
- ✅ Disconnect their account anytime

## 🔧 **Development vs Production**

### **Development:**
- Callback URL: `http://localhost:3000/split-screen`
- Test with your personal Twitter account

### **Production:**
- Callback URL: `https://yourdomain.com/split-screen`
- Update Twitter app settings with production URL

## 📝 **API Endpoints Created**

- **POST** `/api/twitter/auth` - Initiates OAuth flow
- **POST** `/api/twitter/callback` - Handles OAuth callback

## 🎯 **Next Steps**

After successful authentication, you can:
1. Store user's Twitter access token securely
2. Make Twitter API calls on their behalf
3. Integrate Twitter data with ConcoreNews features
4. Enable Twitter posting capabilities (requires write permissions)

## 💰 **Cost Information**

- **Twitter API v2**: Free tier includes 1,500 tweets per month
- **OAuth Authentication**: Free (no limits)
- **User Profile Access**: Free
- Perfect for authentication and basic integration needs! 