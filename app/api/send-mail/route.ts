import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { to, subject, text, html } = data;

    if (!to || !subject || !text) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // ✅ Transporteur Zoho Europe
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_USER, // support@reportlost.org
        pass: process.env.ZOHO_PASS, // mot de passe spécifique app
      },
    });

    const info = await transporter.sendMail({
      from: `"ReportLost" <${process.env.ZOHO_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("📤 Mail envoyé:", info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return NextResponse.json(
      { error: "Email failed", code: error.code },
      { status: 500 }
    );
  }
}
