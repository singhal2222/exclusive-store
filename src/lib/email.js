// FILE LOCATION: src/lib/email.js

import nodemailer from "nodemailer";

// ============================================================
// MAILTRAP TRANSPORTER
// ============================================================
//
// Mailtrap Sandbox captures all outgoing emails in a web UI
// instead of delivering them to real inboxes. Perfect for
// development and QA.
//
// All credentials come from .env.local:
//
//   MAILTRAP_HOST=sandbox.smtp.mailtrap.io
//   MAILTRAP_PORT=2525
//   MAILTRAP_USER=...
//   MAILTRAP_PASS=...
//
// ============================================================

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const host = process.env.MAILTRAP_HOST;
  const port = Number(process.env.MAILTRAP_PORT);
  const user = process.env.MAILTRAP_USER;
  const pass = process.env.MAILTRAP_PASS;

  if (!host || !port || !user || !pass) {
    throw new Error(
      "Missing Mailtrap configuration. Check MAILTRAP_HOST, MAILTRAP_PORT, MAILTRAP_USER, MAILTRAP_PASS in .env.local."
    );
  }

  transporter = nodemailer.createTransport({
    host,
    port,
    secure: false, // Mailtrap uses STARTTLS, not implicit TLS
    auth: { user, pass },
  });

  return transporter;
}

// ============================================================
// SENDER
// ============================================================

function getSender() {
  const email =
    process.env.EMAIL_FROM ||
    "Exclusive <no-reply@exclusive.test>";

  return email;
}

// ============================================================
// HTML ESCAPE HELPER
// ============================================================

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ============================================================
// SHARED EMAIL LAYOUT
// ============================================================
//
// Wraps the provided body HTML inside the Exclusive email
// shell (header, footer, outer container).
//
// ============================================================

function wrapEmailLayout({ title, bodyHtml }) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0"
        />
        <title>${escapeHtml(title)}</title>
      </head>

      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
          font-family: Arial, Helvetica, sans-serif;
        "
      >
        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="background-color: #f5f5f5; padding: 40px 15px;"
        >
          <tr>
            <td align="center">
              <table
                width="100%"
                cellpadding="0"
                cellspacing="0"
                border="0"
                style="
                  max-width: 600px;
                  background-color: #ffffff;
                  border-radius: 10px;
                  overflow: hidden;
                "
              >
                <!-- HEADER -->
                <tr>
                  <td
                    style="
                      background-color: #db4444;
                      padding: 25px;
                      text-align: center;
                    "
                  >
                    <h1
                      style="
                        margin: 0;
                        color: #ffffff;
                        font-size: 28px;
                        font-weight: 700;
                      "
                    >
                      Exclusive
                    </h1>
                  </td>
                </tr>

                <!-- CONTENT -->
                <tr>
                  <td
                    style="
                      padding: 40px 30px;
                      color: #333333;
                    "
                  >
                    ${bodyHtml}
                  </td>
                </tr>

                <!-- FOOTER -->
                <tr>
                  <td
                    style="
                      padding: 20px 30px;
                      background-color: #fafafa;
                      border-top: 1px solid #eeeeee;
                      text-align: center;
                    "
                  >
                    <p
                      style="
                        margin: 0;
                        font-size: 13px;
                        color: #999999;
                      "
                    >
                      © ${new Date().getFullYear()} Exclusive.
                      All rights reserved.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

// ============================================================
// SEND SIGNUP VERIFICATION EMAIL  (LINK-BASED)
// ============================================================
//
// Sends a clickable email verification link to a new user.
//
// The link contains a raw verification token and the ID of
// the temporary SignupVerification record.
//
// When the user clicks, they land on /auth/verify-email
// which validates the token and creates the real User.
//
// Used by:
//   - POST /api/auth/signup
//
// ============================================================

