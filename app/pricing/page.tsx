'use client'

import '../../public/css/pricing.css'
import React, {useState, useEffect} from 'react'
import { createClient } from '@supabase/supabase-js'
import { loadStripe } from '@stripe/stripe-js';
import { useRouter } from 'next/navigation'
import { profile } from 'console';

const supabase = createClient('https://uqmhkgcuncofzrgodkwj.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxbWhrZ2N1bmNvZnpyZ29ka3dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2OTEwNzY0ODMsImV4cCI6MjAwNjY1MjQ4M30.54bIT9pPwx2O6Iibv9-NV1w4DZQEfKDzHqESCUK-wTI')

export default function Page() {
    const [prices, setPrices] = useState([])
    const router = useRouter()
    const [isSubscribed, setIsSubscribed] = useState(false)
    const [currentPeriodStart, setCurrentPeriodStart] = useState()
    const [currentPeriodEnd, setCurrentPeriodEnd] = useState()
    const [currentPriceId, setCurrentPriceId] = useState()
    const [cancelAtPeriodEnd, setCancelAtPeriodend] = useState()

    const loadPortal = async () => {
        const response = await fetch('/api/portal');
        const data = await response.json();
        router.push(data.url)
    }

    const clickGetStared = async(priceId: string) => {
        const stripeCustomer = {stripe_customer: 'cus_ONsOK10HKKwx02'}
        const response = await fetch('/api/load-stripe', {
          method: 'post',
          body: JSON.stringify({ stripe_customer: stripeCustomer?.stripe_customer, priceId: priceId })
        });

        const data = await response.json();

        if (response) {
            const stripe = await loadStripe("pk_test_51Nb3RuDTbe8mQ1678sOhJh0EOg1dI9QoSBQIIw0QVtzlttlfbSi1qbDjLPzx8q2C2Ps8D9VTogLSk80CXbZnPuVr00ddJrVGhs");
            await stripe?.redirectToCheckout({ sessionId: data.id });
          }
    }

    useEffect(() => {
        const fetchData = async() => {
            const response = await fetch('http://localhost:3000/api/prices');
            const json = await response.json();
            setPrices(json.prices);
        }
        const stripeCustomer = {stripe_customer: 'cus_ONsOK10HKKwx02'}
        const profileData = async() => {
            const { data: profileData } = await supabase.from('profile').select('*').eq('stripe_customer', stripeCustomer.stripe_customer).single()
            if(profileData) {
                if(profileData.is_subscribed == true) {
                    setIsSubscribed(true)
                }
                if(profileData.current_period_start) {
                    setCurrentPeriodStart(profileData.current_period_start)
                }
                if(profileData.current_period_end) {
                    setCurrentPeriodEnd(profileData.current_period_end)
                }
                if(profileData.cancel_at_period_end) {
                    setCancelAtPeriodend(profileData.cancel_at_period_end)
                }
                if(profileData.current_price_id) {
                    setCurrentPriceId(profileData.current_price_id)
                }
            }
        }
        profileData()
        fetchData()

    }, [])

    return (
        <main>
            <div className="about">
                <p className="about-links">
                    <a className="disabled">
                        {prices.length == 0 ? 'Loading': 'This is stripe information'}
                    </a>
                </p>
                {prices.length == 0 ? <></> : <><p>start: {currentPeriodStart}</p><p>end: {currentPeriodEnd}</p>
                {isSubscribed ? <p>{cancelAtPeriodEnd ? 'this is cancelled at end time.' : 'this is forever'}</p>:<></> }
                </>}
            </div>
            {prices.length == 0 ?
            <div className='text-center text-white font-40'>Loading</div>
            :
            <div className="plans">
                {prices.map((price, key) => (
                    <div className={`plan ${price.id === currentPriceId ? 'bg-secondary' : ''}`}>
                    <h2 className="plan-title">{price.name}</h2>
                    <p className="plan-price">${price.price / 100}<span>/{price.interval.slice(0,2)}</span></p>
                    <ul className="plan-features">
                        <li><strong>1</strong> user</li>
                        <li><strong>Unlimited</strong> projects</li>
                        <li><strong>2GB</strong> storage</li>
                    </ul>
                    { isSubscribed ? <a className="plan-button" onClick={loadPortal}> {price.id === currentPriceId ? 'Update Plan' : 'Choose Plan'} </a> : <a className="plan-button" onClick={() =>clickGetStared(price.id)}>Subscribe</a> }
                </div>
                ))}
            </div>
            }
        </main>
    )
}