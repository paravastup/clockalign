/**
 * Create Team Page
 * Multi-step team creation flow
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateTeamForm } from './create-team-form'

export default async function CreateTeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/login')
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Create Team</h1>
        <p className="text-muted-foreground">
          Set up your distributed team to start tracking meeting fairness
        </p>
      </div>
      
      <CreateTeamForm userId={user.id} />
    </div>
  )
}