export async function sendSignupVerificationEmail({
  email,
  name,
  verificationUrl,
}) {
  if (!email) {
    throw new Error("Email address is required.");
  }

  if (!verificationUrl) {
    throw new Error("Verification URL is required.");
  }

  // Basic safety: the URL must be http(s) so we don't end up
  // injecting javascript: URIs into the email.
  if (
    typeof verificationUrl !== "string" ||
    !/^https?:\/\//i.test(verificationUrl)
  ) {
    throw new Error("Verification URL must be a valid http(s) URL.");
  }

  const safeUrl = verificationUrl;

  try {
    const info = await getTransporter().sendMail({
      from: getSender(),
      to: email,
      subject: "Verify your Exclusive account",

      html: wrapEmailLayout({
        title: "Verify your Exclusive account",
        bodyHtml: `
          <h2
            style="
              margin-top: 0;
              margin-bottom: 15px;
              font-size: 24px;
              color: #111111;
            "
          >
            Verify your email
          </h2>

          <p
            style="
              margin: 0 0 15px;
              font-size: 16px;
              line-height: 1.6;
            "
          >
            Hello ${escapeHtml(name || "there")},
          </p>

          <p
            style="
              margin: 0 0 25px;
              font-size: 16px;
              line-height: 1.6;
              color: #555555;
            "
          >
            Thank you for creating an account with
            <strong>Exclusive</strong>.
            Please click the button below to verify your
            email address and activate your account.
          </p>

          <!-- CTA BUTTON -->
          <div style="text-align: center; margin: 30px 0;">
            <a
              href="${safeUrl}"
              target="_blank"
              rel="noopener noreferrer"
              style="
                display: inline-block;
                background-color: #db4444;
                color: #ffffff;
                padding: 14px 32px;
                text-decoration: none;
                font-size: 15px;
                font-weight: 600;
                border-radius: 6px;
              "
            >
              Verify My Email
            </a>
          </div>

          <!-- FALLBACK LINK -->
          <p
            style="
              margin: 0 0 8px;
              font-size: 13px;
              color: #777777;
            "
          >
            If the button above does not work, copy and paste
            this link into your browser:
          </p>

          <p
            style="
              margin: 0 0 25px;
              font-size: 12px;
              line-height: 1.5;
              color: #db4444;
              word-break: break-all;
            "
          >
            ${escapeHtml(safeUrl)}
          </p>

          <p
            style="
              margin: 0 0 15px;
              font-size: 14px;
              line-height: 1.6;
              color: #666666;
            "
          >
            This verification link will expire in
            <strong>30 minutes</strong>.
          </p>

          <p
            style="
              margin: 0;
              font-size: 14px;
              line-height: 1.6;
              color: #666666;
            "
          >
            If you did not create an account with Exclusive,
            you can safely ignore this email.
          </p>
        `,
      }),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Mailtrap send error (signup link):", error);

    throw new Error(
      error?.message ||
      "Failed to send verification email."
    );
  }
}

// ============================================================
// SEND PASSWORD RESET EMAIL  (CODE-BASED)
// ============================================================
//
// Sends a 6-digit password reset code. Kept code-based because
// it is currently used by /api/auth/forgot-password.
//
// If you later want the password reset flow to also use a link,
// we can migrate it in a separate step.
//
// Used by:
//   - POST /api/auth/forgot-password
//
// ============================================================

export async function sendPasswordResetEmail({
  email,
  name,
  resetCode,
}) {
  if (!email) {
    throw new Error("Email address is required.");
  }

  if (!resetCode) {
    throw new Error("Reset code is required.");
  }

  try {
    const info = await getTransporter().sendMail({
      from: getSender(),
      to: email,
      subject: "Reset your Exclusive password",

      html: wrapEmailLayout({
        title: "Reset your Exclusive password",
        bodyHtml: `
          <h2
            style="
              margin-top: 0;
              margin-bottom: 15px;
              font-size: 24px;
              color: #111111;
            "
          >
            Reset your password
          </h2>

          <p
            style="
              margin: 0 0 15px;
              font-size: 16px;
              line-height: 1.6;
            "
          >
            Hello ${escapeHtml(name || "there")},
          </p>

          <p
            style="
              margin: 0 0 25px;
              font-size: 16px;
              line-height: 1.6;
              color: #555555;
            "
          >
            We received a request to reset your
            <strong>Exclusive</strong> account password.
            Use the code below to continue.
          </p>

          <!-- RESET CODE -->
          <div
            style="
              margin: 25px 0;
              padding: 20px;
              background-color: #f8f8f8;
              border: 1px solid #eeeeee;
              border-radius: 8px;
              text-align: center;
            "
          >
            <p
              style="
                margin: 0 0 10px;
                font-size: 14px;
                color: #777777;
              "
            >
              Your password reset code
            </p>

            <div
              style="
                font-size: 34px;
                font-weight: 700;
                letter-spacing: 8px;
                color: #db4444;
              "
            >
              ${escapeHtml(resetCode)}
            </div>
          </div>

          <p
            style="
              margin: 0 0 15px;
              font-size: 14px;
              line-height: 1.6;
              color: #666666;
            "
          >
            This code will expire in
            <strong>10 minutes</strong>.
          </p>

          <p
            style="
              margin: 0;
              font-size: 14px;
              line-height: 1.6;
              color: #666666;
            "
          >
            If you did not request a password reset,
            you can safely ignore this email.
          </p>
        `,
      }),
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error("Mailtrap send error (reset code):", error);

    throw new Error(
      error?.message ||
      "Failed to send password reset email."
    );
  }
}