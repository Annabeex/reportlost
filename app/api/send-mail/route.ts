// app/api/send-mail/route.ts
import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
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
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  }

  const title = data.title || 'No title';
  const description = data.description || 'No description';
  const email = data.email || 'No email';
  const date = new Date(data.date).toLocaleString();
  const contribution = data.contribution ? `$${data.contribution.toFixed(2)}` : 'No contribution';
  const location = [data.loss_street, data.loss_neighborhood, data.city].filter(Boolean).join(', ');
  const transport = [
    data.departure_place && `From ${data.departure_place} at ${data.departure_time}`,
    data.arrival_place && `to ${data.arrival_place} at ${data.arrival_time}`,
    data.travel_number && `Travel #${data.travel_number}`,
    data.time_slot && `Slot: ${data.time_slot}`,
  ].filter(Boolean).join(', ');
  const phone = data.phone_description || null;
  const contact = `${data.first_name || ''} ${data.last_name || ''} - ${data.phone || ''} - ${data.address || ''}`;

  const subject = type === 'lost'
    ? `Report-Lost (${date}) ${contribution}`
    : `Report-Found (${date})`;

  const bodyHtml = `
    <h2>${subject}</h2>
    <p><strong>🗓 Date:</strong> ${date}</p>
    <p><strong>📦 Object:</strong> ${title}</p>
    <p><strong>📝 Description:</strong> ${description}</p>
    <p><strong>📍 Location:</strong> ${location}</p>
    ${transport ? `<p><strong>🚉 Transport:</strong> ${transport}</p>` : ''}
    ${phone ? `<p><strong>📱 Phone:</strong> ${phone}</p>` : ''}
    <p><strong>👤 Contact:</strong> ${contact}</p>
    <p><strong>💸 Contribution:</strong> ${contribution}</p>
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
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
