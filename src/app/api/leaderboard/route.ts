import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    console.log('Fetching leaderboard data...');

    // Get the previous week's start date (last Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const currentWeekStart = new Date(now);
    currentWeekStart.setDate(now.getDate() - daysToMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(currentWeekStart.getDate() - 7);
    const previousWeekEnd = new Date(previousWeekStart);
    previousWeekEnd.setDate(previousWeekStart.getDate() + 6);
    previousWeekEnd.setHours(23, 59, 59, 999);

    // Get previous week winner
    const previousWeekWinner = await Prediction.aggregate([
      {
        $match: {
          weekStartDate: {
            $gte: previousWeekStart,
            $lte: previousWeekEnd
          },
          score: { $exists: true, $ne: null }
        }
      },
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          weekScore: { $sum: '$score' },
          prediction: { $first: '$$ROOT' }
        }
      },
      {
        $sort: { weekScore: -1 }
      },
      {
        $limit: 1
      }
    ]);

    // Aggregate predictions to get user statistics
    const leaderboardData = await Prediction.aggregate([
      {
        $group: {
          _id: '$userId',
          username: { $first: '$username' },
          totalScore: { $sum: { $ifNull: ['$score', 0] } },
          predictionCount: { $sum: 1 },
          correctPredictions: { $sum: { $cond: ['$isCorrect', 1, 0] } },
          averageScore: { $avg: { $ifNull: ['$score', 0] } },
          lastPrediction: { $max: '$createdAt' },
          firstPrediction: { $min: '$createdAt' }
        }
      },
      {
        $addFields: {
          accuracy: {
            $cond: [
              { $eq: ['$predictionCount', 0] },
              0,
              { $multiply: [{ $divide: ['$correctPredictions', '$predictionCount'] }, 100] }
            ]
          },
          weeksActive: {
            $ceil: {
              $divide: [
                { $subtract: ['$lastPrediction', '$firstPrediction'] },
                1000 * 60 * 60 * 24 * 7 // milliseconds in a week
              ]
            }
          }
        }
      },
      {
        $sort: { totalScore: -1, accuracy: -1, predictionCount: -1 }
      }
    ]);

    // Add rank to each user
    const rankedLeaderboard = leaderboardData.map((user, index) => ({
      ...user,
      rank: index + 1
    }));

    console.log(`Found ${rankedLeaderboard.length} users in leaderboard`);

    return NextResponse.json({
      success: true,
      data: rankedLeaderboard,
      totalUsers: rankedLeaderboard.length,
      previousWeekWinner: previousWeekWinner.length > 0 ? {
        username: previousWeekWinner[0].username,
        score: previousWeekWinner[0].weekScore,
        prediction: previousWeekWinner[0].prediction
      } : null
    });

  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch leaderboard'
      },
      { status: 500 }
    );
  }
}
