import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export interface QRCodeData {
  meetingId: string;
  token: string;
  timestamp: number;
  version: string;
}

export interface QRCodeOptions {
  size?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

/**
 * Generates a unique token for QR code validation
 */
export function generateQRToken(): string {
  return uuidv4();
}

/**
 * Creates QR code data object with meeting information
 */
export function createQRCodeData(meetingId: string, token: string): QRCodeData {
  return {
    meetingId,
    token,
    timestamp: Date.now(),
    version: '1.0'
  };
}

/**
 * Generates a QR code as base64 string
 */
export async function generateQRCode(
  meetingId: string,
  token: string,
  options: QRCodeOptions = {}
): Promise<string> {
  const qrData = createQRCodeData(meetingId, token);
  const jsonData = JSON.stringify(qrData);

  const qrOptions = {
    width: options.size || 300,
    margin: options.margin || 4,
    color: {
      dark: options.color?.dark || '#000000',
      light: options.color?.light || '#FFFFFF'
    },
    errorCorrectionLevel: 'M' as const,
    type: 'image/png' as const
  };

  try {
    const qrCodeDataURL = await QRCode.toDataURL(jsonData, qrOptions);
    return qrCodeDataURL;
  } catch (error) {
    console.error('Error generating QR code:', error);
    throw new Error('Failed to generate QR code');
  }
}

/**
 * Validates and parses QR code data
 */
export function parseQRCodeData(qrString: string): QRCodeData | null {
  try {
    const data = JSON.parse(qrString);

    // Validate required fields
    if (!data.meetingId || !data.token || !data.timestamp || !data.version) {
      return null;
    }

    // Check if QR code is not too old (24 hours max)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - data.timestamp > maxAge) {
      return null;
    }

    return data as QRCodeData;
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return null;
  }
}

/**
 * Validates QR code format without checking token validity
 */
export function isValidQRCodeFormat(qrString: string): boolean {
  return parseQRCodeData(qrString) !== null;
}

/**
 * Generates a printable QR code with meeting information
 */
export async function generatePrintableQRCode(
  meetingId: string,
  token: string,
  meetingTitle: string,
  meetingDate: string
): Promise<{ qrCode: string; printData: string }> {
  const qrCode = await generateQRCode(meetingId, token, {
    size: 400,
    margin: 6
  });

  const printData = JSON.stringify({
    qrCode,
    meetingTitle,
    meetingDate,
    instructions: 'Scan this QR code with the burial society app to mark your attendance',
    generatedAt: new Date().toISOString()
  }, null, 2);

  return { qrCode, printData };
}

/**
 * Creates a shareable QR code URL for digital distribution
 */
export function createShareableQRUrl(qrCodeDataURL: string): string {
  // In a real implementation, you might upload to a CDN or cloud storage
  // For now, we'll return the data URL directly
  return qrCodeDataURL;
}

/**
 * Validates meeting access token
 */
export function validateMeetingToken(storedToken: string, providedToken: string): boolean {
  return storedToken === providedToken && storedToken.length > 0;
}

/**
 * Checks if QR code scan is within valid time window
 */
export function isWithinValidTimeWindow(
  meetingDate: string,
  startTime: string,
  endTime?: string,
  bufferMinutes: number = 30
): boolean {
  const now = new Date();
  const meetingDateTime = new Date(`${meetingDate}T${startTime}`);

  // Allow check-in from 30 minutes before start time
  const earliestTime = new Date(meetingDateTime.getTime() - (bufferMinutes * 60 * 1000));

  let latestTime: Date;
  if (endTime) {
    latestTime = new Date(`${meetingDate}T${endTime}`);
  } else {
    // If no end time, allow check-in for 3 hours after start
    latestTime = new Date(meetingDateTime.getTime() + (3 * 60 * 60 * 1000));
  }

  // Add buffer time after meeting end
  latestTime = new Date(latestTime.getTime() + (bufferMinutes * 60 * 1000));

  return now >= earliestTime && now <= latestTime;
}