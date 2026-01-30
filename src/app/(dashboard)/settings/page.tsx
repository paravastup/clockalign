/**
 * Settings Page
 * User profile, timezone, energy preferences, and notifications
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Fetch user profile
  interface UserProfile {
    name: string | null
    timezone: string
    avatar_url: string | null
    energy_profile: unknown
    preferences: Record<string, unknown>
  }
  const { data: profile } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single() as { data: UserProfile | null }

  // Merge auth user data with profile
  const userData = {
    id: user.id,
    email: user.email || '',
    name: profile?.name || user.user_metadata?.name || user.user_metadata?.full_name || '',
    timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
    avatar_url: profile?.avatar_url || user.user_metadata?.avatar_url || '',
    energy_profile: profile?.energy_profile as {
      workStart: number
      workEnd: number
      goldenStart: number
      goldenEnd: number
      energyType: 'early_bird' | 'night_owl' | 'balanced'
    } | null,
    preferences: (profile?.preferences || {}) as {
      email_notifications?: boolean
      meeting_reminders?: boolean
      weekly_digest?: boolean
    },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>
      
      <SettingsForm initialData={userData} />
    </div>
  )
}
