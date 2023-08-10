import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

const stripe = new Stripe(process.env.STRIPE_API_KEY as string, { apiVersion: '2022-11-15' });

export async function handler(req: NextApiRequest, res: NextApiResponse) {
    const supabase = createRouteHandlerClient({ cookies })
    let body = '';

    for await (const chunk of req) {
        body += chunk;
    }
    const signature = req.headers['stripe-signature']

    let eventStripe: Stripe.Event;

    try {
        eventStripe = stripe.webhooks.constructEvent(body, signature as string, process.env.STRIPE_ENDPOINT_SECRET as string);
    } catch (error) {
        return {
            error: `Webhook error.${error}`
        }
    }

    let subscription = eventStripe.data.object as Stripe.Subscription;

    const {data: userData } = await supabase.from('profile').select('id').eq('stripe_customer', subscription.customer).single()
    switch(eventStripe.type) {
        case "customer.subscription.updated":
            await supabase
            .from('profile')
            .update({
                is_subscribed: true,
                interval: subscription.items.data[0].plan.interval,
                current_period_end: new Date(subscription.current_period_end * 1000),
                subscription_id: subscription.id,
                cancel_at_period_end: subscription.cancel_at_period_end,
            } as never)
            .eq('stripe_customer', subscription.customer)
        case "customer.subscription.deleted":
            await supabase
            .from('profile')
            .update({
                is_subscribed: false,
                interval: null,
                current_period_end: new Date(subscription.current_period_end * 1000),
                cancel_at_period_end: subscription.cancel_at_period_end,
            } as never)
            .eq('stripe_customer', subscription.customer)
            break;
    }

    return NextResponse.json({message: 'success'})
}