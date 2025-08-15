// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import TwitterProvider from 'next-auth/providers/twitter';

const authOptions: NextAuthOptions = {
  providers: [
    TwitterProvider({
      clientId: process.env.TWITTER_CLIENT_ID!,
      clientSecret: process.env.TWITTER_CLIENT_SECRET!,
      version: "2.0", // Use Twitter API v2
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.username = token.username as string || token.name || 'X User';
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // Store Twitter username in token
        token.username = (profile as any).data?.username || (profile as any).username;
      }
      return token;
    },
    async signIn({ user, account, profile }) {
      console.log('Sign in attempt:', { 
        provider: account?.provider, 
        username: (profile as any)?.data?.username || (profile as any)?.username 
      });
      
      // Save user to database
      if (account?.provider === 'twitter' && profile) {
        try {
          const response = await fetch(`${process.env.NEXTAUTH_URL}/api/users/x-login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              twitterId: (profile as any).id,
              username: (profile as any).data?.username || (profile as any).username,
              name: (profile as any).name,
              image: (profile as any).profile_image_url,
              provider: 'twitter'
            }),
          });
          
          if (!response.ok) {
            console.error('Failed to save user to database');
          }
        } catch (error) {
          console.error('Error saving user to database:', error);
        }
      }
      
      return true;
    },
  },
  pages: {
    signIn: '/',
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };