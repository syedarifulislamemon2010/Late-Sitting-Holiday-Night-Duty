import http from 'http';
import logger from '@/lib/logger';

export interface SmsSendResult {
  success: boolean;
  smsId?: string;
  statusCode?: number;
  statusText?: string;
  error?: string;
}

/**
 * Sends an SMS through Janata Bank's central SMS API Gateway (JBSmsApi).
 * 
 * Target: http://172.17.20.17/JBSmsApi/Send
 */
export async function sendJanataSms(recipientMobile: string, message: string): Promise<SmsSendResult> {
  return new Promise((resolve) => {
    try {
      // Normalize mobile to standard 11 digits: 01XXXXXXXXX
      const cleanMobile = recipientMobile.replace(/\D/g, '').slice(-11);
      if (!cleanMobile.startsWith('01') || cleanMobile.length !== 11) {
        return resolve({
          success: false,
          error: 'অবৈধ মোবাইল নম্বর! অনুগ্রহ করে ১১ ডিজিটের সঠিক মোবাইল নম্বর প্রদান করুন।'
        });
      }

      const payload = JSON.stringify({
        Recipient: cleanMobile,
        Message: message
      });

      // Local address binding if configured or running in development with dual-NIC
      const localAddress = process.env.SMS_LOCAL_ADDRESS || (process.platform === 'win32' ? '172.17.22.124' : undefined);

      const options: http.RequestOptions = {
        hostname: process.env.SMS_API_HOST || '172.17.20.17',
        port: parseInt(process.env.SMS_API_PORT || '80', 10),
        path: process.env.SMS_API_PATH || '/JBSmsApi/Send',
        method: 'POST',
        headers: {
          'Authorization': process.env.SMS_API_AUTH || 'Basic YmFjaCZydGdzOjMhYiRjJWgmTSZSc0d0MlNxciop',
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        },
        timeout: 10000
      };

      if (localAddress) {
        options.localAddress = localAddress;
      }

      logger.info(`[SMS] Sending SMS via Janata SMS Gateway to ${cleanMobile.slice(0, 3)}****${cleanMobile.slice(-4)}`);

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            if (data.StatusCode === 1 || data.StatusText === 'SUCCESS') {
              logger.info(`[SMS] Delivered successfully. SmsID: ${data.SmsID}`);
              resolve({
                success: true,
                smsId: data.SmsID,
                statusCode: data.StatusCode,
                statusText: data.StatusText
              });
            } else {
              logger.warn('[SMS] Gateway non-success response:', data);
              resolve({
                success: false,
                statusCode: data.StatusCode,
                statusText: data.StatusText,
                error: data.Message || 'এসএমএস পাঠাতে ব্যর্থ হয়েছে।'
              });
            }
          } catch (parseErr) {
            logger.error('[SMS] Failed to parse SMS API response:', parseErr, body);
            resolve({
              success: false,
              error: 'এসএমএস সার্ভার থেকে অকার্যকর রেসপন্স পাওয়া গেছে।'
            });
          }
        });
      });

      req.on('timeout', () => {
        req.destroy();
        logger.error('[SMS] Gateway request timed out');
        resolve({
          success: false,
          error: 'এসএমএস সার্ভারের সংযোগ সময় শেষ (Timeout)।'
        });
      });

      req.on('error', (err) => {
        logger.error('[SMS] Gateway network error:', err);
        resolve({
          success: false,
          error: err.message || 'এসএমএস সার্ভারের সাথে যোগাযোগ করা যায়নি।'
        });
      });

      req.write(payload);
      req.end();
    } catch (err: any) {
      logger.error('[SMS] Unexpected error in sendJanataSms:', err);
      resolve({
        success: false,
        error: err.message || 'অভ্যন্তরীণ ত্রুটি ঘটেছে।'
      });
    }
  });
}
