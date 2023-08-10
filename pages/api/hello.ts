import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_API_KEY as string, { apiVersion: '2022-11-15' });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.status(200).json({ message: 'hello' })
}