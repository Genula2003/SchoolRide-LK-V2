/**
 * Validates Sri Lankan mobile numbers:
 * Formats supported:
 * - 07XXXXXXXX (10 digits)
 * - +947XXXXXXXX (12 characters)
 * - 947XXXXXXXX (11 digits)
 */
export function isValidSriLankanPhone(phone: string): boolean {
  if (!phone) return false;
  const cleaned = phone.replace(/[\s-]/g, '');
  const slPhoneRegex = /^(?:\+94|94|0)?7[01245678]\d{7}$/;
  return slPhoneRegex.test(cleaned);
}

/**
 * Normalizes Sri Lankan phone to international E.164 standard (+947XXXXXXXX).
 */
export function normalizeSriLankanPhone(phone: string): string {
  const cleaned = phone.replace(/[\s-]/g, '');
  if (cleaned.startsWith('+94')) {
    return cleaned;
  }
  if (cleaned.startsWith('94')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+94${cleaned.slice(1)}`;
  }
  return `+94${cleaned}`;
}

/**
 * Validates Sri Lankan National Identity Card (NIC) number:
 * - Old format: 9 digits followed by 'V' or 'X' (e.g., 851234567V)
 * - New format: 12 digits (e.g., 198512345678)
 */
export function isValidSriLankanNIC(nic: string): boolean {
  if (!nic) return false;
  const trimmed = nic.trim().toUpperCase();
  const oldNicRegex = /^[0-9]{9}[VX]$/;
  const newNicRegex = /^[0-9]{12}$/;
  return oldNicRegex.test(trimmed) || newNicRegex.test(trimmed);
}

/**
 * Validates Sri Lankan vehicle registration plate:
 * Formats:
 * - Modern: "WP CAB-1234", "CP GA-5678", "SP 65-1234", "CAB-1234", "19-1234"
 */
export function isValidSriLankanPlate(plate: string): boolean {
  if (!plate) return false;
  const cleaned = plate.trim().toUpperCase();
  const plateRegex = /^(?:[A-Z]{2}\s+)?[A-Z]{1,3}[-\s]?\d{4}$|^(?:[A-Z]{2}\s+)?\d{2,3}[-\s]?\d{4}$/;
  return plateRegex.test(cleaned);
}
