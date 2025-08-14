import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Prediction from '@/models/Prediction';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { username, email, password } = await request.json();
    
    if (!username || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Username, email, and password are required' },
        { status: 400 }
      );
    }

    // Check if user exists in the User collection
    const existingUser = await User.findOne({ 
      $or: [
        { username: username },
        { email: email }
      ]
    });

    if (existingUser) {
      // User exists, verify password
      if (existingUser.password === password) {
        // Password matches, return user info
        return NextResponse.json({
          success: true,
          exists: true,
          userId: existingUser.userId,
          username: existingUser.username,
          email: existingUser.email,
          authenticated: true
        });
      } else {
        // Password doesn't match
        return NextResponse.json({
          success: false,
          error: 'Incorrect password. Please try again.',
          exists: true,
          authenticated: false
        });
      }
    } else {
      // User doesn't exist, generate a new userId
      const timestamp = Date.now();
      const newUserId = `user_${username.toLowerCase().replace(/[^a-z0-9]/g, '')}_${timestamp}`;
      
      return NextResponse.json({
        success: true,
        exists: false,
        userId: newUserId,
        username: username,
        email: email
      });
    }

  } catch (error) {
    console.error('Error checking user:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check user' },
      { status: 500 }
    );
  }
}
