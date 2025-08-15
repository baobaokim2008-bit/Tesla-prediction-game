import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { userId, username, email, password } = await request.json();
    
    console.log('Registration request received');
    console.log('Request data:', { userId, username, email, password: '***' });
    
    if (!userId || !username || !email || !password) {
      console.log('Missing required fields');
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

    console.log('Existing user check:', existingUser ? 'Found existing user' : 'No existing user');
    
    if (existingUser) {
      console.log('Existing user details:', { 
        userId: existingUser.userId, 
        username: existingUser.username, 
        email: existingUser.email 
      });
      return NextResponse.json({
        success: false,
        error: 'User already exists with this username, email, or ID'
      }, { status: 400 });
    }

    // Create new user
    console.log('Creating new user...');
    const newUser = new User({
      userId,
      username,
      email,
      password
    });

    console.log('Saving user to database...');
    await newUser.save();
    console.log('User saved successfully');

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
    console.error('Error details:', error.message);
    console.error('Error stack:', error.stack);
    return NextResponse.json(
      { success: false, error: `Failed to register user: ${error.message}` },
      { status: 500 }
    );
  }
}
