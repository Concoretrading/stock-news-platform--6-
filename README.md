# The Predator Intelligence System

A full-on autonomous trading intelligence engine designed for high-probability SPX trading, leveraging a 5-pillar intelligence model and local "Owned Power" architecture.

## 🦅 The Transition
Originally a stock news tracker, this project has evolved into a comprehensive **Live Predator** system. It now prioritizes local compute (PGlite + RTX 5070 Ti) to minimize cloud costs while maximizing decision-making speed and accuracy.

## 🧠 Core Intelligence Pillars
1. **Technical**: Advanced price action and trend analysis.
2. **Flow**: Real-time options premium and institutional flow interpretation.
3. **Sentiment**: News narrative arc and social sentiment analysis.
4. **Behavioral**: Market psychology and "Emotional Flow" detection.
5. **Macro**: Economic calendar and high-impact event correlation.

## Environment Setup

**IMPORTANT**: For screenshot functionality to work, you need to set up environment variables properly:

1. Copy `env.local` to `.env.local`:
   ```bash
   cp env.local .env.local
   ```

2. Ensure the Google Vision API credentials file exists:
   ```bash
   ls concorenews-firebase-adminsdk.json
   ```

3. The screenshot analyzer requires the `GOOGLE_APPLICATION_CREDENTIALS` environment variable to be set in `.env.local`

## 🚀 Features

- **Screenshot Analysis**: Upload screenshots of news articles for automatic OCR and stock ticker detection
- **Real-time Stock Tracking**: Monitor your watchlist with live price updates
- **News Management**: Automatically categorize and store news articles by stock ticker
- **Modern UI**: Beautiful, responsive interface built with Next.js 14 and shadcn/ui
- **Dark Mode**: Full theme support with system preference detection

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI Components**: shadcn/ui, Tailwind CSS
- **Database**: Firestore (Firebase)
- **Authentication**: Firebase Auth
- **OCR Processing**: Google Cloud Vision API
- **Cloud Functions**: Google Cloud Functions & Firebase Functions
- **Deployment**: Vercel (Frontend), Google Cloud (Backend)

## 📋 Prerequisites

Before you begin, ensure you have:

- Node.js 18+ installed
- A Firebase project (Firestore and Auth enabled)
- A Google Cloud account with Vision API enabled
- A Vercel account (for deployment)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd concore-news-platform
```

### 2. Install Dependencies

```bash
npm install
# or
pnpm install
```

### 3. Set Up Environment Variables

Copy the example environment file:

```bash
cp env.example .env.local
```

Fill in your environment variables:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id

# Google Cloud Vision API
GOOGLE_CLOUD_PROJECT_ID=your_google_cloud_project_id
GOOGLE_APPLICATION_CREDENTIALS=path_to_your_service_account_key.json

# App Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=ConcoreNews

# Google Cloud Function URL (for OCR processing)
GOOGLE_CLOUD_FUNCTION_URL=https://your-region-your-project.cloudfunctions.net/ocr-processor
```

### 4. Set Up Firebase

1. Create a new Firebase project
2. Enable Firestore and Authentication (Email/Password or Google OAuth)
3. Set up Firebase Storage if needed for image uploads
4. Deploy any Firebase Functions if used

### 5. Set Up Google Cloud

1. Create a new Google Cloud project
2. Enable the Vision API
3. Create a service account and download the JSON key
4. Deploy the Cloud Function (see below)

### 6. Deploy Google Cloud Function

Navigate to the cloud function directory:

```bash
cd google-cloud-function
npm install
```

Deploy the function:

```bash
gcloud functions deploy ocr-processor \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --region your-region
```

Update your environment variables with the function URL.

### 7. Run the Development Server

```bash
npm run dev
```

Open <http://localhost:3000> in your browser.

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:

* `NEXT_PUBLIC_FIREBASE_API_KEY`
* `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
* `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
* `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
* `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
* `NEXT_PUBLIC_FIREBASE_APP_ID`
* `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`
* `GOOGLE_CLOUD_FUNCTION_URL`
* `NEXT_PUBLIC_BASE_URL` (your Vercel domain)

## 📁 Project Structure

```
├── app/                    # Next.js 14 app directory
│   ├── api/               # API routes
│   └── stocks/            # Stock-related pages
├── components/            # React components
│   ├── ui/               # shadcn/ui components
├── lib/                  # Utility functions
├── google-cloud-function/ # OCR processing function
└── scripts/              # Database setup scripts
```

## 🔧 API Endpoints

### `/api/analyze-screenshot`

* **POST**: Upload and analyze screenshots
* **Body**: FormData with image file
* **Returns**: OCR results with detected tickers

### `/api/manual-news`

* **POST**: Create news entries (no authentication required)
* **GET**: Fetch news with optional filters

### `/api/stocks`

* **GET**: Fetch stock data

## 🔒 Security

* Firestore Security Rules enabled on all collections
* Environment variables for sensitive data
* CORS configured for API endpoints

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:

1. Check the Issues page
2. Review the environment variables setup
3. Ensure all dependencies are installed
4. Verify Firebase and Google Cloud configurations

## 🎯 Roadmap

* Real-time stock price updates
* Advanced sentiment analysis
* Portfolio tracking
* Mobile app (React Native)
* Desktop app (Electron)
* Social features and sharing
* Advanced analytics and charts

---

**Built with ❤️ using Next.js, Firebase, and Google Cloud** 