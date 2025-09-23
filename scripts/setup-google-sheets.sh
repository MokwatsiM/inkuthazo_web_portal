#!/bin/bash

# Google Sheets Integration Setup Script
# This script helps configure Firebase Functions for Google Sheets integration

set -e

echo "🚀 Setting up Google Sheets Integration for Attendance Tracking"
echo "============================================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI is not installed. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please login first:"
    echo "firebase login"
    exit 1
fi

echo "✅ Firebase CLI is ready"

# Get current project
PROJECT_ID=$(firebase use --tool=bash)
if [ -z "$PROJECT_ID" ]; then
    echo "❌ No Firebase project selected. Please select a project:"
    echo "firebase use --add"
    exit 1
fi

echo "📋 Current Firebase project: $PROJECT_ID"

# Check if configuration already exists
echo ""
echo "🔍 Checking existing configuration..."
if firebase functions:config:get google &> /dev/null; then
    echo "⚠️  Google configuration already exists:"
    firebase functions:config:get google
    echo ""
    read -p "Do you want to update the configuration? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Configuration setup cancelled."
        exit 0
    fi
fi

# Get configuration values
echo ""
echo "📝 Please provide your Google Cloud Service Account details:"
echo "   (You can find these in your service account JSON file)"
echo ""

read -p "Google Project ID: " GOOGLE_PROJECT_ID
read -p "Service Account Email: " CLIENT_EMAIL
read -p "Client ID: " CLIENT_ID
read -p "Private Key ID: " PRIVATE_KEY_ID
echo "Private Key (paste the full key including -----BEGIN/END PRIVATE KEY-----): "
read -r PRIVATE_KEY
read -p "Client Certificate URL: " CLIENT_CERT_URL
read -p "Google Spreadsheet ID: " SHEETS_ID

echo ""
echo "🔧 Setting Firebase Functions configuration..."

# Set configuration
firebase functions:config:set google.project_id="$GOOGLE_PROJECT_ID"
firebase functions:config:set google.client_email="$CLIENT_EMAIL"
firebase functions:config:set google.client_id="$CLIENT_ID"
firebase functions:config:set google.private_key_id="$PRIVATE_KEY_ID"
firebase functions:config:set google.private_key="$PRIVATE_KEY"
firebase functions:config:set google.client_cert_url="$CLIENT_CERT_URL"
firebase functions:config:set google.sheets_id="$SHEETS_ID"

echo "✅ Configuration set successfully!"

# Verify configuration
echo ""
echo "🔍 Verifying configuration..."
firebase functions:config:get google

# Build and deploy functions
echo ""
read -p "Do you want to build and deploy the functions now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🏗️  Building functions..."
    cd functions
    npm run build

    echo "🚀 Deploying functions..."
    cd ..
    firebase deploy --only functions

    echo "✅ Functions deployed successfully!"
else
    echo "⚠️  Remember to deploy your functions when ready:"
    echo "   cd functions && npm run build && cd .. && firebase deploy --only functions"
fi

echo ""
echo "🎉 Google Sheets Integration Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Make sure your Google Spreadsheet is shared with: $CLIENT_EMAIL"
echo "2. Test the integration by creating a meeting and scanning QR codes"
echo "3. Check the Functions logs if you encounter any issues: firebase functions:log"
echo ""
echo "For troubleshooting, see: GOOGLE_SHEETS_SETUP.md"