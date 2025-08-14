import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    // Get current date and time
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 5 = Friday
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Check if it's Friday after 4 PM ET (market close)
    // Friday = 5, and we need to be after 4 PM ET (which is 8 PM UTC)
    const isFriday = currentDay === 5;
    const isAfterMarketClose = currentHour >= 20 || (currentHour === 20 && currentMinute >= 0);

    if (!isFriday || !isAfterMarketClose) {
      return NextResponse.json({
        success: false,
        error: 'Scores can only be calculated after Friday 4 PM ET'
      }, { status: 400 });
    }

    // Get the current week's start date (Monday)
    const currentWeekStart = new Date(now);
    const daysSinceMonday = currentDay === 0 ? 6 : currentDay - 1; // Sunday = 6 days since Monday
    currentWeekStart.setDate(now.getDate() - daysSinceMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    // Get the current week's end date (Friday)
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 4); // Friday is 4 days after Monday
    currentWeekEnd.setHours(23, 59, 59, 999);

    // Get all predictions for the current week
    const predictions = await Prediction.find({
      weekStartDate: {
        $gte: currentWeekStart,
        $lte: currentWeekEnd
      }
    });

    if (predictions.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No predictions found for the current week'
      }, { status: 404 });
    }

    // Get the actual Friday closing price (you might want to fetch this from your stock API)
    // For now, using a placeholder - you should replace this with actual Friday closing price
    const actualFridayPrice = 340.00; // This should be the actual Friday closing price

    // Calculate scores for each prediction
    let updatedCount = 0;
    let correctPredictions = 0;
    let narrowestRange = Infinity;
    let narrowestRangePredictions: any[] = [];

    // First pass: determine the narrowest range among correct predictions
    for (const prediction of predictions) {
      if (prediction.predictedMin && prediction.predictedMax) {
        const range = prediction.predictedMax - prediction.predictedMin;
        const isCorrect = actualFridayPrice >= prediction.predictedMin && actualFridayPrice <= prediction.predictedMax;
        
        if (isCorrect && range < narrowestRange) {
          narrowestRange = range;
          narrowestRangePredictions = [prediction];
        } else if (isCorrect && range === narrowestRange) {
          narrowestRangePredictions.push(prediction);
        }
      }
    }

    // Second pass: calculate scores with day multipliers
    for (const prediction of predictions) {
      if (prediction.predictedMin && prediction.predictedMax) {
        const range = prediction.predictedMax - prediction.predictedMin;
        const isCorrect = actualFridayPrice >= prediction.predictedMin && actualFridayPrice <= prediction.predictedMax;
        
        // Calculate day multiplier based on when the prediction was created
        const predictionDate = new Date(prediction.createdAt);
        const predictionDay = predictionDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        
        let dayMultiplier = 1; // Default for Thursday
        if (predictionDay === 1) { // Monday
          dayMultiplier = 5;
        } else if (predictionDay === 2) { // Tuesday
          dayMultiplier = 3;
        } else if (predictionDay === 3) { // Wednesday
          dayMultiplier = 2;
        } else if (predictionDay === 4) { // Thursday
          dayMultiplier = 1;
        }

        // Calculate base score
        let baseScore = 1; // Participation point
        if (isCorrect) {
          baseScore += 10; // Correct prediction bonus
          correctPredictions++;
          
          // Check if this prediction has the narrowest range
          if (range === narrowestRange && narrowestRangePredictions.length > 0) {
            baseScore += 30; // Narrowest range bonus
          }
        }

        // Apply day multiplier
        const finalScore = baseScore * dayMultiplier;

        // Update the prediction
        await Prediction.findByIdAndUpdate(prediction._id, {
          $set: {
            actualPrice: actualFridayPrice,
            isCorrect: isCorrect,
            score: finalScore,
            rangeSize: range,
            dayMultiplier: dayMultiplier,
            updatedAt: new Date()
          }
        });

        updatedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Scores calculated successfully for ${updatedCount} predictions`,
      data: {
        totalPredictions: updatedCount,
        correctPredictions: correctPredictions,
        actualFridayPrice: actualFridayPrice,
        narrowestRange: narrowestRange === Infinity ? null : narrowestRange,
        narrowestRangeCount: narrowestRangePredictions.length
      }
    });

  } catch (error) {
    console.error('Error calculating scores:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to calculate scores' },
      { status: 500 }
    );
  }
}
