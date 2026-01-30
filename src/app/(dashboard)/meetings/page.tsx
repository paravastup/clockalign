/**
 * Meetings List Page
 * View and manage scheduled meetings
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Calendar, Plus, Clock } from 'lucide-react'

export default async function MeetingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Placeholder - will fetch actual meetings later
  const meetings: never[] = []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Meetings</h1>
          <p className="text-muted-foreground">
            Schedule and manage your cross-timezone meetings
          </p>
        </div>
        <Button asChild>
          <Link href="/meetings/new">
            <Plus className="mr-2 h-4 w-4" />
            New Meeting
          </Link>
        </Button>
      </div>

      {meetings.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No meetings scheduled</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Schedule your first meeting to see it here. ClockAlign will help you find 
              fair times across all participants&apos; timezones.
            </p>
            <Button size="lg" asChild>
              <Link href="/meetings/new">
                <Plus className="mr-2 h-4 w-4" />
                Schedule a Meeting
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {/* Meeting cards will go here */}
        </div>
      )}

      {/* Coming Soon Section */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Meeting Scheduling (Coming in Day 5)
          </CardTitle>
          <CardDescription>
            Full meeting scheduling with time finder, sacrifice scores, and calendar integration
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="font-medium mb-1">🔍 Time Finder</div>
              <p className="text-muted-foreground">
                Find optimal meeting times across multiple timezones
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="font-medium mb-1">📊 Sacrifice Scores</div>
              <p className="text-muted-foreground">
                See who&apos;s taking the hit for each proposed time
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <div className="font-medium mb-1">✨ Golden Windows</div>
              <p className="text-muted-foreground">
                Schedule when everyone is sharp, not just awake
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
