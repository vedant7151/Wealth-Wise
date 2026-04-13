import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import * as React from "react";

interface SendEmailOptions {
  to: string;
  subject: string;
  react: React.ReactElement;
}

export async function sendEmail({ to, subject, react }: SendEmailOptions) {
  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const html = await render(react);
    
    // Check if credentials are set (so it doesn't crash in local dev unnecessarily)
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
       console.log("No EMAIL_USER or EMAIL_PASSWORD found. Skipping email send.");
       return { success: false, error: "Missing email credentials" };
    }

    const info = await transporter.sendMail({
      from: `"Wealth Platform" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log("Message sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
