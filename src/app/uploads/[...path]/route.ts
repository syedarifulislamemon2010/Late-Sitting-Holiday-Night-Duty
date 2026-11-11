import logger from '@/lib/logger';
import fs from 'fs';
import path from 'path';
import { getCurrentUser } from '@/lib/auth-wrapper';
import { db } from '@/lib/db';
import { manualDocuments } from '@/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const resolvedParams = await params;
    const filePathSegments = resolvedParams.path;
    const uploadsDir = path.resolve(process.cwd(), 'public', 'uploads');
    const resolvedPath = path.resolve(uploadsDir, ...filePathSegments);

    // Prevent path traversal attack
    if (!resolvedPath.startsWith(uploadsDir + path.sep) && resolvedPath !== uploadsDir) {
      return new Response('Forbidden', { status: 403 });
    }

    if (!fs.existsSync(resolvedPath)) {
      return new Response('File not found', { status: 404 });
    }

    const ext = path.extname(resolvedPath).toLowerCase();
    const allowedExtensions = new Set(['.html', '.pdf', '.jpg', '.jpeg', '.png', '.gif', '.svg', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.csv', '.zip']);
    if (!allowedExtensions.has(ext)) {
      return new Response('Unsupported file type', { status: 415 });
    }

    // Check file-level permission if this file is tracked in manualDocuments
    const relativeUrl = '/uploads/' + filePathSegments.join('/');
    try {
      const manualDocList = await db
        .select({ isVisibleToUsers: manualDocuments.isVisibleToUsers })
        .from(manualDocuments)
        .where(eq(manualDocuments.filePath, relativeUrl))
        .limit(1);

      if (manualDocList.length > 0 && !manualDocList[0].isVisibleToUsers && user.role !== 'ADMIN') {
        logger.warn(`[Uploads Access Denied] user=${user.username} role=${user.role} attempted to access private document: ${relativeUrl}`);
        return new Response('Forbidden', { status: 403 });
      }
    } catch (dbErr) {
      logger.warn('[Uploads] Optional manual document permission check skipped:', dbErr);
    }

    const fileBuffer = fs.readFileSync(resolvedPath);

    let contentType = 'application/octet-stream';
    if (ext === '.html') {
      contentType = 'text/html; charset=utf-8';
    } else if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (ext === '.jpg' || ext === '.jpeg') {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    } else if (ext === '.gif') {
      contentType = 'image/gif';
    } else if (ext === '.svg') {
      contentType = 'image/svg+xml';
    } else if (ext === '.txt' || ext === '.csv') {
      contentType = 'text/plain; charset=utf-8';
    }

    const responseHeaders: Record<string, string> = {
      'Content-Type': contentType,
      'X-Content-Type-Options': 'nosniff',
    };

    if (ext === '.html') {
      // Sandbox restricts DOM access to parent/cookies while allowing print modals to execute safely
      responseHeaders['Content-Security-Policy'] = 'sandbox allow-scripts allow-modals allow-popups;';
    }

    return new Response(fileBuffer, {
      headers: responseHeaders,
    });
  } catch (error) {
    logger.error('Error serving uploaded file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
