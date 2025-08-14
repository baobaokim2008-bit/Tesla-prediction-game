import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required'
        },
        { status: 400 }
      );
    }

    // Find the current week's prediction for this user
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const existingPrediction = await Prediction.findOne({
      userId,
      weekStartDate: {
        $gte: weekStart
      }
    });

    if (!existingPrediction) {
      return NextResponse.json(
        {
          success: false,
          error: 'No prediction found for current week'
        },
        { status: 404 }
      );
    }

    // Add multiple test history entries with different times
    const testEntries = [
      {
        predictedMin: 300,
        predictedMax: 320,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
        dayMultiplier: 2
      },
      {
        predictedMin: 310,
        predictedMax: 330,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        dayMultiplier: 2
      },
      {
        predictedMin: 315,
        predictedMax: 335,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
        dayMultiplier: 2
      }
    ];

    // Add these test entries to the prediction history
    const updatedPrediction = await Prediction.findByIdAndUpdate(
      existingPrediction._id,
      {
        $push: {
          predictionHistory: { $each: testEntries }
        }
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Added test history entries',
      data: updatedPrediction
    });

  } catch (error) {
    console.error('Error adding test entries:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add test entries'
      },
      { status: 500 }
    );
  }
}
