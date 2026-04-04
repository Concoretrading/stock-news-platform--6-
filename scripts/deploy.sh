#!/bin/bash

# ConcoreNews Deployment Script
# This script automates the deployment process for both the web app and cloud function

set -e

echo "🚀 Starting ConcoreNews deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    print_status "Checking dependencies..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18+"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    if ! command -v git &> /dev/null; then
        print_error "git is not installed"
        exit 1
    fi
    
    print_status "All dependencies are installed ✓"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
    print_status "Dependencies installed ✓"
}

# Build the application
build_app() {
    print_status "Building the application..."
    npm run build
    print_status "Application built successfully ✓"
}

# Deploy Google Cloud Function
deploy_cloud_function() {
    print_status "Deploying Google Cloud Function..."
    
    if [ ! -d "google-cloud-function" ]; then
        print_error "Google Cloud Function directory not found"
        exit 1
    fi
    
    cd google-cloud-function
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_warning "gcloud CLI not found. Please install Google Cloud SDK"
        print_warning "Skipping cloud function deployment"
        cd ..
        return
    fi
    
    # Install function dependencies
    npm install
    
    # Deploy the function
    gcloud functions deploy ocr-processor \
        --runtime nodejs18 \
        --trigger-http \
        --allow-unauthenticated \
        --region us-central1 \
        --memory 512MB \
        --timeout 60s
    
    cd ..
    print_status "Cloud Function deployed successfully ✓"
}

# Check environment variables
check_env_vars() {
    print_status "Checking environment variables..."
    
    required_vars=(
        "NEXT_PUBLIC_SUPABASE_URL"
        "NEXT_PUBLIC_SUPABASE_ANON_KEY"
        "SUPABASE_SERVICE_ROLE_KEY"
        "GOOGLE_CLOUD_FUNCTION_URL"
    )
    
    missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -ne 0 ]; then
        print_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        print_error "Please set these variables in your .env.local file"
        exit 1
    fi
    
    print_status "All environment variables are set ✓"
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Run linting
    npm run lint
    
    # Run type checking
    npx tsc --noEmit
    
    print_status "Tests passed ✓"
}

# Main deployment function
main() {
    print_status "Starting deployment process..."
    
    check_dependencies
    check_env_vars
    install_dependencies
    run_tests
    build_app
    deploy_cloud_function
    
    print_status "🎉 Deployment completed successfully!"
    print_status "Your app is ready to be deployed to Vercel"
    print_status "Run 'vercel --prod' to deploy to production"
}

# Run main function
main "$@" 