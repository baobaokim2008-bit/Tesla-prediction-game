import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    console.log('Creating test prediction...');
    
    // Calculate current week's Monday and Friday
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 4);
    weekEnd.setHours(23, 59, 59, 999);

    // Create a test prediction with explicit min/max values
    const testPrediction = new Prediction({
      userId: 'test_user_123',
      username: 'TestUser',
      predictedMin: 240.10,
      predictedMax: 249.90,
      weekStartDate: weekStart,
      weekEndDate: weekEnd
    });

    await testPrediction.save();
    
    console.log('Test prediction created:', testPrediction);
    
    return NextResponse.json({
      success: true,
      message: 'Test prediction created successfully',
      prediction: {
        id: testPrediction._id,
        username: testPrediction.username,
        predictedMin: testPrediction.predictedMin,
        predictedMax: testPrediction.predictedMax,
        predictedPrice: testPrediction.predictedPrice
      }
    });
    
  } catch (error) {
    console.error('Error creating test prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create test prediction'
      },
      { status: 500 }
    );
  }
}
