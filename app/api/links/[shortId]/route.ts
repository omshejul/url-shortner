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

export async function DELETE(
  request: Request,
  context: { params: Promise<{ shortId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized, Sign In to Continue' }, { status: 401 })
    }

    const resolvedParams = await context.params
    const { shortId } = resolvedParams

    const link = await Link.findOne({ 
      shortId,
      userId: session.user.email 
    })

    if (!link) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    await link.deleteOne()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/links/[shortId]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ shortId: string }> }
) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized, Sign In to Continue' }, { status: 401 })
    }

    const resolvedParams = await context.params
    const { shortId } = resolvedParams

    const link = await Link.findOne({ 
      shortId,
      userId: session.user.email 
    })

    if (!link) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    const { expiry, originalUrl, newShortId } = await request.json()
    
    if (expiry !== undefined) {
      link.expiresAt = expiry ? new Date(Date.now() + parseInt(expiry) * 1000) : null
    }
    
    if (originalUrl) {
      link.originalUrl = originalUrl
    }
    
    if (newShortId) {
      // Check if new shortId is available
      const exists = await Link.findOne({ shortId: newShortId })
      if (exists) {
        return NextResponse.json({ error: 'Custom URL already taken' }, { status: 400 })
      }
      link.shortId = newShortId
    }

    await link.save()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/links/[shortId]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 