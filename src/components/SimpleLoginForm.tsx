'use client';

import { useState } from 'react';

interface Props {
  onLogin: (userId: string, username: string) => void;
}

interface StoredUser {
  userId: string;
  username: string;
  email: string;
  password: string;
  createdAt: number;
}

export function SimpleLoginForm({ onLogin }: Props) {
  const [currentView, setCurrentView] = useState<'login' | 'signup' | 'reset'>('login');
  
  // Login state
  const [loginNickname, setLoginNickname] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Signup state
  const [signupNickname, setSignupNickname] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  
  // Reset password state
  const [resetNickname, setResetNickname] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  
  // Common state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const findExistingUser = (username: string, email: string, password: string): StoredUser | null => {
    try {
      const storedUsers = localStorage.getItem('tesla_users');
      if (!storedUsers) return null;
      
      const users: StoredUser[] = JSON.parse(storedUsers);
      const existingUser = users.find(user => 
        (user.username.toLowerCase() === username.toLowerCase() || user.email.toLowerCase() === email.toLowerCase()) && 
        user.password === password
      );
      
      return existingUser || null;
    } catch (err) {
      console.error('Error reading stored users:', err);
      return null;
    }
  };

  const storeNewUser = (userId: string, username: string, email: string, password: string): void => {
    try {
      const newUser: StoredUser = {
        userId,
        username,
        email,
        password,
        createdAt: Date.now()
      };
      
      const storedUsers = localStorage.getItem('tesla_users');
      const users: StoredUser[] = storedUsers ? JSON.parse(storedUsers) : [];
      
      // Check if user with same username or email already exists
      const existingUserIndex = users.findIndex(user => 
        user.username.toLowerCase() === username.toLowerCase() || 
        user.email.toLowerCase() === email.toLowerCase()
      );
      
      if (existingUserIndex !== -1) {
        // Update existing user with new password and userId
        users[existingUserIndex] = newUser;
      } else {
        // Add new user to the list
        users.push(newUser);
      }
      
      // Store updated user list
      localStorage.setItem('tesla_users', JSON.stringify(users));
    } catch (err) {
      console.error('Error storing new user:', err);
    }
  };

  const checkUserInDatabase = async (username: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/users/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to check user');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error checking user in database:', err);
      return null;
    }
  };

  const registerNewUser = async (userId: string, username: string, email: string, password: string) => {
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, username, email, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to register user');
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error registering user:', err);
      return null;
    }
  };

  const resetPassword = async (nickname: string, email: string, newPassword: string) => {
    try {
      console.log('Sending password reset request:', { nickname, email, newPassword: '***' });
      const response = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname, email, newPassword }),
      });

      console.log('Reset password response status:', response.status);
      console.log('Reset password response ok:', response.ok);

      const data = await response.json();
      console.log('Reset password response data:', data);

      if (!response.ok) {
        return data;
      }

      return data;
    } catch (err) {
      console.error('Error resetting password:', err);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginNickname.trim()) {
      setError('Please enter your nickname');
      return;
    }

    if (!loginPassword || loginPassword.length !== 4 || !/^\d{4}$/.test(loginPassword)) {
      setError('Please enter a 4-digit password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // For login, we need to find the user by nickname first, then verify password
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ nickname: loginNickname, password: loginPassword }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        localStorage.setItem('tesla_user_id', data.user.userId);
        localStorage.setItem('tesla_username', data.user.username);
        localStorage.setItem('tesla_email', data.user.email);
        localStorage.setItem('tesla_password', loginPassword);
        
        storeNewUser(data.user.userId, data.user.username, data.user.email, loginPassword);
        
        onLogin(data.user.userId, data.user.username);
      } else {
        setError(data.error || 'Login failed. Please check your nickname and password.');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupNickname.trim()) {
      setError('Please enter a nickname');
      return;
    }

    if (!signupEmail.trim() || !validateEmail(signupEmail)) {
      setError('Please enter a valid email address');
      return;
    }

    if (!signupPassword || signupPassword.length !== 4 || !/^\d{4}$/.test(signupPassword)) {
      setError('Please enter a 4-digit password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const timestamp = Date.now();
      const userId = `user_${signupNickname.toLowerCase().replace(/[^a-z0-9]/g, '')}_${timestamp}`;
      
      const registration = await registerNewUser(userId, signupNickname, signupEmail, signupPassword);
      
      if (registration && registration.success) {
        localStorage.setItem('tesla_user_id', userId);
        localStorage.setItem('tesla_username', signupNickname);
        localStorage.setItem('tesla_email', signupEmail);
        localStorage.setItem('tesla_password', signupPassword);
        
        storeNewUser(userId, signupNickname, signupEmail, signupPassword);
        
        onLogin(userId, signupNickname);
      } else {
        setError(registration?.error || 'Failed to create account. Please try again.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetNickname.trim()) {
      setMessage('Please enter your nickname');
      return;
    }

    if (!resetEmail.trim() || !validateEmail(resetEmail)) {
      setMessage('Please enter a valid email address');
      return;
    }

    if (!newPassword || newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
      setMessage('Please enter a 4-digit password');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const resetResult = await resetPassword(resetNickname, resetEmail, newPassword);
      
      if (resetResult && resetResult.success) {
        setMessage('Password reset successfully! You can now login with your new password.');
        setCurrentView('login');
        setResetNickname('');
        setResetEmail('');
        setNewPassword('');
        
        storeNewUser(resetResult.user.userId, resetResult.user.username, resetResult.user.email, newPassword);
      } else {
        setMessage(resetResult?.error || 'Failed to reset password. Please try again.');
      }
    } catch (err) {
      console.error('Password reset error:', err);
      setMessage('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const clearMessages = () => {
    setError('');
    setMessage('');
  };

  // Login View
  if (currentView === 'login') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome Back!</h2>
          <p className="text-gray-300">Enter your nickname and password to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="login-nickname" className="block text-sm font-medium text-gray-300 mb-2">
              Nickname
            </label>
            <input
              type="text"
              id="login-nickname"
              value={loginNickname}
              onChange={(e) => { setLoginNickname(e.target.value); clearMessages(); }}
              placeholder="Enter your nickname"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="login-password" className="block text-sm font-medium text-gray-300 mb-2">
              4-Digit Password
            </label>
            <input
              type="password"
              id="login-password"
              value={loginPassword}
              onChange={(e) => { setLoginPassword(e.target.value); clearMessages(); }}
              placeholder="Enter 4 digits (e.g., 1234)"
              maxLength={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !loginNickname.trim() || loginPassword.length !== 4}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Logging in...
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>

        <div className="mt-6 text-center space-y-3">
          <button
            type="button"
            onClick={() => { setCurrentView('signup'); clearMessages(); }}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Don't have an account? Sign up
          </button>
          
          <button
            type="button"
            onClick={() => { setCurrentView('reset'); clearMessages(); }}
            className="block text-sm text-orange-400 hover:text-orange-300 underline"
          >
            Forgot your password?
          </button>
        </div>
      </div>
    );
  }

  // Signup View
  if (currentView === 'signup') {
    return (
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-gray-300">Enter your details to start predicting</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6">
          <div>
            <label htmlFor="signup-nickname" className="block text-sm font-medium text-gray-300 mb-2">
              Nickname
            </label>
            <input
              type="text"
              id="signup-nickname"
              value={signupNickname}
              onChange={(e) => { setSignupNickname(e.target.value); clearMessages(); }}
              placeholder="Choose a unique nickname"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="signup-email"
              value={signupEmail}
              onChange={(e) => { setSignupEmail(e.target.value); clearMessages(); }}
              placeholder="Enter your email address"
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
              4-Digit Password
            </label>
            <input
              type="password"
              id="signup-password"
              value={signupPassword}
              onChange={(e) => { setSignupPassword(e.target.value); clearMessages(); }}
              placeholder="Create a 4-digit password"
              maxLength={4}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || !signupNickname.trim() || !signupEmail.trim() || !validateEmail(signupEmail) || signupPassword.length !== 4}
            className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white font-semibold rounded-lg hover:from-green-700 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Creating Account...
              </div>
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => { setCurrentView('login'); clearMessages(); }}
            className="text-sm text-blue-400 hover:text-blue-300 underline"
          >
            Already have an account? Login
          </button>
          
          <div className="mt-4 space-y-2">
            <p className="text-xs text-gray-400">
              Your nickname will be visible to other players in the community predictions
            </p>
            <p className="text-xs text-green-400">
              ✓ Secure authentication with email-based password recovery
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Reset Password View
  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-8 border border-white/20 max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Reset Password</h2>
        <p className="text-gray-300">Enter your nickname and email to reset your password</p>
      </div>

      <form onSubmit={handleResetPassword} className="space-y-6">
        <div>
          <label htmlFor="reset-nickname" className="block text-sm font-medium text-gray-300 mb-2">
            Your Nickname
          </label>
          <input
            type="text"
            id="reset-nickname"
            value={resetNickname}
            onChange={(e) => { setResetNickname(e.target.value); clearMessages(); }}
            placeholder="Enter your nickname"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="reset-email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="reset-email"
            value={resetEmail}
            onChange={(e) => { setResetEmail(e.target.value); clearMessages(); }}
            placeholder="Enter your email address"
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-300 mb-2">
            New 4-Digit Password
          </label>
          <input
            type="password"
            id="new-password"
            value={newPassword}
            onChange={(e) => { setNewPassword(e.target.value); clearMessages(); }}
            placeholder="Enter new 4 digits (e.g., 5678)"
            maxLength={4}
            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {message && (
          <p className={`text-sm ${message.includes('successfully') ? 'text-green-400' : 'text-red-400'}`}>
            {message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => { setCurrentView('login'); clearMessages(); }}
            className="flex-1 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Login
          </button>
          <button
            type="submit"
            disabled={isLoading || !resetNickname.trim() || !resetEmail.trim() || !validateEmail(resetEmail) || newPassword.length !== 4}
            className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-red-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Resetting...
              </div>
            ) : (
              'Reset Password'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
