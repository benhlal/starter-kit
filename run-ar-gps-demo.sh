#!/bin/bash

# AR GPS Demo Test Script
# This script builds and runs the AR GPS demo on Android

echo "🚀 Building and running AR GPS Demo..."

# Clean and build
echo "📦 Building Android app..."
cd "d:/SourceCode/Personal/Mobile/AR/starter-kit"
./android/gradlew.bat -p android clean :app:assembleDebug

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Install and run
    echo "📱 Installing on device..."
    adb install -r android/app/build/outputs/apk/debug/app-debug.apk
    
    if [ $? -eq 0 ]; then
        echo "🎯 Starting app..."
        adb shell am start -n com.benh.zch/.MainActivity
        echo ""
        echo "📍 AR GPS Demo Instructions:"
        echo "1. Open the app and navigate to Events screen"
        echo "2. Look for '📍 AR GPS Demo' button (admin only)"
        echo "3. Toggle 'Use Live GPS' or use fixed coordinates"
        echo "4. Start AR Session to initialize world tracking"
        echo "5. Place test objects at GPS coordinates"
        echo "6. Walk around to find objects at their GPS locations"
        echo ""
        echo "🔍 Features to test:"
        echo "- Objects spawn at GPS coordinates, not camera position"
        echo "- Live GPS vs fixed coordinates comparison"
        echo "- AR session state monitoring"
        echo "- Object anchoring to world coordinates"
        echo ""
        echo "Expected: Objects will appear at calculated GPS positions in AR world"
    else
        echo "❌ Installation failed"
    fi
else
    echo "❌ Build failed"
fi