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
import { signInWithMagicLink, signInWithGoogle } from '@/lib/auth/actions'

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
    
    const result = await signInWithGoogle(redirectTo || undefined)
    
    if (result?.error) {
      setMessage({ type: 'error', text: result.error })
      setLoading(false)
    }
    // If successful, user will be redirected
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background via-background to-teal-50/30 dark:to-teal-950/10 p-4">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0F766E0a_1px,transparent_1px),linear-gradient(to_bottom,#0F766E0a_1px,transparent_1px)] bg-[size:24px_24px]" />
      
      <Card className="relative w-full max-w-md card-elevated border-border/50">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-5 w-14 h-14 bg-gradient-to-br from-teal-600 to-teal-700 rounded-2xl flex items-center justify-center shadow-lg shadow-teal-700/20 text-white">
            <span className="text-2xl">⏰</span>
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight text-teal-950 dark:text-teal-50">Welcome back</CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            Sign in to schedule fair meetings
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-5">
          {/* Google Sign In */}
          <Button 
            variant="outline" 
            className="w-full h-11 rounded-lg font-medium hover:bg-slate-50 transition-colors border-slate-200" 
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
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-950 px-2 text-muted-foreground">
                Or continue with email
              </span>
            </div>
          </div>

          {/* Magic Link Form */}
          <form onSubmit={handleMagicLink} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11 rounded-lg border-slate-200 focus:border-teal-500 focus:ring-teal-500"
              />
            </div>
            
            <Button type="submit" variant="shine" className="w-full h-11 rounded-lg btn-primary-gradient bg-teal-700 hover:bg-teal-800" disabled={loading}>
              {loading ? 'Sending...' : 'Send Magic Link'}
            </Button>
          </form>

          {/* Message */}
          {message && (
            <div className={`p-3 rounded-md text-sm ${
              message.type === 'error' 
                ? 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400 border border-rose-100' 
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100'
            }`}>
              {message.text}
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2 text-center text-sm text-muted-foreground">
          <p>
            By continuing, you agree to our{' '}
            <Link href="/terms" className="underline hover:text-teal-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-teal-700">
              Privacy Policy
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
