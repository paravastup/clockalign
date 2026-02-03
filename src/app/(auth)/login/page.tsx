/**
 * Login Page
 * Magic link + Google OAuth
 */
'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { signInWithMagicLink } from '@/lib/auth/actions'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirect')
  const errorParam = searchParams.get('error')
  
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(
    errorParam ? { type: 'error', text: errorParam } : null
  )

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)

    const formData = new FormData()
    formData.set('email', email)
    if (redirectTo) formData.set('redirectTo', redirectTo)

    const result = await signInWithMagicLink(formData)
    
    if (result.error) {
      setMessage({ type: 'error', text: result.error })
    } else if (result.success) {
      setMessage({ type: 'success', text: result.message || 'Check your email!' })
    }
    
    setLoading(false)
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setMessage(null)

    const supabase = createClient()
    const origin = window.location.origin
    const nextParam = redirectTo ? `?next=${encodeURIComponent(redirectTo)}` : ''
    const redirectToUrl = `${origin}/auth/callback${nextParam}`

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectToUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: true,
      },
    })

    if (error) {
      setMessage({ type: 'error', text: error.message })
      setLoading(false)
      return
    }

    if (data?.url) {
      window.location.assign(data.url)
      return
    }

    setMessage({ type: 'error', text: 'Failed to initiate Google sign in' })
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-white via-teal-50/20 to-white dark:from-zinc-950 dark:via-teal-950/10 dark:to-zinc-950 p-4 relative overflow-hidden">
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-radial from-teal-200/30 via-transparent to-transparent dark:from-teal-900/15 blur-3xl pointer-events-none" />
      
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0d948808_1px,transparent_1px),linear-gradient(to_bottom,#0d948808_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <Card className="relative w-full max-w-md glass shadow-2xl shadow-teal-900/5 border-teal-100/50 dark:border-teal-800/30">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-5 w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-700 rounded-2xl flex items-center justify-center shadow-xl shadow-teal-600/25 text-white ring-4 ring-teal-100 dark:ring-teal-900/30">
            <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight bg-gradient-to-r from-teal-900 to-teal-700 dark:from-teal-100 dark:to-teal-300 bg-clip-text text-transparent">
            Welcome back
          </CardTitle>
          <CardDescription className="text-base text-zinc-500 dark:text-zinc-400 mt-2">
            Sign in to schedule fair meetings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-5">
          {/* Google Sign In */}
          <Button 
            variant="outline" 
            className="w-full h-12 rounded-xl font-medium bg-white hover:bg-zinc-50 transition-all duration-300 border-zinc-200 hover:border-zinc-300 shadow-sm" 
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <svg className="mr-2.5 h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white/80 dark:bg-zinc-950/80 backdrop-blur px-3 text-zinc-400 font-medium tracking-wide">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 focus:border-teal-500 focus:ring-teal-500/20 transition-all"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 rounded-xl btn-primary-gradient" 
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Sending...
                </span>
              ) : 'Send Magic Link'}
            </Button>
          </form>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-xl text-sm ${
              message.type === 'error'
                ? 'bg-red-50/80 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800/50'
                : 'bg-teal-50/80 text-teal-700 dark:bg-teal-900/20 dark:text-teal-300 border border-teal-200 dark:border-teal-800/50'
            }`}>
              <div className="flex items-center gap-2">
                {message.type === 'error' ? (
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                ) : (
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
                {message.text}
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center text-sm text-zinc-500 dark:text-zinc-400 pt-2">
          <p>
            By continuing, you agree to our{' '}
            <Link href="/terms" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium transition-colors">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300 font-medium transition-colors">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
