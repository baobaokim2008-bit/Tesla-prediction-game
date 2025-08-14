import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, username, email, password } = await request.json();
    
    if (!userId || !username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'UserId, username, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { username: username },
        { email: email },
        { userId: userId }
      ]
    });

    if (existingUser) {
      return NextResponse.json({
        success: false,
        error: 'User already exists with this username, email, or ID'
      }, { status: 400 });
    }

    // Create new user
    const newUser = new User({
      userId,
      username,
      email,
      password
    });

    await newUser.save();

    return NextResponse.json({
      success: true,
      message: 'User registered successfully',
      user: {
        userId: newUser.userId,
        username: newUser.username,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error('Error registering user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to register user' },
      { status: 500 }
    );
  }
}
