import crypto from 'crypto-js';

const DEVICE_ID_KEY = 'chat_notes_device_id';

/**
 * Generate a unique device identifier based on browser fingerprint
 */
export function generateDeviceId(): string {
  const userAgent = navigator.userAgent;
  const language = navigator.language;
  const platform = navigator.platform;
  const screenResolution = `${screen.width}x${screen.height}`;
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  // Create a fingerprint from multiple browser properties
  const fingerprint = crypto.SHA256(
    `${userAgent}|${language}|${platform}|${screenResolution}|${timezone}`
  ).toString();
  
  return fingerprint.substring(0, 32); // Use first 32 characters for consistency
}

/**
 * Get device ID from localStorage or generate a new one
 */
export function getOrCreateDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  
  if (!deviceId || deviceId.length !== 32) {
    deviceId = generateDeviceId();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  
  return deviceId;
}

/**
 * Get device ID from localStorage
 */
export function getDeviceId(): string | null {
  const deviceId = localStorage.getItem(DEVICE_ID_KEY);
  return deviceId && deviceId.length === 32 ? deviceId : null;
}

/**
 * Clear device ID from localStorage
 */
export function clearDeviceId(): void {
  localStorage.removeItem(DEVICE_ID_KEY);
}

/**
 * Validate device ID format
 */
export function isValidDeviceId(deviceId: string): boolean {
  return Boolean(deviceId && deviceId.length === 32 && /^[a-f0-9]+$/i.test(deviceId));
}

/**
 * Create device info object
 */
export function createDeviceInfo(): {
  deviceId: string;
  userAgent: string;
  platform: string;
  language: string;
  timezone: string;
} {
  return {
    deviceId: getOrCreateDeviceId(),
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
} 