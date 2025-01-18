import mongoose from 'mongoose'
import { nanoid } from 'nanoid'
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
  
export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { url, customPath, expiry } = await req.json()
    
    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 })
    }

    const shortId = customPath || nanoid(8)

    // Check if custom path already exists
    if (customPath) {
      const exists = await Link.findOne({ shortId: customPath })
      if (exists) {
        return NextResponse.json(
          { error: 'Custom URL already taken' }, 
          { status: 400 }
        )
      }
    }


    const link = new Link({
      shortId,
      originalUrl: url,
      userId: session.user.email,
      expiresAt: expiry ? new Date(Date.now() + parseInt(expiry) * 1000) : null
    })

    await link.save()
    
    return NextResponse.json({ 
      shortUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/${shortId}`,
      shortId 
    })
  } catch (error) {
    console.error('Error in /api/shorten:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 