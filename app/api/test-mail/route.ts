// app/api/test-mail/route.ts
import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic"; // ✅ pas de rendu statique

export async function GET(req: NextRequest) {
  try {
    const to = req.nextUrl.searchParams.get("to");

    if (!to) {
      return NextResponse.json({ error: "Missing recipient" }, { status: 400 });
    }

    // ✅ Transporteur Zoho Europe
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.eu",
      port: 465,
      secure: true,
      auth: {
        user: process.env.ZOHO_USER,
        pass: process.env.ZOHO_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"ReportLost" <${process.env.ZOHO_USER}>`,
      to,
      subject: "✉️ Test email ReportLost",
      text: "Ceci est un test depuis Nodemailer avec smtp.zoho.eu",
      html: "<p><b>Ceci est un test</b> depuis Nodemailer avec <code>smtp.zoho.eu</code></p>",
    });

    console.log("📤 Test email envoyé:", info.messageId);

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error: any) {
    console.error("❌ Error sending test email:", error);
    return NextResponse.json(
      { error: "Email failed", code: error.code },
      { status: 500 }
    );
  }
}
