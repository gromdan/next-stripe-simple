import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';

const stripe = new Stripe(process.env.STRIPE_API_KEY as string, { apiVersion: '2022-11-15' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const stripeCustomer = {
        stripe_customer: 'cus_ONsOK10HKKwx02'
    }
    
    if(stripeCustomer?.stripe_customer) {
        const session = await stripe.billingPortal.sessions.create({
            customer: stripeCustomer?.stripe_customer,
            return_url: `${process.env.CLIENT_URL}/pricing`,
        })

        res.status(200).json({ url: session.url })
    }
}