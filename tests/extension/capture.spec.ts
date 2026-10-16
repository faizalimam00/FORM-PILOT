import { test, expect } from '@playwright/test';
import { statSync } from 'node:fs';
import { captureProduct } from '../../scripts/capture';
test('capture production UI with fictional data for visual verification', async () => {
  await captureProduct();
  for (const file of [
    'product-review.png',
    'profile-desktop.png',
    'launcher.png',
    'website-desktop.png',
    'website-mobile.png',
    'website-mobile-dark.png',
    'review-dark.png',
    'playground.png',
  ])
    expect(statSync(`docs/assets/${file}`).size).toBeGreaterThan(1000);
});
