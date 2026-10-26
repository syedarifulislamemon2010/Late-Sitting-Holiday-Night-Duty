import logger from '@/lib/logger';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
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

    return new Response(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    logger.error('Error serving uploaded file:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
