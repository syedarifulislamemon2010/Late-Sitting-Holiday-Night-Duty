import logger from '@/lib/logger';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public code: string = 'internal_server_error'
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'ইনপুট সঠিক নয়।', public details?: Record<string, string[]>) {
    super(message, 400, 'validation_error');
  }
}

export class AuthError extends AppError {
  constructor(message: string = 'অনুমতি নেই।', statusCode: number = 403, code: string = 'forbidden') {
    super(message, statusCode, code);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'ডাটাবেজ সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।') {
    super(message, 500, 'database_error');
  }
}

export class ConflictError extends AppError {
  constructor(message: string, public details?: any) {
    super(message, 409, 'conflict');
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.code, message: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof ZodError) {
    // Flatten Zod validation errors to key-value lists
    const fieldErrors = error.flatten().fieldErrors as Record<string, string[] | undefined>;
    const formattedErrors: Record<string, string> = {};
    for (const key in fieldErrors) {
      const errors = fieldErrors[key];
      if (errors && errors[0]) {
        formattedErrors[key] = errors[0];
      }
    }
    return NextResponse.json(
      {
        error: 'validation_error',
        message: 'ইনপুট সঠিক নয়।',
        details: formattedErrors
      },
      { status: 400 }
    );
  }

  logger.error('Unhandled API Error:', error);

  // Send Centralized Error Webhook Alert (Discord/Slack compatible)
  const webhookUrl = process.env.ERROR_WEBHOOK_URL;
  if (webhookUrl) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        embeds: [{
          title: '🚨 Production LHN Portal Server Error Alert',
          color: 15158332, // Red
          fields: [
            { name: 'Error Message', value: errObj.message || 'Unknown Error', inline: false },
            { name: 'Stack Trace', value: `\`\`\`javascript\n${(errObj.stack || 'No Stack Trace Available').slice(0, 800)}\n\`\`\``, inline: false },
            { name: 'Timestamp', value: new Date().toISOString(), inline: true }
          ]
        }]
      })
    }).catch(webhookErr => {
      logger.error('Failed to send error notification webhook:', webhookErr);
    });
  }

  return NextResponse.json(
    {
      error: 'internal_server_error',
      message: 'সার্ভার সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।'
    },
    { status: 500 }
  );
}
