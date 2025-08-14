import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    // Get the current week's start date (Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 0, so we need 6 days back
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Get the latest prediction for each user for the current week
    const predictions = await Prediction.aggregate([
      {
        $match: {
          weekStartDate: {
            $gte: weekStart
          }
        }
      },
      {
        $sort: { createdAt: -1 } // Sort by creation date (newest first)
      },
      {
        $group: {
          _id: '$userId',
          latestPrediction: { $first: '$$ROOT' }
        }
      },
      {
        $replaceRoot: { newRoot: '$latestPrediction' }
      },
      {
        $sort: { createdAt: -1 } // Sort the final results by creation date
      },
      {
        $limit: 100 // Limit to prevent overwhelming the UI
      }
    ]);

    return NextResponse.json({
      success: true,
      data: predictions
    });
  } catch (error) {
    console.error('Error fetching all predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch predictions'
      },
      { status: 500 }
    );
  }
}
