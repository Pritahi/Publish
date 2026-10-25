# SleepGuard - Bed Phone Tracker

## Overview
Track phone usage in bed using NFC tag commitment. Tap your phone to an NFC tag before sleeping, and the app tracks how long you use your phone in bed. If you exceed 30 minutes, your streak breaks.

## Features
- **NFC Tag Start** - Tap NFC tag to begin sleep session
- **Usage Tracking** - Tracks active screen time during sleep session
- **Streak Counter** - Counts consecutive nights under usage limit
- **Session Reports** - View recent sleep sessions
- **PWA** - Installable as app on your phone

## Tech Stack
- HTML5 + JavaScript (Vanilla)
- Web NFC API (Android Chrome)
- LocalStorage (no backend required)
- PWA (Progressive Web App)

## How to Use
1. Place an NFC sticker on your bedside table or charging point
2. Open SleepGuard on your phone
3. Tap your phone to the NFC tag before sleeping
4. App tracks your phone usage during the session
5. End session in the morning to see your streak

## Deployment (GitHub Pages)
1. Push this folder to GitHub repository
2. Go to Settings → Pages
3. Select source branch
4. Your app is live at `https://username.github.io/repo-name/`

## Limitations
- Web NFC works on Android Chrome only
- iOS requires native app for NFC (Web NFC not supported by Apple)
- Usage tracking works when app is open/visible
