/**
 * Stripe Webhook Handler
 * Handles subscription lifecycle events from Stripe
 */
import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Lazy-initialized Supabase admin client (bypasses RLS)
let supabaseAdmin: SupabaseClient | null = null

function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdmin) {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase environment variables not configured')
    }
    supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
  }
  return supabaseAdmin
}

// Stripe webhook secret for signature verification
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    console.error('No stripe-signature header')
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error('Webhook signature verification failed:', message)
    return NextResponse.json(
      { error: `Webhook Error: ${message}` },
      { status: 400 }
    )
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        await handleCheckoutComplete(session)
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionUpdate(subscription)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        await handleSubscriptionDeleted(subscription)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentFailed(invoice)
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        await handlePaymentSucceeded(invoice)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful checkout - initial subscription setup
 */
async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.supabase_user_id
  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  if (!userId) {
    console.error('No user ID in checkout session metadata')
    return
  }

  // Fetch the subscription details with items expanded
  const subscriptionResponse = await stripe.subscriptions.retrieve(subscriptionId, {
    expand: ['items.data'],
  })
  const subscription = subscriptionResponse as Stripe.Subscription

  const tier = 'pro'
  const status = mapStripeStatus(subscription.status)

  // Get current_period_end from the first subscription item
  const firstItem = subscription.items?.data?.[0]
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (getSupabaseAdmin().from('users') as any)
    .update({
      stripe_customer_id: customerId,
      subscription_id: subscriptionId,
      subscription_status: status,
      subscription_tier: tier,
      current_period_end: currentPeriodEnd,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    })
    .eq('id', userId)

  console.log(`Checkout complete for user ${userId}: ${status} subscription`)
}

/**
 * Handle subscription updates (renewals, plan changes, trial endings)
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  const status = mapStripeStatus(subscription.status)

  // Determine tier based on subscription status
  const tier = subscription.status === 'active' || subscription.status === 'trialing'
    ? 'pro'
    : 'free'

  // Get current_period_end from the first subscription item
  const firstItem = subscription.items?.data?.[0]
  const currentPeriodEnd = firstItem?.current_period_end
    ? new Date(firstItem.current_period_end * 1000).toISOString()
    : null

  // Find user by Stripe customer ID
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: user, error } = await (getSupabaseAdmin().from('users') as any)
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single() as { data: { id: string } | null, error: Error | null }

  if (error || !user) {
    // Try to find by metadata
    const userId = subscription.metadata?.supabase_user_id
    if (userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (getSupabaseAdmin().from('users') as any)
        .update({
          subscription_id: subscription.id,
          subscription_status: status,
          subscription_tier: tier,
          current_period_end: currentPeriodEnd,
          trial_ends_at: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        })
        .eq('id', userId)

      console.log(`Subscription updated for user ${userId}: ${status}`)
      return
    }
    console.error('Could not find user for subscription update')
    return
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (getSupabaseAdmin().from('users') as any)
    .update({
      subscription_id: subscription.id,
      subscription_status: status,
      subscription_tier: tier,
      current_period_end: currentPeriodEnd,
      trial_ends_at: subscription.trial_end
        ? new Date(subscription.trial_end * 1000).toISOString()
        : null,
    })
    .eq('id', user.id)

  console.log(`Subscription updated for user ${user.id}: ${status}`)
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (getSupabaseAdmin().from('users') as any)
    .update({
      subscription_status: 'canceled',
      subscription_tier: 'free',
      // Keep subscription_id for reference
    })
    .eq('stripe_customer_id', customerId)

  console.log(`Subscription canceled for customer ${customerId}`)
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (getSupabaseAdmin().from('users') as any)
    .update({
      subscription_status: 'past_due',
    })
    .eq('stripe_customer_id', customerId)

  console.log(`Payment failed for customer ${customerId}`)

  // TODO: Send email notification to user about failed payment
}

/**
 * Handle successful payment (clears past_due status)
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const customerId = invoice.customer as string

  // Only update if this is for a subscription (check via parent.subscription_details)
  const hasSubscription = invoice.parent?.subscription_details?.subscription
  if (hasSubscription) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (getSupabaseAdmin().from('users') as any)
      .update({
        subscription_status: 'active',
        subscription_tier: 'pro',
      })
      .eq('stripe_customer_id', customerId)

    console.log(`Payment succeeded for customer ${customerId}`)
  }
}

/**
 * Map Stripe subscription status to our internal status
 */
function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  const statusMap: Record<Stripe.Subscription.Status, string> = {
    active: 'active',
    past_due: 'past_due',
    canceled: 'canceled',
    unpaid: 'past_due',
    trialing: 'trialing',
    incomplete: 'incomplete',
    incomplete_expired: 'canceled',
    paused: 'canceled',
  }
  return statusMap[stripeStatus] || 'free'
}
