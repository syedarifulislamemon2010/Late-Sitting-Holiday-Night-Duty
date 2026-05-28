import { prisma } from './prisma';
import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';

const execAsync = promisify(exec);

// Helper to get local server MAC address
function getLocalMacAddress(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (networkInterface) {
      for (const info of networkInterface) {
        if (!info.internal && info.mac && info.mac !== '00:00:00:00:00:00') {
          return info.mac;
        }
      }
    }
  }
  return 'Unknown Local MAC';
}

// Resolve MAC address of an IP
export async function getMacAddress(ip: string): Promise<string> {
  const cleanIp = ip.replace('::ffff:', '');
  if (cleanIp === '127.0.0.1' || cleanIp === '::1' || cleanIp === 'localhost') {
    return getLocalMacAddress();
  }

  try {
    // Run arp -a on Windows
    const { stdout } = await execAsync(`arp -a ${cleanIp}`);
    // Search for MAC pattern: e.g. 00-11-22-33-44-55 or 00:11:22:33:44:55
    const macRegex = /([0-9a-fA-F]{2}[:-]){5}([0-9a-fA-F]{2})/;
    const match = stdout.match(macRegex);
    if (match) {
      return match[0].toUpperCase().replace(/-/g, ':');
    }
  } catch (err) {
    console.error(`Failed to lookup MAC address for IP ${cleanIp}:`, err);
  }

  return 'Not Available (Layer 3 Routing)';
}

// Log function to save audit logs to database
export async function logActivity({
  username,
  action,
  entityType,
  entityId,
  ipAddress,
  userAgent,
  details
}: {
  username: string;
  action: string;
  entityType?: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  details: string;
}) {
  try {
    const clientIp = ipAddress ? ipAddress.replace('::ffff:', '') : 'Unknown IP';
    const mac = await getMacAddress(clientIp);

    await prisma.auditLog.create({
      data: {
        username,
        action,
        entityType,
        entityId: entityId ? String(entityId) : null,
        ipAddress: clientIp,
        macAddress: mac,
        userAgent: userAgent || null,
        details
      }
    });
  } catch (err) {
    console.error('Failed to save audit log:', err);
  }
}
