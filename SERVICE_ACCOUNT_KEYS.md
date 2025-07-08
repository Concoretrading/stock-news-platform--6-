# Service Account Keys Organization

## 📁 **Current Keys:**

### 1. **Local Development Key** (Currently Active)
- **File**: `concorenews-firebase-adminsdk.json`
- **Purpose**: Local development and testing
- **Key ID**: `7594e72bc1847ac1b66fe3bc73374a7b668284ac`
- **Status**: ✅ Working and tested

### 2. **Earnings/Production Key** (Backup/Future Use)
- **File**: `concorenews-firebase-earnings-adminsdk.json`
- **Purpose**: Production deployment (Vercel) or dedicated earnings feature
- **Key ID**: `1d01ca581647ba3e63d503bdcad47c87cde5fdaf`
- **Status**: ✅ Ready for use

## 🎯 **Usage Options:**

### **Option A: Keep Current Setup**
- Use Key #1 for everything (local + production)
- Simple and working

### **Option B: Separate by Environment**
- Key #1: Local development
- Key #2: Vercel production deployment

### **Option C: Separate by Feature**
- Key #1: General Firebase operations
- Key #2: Dedicated for earnings/Vision API features

## 🔧 **Environment Configuration:**

### **Local Development:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=./concorenews-firebase-adminsdk.json
```

### **Vercel Production:**
```bash
GOOGLE_APPLICATION_CREDENTIALS=<base64-encoded-key-content>
```

## 🔒 **Security Notes:**

- Both keys access the same service account
- Both keys have identical permissions
- You can revoke individual keys if needed
- Both keys are in `.gitignore` (not committed to repo)

## 🚀 **Current Status:**

✅ **Working**: Key #1 is active and Google Vision API tested successfully
✅ **Ready**: Key #2 is saved and ready for future use
✅ **Organized**: Both keys clearly separated and documented 