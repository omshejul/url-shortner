import mongoose from 'mongoose'
import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI!)

const LinkSchema = new mongoose.Schema({
    shortId: { type: String, required: true, unique: true },
    originalUrl: { type: String, required: true },
    userId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date },
  })
  
  const Link = mongoose.models.Link || mongoose.model('Link', LinkSchema)
  
export async function GET() {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized, Sign In to Continue' }, { status: 401 })
    }

    console.log('Fetching links for user:', session.user.email)
    
    const links = await Link.find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .lean()

    console.log('Found links:', links)

    return NextResponse.json({ links })
  } catch (error) {
    console.error('Error in GET /api/links:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 