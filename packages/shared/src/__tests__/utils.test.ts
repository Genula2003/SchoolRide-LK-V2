import { describe, it, expect } from 'vitest';
import {
  formatLKR,
  formatSriLankanDateTime,
  formatSriLankanTime,
  calculateHaversineDistanceKm,
} from '../utils/formatting';
import {
  isValidSriLankanNIC,
  isValidSriLankanPhone,
  normalizeSriLankanPhone,
  isValidSriLankanPlate,
} from '../utils/validation';
import { SRI_LANKAN_DISTRICTS } from '../constants/districts';
import { INITIAL_SCHOOLS } from '../constants/schools';

describe('Sri Lankan Formatting Utilities', () => {
  it('formats minor units to Sri Lankan Rupees (LKR / Rs.) correctly', () => {
    // 25,000 LKR = 2,500,000 minor units
    const formatted = formatLKR(2500000, true);
    expect(formatted).toMatch(/Rs\.\s*25,000/);

    const zeroFormatted = formatLKR(0, true);
    expect(zeroFormatted).toMatch(/Rs\.\s*0/);
  });

  it('formats base amount to Sri Lankan Rupees', () => {
    const formatted = formatLKR(18500, false);
    expect(formatted).toMatch(/Rs\.\s*18,500/);
  });

  it('formats date and time in Asia/Colombo timezone', () => {
    // 2026-10-29T12:00:00Z -> Colombo is UTC+5:30 -> 17:30 (5:30 PM)
    const testDate = new Date('2026-10-29T12:00:00Z');
    const timeStr = formatSriLankanTime(testDate);
    expect(timeStr).toContain('05:30');
    expect(timeStr).toMatch(/PM|pm/);

    const fullStr = formatSriLankanDateTime(testDate);
    expect(fullStr).toContain('2026');
  });

  it('calculates Haversine distance correctly between Colombo schools', () => {
    // Royal College (6.9066, 79.8617) to Visakha Vidyalaya (6.8903, 79.8596) ~ 1.8km
    const dist = calculateHaversineDistanceKm(6.9066, 79.8617, 6.8903, 79.8596);
    expect(dist).toBeGreaterThan(1.5);
    expect(dist).toBeLessThan(2.5);
  });
});

describe('Sri Lankan Validation Utilities', () => {
  it('validates Sri Lankan mobile phone numbers', () => {
    expect(isValidSriLankanPhone('0771234567')).toBe(true);
    expect(isValidSriLankanPhone('+94771234567')).toBe(true);
    expect(isValidSriLankanPhone('0718765432')).toBe(true);
    expect(isValidSriLankanPhone('0765554433')).toBe(true);
    expect(isValidSriLankanPhone('0701112233')).toBe(true);

    // Invalid numbers
    expect(isValidSriLankanPhone('0112345678')).toBe(false); // Landline
    expect(isValidSriLankanPhone('123456')).toBe(false);
    expect(isValidSriLankanPhone('+14155552671')).toBe(false); // US
  });

  it('normalizes Sri Lankan phone numbers to international format', () => {
    expect(normalizeSriLankanPhone('0771234567')).toBe('+94771234567');
    expect(normalizeSriLankanPhone('+94771234567')).toBe('+94771234567');
    expect(normalizeSriLankanPhone('94771234567')).toBe('+94771234567');
  });

  it('validates Sri Lankan NIC numbers (old and new format)', () => {
    // Old format (9 digits + V or X)
    expect(isValidSriLankanNIC('851234567V')).toBe(true);
    expect(isValidSriLankanNIC('905678901v')).toBe(true);
    expect(isValidSriLankanNIC('751234567X')).toBe(true);

    // New format (12 digits)
    expect(isValidSriLankanNIC('198512345678')).toBe(true);
    expect(isValidSriLankanNIC('200156789012')).toBe(true);

    // Invalid NICs
    expect(isValidSriLankanNIC('12345')).toBe(false);
    expect(isValidSriLankanNIC('851234567Z')).toBe(false);
    expect(isValidSriLankanNIC('19851234567890')).toBe(false);
  });

  it('validates Sri Lankan vehicle registration plates', () => {
    expect(isValidSriLankanPlate('WP CAB-1234')).toBe(true);
    expect(isValidSriLankanPlate('CP GA-5678')).toBe(true);
    expect(isValidSriLankanPlate('SP 65-1234')).toBe(true);
    expect(isValidSriLankanPlate('CAB-1234')).toBe(true);
    expect(isValidSriLankanPlate('65-1234')).toBe(true);

    // Invalid plates
    expect(isValidSriLankanPlate('')).toBe(false);
    expect(isValidSriLankanPlate('INVALID-PLATE-TOO-LONG')).toBe(false);
  });

  it('contains all 25 official districts and initial schools', () => {
    expect(SRI_LANKAN_DISTRICTS.length).toBe(25);
    expect(INITIAL_SCHOOLS.length).toBeGreaterThanOrEqual(15);
    const colombo = SRI_LANKAN_DISTRICTS.find((d) => d.name === 'Colombo');
    expect(colombo).toBeDefined();
    expect(colombo?.province).toBe('Western');
  });
});
