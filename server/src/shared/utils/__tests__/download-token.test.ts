import { describe, it, expect } from 'vitest';
import {
  canServeDownload,
  computeDownloadExpiry,
  isDownloadTokenExpired,
} from '../download-token';

describe('download-token', () => {
  const now = new Date('2026-07-23T12:00:00.000Z');

  it('computes expiry N days from a base time', () => {
    const exp = computeDownloadExpiry(7, now);
    expect(exp.toISOString()).toBe('2026-07-30T12:00:00.000Z');
  });

  it('detects expired tokens', () => {
    expect(isDownloadTokenExpired(new Date('2026-07-22T12:00:00.000Z'), now)).toBe(true);
    expect(isDownloadTokenExpired(new Date('2026-07-24T12:00:00.000Z'), now)).toBe(false);
  });

  it('treats null expiry as expired unless grandfathered', () => {
    expect(isDownloadTokenExpired(null, now)).toBe(true);
  });

  it('allows download when status, token, and expiry are valid', () => {
    expect(
      canServeDownload({
        status: 'COMPLETED',
        storedToken: 'abc',
        presentedToken: 'abc',
        expiresAt: new Date('2026-07-30T12:00:00.000Z'),
        now,
      }),
    ).toBe(true);
  });

  it('rejects wrong token, wrong status, or expired', () => {
    expect(
      canServeDownload({
        status: 'PENDING',
        storedToken: 'abc',
        presentedToken: 'abc',
        expiresAt: new Date('2026-07-30T12:00:00.000Z'),
        now,
      }),
    ).toBe(false);

    expect(
      canServeDownload({
        status: 'COMPLETED',
        storedToken: 'abc',
        presentedToken: 'xyz',
        expiresAt: new Date('2026-07-30T12:00:00.000Z'),
        now,
      }),
    ).toBe(false);

    expect(
      canServeDownload({
        status: 'COMPLETED',
        storedToken: 'abc',
        presentedToken: 'abc',
        expiresAt: new Date('2026-07-01T12:00:00.000Z'),
        now,
      }),
    ).toBe(false);
  });

  it('grandfathering allows null expiry when flag set', () => {
    expect(
      canServeDownload({
        status: 'COMPLETED',
        storedToken: 'abc',
        presentedToken: 'abc',
        expiresAt: null,
        now,
        allowLegacyNoExpiry: true,
      }),
    ).toBe(true);

    expect(
      canServeDownload({
        status: 'COMPLETED',
        storedToken: 'abc',
        presentedToken: 'abc',
        expiresAt: null,
        now,
        allowLegacyNoExpiry: false,
      }),
    ).toBe(false);
  });
});
