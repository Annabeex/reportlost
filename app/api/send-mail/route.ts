// app/api/send-mail/route.ts

// TEMPORAIREMENT DÉSACTIVÉ POUR TESTS (envoi de mails désactivé)
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  console.log('📭 Email désactivé temporairement — requête ignorée.');
  return NextResponse.json({ success: false, message: 'Email service temporarily disabled.' });
}


/*

// ✅ Code original — à réactiver plus tard si besoin

import { NextResponse } from 'next/server';
const nodemailer = require('nodemailer');

export async function POST(req: Request) {
  const data = await req.json();

  const {
    to, // email du client
    subject,
    text,
    html,
  } = data;

  if (!to || !subject || !text) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_USER,       // support@reportlost.org
        pass: process.env.ZOHO_PASS        // mot de passe d'application Zoho
      }
    });

    const mailOptions = {
      from: `"ReportLost" <${process.env.ZOHO_USER}>`,
      to,
      subject,
      text,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('📤 Mail sent:', info.messageId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return NextResponse.json({ error: 'Error sending email' }, { status: 500 });
  }
}

*/
