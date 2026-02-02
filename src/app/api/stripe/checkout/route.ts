/**
 * Stripe Checkout Session API Route
 * Creates a Stripe Checkout session for subscription purchases
 */
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripe, PRICING } from '@/lib/stripe'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { priceType = 'monthly' } = body as { priceType?: 'monthly' | 'yearly' }

    // Get the price ID based on the plan type
    const priceId = priceType === 'yearly'
      ? PRICING.yearly.priceId
      : PRICING.monthly.priceId

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured. Please set STRIPE_PRICE_ID_MONTHLY and STRIPE_PRICE_ID_YEARLY.' },
        { status: 500 }
      )
    }

    // Fetch user profile to get or create Stripe customer
    interface UserProfile {
      stripe_customer_id: string | null
      email: string
      name: string | null
    }
    const { data: profile } = await supabase
      .from('users')
      .select('stripe_customer_id, email, name')
      .eq('id', user.id)
      .single() as { data: UserProfile | null }

    let customerId = profile?.stripe_customer_id

    // Create Stripe customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || profile?.email || undefined,
        name: profile?.name || undefined,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Store customer ID in database
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from('users') as any)
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id)
    }

    // Get the base URL for redirects
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      // 7-day free trial
      subscription_data: {
        trial_period_days: PRICING.trialDays,
        metadata: {
          supabase_user_id: user.id,
        },
      },
      success_url: `${origin}/settings?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing?canceled=true`,
      // Allow promotion codes
      allow_promotion_codes: true,
      // Collect billing address for tax purposes
      billing_address_collection: 'auto',
      // Customer can update their info
      customer_update: {
        address: 'auto',
        name: 'auto',
      },
      metadata: {
        supabase_user_id: user.id,
        price_type: priceType,
      },
    })

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
  } catch (error) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
