import axios from "axios";

export async function sendOTP(email: string, otp: string) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || "no-reply@nutrion.app";
  const senderName = process.env.BREVO_SENDER_NAME || "NutriON";

  if (!apiKey) {
    console.warn("\n=========================================");
    console.warn("[MOCK BREVO] BREVO_API_KEY is not set. Mocking OTP.");
    console.log(`[MOCK BREVO] Sending OTP to: ${email}`);
    console.log(`[MOCK BREVO] Your OTP Code is: ${otp}`);
    console.warn("=========================================\n");
    return true;
  }

  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",
      {
        sender: { name: senderName, email: senderEmail },
        to: [{ email }],
        subject: "Your NutriON Verification Code",
        htmlContent: `<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 10px;">
          <h2 style="color: #2e7d32;">NutriON</h2>
          <p>Hello,</p>
          <p>Your verification code is: <strong style="font-size: 24px; color: #15803d; letter-spacing: 2px;">${otp}</strong></p>
          <p>This code will expire in 10 minutes.</p>
        </div>`
      },
      {
        headers: {
          "api-key": apiKey,
          "Content-Type": "application/json"
        }
      }
    );
    console.log(`[BREVO] Successfully sent OTP to ${email}`);
    return true;
  } catch (error: any) {
    console.error("[BREVO ERROR] Failed to send email:", error.response?.data || error.message);
    throw new Error("Failed to send OTP email");
  }
}
