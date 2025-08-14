# Tesla Prediction Game

A full-stack web application where users can predict Tesla stock prices and compete with others.

## Features

- **Stock Price Prediction**: Users can predict Tesla stock price ranges for the current week
- **AI Market Insights**: Powered by Grok-4 for market catalysts and analysis
- **Community Dashboard**: View all community predictions with bell curve visualization
- **Leaderboard**: Track scores and rankings based on prediction accuracy
- **User Authentication**: Simple login system with password recovery
- **Weekly Scoring**: Multiplier system based on prediction timing (Monday = 5x, Tuesday = 3x, Wednesday = 2x)

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **APIs**: Alpha Vantage (stock data), Grok-4 (AI insights)
- **Authentication**: Custom user system with email/password

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env.local`:
```
MONGODB_URI=your_mongodb_connection_string
GROK_API_KEY=your_grok_api_key
ALPHA_VANTAGE_API_KEY=your_alpha_vantage_api_key
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) to view the application.

## How It Works

- Users sign up with a nickname, email, and 4-digit password
- Predictions can be made Monday through Thursday
- Scoring multipliers: Monday (5x), Tuesday (3x), Wednesday (2x)
- Users can edit their predictions throughout the week
- Scores are calculated based on accuracy and prediction range
- Community predictions show aggregated data with bell curve visualization
- Market catalysts provide AI-powered insights on Tesla-relevant news and events
