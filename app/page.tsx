'use client'
import { signIn, signOut, useSession } from 'next-auth/react'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { Copy, LogOut, Trash2 } from 'react-feather'
import { FiCheck, FiEdit2, FiLoader, FiUser, FiX } from "react-icons/fi"
import { format } from 'timeago.js'

// First, add a new type for link data
type LinkData = {
  shortId: string
  originalUrl: string
  expiresAt?: string
}

// Add type for link
interface Link {
  shortId: string
  originalUrl: string
  expiresAt: string | null
  createdAt: string
  userId: string
}

// Format date helper function
const formatDate = (date: string | null) => {
  if (!date) return null
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short', 
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  })
}

// Format relative time helper function
const formatRelativeTime = (date: string | null) => {
  if (!date) return null
  const target = new Date(date)
  const now = new Date()
  
  // If expired
  if (target < now) return 'Expired'
  
  return format(target, 'en_US')
}

export default function Home() {
  const { data: session, status } = useSession()
  const [url, setUrl] = useState('')
  const [customPath, setCustomPath] = useState('')
  const [expiry, setExpiry] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [links, setLinks] = useState<Link[]>([])
  const [isLoadingLinks, setIsLoadingLinks] = useState(false)
  const [linksError, setLinksError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState<{ [key: string]: boolean }>({})
  const [editedValues, setEditedValues] = useState<{ [key: string]: LinkData }>({})
  const [configError, setConfigError] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // Handle copy feedback
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000) // Reset after 2 seconds
  }

  // Load form data from localStorage on mount
  useEffect(() => {
    const savedFormData = localStorage.getItem('urlShortenerFormData')
    if (savedFormData) {
      const { url: savedUrl, customPath: savedPath, expiry: savedExpiry } = JSON.parse(savedFormData)
      setUrl(savedUrl || '')
      setCustomPath(savedPath || '')
      setExpiry(savedExpiry || '')
      localStorage.removeItem('urlShortenerFormData')
    }
  }, [])

  useEffect(() => {
    if (session) {
      fetchLinks()
    }
  }, [session])

  // Check for configuration errors
  useEffect(() => {
    const checkConfig = async () => {
      try {
        const res = await fetch('/api/auth/providers')
        if (!res.ok) {
          setConfigError('Environment variables not configured. Please set up MONGODB_URI, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET in your .env file.')
        } else {
          setConfigError('')
        }
      } catch {
        setConfigError('Environment variables not configured. Please set up MONGODB_URI, GOOGLE_CLIENT_ID, and GOOGLE_CLIENT_SECRET in your .env file.')
      }
    }
    checkConfig()
  }, [])

  const fetchLinks = async () => {
    try {
      setIsLoadingLinks(true)
      setLinksError('')
      const res = await fetch('/api/links')
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch links')
      }

      setLinks(data.links)
    } catch (error) {
      console.error('Error fetching links:', error)
      setLinksError('Failed to load your links')
    } finally {
      setIsLoadingLinks(false)
    }
  }

  const handleDelete = async (shortId: string) => {
    try {
      setIsUpdating(prev => ({ ...prev, [shortId]: true }))
      const res = await fetch(`/api/links/${shortId}`, {
        method: 'DELETE'
      })
      if (res.ok) {
        await fetchLinks()
      }
    } finally {
      setIsUpdating(prev => ({ ...prev, [shortId]: false }))
    }
  }

  // const handleUpdateExpiry = async (shortId: string, newExpiry: string) => {
  //   try {
  //     setIsUpdating(prev => ({ ...prev, [shortId]: true }))
  //     const res = await fetch(`/api/links/${shortId}`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify({ expiry: newExpiry })
  //     })
  //     if (res.ok) {
  //       await fetchLinks()
  //     }
  //   } finally {
  //     setIsUpdating(prev => ({ ...prev, [shortId]: false }))
  //   }
  // }

  // const handleUpdateUrl = async (shortId: string, type: 'original' | 'short', newValue: string) => {
  //   try {
  //     setIsUpdating(prev => ({ ...prev, [shortId]: true }))
  //     const res = await fetch(`/api/links/${shortId}`, {
  //       method: 'PATCH',
  //       headers: { 'Content-Type': 'application/json' },
  //       body: JSON.stringify(
  //         type === 'original' 
  //           ? { originalUrl: newValue }
  //           : { newShortId: newValue }
  //       )
  //     })
  //     if (res.ok) {
  //       await fetchLinks()
  //       setEditingId(null)
  //     }
  //   } finally {
  //     setIsUpdating(prev => ({ ...prev, [shortId]: false }))
  //   }
  // }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')
    setShortUrl('')

    try {
      const response = await fetch('/api/shorten', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          customPath: customPath.trim() || undefined,
          expiry: expiry ? parseInt(expiry) : undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setShortUrl(data.shortUrl)
      await fetchLinks()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveChanges = async (shortId: string) => {
    try {
      setIsUpdating(prev => ({ ...prev, [shortId]: true }))
      const edited = editedValues[shortId]
      if (!edited) return

      const res = await fetch(`/api/links/${shortId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalUrl: edited.originalUrl,
          newShortId: edited.shortId !== shortId ? edited.shortId : undefined,
          expiry: edited.expiresAt
        })
      })
      if (res.ok) {
        await fetchLinks()
        setEditingId(null)
        setEditedValues(prev => {
          const next = { ...prev }
          delete next[shortId]
          return next
        })
      }
    } finally {
      setIsUpdating(prev => ({ ...prev, [shortId]: false }))
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      <div className="max-w-4xl mx-auto px-4 py-16 sm:px-6 lg:px-8">
        {configError && (
          <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <p className="text-yellow-700 dark:text-yellow-300">{configError}</p>
          </div>
        )}

        <div className="flex flex-wrap px-4 items-center justify-between mb-12">
          <div className="py-2">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              URL Shortener
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Create short, memorable links in seconds
            </p>
          </div>

          <div>
            {status === 'loading' ? (
              <div className="flex py-2 justify-center">
                <FiLoader className="w-5 h-5 animate-spin text-gray-500 dark:text-gray-400" />
              </div>
            ) : session ? (
              <div className="flex flex-wrap py-2 items-center gap-2">
                <div className="flex flex-wrap p-2 items-center gap-2 rounded-lg ">

                <div className="flex items-center gap-3">
                  {session.user?.image? (
                    <Image
                      src={session.user.image}
                      alt={session.user.name || 'Profile'}
                      width={42}
                      height={42}
                      className="rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <FiUser className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-700 dark:text-gray-300">
                    {session.user?.name}
                  </span>
                  <span className="text-gray-500 dark:text-gray-500">
                    {session.user?.email}
                  </span>
                </div>
                </div>

                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 px-6 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-400/10 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-400/20"
                >
                  Logout<LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center">
                <button
                  onClick={() => {
                    // Save form data before signing in
                    localStorage.setItem('urlShortenerFormData', JSON.stringify({ url, customPath, expiry }))
                    signIn('google')
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-gray-400/10 dark:bg-gray-400/10 border border-gray-400/20 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="currentColor"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="currentColor"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  Sign in to create
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-black border border-gray-400/20 rounded-xl p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-6">
              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Long URL
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/your-long-url"
                  required
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                    bg-transparent text-gray-900 dark:text-white
                    placeholder-gray-400 dark:placeholder-gray-500"
                />
              </div>

              <div>
                <label htmlFor="customPath" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Custom Path (Optional)
                </label>
                <div className="flex items-center gap-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-transparent">
                  <span className="text-black text-base dark:text-white whitespace-nowrap">
                    {process.env.NEXT_PUBLIC_BASE_URL}/
                  </span>
                  <input
                    id="customPath"
                    type="text"
                    value={customPath}
                    onChange={(e) => setCustomPath(e.target.value)}
                    placeholder="custom-path"
                    pattern="^[a-zA-Z0-9-_]*$"
                    title="Only letters, numbers, hyphens and underscores allowed"
                    className="flex-1 bg-transparent focus:outline-none text-gray-900 dark:text-white
                      placeholder-gray-400 dark:placeholder-gray-500 min-w-0"
                  />
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Only letters, numbers, hyphens and underscores allowed
                </p>
              </div>

              <div>
                <label htmlFor="expiry" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Link Expiration (Optional)
                </label>
                <select
                  id="expiry"
                  value={expiry}
                  onChange={(e) => setExpiry(e.target.value)}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg 
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                    bg-transparent text-gray-900 dark:text-white"
                >
                  <option value="">No expiration</option>
                  <option value="3600">1 hour</option>
                  <option value="86400">1 day</option>
                  <option value="604800">1 week</option>
                  <option value="2592000">1 month</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                text-white font-medium transition-colors border border-gray-400/20
                disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <FiLoader className="w-5 h-5 animate-spin" />
                  Shortening...
                </span>
              ) : (
                'Shorten URL'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-6 p-4 bg-white dark:bg-black border border-red-200/50 dark:border-red-800/50 rounded-lg">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {shortUrl && (
            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg">
              <p className="text-green-700 dark:text-green-300 mb-2">Your shortened URL:</p>
              <div className="flex items-center gap-2">
                <a
                  href={shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-blue-600 dark:text-blue-400 hover:underline break-all"
                >
                  {shortUrl}
                </a>
                <button
                  onClick={() => handleCopy(shortUrl, 'new')}
                  className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 bg-gray-400/10 border border-gray-400/20 rounded-lg transition-colors"
                  title={copiedId === 'new' ? 'Copied!' : 'Copy to clipboard'}
                >
                  {copiedId === 'new' ? (
                    <FiCheck className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {session && (
          <div className="mt-12">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Your Links</h2>
            {isLoadingLinks ? (
              <div className="flex justify-center">
                <FiLoader className="w-6 h-6 animate-spin text-gray-500 dark:text-gray-400" />
              </div>
            ) : linksError ? (
              <div className="text-center text-red-500">{linksError}</div>
            ) : links.length === 0 ? (
              <div className="text-center text-gray-500 dark:text-gray-400">No links created yet</div>
            ) : (
              <div className="space-y-4">
                {links.map((link) => (
                  <div
                    key={link.shortId}
                    className="bg-white dark:bg-black border border-gray-400/20 rounded-xl p-4"
                  >
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Link Details</h3>
                        <div className="flex items-center gap-2">
                          {editingId === link.shortId ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(null)
                                  setEditedValues(prev => {
                                    const next = { ...prev }
                                    delete next[link.shortId]
                                    return next
                                  })
                                }}
                                className="p-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 bg-gray-400/10 rounded-lg border border-gray-400/20"
                                disabled={isUpdating[link.shortId]}
                              >
                                <FiX className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleSaveChanges(link.shortId)}
                                className="p-3 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 bg-gray-400/10 rounded-lg border border-gray-400/20"
                                disabled={isUpdating[link.shortId]}
                              >
                                {isUpdating[link.shortId] ? (
                                  <FiLoader className="w-5 h-5 animate-spin" />
                                ) : (
                                  <FiCheck className="w-5 h-5" />
                                )}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(link.shortId)
                                  setEditedValues(prev => ({
                                    ...prev,
                                    [link.shortId]: {
                                      shortId: link.shortId,
                                      originalUrl: link.originalUrl,
                                      expiresAt: link.expiresAt ? String(Math.floor((new Date(link.expiresAt).getTime() - Date.now()) / 1000)) : ''
                                    }
                                  }))
                                }}
                                className="p-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-gray-400/10 rounded-lg border border-gray-400/20"
                              >
                                <FiEdit2 className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDelete(link.shortId)}
                                className="p-3 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 bg-gray-400/10 rounded-lg border border-gray-400/20"
                                disabled={isUpdating[link.shortId]}
                              >
                                {isUpdating[link.shortId] ? (
                                  <FiLoader className="w-5 h-5 animate-spin" />
                                ) : (
                                  <Trash2 className="w-5 h-5" />
                                )}
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2 min-w-0">
                          <label className="text-sm text-gray-500 dark:text-gray-400">Original URL</label>
                          {editingId === link.shortId ? (
                            <input
                              type="url"
                              value={editedValues[link.shortId]?.originalUrl ?? link.originalUrl}
                              onChange={(e) => setEditedValues(prev => ({
                                ...prev,
                                [link.shortId]: { ...prev[link.shortId], originalUrl: e.target.value }
                              }))}
                              className="w-full p-2 text-blue-600 dark:text-blue-400 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                            />
                          ) : (
                            <a
                              href={link.originalUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block text-blue-600 dark:text-blue-400 hover:underline break-all"
                            >
                              {link.originalUrl}
                            </a>
                          )}
                        </div>

                        <div className="space-y-2 min-w-0">
                          <label className="text-sm text-gray-500 dark:text-gray-400">Short URL</label>
                          <div className="flex items-center gap-2 overflow-hidden">
                            {editingId === link.shortId ? (
                              <div className="flex items-center gap-2 w-full">
                                <span className="text-gray-500 dark:text-gray-400 shrink-0">{process.env.NEXT_PUBLIC_BASE_URL}/</span>
                                <input
                                  type="text"
                                  value={editedValues[link.shortId]?.shortId ?? link.shortId}
                                  onChange={(e) => setEditedValues(prev => ({
                                    ...prev,
                                    [link.shortId]: { ...prev[link.shortId], shortId: e.target.value }
                                  }))}
                                  pattern="^[a-zA-Z0-9-_]*$"
                                  className="min-w-0 flex-1 p-2 text-blue-600 dark:text-blue-400 bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                                />
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 min-w-0 overflow-hidden">
                                <a
                                  href={`${process.env.NEXT_PUBLIC_BASE_URL}/${link.shortId}`}
                                  target="_blank"
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 dark:text-blue-400 hover:underline truncate"
                                >
                                  {process.env.NEXT_PUBLIC_BASE_URL}/{link.shortId}
                                </a>
                                <button
                                  onClick={() => handleCopy(`${process.env.NEXT_PUBLIC_BASE_URL}/${link.shortId}`, link.shortId)}
                                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 bg-gray-400/10 shrink-0 border border-gray-400/20 rounded-lg transition-colors"
                                  title={copiedId === link.shortId ? 'Copied!' : 'Copy to clipboard'}
                                >
                                  {copiedId === link.shortId ? (
                                    <FiCheck className="w-4 h-4 text-green-500" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2 md:col-span-2">
                          <label className="text-sm text-gray-500 dark:text-gray-400">Expiration</label>
                          {editingId === link.shortId ? (
                            <select
                              value={editedValues[link.shortId]?.expiresAt ?? ''}
                              onChange={(e) => setEditedValues(prev => ({
                                ...prev,
                                [link.shortId]: { ...prev[link.shortId], expiresAt: e.target.value }
                              }))}
                              className="w-full p-2 text-gray-900 dark:text-white bg-transparent border border-gray-300 dark:border-gray-600 rounded-lg focus:border-blue-500 focus:outline-none"
                            >
                              <option value="">No expiration</option>
                              <option value="3600">1 hour</option>
                              <option value="86400">1 day</option>
                              <option value="604800">1 week</option>
                              <option value="2592000">1 month</option>
                            </select>
                          ) : link.expiresAt ? (
                            <p className="text-gray-900 dark:text-white">
                              Expires {formatRelativeTime(link.expiresAt)}
                              <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                                ({formatDate(link.expiresAt)})
                              </span>
                            </p>
                          ) : (
                            <p className="text-gray-500 dark:text-gray-400">No expiration</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
