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

    // Create a history entry from the current prediction data
    const historyEntry = {
      predictedMin: existingPrediction.predictedMin || existingPrediction.predictedPrice || 0,
      predictedMax: existingPrediction.predictedMax || existingPrediction.predictedPrice || 0,
      createdAt: existingPrediction.createdAt,
      dayMultiplier: existingPrediction.dayMultiplier || 1
    };

    // Update the prediction with the history entry
    const updatedPrediction = await Prediction.findByIdAndUpdate(
      existingPrediction._id,
      {
        $set: {
          predictionHistory: [historyEntry]
        }
      },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Fixed current prediction with history entry',
      data: updatedPrediction
    });

  } catch (error) {
    console.error('Error fixing current prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fix current prediction'
      },
      { status: 500 }
    );
  }
}
