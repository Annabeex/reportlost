import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  let body: any
  try {
    body = await req.json()
    console.log('📦 Body reçu dans /api/send-mail:', body)
  } catch (error) {
    console.error('❌ Invalid JSON:', error)
    return NextResponse.json({ success: false, error: 'Invalid JSON' }, { status: 400 })
  }

  const { type, data } = body

  console.log('📩 Type:', type)
  console.log('🧾 Data:', data)

  if (!type || !data) {
    return NextResponse.json({ success: false, error: 'Missing type or data' }, { status: 400 })
  }

  if (type === 'client-confirmation') {
    const firstName = sanitize(data.first_name, 'Customer')
    const email = sanitize(data.email)

    const html = `
      <h2>Thank you, ${firstName}!</h2>
      <p>We have received your lost item report and a member of our team will start processing it shortly.</p>
      <p>We’ll get back to you within the next few hours. In the meantime, you can relax — your request is being taken care of 💌</p>
    `

    try {
      console.log('📤 Envoi email client via Resend...')
      await resend.emails.send({
        from: 'ReportLost <support@reportlost.org>',
        to: email,
        subject: '🧾 Confirmation – Your lost item report has been received',
        html,
      })
      return NextResponse.json({ success: true })
    } catch (error: any) {
      console.error('❌ Client email send error:', JSON.stringify(error, null, 2))
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }
  }

  // --- Admin alert: lost or found ---
  const {
    title = 'No title',
    description = 'No description',
    email = 'No email',
    date,
    contribution,
    loss_street,
    loss_neighborhood,
    city,
    departure_place,
    arrival_place,
    departure_time,
    arrival_time,
    travel_number,
    time_slot,
    phone_description,
    first_name,
    last_name,
    phone,
    address,
    object_photo,
  } = data

  const formattedDate = date ? new Date(date).toLocaleString() : new Date().toLocaleString()
  const formattedContribution = contribution ? `$${Number(contribution).toFixed(2)}` : 'No contribution'
  const location = [loss_street, loss_neighborhood, city].filter(Boolean).join(', ')
  const transport = [
    departure_place && `From ${departure_place} at ${departure_time}`,
    arrival_place && `to ${arrival_place} at ${arrival_time}`,
    travel_number && `Travel #${travel_number}`,
    time_slot && `Slot: ${time_slot}`,
  ]
    .filter(Boolean)
    .join(', ')
  const contact = [first_name, last_name, phone, address].filter(Boolean).join(' – ')

  const subject = type === 'lost'
    ? `Report-Lost (${formattedDate}) ${formattedContribution}`
    : `Report-Found (${formattedDate})`

  const bodyHtml = `
    <h2>${subject}</h2>
    <p><strong>🗓 Date:</strong> ${formattedDate}</p>
    <p><strong>📦 Object:</strong> ${sanitize(title)}</p>
    <p><strong>📝 Description:</strong> ${sanitize(description)}</p>
    <p><strong>📍 Location:</strong> ${sanitize(location)}</p>
    ${transport ? `<p><strong>🚉 Transport:</strong> ${sanitize(transport)}</p>` : ''}
    ${phone_description ? `<p><strong>📱 Phone:</strong> ${sanitize(phone_description)}</p>` : ''}
    <p><strong>👤 Contact:</strong> ${sanitize(contact)}</p>
    <p><strong>💸 Contribution:</strong> ${formattedContribution}</p>
    ${object_photo ? `<p><strong>📷 Image:</strong><br/><img src="${sanitize(object_photo)}" alt="Object photo" style="max-width:300px;border-radius:8px;" /></p>` : ''}
  `

  try {
    console.log('📤 Envoi email admin via Resend...')
    await resend.emails.send({
      from: 'ReportLost <support@reportlost.org>',
      to: process.env.ADMIN_EMAIL || 'support@reportlost.org',
      subject,
      html: bodyHtml,
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('❌ Admin email send error:', JSON.stringify(error, null, 2))
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

function sanitize(value: any, fallback: string = '') {
  if (!value || typeof value !== 'string') return fallback
  return value.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
