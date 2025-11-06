// /server/email/send.ts
// Email sending utilities with template support
// Handles sending transactional emails using Resend

import { resend, DEFAULT_FROM_EMAIL, DEFAULT_FROM_NAME } from "./client";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Email template names
 * Add new template names here as you create them
 */
type EmailTemplate =
  | "verify"
  | "magic"
  | "reset"
  | "welcome"
  | "transaction"
  | "kyc-approved"
  | "kyc-rejected"
  | "kyc-documents-required"; // ✅ Add this

/**
 * Email options
 */
interface EmailOptions {
  to: string | string[];
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
  from?: string;
  replyTo?: string;
}

// ============================================================================
// EMAIL TEMPLATES
// ============================================================================

/**
 * Generate HTML email from template
 * @param template - Template name
 * @param data - Template data
 * @returns string - HTML email content
 *
 * Currently using simple HTML templates
 * TODO: Integrate React Email for better templates
 */
function generateEmailHTML(
  template: EmailTemplate,
  data: Record<string, any>
): string {
  const templates: Record<EmailTemplate, (data: any) => string> = {
    // Email verification template
    verify: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Galla Gold</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Verify Your Email Address</h2>
            
            <p>Hi ${data.firstName},</p>
            
            <p>Thank you for signing up with Galla Gold! To complete your registration, please verify your email address by clicking the button below:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                data.verificationUrl
              }" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Verify Email</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${
              data.verificationUrl
            }</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">This link will expire in 24 hours.</p>
            
            <p style="font-size: 14px; color: #666;">If you didn't create an account with Galla Gold, you can safely ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Galla Gold. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,

    // KYC additional documents required
    "kyc-documents-required": (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Additional Documents Required</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Galla Gold</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Additional Documents Required</h2>
            
            <p>Hi ${data.firstName},</p>
            
            <p>Thank you for submitting your KYC verification. After reviewing your application, we need additional documents to complete the verification process:</p>
            
            <div style="background: #fff; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-weight: bold;">Required Documents:</p>
              <p style="margin: 5px 0 0 0;">${data.requiredDocuments}</p>
            </div>
            
            ${
              data.notes
                ? `<p style="font-size: 14px; color: #666;"><strong>Note:</strong> ${data.notes}</p>`
                : ""
            }
            
            <p>Please upload the requested documents at your earliest convenience:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/dashboard/profile?tab=kyc" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Upload Documents</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">If you have questions, contact our support team at support@gallagold.com</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Galla Gold. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,

    // Magic link template
    magic: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Magic Link</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Galla Gold</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Your Magic Link 🔐</h2>
            
            <p>Hi ${data.firstName},</p>
            
            <p>Click the button below to securely log in to your Galla Gold account:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                data.magicUrl
              }" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Log In</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${
              data.magicUrl
            }</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">This link will expire in 15 minutes.</p>
            
            <p style="font-size: 14px; color: #666;">If you didn't request this magic link, you can safely ignore this email.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Galla Gold. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,

    // Password reset template
    reset: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Galla Gold</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
            
            <p>Hi ${data.firstName},</p>
            
            <p>We received a request to reset your password. Click the button below to create a new password:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                data.resetUrl
              }" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Reset Password</a>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #666; font-size: 14px;">${
              data.resetUrl
            }</p>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
            
            <p style="font-size: 14px; color: #666;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Galla Gold. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,

    // Welcome email template
    welcome: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to Galla Gold</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Welcome to Galla Gold! 🎉</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.firstName},</p>
            
            <p>Your email has been successfully verified, and your Galla Gold account is now active!</p>
            
            <h3 style="color: #D4AF37; margin-top: 30px;">What's Next?</h3>
            
            <ul style="line-height: 2;">
              <li><strong>Fund Your Account:</strong> Add funds to start buying gold</li>
              <li><strong>Buy Gold:</strong> Invest in physical gold at competitive prices</li>
              <li><strong>Track Your Portfolio:</strong> Monitor your investments in real-time</li>
              <li><strong>Complete KYC:</strong> Verify your identity for higher limits</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/dashboard" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Go to Dashboard</a>
            </div>
            
            <p style="margin-top: 30px; font-size: 14px; color: #666;">If you have any questions, our support team is here to help at support@gallagold.com</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Galla Gold. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,

    // Transaction notification template
    transaction: (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transaction Notification</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">Transaction Complete</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.firstName},</p>
            
            <p>Your transaction has been ${
              data.status === "completed"
                ? "successfully completed"
                : "processed"
            }.</p>
            
            <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Type:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${
                    data.type
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Amount:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${
                    data.amount
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee;"><strong>Date:</strong></td>
                  <td style="padding: 10px 0; border-bottom: 1px solid #eee; text-align: right;">${
                    data.date
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0;"><strong>Transaction ID:</strong></td>
                  <td style="padding: 10px 0; text-align: right; font-size: 12px; color: #666;">${
                    data.transactionId
                  }</td>
                </tr>
              </table>
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/dashboard" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">View Dashboard</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Galla Gold. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,

    // KYC approved template
    "kyc-approved": (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>KYC Approved</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">KYC Verified! ✅</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.firstName},</p>
            
            <p>Great news! Your identity verification (KYC) has been approved.</p>
            
            <h3 style="color: #D4AF37; margin-top: 30px;">What This Means:</h3>
            
            <ul style="line-height: 2;">
              <li>✓ Higher transaction limits</li>
              <li>✓ Physical gold delivery available</li>
              <li>✓ Access to premium features</li>
              <li>✓ Enhanced account security</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/dashboard" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Start Trading</a>
            </div>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Galla Gold. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,

    // KYC rejected template
    "kyc-rejected": (data) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>KYC Review Required</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">KYC Review Required</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p>Hi ${data.firstName},</p>
            
            <p>We were unable to verify your identity with the documents provided.</p>
            
            <h3 style="color: #D4AF37; margin-top: 30px;">Reason:</h3>
            <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #D4AF37;">${
              data.reason || "Documents not clear or valid"
            }</p>
            
            <p>Please submit new documents for review. Ensure they are:</p>
            <ul>
              <li>Clear and readable</li>
              <li>Valid and not expired</li>
              <li>Showing all information</li>
            </ul>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${
                process.env.NEXT_PUBLIC_APP_URL
              }/dashboard/profile?tab=kyc" style="background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Resubmit Documents</a>
            </div>
            
            <p style="font-size: 14px; color: #666;">If you have questions, contact our support team at support@gallagold.com</p>
          </div>
          
          <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
            <p>© ${new Date().getFullYear()} Galla Gold. All rights reserved.</p>
          </div>
        </body>
      </html>
    `,
  };

  return templates[template](data);
}

// ============================================================================
// SEND EMAIL FUNCTION
// ============================================================================

/**
 * Send an email using Resend
 * @param options - Email options
 * @returns Promise<void>
 *
 * Example usage:
 * ```ts
 * await sendEmail({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   template: "welcome",
 *   data: { firstName: "John" }
 * });
 * ```
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const { to, subject, template, data, from, replyTo } = options;

    // Generate HTML from template
    const html = generateEmailHTML(template, data);

    // Send email via Resend
    await resend.emails.send({
      from: from || `${DEFAULT_FROM_NAME} <${DEFAULT_FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo,
    });

    console.log(
      `Email sent successfully to ${Array.isArray(to) ? to.join(", ") : to}`
    );
  } catch (error: any) {
    console.error("Failed to send email:", error);
    // Don't throw error - log and continue
    // In production, you might want to queue failed emails for retry
  }
}

/**
 * Send bulk emails
 * @param emails - Array of email options
 * @returns Promise<void>
 *
 * Useful for batch notifications
 */
export async function sendBulkEmails(emails: EmailOptions[]): Promise<void> {
  const promises = emails.map((email) => sendEmail(email));
  await Promise.allSettled(promises);
}
