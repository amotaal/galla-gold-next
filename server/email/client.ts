// /server/email/client.ts
// Email client configuration using Resend

import { Resend } from 'resend';

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY || 'your-api-key');

// Email configuration
export const DEFAULT_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@gallagold.com';
export const DEFAULT_FROM_NAME = process.env.RESEND_FROM_NAME || 'GALLA.GOLD';
