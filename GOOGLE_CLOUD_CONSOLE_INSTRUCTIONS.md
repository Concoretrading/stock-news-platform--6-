# Get Service Account Key from Google Cloud Console

## Method 1: Google Cloud Console (Since you have access)

1. **Go to Google Cloud Console**:
   - https://console.cloud.google.com/iam-admin/serviceaccounts?project=concorenews

2. **Find the Firebase Admin SDK service account**:
   - Look for an account like: `firebase-adminsdk-xxxxx@concorenews.iam.gserviceaccount.com`
   - Or create a new one if none exists

3. **Create a new key**:
   - Click on the service account email
   - Go to "Keys" tab
   - Click "Add Key" → "Create new key"
   - Choose "JSON" format
   - Click "Create"

4. **Download and rename**:
   - Save the downloaded file as `concorenews-firebase-adminsdk.json`
   - Place it in your project root directory

## Method 2: Firebase Console (Alternative)

1. **Go to Firebase Console**:
   - https://console.firebase.google.com/project/concorenews/settings/serviceaccounts/adminsdk

2. **Generate new private key**:
   - Click "Generate new private key"
   - Confirm the popup
   - Save as `concorenews-firebase-adminsdk.json`

## What the key file should look like:

```json
{
  "type": "service_account",
  "project_id": "concorenews",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...",
  "client_email": "firebase-adminsdk-xxxxx@concorenews.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

## Test after download:

```bash
node test-vision-setup.js
``` 