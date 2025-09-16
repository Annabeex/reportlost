// app/api/send-mail/route.ts
import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { to, subject, text, html } = data;

    if (!to || !subject || !text) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.ZOHO_USER, // ex: support@reportlost.org
        pass: process.env.ZOHO_PASS, // mot de passe d’application Zoho
      },
    });

    const mailOptions = {
      from: `"ReportLost" <${process.env.ZOHO_USER}>`,
      to,
      subject,
      text,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📤 Mail sent:', info.messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
  }
}
