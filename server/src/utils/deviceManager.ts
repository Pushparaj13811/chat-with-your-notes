import crypto from 'crypto';

export interface DeviceInfo {
  deviceId: string;
  userAgent: string;
  ipAddress: string;
  fingerprint: string;
}

/**
 * Generate a unique device identifier based on multiple factors
 */
export function generateDeviceId(req: any): string {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = req.ip || req.connection.remoteAddress || '';
  const acceptLanguage = req.headers['accept-language'] || '';
  const acceptEncoding = req.headers['accept-encoding'] || '';
  
  // Create a fingerprint from multiple headers
  const fingerprint = crypto
    .createHash('sha256')
    .update(`${userAgent}|${ipAddress}|${acceptLanguage}|${acceptEncoding}`)
    .digest('hex');
  
  return fingerprint.substring(0, 32); // Use first 32 characters for consistency
}

/**
 * Extract device ID from request (cookie or header)
 */
export function getDeviceIdFromRequest(req: any): string | null {
  // Try to get from cookie first
  const deviceIdFromCookie = req.cookies?.deviceId;
  if (deviceIdFromCookie) {
    return deviceIdFromCookie;
  }
  
  // Try to get from header
  const deviceIdFromHeader = req.headers['x-device-id'];
  if (deviceIdFromHeader) {
    return deviceIdFromHeader;
  }
  
  return null;
}

/**
 * Set device ID in response cookie
 */
export function setDeviceIdCookie(res: any, deviceId: string): void {
  // Set cookie with device ID
  res.cookie('deviceId', deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    path: '/'
  });
}

/**
 * Validate device ID format
 */
export function isValidDeviceId(deviceId: string): boolean {
  return Boolean(deviceId && deviceId.length === 32 && /^[a-f0-9]+$/i.test(deviceId));
}

/**
 * Get or create device ID for a request
 */
export function getOrCreateDeviceId(req: any, res: any): string {
  let deviceId = getDeviceIdFromRequest(req);
  
  if (!deviceId || !isValidDeviceId(deviceId)) {
    deviceId = generateDeviceId(req);
    setDeviceIdCookie(res, deviceId);
  }
  
  return deviceId;
}

/**
 * Create device info object
 */
export function createDeviceInfo(req: any, deviceId: string): DeviceInfo {
  return {
    deviceId,
    userAgent: req.headers['user-agent'] || '',
    ipAddress: req.ip || req.connection.remoteAddress || '',
    fingerprint: generateDeviceId(req)
  };
} 