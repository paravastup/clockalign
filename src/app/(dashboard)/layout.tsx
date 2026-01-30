/**
 * Dashboard Layout
 * Protected layout with sidebar + header for authenticated pages
 */
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppShell } from '@/components/layout'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  
  if (!authUser) {
    redirect('/login')
  }

  // Fetch user profile from database
  const { data: profile } = await supabase
    .from('users')
    .select('name, timezone, avatar_url')
    .eq('id', authUser.id)
    .single() as { data: { name: string | null; timezone: string; avatar_url: string | null } | null }

  const user = {
    email: authUser.email,
    name: profile?.name || authUser.user_metadata?.name || authUser.user_metadata?.full_name,
    avatar_url: profile?.avatar_url || authUser.user_metadata?.avatar_url,
    timezone: profile?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
  }

  return <AppShell user={user}>{children}</AppShell>
}
