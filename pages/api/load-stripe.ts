import Stripe from 'stripe';
import { NextApiRequest, NextApiResponse } from 'next';

const stripe = new Stripe(process.env.STRIPE_API_KEY as string, { apiVersion: '2022-11-15' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const body = JSON.parse(req.body)
 
     const lineItems = [{
         price: body.priceId,
         quantity: 1
     }]
 
     const session = await stripe.checkout.sessions.create({
         customer: body.stripe_customer,
         mode: 'subscription',
         payment_method_types: ['card'],
         line_items: lineItems,
         success_url: `${process.env.CLIENT_URL}/pricing`,
         cancel_url: `${process.env.CLIENT_URL}/pricing`,
     })

    res.status(200).json({ id: session.id })
}