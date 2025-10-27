import { MongoClient } from 'mongodb'

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"')
}

// Extract database name from MongoDB URI
function getDatabaseNameFromURI(uri: string): string {
  try {
    const url = new URL(uri)
    const dbName = url.pathname.slice(1).split('?')[0] // Remove leading '/' and query params
    if (!dbName) {
      throw new Error('No database name found in MONGODB_URI')
    }
    return dbName
  } catch (error) {
    throw new Error('Invalid MONGODB_URI format')
  }
}

export const DATABASE_NAME = getDatabaseNameFromURI(process.env.MONGODB_URI)

const uri = process.env.MONGODB_URI
const options = {}

let client
let clientPromise: Promise<MongoClient>

if (process.env.NODE_ENV === 'development') {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>
  }

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options)
    globalWithMongo._mongoClientPromise = client.connect()
  }
  clientPromise = globalWithMongo._mongoClientPromise
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(uri, options)
  clientPromise = client.connect()
}

export default clientPromise

// Add this function to clean expired links
export async function cleanExpiredLinks() {
  try {
    const client = await clientPromise
    const db = client.db(DATABASE_NAME)

    const result = await db.collection('links').deleteMany({
      expiresAt: { $lt: new Date() }
    })

    console.log(`Cleaned ${result.deletedCount} expired links`)
  } catch (error) {
    console.error('Error cleaning expired links:', error)
  }
}

// Helper function to get database instance
export async function getDatabase() {
  const client = await clientPromise
  return client.db(DATABASE_NAME)
}