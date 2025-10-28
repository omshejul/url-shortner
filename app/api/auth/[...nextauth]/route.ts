import clientPromise, { DATABASE_NAME } from '@/app/lib/mongodb'
import { MongoDBAdapter } from "@auth/mongodb-adapter"
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  adapter: MongoDBAdapter(clientPromise, {
    databaseName: DATABASE_NAME
  }),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    secret: process.env.NEXTAUTH_SECRET,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Use unique cookie names to avoid conflicts with main site
  cookies: {
    sessionToken: {
      name: `url-shortener.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/link',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    callbackUrl: {
      name: `url-shortener.callback-url`,
      options: {
        sameSite: 'lax',
        path: '/link',
        secure: process.env.NODE_ENV === 'production'
      }
    },
    csrfToken: {
      name: `url-shortener.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/link',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  },
  // Use unique pages to avoid conflicts
  pages: {
    signIn: '/link/api/auth/signin',
    signOut: '/link/api/auth/signout',
    error: '/link/api/auth/error',
    verifyRequest: '/link/api/auth/verify-request',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === 'development',
})

export { handler as GET, handler as POST }
