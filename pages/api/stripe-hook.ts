import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe'
import { buffer } from "micro";
import Cors from 'micro-cors';
import { createClient } from '@supabase/supabase-js'
const supabase = createClient('https://uqmhkgcuncofzrgodkwj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbWhrZ2N1bmNvZnpyZ29ka3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTEwNzY0ODMsImV4cCI6MjAwNjY1MjQ4M30.54bIT9pPwx2O6Iibv9-NV1w4DZQEfKDzHqESCUK-wTI')

const stripe = new Stripe(process.env.STRIPE_API_KEY as string, { apiVersion: '2022-11-15' });
const webhookSecret: string = process.env.STRIPE_ENDPOINT_SECRET!

const cors = Cors({
    allowMethods: ['POST', 'HEAD'],
});


export const config = {
    api: {
        bodyParser: false,
    },
}

const webhookHandler = async (req: NextApiRequest, res: NextApiResponse) => {
    if (req.method === 'POST') {
        const buf = await buffer(req)
        const sig = req.headers['stripe-signature']!

        let event: Stripe.Event

        try {
            event = stripe.webhooks.constructEvent(buf.toString(), sig, webhookSecret)
        } catch (err) {
            // On error, log and return the error message
            res.status(400).send(`Webhook Error: ${err}`)
            return
        }

        let subscription = event.data.object as Stripe.Subscription;
        let current_period_ends: Date = new Date(
            subscription.current_period_end * 1000
        );

        switch (event.type) {
            case "customer.subscription.updated":
                await supabase
                    .from('profile')
                    .update({
                        is_subscribed: true,
                        interval: subscription.items.data[0].plan.interval,
                        current_period_start: new Date(subscription.current_period_start * 1000),
                        current_period_end: new Date(subscription.current_period_end * 1000),
                        current_price_id: subscription.items.data[0].price.id,
                        subscription_id: subscription.id,
                        cancel_at_period_end: subscription.cancel_at_period_end,
                    } as never)
                    .eq('stripe_customer', subscription.customer)
                break;
            case "customer.subscription.deleted":
                await supabase
                    .from('profile')
                    .update({
                        is_subscribed: false,
                        interval: null,
                        current_period_start: null,
                        current_period_end: null,
                        current_price_id: null,
                        subscription_id: null,
                        cancel_at_period_end: null,
                    } as never)
                    .eq('stripe_customer', subscription.customer)
                break;
        }
        res.status(200).json({ message: 'success' })
    }
}

export default cors(webhookHandler as any);
