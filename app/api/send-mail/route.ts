// app/api/send-mail/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function POST(req: Request) {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const body = await req.json();
  const { type, data } = body;

  if (type === 'client-confirmation') {
    const firstName = data.first_name || 'Customer';
    const email = data.email;

    const html = `
      <h2>Thank you, ${firstName}!</h2>
      <p>We have received your lost item report and a member of our team will start processing it shortly.</p>
      <p>We’ll get back to you within the next few hours. In the meantime, you can relax — your request is being taken care of 💌</p>
    `;

    try {
      await resend.emails.send({
        from: 'ReportLost <no-reply@reportlost.org>',
        to: email,
        subject: '🧾 Confirmation – Your lost item report has been received',
        html,
      });
      return NextResponse.json({ success: true });
    } catch (error: any) {
      console.error('❌ Email send error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  // Sanitize data before formatting email
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
    object_photo
  } = data;

  const formattedDate = new Date(date).toLocaleString();
  const formattedContribution = contribution ? `$${contribution.toFixed(2)}` : 'No contribution';
  const location = [loss_street, loss_neighborhood, city].filter(Boolean).join(', ');
  const transport = [
    departure_place && `From ${departure_place} at ${departure_time}`,
    arrival_place && `to ${arrival_place} at ${arrival_time}`,
    travel_number && `Travel #${travel_number}`,
    time_slot && `Slot: ${time_slot}`,
  ].filter(Boolean).join(', ');
  const contact = `${first_name || ''} ${last_name || ''} - ${phone || ''} - ${address || ''}`;

  const subject = type === 'lost'
    ? `Report-Lost (${formattedDate}) ${formattedContribution}`
    : `Report-Found (${formattedDate})`;

  const bodyHtml = `
    <h2>${subject}</h2>
    <p><strong>🗓 Date:</strong> ${formattedDate}</p>
    <p><strong>📦 Object:</strong> ${title}</p>
    <p><strong>📝 Description:</strong> ${description}</p>
    <p><strong>📍 Location:</strong> ${location}</p>
    ${transport ? `<p><strong>🚉 Transport:</strong> ${transport}</p>` : ''}
    ${phone_description ? `<p><strong>📱 Phone:</strong> ${phone_description}</p>` : ''}
    <p><strong>👤 Contact:</strong> ${contact}</p>
    <p><strong>💸 Contribution:</strong> ${formattedContribution}</p>
    ${object_photo ? `<p><strong>📷 Image:</strong><br/><img src="${object_photo}" alt="Object photo" style="max-width:300px;border-radius:8px;" /></p>` : ''}
  `;

  try {
    await resend.emails.send({
      from: 'ReportLost <no-reply@reportlost.org>',
      to: process.env.ADMIN_EMAIL || 'contact@reportlost.org',
      subject,
      html: bodyHtml,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('❌ Admin email send error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
