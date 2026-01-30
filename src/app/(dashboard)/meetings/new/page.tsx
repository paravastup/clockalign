/**
 * New Meeting Page
 * Create a new meeting with participants
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calendar } from 'lucide-react'

export default async function NewMeetingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/meetings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">New Meeting</h1>
          <p className="text-muted-foreground">
            Schedule a meeting across timezones
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <Card className="border-dashed">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-4">
            <Calendar className="h-8 w-8 text-amber-600" />
          </div>
          <CardTitle>Coming Soon - Day 5</CardTitle>
          <CardDescription>
            Meeting creation with smart time finder is being built
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4 opacity-50 pointer-events-none">
            <div className="space-y-2">
              <Label>Meeting Title</Label>
              <Input placeholder="Weekly Team Standup" disabled />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Duration</Label>
                <Input placeholder="30 minutes" disabled />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Input placeholder="Standup" disabled />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Participants</Label>
              <Input placeholder="Add team members..." disabled />
            </div>
          </div>

          <div className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <h4 className="font-medium text-amber-800 dark:text-amber-200 mb-2">What&apos;s coming:</h4>
            <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-1">
              <li>• Add participants and detect their timezones</li>
              <li>• Smart time finder that respects everyone&apos;s work hours</li>
              <li>• Sacrifice Score preview for each proposed time</li>
              <li>• Golden Window optimization</li>
              <li>• Async nudge when meeting could be an email</li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="ghost" asChild>
              <Link href="/meetings">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <Button disabled>
              Find Times
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
