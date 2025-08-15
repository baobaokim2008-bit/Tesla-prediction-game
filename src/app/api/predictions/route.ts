import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, username, predictedMin, predictedMax } = await request.json();
    
    if (!userId || !username || !predictedMin || !predictedMax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: userId, username, predictedMin, and predictedMax'
        },
        { status: 400 }
      );
    }

    // Validate that min is less than max
    if (predictedMin >= predictedMax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum price must be less than maximum price'
        },
        { status: 400 }
      );
    }

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

    // Calculate day multiplier based on current day
    const dayMultiplier = (() => {
      switch (currentDay) {
        case 1: return 5; // Monday
        case 2: return 3; // Tuesday
        case 3: return 2; // Wednesday
        case 4: return 1; // Thursday
        default: return 1; // Default
      }
    })();

    // Check if user already has a prediction for this week
    const existingPrediction = await Prediction.findOne({
      userId,
      weekStartDate: {
        $gte: weekStart
      }
    });

    if (existingPrediction) {
      // If prediction exists, update it instead of creating a new one
      const newHistoryEntry = {
        predictedMin,
        predictedMax,
        createdAt: new Date(),
        dayMultiplier
      };

      const updatedPrediction = await Prediction.findByIdAndUpdate(
        existingPrediction._id,
        {
          $set: {
            predictedMin: predictedMin,
            predictedMax: predictedMax,
            dayMultiplier: dayMultiplier,
            updatedAt: new Date()
          },
          $push: {
            predictionHistory: newHistoryEntry
          },
          $unset: {
            predictedPrice: 1 // Ensure old field is removed
          }
        },
        { new: true }
      );
      return NextResponse.json({ success: true, data: updatedPrediction }, { status: 200 }); // Return 200 for update
    }

    // Create the first prediction history entry
    const firstHistoryEntry = {
      predictedMin,
      predictedMax,
      createdAt: new Date(),
      dayMultiplier
    };

    const prediction = new Prediction({
      userId,
      username,
      predictedMin,
      predictedMax,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      dayMultiplier,
      predictionHistory: [firstHistoryEntry]
    });

    await prediction.save();

    return NextResponse.json({ success: true, data: prediction }, { status: 201 });
  } catch (error) {
    console.error('Error creating prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create prediction'
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const { predictionId, predictedMin, predictedMax } = await request.json();
    
    if (!predictionId || !predictedMin || !predictedMax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: predictionId, predictedMin, and predictedMax'
        },
        { status: 400 }
      );
    }

    // Validate that min is less than max
    if (predictedMin >= predictedMax) {
      return NextResponse.json(
        {
          success: false,
          error: 'Minimum price must be less than maximum price'
        },
        { status: 400 }
      );
    }

    // Find the prediction
    const prediction = await Prediction.findById(predictionId);
    
    if (!prediction) {
      return NextResponse.json(
        {
          success: false,
          error: 'Prediction not found'
        },
        { status: 404 }
      );
    }

    // Check if it's the current week
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Sunday
    weekEnd.setHours(23, 59, 59, 999);

    const predictionDate = new Date(prediction.weekStartDate);
    
    // Check if prediction is within the current week range
    if (predictionDate.getTime() < weekStart.getTime() || predictionDate.getTime() > weekEnd.getTime()) {
      return NextResponse.json(
        {
          success: false,
          error: 'Can only edit current week\'s prediction'
        },
        { status: 400 }
      );
    }

    // Check if results are already in (can't edit if actual price exists)
    if (prediction.actualPrice !== null && prediction.actualPrice !== undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Cannot edit prediction after results are available'
        },
        { status: 400 }
      );
    }

    // Calculate day multiplier for this update
    const dayMultiplier = (() => {
      switch (currentDay) {
        case 1: return 5; // Monday
        case 2: return 3; // Tuesday
        case 3: return 2; // Wednesday
        case 4: return 1; // Thursday
        default: return 1; // Default
      }
    })();

    // Create new history entry
    const newHistoryEntry = {
      predictedMin,
      predictedMax,
      createdAt: new Date(),
      dayMultiplier
    };

    // Always add to history, even if values are the same
    // This ensures we track every input attempt
    const updatedPrediction = await Prediction.findByIdAndUpdate(
      predictionId,
      {
        $set: {
          predictedMin: predictedMin,
          predictedMax: predictedMax,
          dayMultiplier: dayMultiplier,
          updatedAt: new Date()
        },
        $push: {
          predictionHistory: newHistoryEntry
        },
        $unset: {
          predictedPrice: 1  // This will remove the predictedPrice field
        }
      },
      { new: true } // Return the updated document
    );

    return NextResponse.json({ success: true, data: updatedPrediction });
  } catch (error) {
    console.error('Error updating prediction:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update prediction'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'userId is required'
        },
        { status: 400 }
      );
    }

    // Get the current week's start date (Monday)
    const now = new Date();
    const currentDay = now.getDay();
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);

    // Get only current week predictions for the user
    const predictions = await Prediction.find({
      userId,
      weekStartDate: {
        $gte: weekStart
      }
    }).sort({ weekStartDate: -1 });

    return NextResponse.json({ success: true, data: predictions });
  } catch (error) {
    console.error('Error fetching predictions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch predictions'
      },
      { status: 500 }
    );
  }
}

