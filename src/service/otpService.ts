import { randomInt } from 'node:crypto';

export function generateOtp() {
    return randomInt(0, 1_000_000).toString().padStart(6, '0');
}