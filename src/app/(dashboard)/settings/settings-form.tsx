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
import { User, Globe, Zap, Bell, Save, Loader2 } from 'lucide-react'
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      {/* Notification Preferences */}
      <Card className="card-elevated">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/50">
              <Bell className="h-5 w-5 text-rose-500" />
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
