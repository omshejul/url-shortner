import mongoose from 'mongoose'
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

export async function GET(
  request: Request,
  context: { params: Promise<{ shortId: string }> }
) {
  try {
    // Await params resolution before using
    const resolvedParams = await context.params
    const { shortId } = resolvedParams

    const link = await Link.findOne({ shortId })

    if (!link) {
      return NextResponse.redirect(new URL('/', request.url))
    }

    // Check if link has expired
    if (link.expiresAt && link.expiresAt < new Date()) {
      await link.deleteOne()
      return NextResponse.redirect(new URL('/', request.url))
    }

    return NextResponse.redirect(new URL(link.originalUrl))
  } catch (error) {
    console.error('Error in shortId route:', error)
    return NextResponse.redirect(new URL('/', request.url))
  }
}