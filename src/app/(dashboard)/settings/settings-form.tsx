'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { TimezonePicker } from '@/components/timezone-picker'
import { EnergyPreferences } from '@/components/energy-preferences'
import { createClient } from '@/lib/supabase/client'
import { User, Globe, Zap, Bell, Save, Loader2, CreditCard, Crown, ExternalLink } from 'lucide-react'
import { useSubscription } from '@/hooks/useSubscription'
import { SubscriptionBadge } from '@/components/premium-gate'
import { ReferralShare } from '@/components/referral-share'
import { formatPrice, PRICING } from '@/lib/stripe'
import Link from 'next/link'
import { toast } from 'sonner'

interface EnergyProfile {
  workStart: number
  workEnd: number
  goldenStart: number
  goldenEnd: number
  energyType: 'early_bird' | 'night_owl' | 'balanced'
}

interface UserData {
  id: string
  email: string
  name: string
  timezone: string
  avatar_url: string
  energy_profile: EnergyProfile | null
  preferences: {
    email_notifications?: boolean
    meeting_reminders?: boolean
    weekly_digest?: boolean
  }
  calendarConnected?: boolean
}

interface SettingsFormProps {
  initialData: UserData
}

export function SettingsForm({ initialData }: SettingsFormProps) {
  const router = useRouter()
  const supabase = createClient()
  
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState<UserData>(initialData)

  const initials = formData.name 
    ? formData.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : formData.email?.charAt(0).toUpperCase() || '?'

  const handleSave = async () => {
    setLoading(true)
    
    try {
       
      const { error } = await (supabase.from('users') as any).upsert({
        id: formData.id,
        email: formData.email,
        name: formData.name,
        timezone: formData.timezone,
        avatar_url: formData.avatar_url,
        energy_profile: formData.energy_profile,
        preferences: formData.preferences,
        updated_at: new Date().toISOString(),
      })

      if (error) throw error
      
      toast.success('Settings saved successfully')
      router.refresh()
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('Failed to save settings. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-teal-50 dark:bg-teal-900/50">
              <User className="h-5 w-5 text-teal-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Profile</CardTitle>
              <CardDescription className="text-[13px]">
                Your personal information
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 ring-4 ring-teal-50 dark:ring-teal-900/20">
              <AvatarImage src={formData.avatar_url} alt={formData.name} />
              <AvatarFallback className="text-lg bg-teal-100 text-teal-700">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-sm font-medium">{formData.email}</p>
              <p className="text-xs text-muted-foreground">
                Profile picture synced from your login provider
              </p>
            </div>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="focus-visible:ring-teal-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timezone Section */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-sky-50 dark:bg-sky-950/50">
              <Globe className="h-5 w-5 text-sky-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Timezone</CardTitle>
              <CardDescription className="text-[13px]">
                Your local timezone for accurate scheduling
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-w-md">
            <TimezonePicker
              value={formData.timezone}
              onChange={(tz) => setFormData({ ...formData, timezone: tz })}
            />
            <p className="text-xs text-muted-foreground mt-2">
              All meeting times will be displayed in this timezone
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Energy Preferences Section */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
              <Zap className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Energy Preferences</CardTitle>
              <CardDescription className="text-[13px]">
                Help us find meeting times when you&apos;re at your best
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EnergyPreferences
            value={formData.energy_profile || undefined}
            onChange={(profile) => setFormData({ ...formData, energy_profile: profile })}
          />
        </CardContent>
      </Card>

      {/* Subscription & Billing Section */}
      <BillingSection />

      {/* Referral Section */}
      <ReferralShare />

      {/* Notification Preferences */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-950/50">
              <Bell className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Notifications</CardTitle>
              <CardDescription className="text-[13px]">
                Configure how you receive updates
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive email updates about meetings and invites
              </p>
            </div>
            <Switch
              checked={formData.preferences?.email_notifications ?? true}
              onCheckedChange={(checked) => 
                setFormData({ 
                  ...formData, 
                  preferences: { ...formData.preferences, email_notifications: checked } 
                })
              }
              className="data-[state=checked]:bg-teal-600"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Meeting Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Get reminded before your scheduled meetings
              </p>
            </div>
            <Switch
              checked={formData.preferences?.meeting_reminders ?? true}
              onCheckedChange={(checked) => 
                setFormData({ 
                  ...formData, 
                  preferences: { ...formData.preferences, meeting_reminders: checked } 
                })
              }
              className="data-[state=checked]:bg-teal-600"
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Receive a weekly summary of your meeting fairness
              </p>
            </div>
            <Switch
              checked={formData.preferences?.weekly_digest ?? false}
              onCheckedChange={(checked) => 
                setFormData({ 
                  ...formData, 
                  preferences: { ...formData.preferences, weekly_digest: checked } 
                })
              }
              className="data-[state=checked]:bg-teal-600"
            />
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading} size="lg" className="rounded-lg px-6 h-11 bg-teal-700 hover:bg-teal-800 text-white shadow-md">
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

/**
 * Billing Section Component
 * Shows current subscription status and manage billing button
 */
function BillingSection() {
  const {
    isPro,
    isTrialing,
    isLoading,
    status,
    currentPeriodEnd,
    trialEndsAt,
    redirectToPortal,
  } = useSubscription()

  const [portalLoading, setPortalLoading] = React.useState(false)

  const handleManageBilling = async () => {
    setPortalLoading(true)
    try {
      await redirectToPortal()
    } catch {
      toast.error('Failed to open billing portal')
    } finally {
      setPortalLoading(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return null
    return new Intl.DateTimeFormat('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }).format(date)
  }

  return (
    <Card className="card-elevated">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50">
              <CreditCard className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold tracking-tight">Subscription</CardTitle>
              <CardDescription className="text-[13px]">
                Manage your billing and subscription
              </CardDescription>
            </div>
          </div>
          <SubscriptionBadge />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isPro ? (
          <>
            {/* Pro user content */}
            <div className="rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50 p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-400 to-orange-500">
                  <Crown className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">
                    ClockAlign Pro
                  </p>
                  <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
                    {isTrialing ? (
                      <>Trial ends {formatDate(trialEndsAt)}</>
                    ) : status === 'past_due' ? (
                      <span className="text-red-600">Payment past due</span>
                    ) : (
                      <>Renews {formatDate(currentPeriodEnd)}</>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleManageBilling}
                  disabled={portalLoading}
                  className="rounded-lg border-amber-200 hover:bg-amber-100/50 dark:border-amber-800 dark:hover:bg-amber-900/50"
                >
                  {portalLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Manage Billing
                      <ExternalLink className="ml-2 h-3.5 w-3.5" />
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Usage stats placeholder */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-teal-600">∞</p>
                <p className="text-xs text-muted-foreground">Teams</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-teal-600">∞</p>
                <p className="text-xs text-muted-foreground">Members</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30 col-span-2 md:col-span-1">
                <p className="text-2xl font-bold text-emerald-600">✓</p>
                <p className="text-xs text-muted-foreground">All Features</p>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Free user content */}
            <div className="rounded-xl border border-dashed p-4">
              <p className="text-sm text-muted-foreground mb-3">
                You&apos;re on the <strong>Free</strong> plan. Upgrade to Pro for unlimited teams, leaderboards, and more.
              </p>
              <div className="flex gap-3">
                <Button
                  asChild
                  className="rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                >
                  <Link href="/pricing">
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Pro
                  </Link>
                </Button>
              </div>
            </div>

            {/* Free tier limits */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-amber-600">1</p>
                <p className="text-xs text-muted-foreground">Team</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-amber-600">5</p>
                <p className="text-xs text-muted-foreground">Members max</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Start with a 7-day free trial • {formatPrice(PRICING.monthly.amount)}/month after
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
