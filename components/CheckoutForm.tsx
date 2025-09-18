'use client'

import { useState } from 'react'
import {
  CardElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'

interface Props {
  amount: number
  reportId?: string         // ✅ nouvelle prop
  onSuccess?: () => void
  onBack?: () => void
}

export default function CheckoutForm({ amount, reportId, onSuccess, onBack }: Props) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (!stripe || !elements) {
      setMessage('Stripe has not loaded yet.')
      setLoading(false)
      return
    }

    // ✅ On envoie aussi reportId à l’API
    const res = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, reportId }),
    })

    const { clientSecret, error } = await res.json()

    if (error || !clientSecret) {
      setMessage(error || 'Failed to get client secret.')
      setLoading(false)
      return
    }

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) {
      setMessage('Card element not found.')
      setLoading(false)
      return
    }

    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
      },
    })

    if (result.error) {
      setMessage(result.error.message || 'Payment failed.')
    } else if (result.paymentIntent?.status === 'succeeded') {
      setMessage('✅ Payment successful. Your report has been submitted.')
      onSuccess?.()
    }

    setLoading(false)
  }

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded shadow space-y-6">
      {/* Bandeau sécurisé */}
      <div className="flex items-center gap-2 text-sm text-gray-700 bg-blue-50 border border-blue-200 px-4 py-2 rounded">
        <span className="text-blue-600 text-lg">🔒</span>
        <span>
          This page is secure and encrypted. Your payment information is processed safely via Stripe.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <label className="block text-gray-700 text-sm font-medium">Card details</label>
        <div className="border p-4 rounded">
          <CardElement options={{ hidePostalCode: true }} />
        </div>

        <div className="flex justify-between items-center">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            >
              Back
            </button>
          )}

          <button
            type="submit"
            disabled={!stripe || loading}
            className="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700"
          >
            {loading ? 'Processing...' : `Pay $${amount}`}
          </button>
        </div>

        {message && (
          <p className="text-sm text-center mt-4 text-gray-800 bg-gray-100 p-2 rounded">
            {message}
          </p>
        )}
      </form>
    </div>
  )
}
