import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { twitterId, username, name, image, provider } = await request.json();
    
    if (!twitterId || !username) {
      return NextResponse.json(
        { success: false, error: 'Twitter ID and username are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { twitterId: twitterId },
        { username: username }
      ]
    });

    if (existingUser) {
      // Update existing user with latest info
      existingUser.name = name;
      existingUser.image = image;
      existingUser.lastLogin = new Date();
      await existingUser.save();
      
      return NextResponse.json({
        success: true,
        message: 'X user logged in successfully',
        user: {
          userId: existingUser.userId,
          username: existingUser.username,
          name: existingUser.name,
          image: existingUser.image
        }
      });
    }

    // Create new X user
    const newUser = new User({
      userId: `x_user_${twitterId}_${Date.now()}`,
      username: username,
      name: name,
      image: image,
      twitterId: twitterId,
      provider: provider,
      email: null, // X doesn't provide email by default
      password: null, // X users don't have passwords
      createdAt: new Date(),
      lastLogin: new Date()
    });

    await newUser.save();
    
    return NextResponse.json({
      success: true,
      message: 'X user registered successfully',
      user: {
        userId: newUser.userId,
        username: newUser.username,
        name: newUser.name,
        image: newUser.image
      }
    });

  } catch (error) {
    console.error('Error handling X login:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process X login' },
      { status: 500 }
    );
  }
}
