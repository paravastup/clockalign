/**
 * New Meeting Page
 * Uses the multi-step meeting creation form
 */

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { MeetingForm } from '@/components/meetings/meeting-form'

export default async function NewMeetingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="py-6">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Schedule a Meeting</h1>
        <p className="text-muted-foreground mt-1">
          Find the perfect time that works for everyone
        </p>
      </div>
      
      <MeetingForm />
    </div>
  )
}
