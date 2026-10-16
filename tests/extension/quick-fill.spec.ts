import { test, expect, type BrowserContext } from '@playwright/test';
import { launch, sample, trigger } from './helpers';

let context: BrowserContext;
let id: string;
test.beforeEach(async () => {
  ({ context, id } = await launch());
  await sample(context, id);
});
test.afterEach(async () => {
  await context?.close();
});
const click = (text: string) =>
  `Array.from(document.querySelectorAll('button')).find(b => b.textContent.trim() === ${JSON.stringify(text)}).click()`;

test('toolbar fills in place, preserves existing values and undoes without overwriting later edits', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/event/');
  await page.locator('#event-email').fill('already@example.com');
  const popup = await trigger(context, page, id);
  const pages = context.pages().length;
  await expect(page.locator('#event-first')).toHaveValue('');
  await popup.evaluate(click('Fill form'));
  await expect.poll(() => popup.evaluate('document.body.innerText')).toMatch(/fields? filled\./);
  expect(context.pages()).toHaveLength(pages);
  await expect(page.locator('#event-first')).toHaveValue('Alex');
  await expect(page.locator('#event-email')).toHaveValue('already@example.com');
  await expect(
    page.getByText('Demo completed locally. No details were sent anywhere.'),
  ).not.toBeVisible();
  // Dispatch an edit without stealing focus from the native popup.
  await page.locator('#event-first').evaluate((input: HTMLInputElement) => {
    input.value = 'My later edit';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await popup.evaluate(click('Undo last fill'));
  await expect.poll(() => popup.evaluate('document.body.innerText')).toContain('Undo: restored');
  await expect(page.locator('#event-first')).toHaveValue('My later edit');
  await expect(page.locator('#event-last')).toHaveValue('');
  await expect(page.locator('#event-email')).toHaveValue('already@example.com');
});

test('quick fill skips ambiguous and sensitive fields; optional corrections remain in the popup', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/difficult/');
  const popup = await trigger(context, page, id);
  const pages = context.pages().length;
  const previous = await page.locator('#existing-mail').inputValue();
  await popup.evaluate(click('Fill form'));
  await expect.poll(() => popup.evaluate('document.body.innerText')).toContain('left unchanged.');
  await expect(page.locator('#mystery-b')).toHaveValue('');
  await expect(page.locator('#secret')).toHaveValue('');
  await expect(page.locator('#existing-mail')).toHaveValue(previous);
  await popup.evaluate(click('Review fields & corrections'));
  await expect.poll(() => popup.evaluate('document.body.innerText')).toContain('Scan complete.');
  expect(context.pages()).toHaveLength(pages);
  // Correct Account name, remember it, explicitly select it and fill in the same popup.
  await popup.evaluate(`(() => {
    const card = Array.from(document.querySelectorAll('.field-card')).find(el => el.querySelector('input[aria-label="Select Account name"]'));
    const select = card.querySelector('select');
    select.value = 'company';
    select.dispatchEvent(new Event('change', {bubbles:true}));
  })()`);
  await popup.evaluate(`(() => {
    const card = Array.from(document.querySelectorAll('.field-card')).find(el => el.querySelector('input[aria-label="Select Account name"]'));
    const remember = Array.from(card.querySelectorAll('label')).find(el => el.textContent.includes('Remember this mapping'));
    remember.querySelector('input').click();
    card.querySelector('input[aria-label="Select Account name"]').click();
  })()`);
  await popup.evaluate("document.querySelector('.review-footer .button').click()");
  await expect(page.locator('#mystery-b')).toHaveValue('Example Studio');
  await expect.poll(() => popup.evaluate('document.body.innerText')).toMatch(/fields? filled\./);
  await popup.evaluate(click('Back'));
  await expect
    .poll(() => popup.evaluate("document.querySelector('button.primary')?.textContent"))
    .toBe('Fill form');
  expect(context.pages()).toHaveLength(pages);
});

test('direct fill handles React-controlled fields and newly rendered fields on the next click', async () => {
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/saas/');
  const popup = await trigger(context, page, id);
  await popup.evaluate(click('Fill form'));
  await expect.poll(() => popup.evaluate('document.body.innerText')).toMatch(/fields? filled\./);
  await expect(page.getByLabel('React state preview')).toContainText('Alex Morgan');
  await page.locator('#saas-kind').evaluate((el: HTMLSelectElement) => {
    el.value = 'work';
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expect(page.locator('#saas-company')).toBeVisible();
  await popup.evaluate(click('Fill form'));
  await expect(page.locator('#saas-company')).toHaveValue('Example Studio');
  await expect(page.getByLabel('React state preview')).toContainText('Example Studio');
  await expect(page.locator('#saas-pass')).toHaveValue('');
});

test('restricted pages show an error inside the toolbar, without creating a window', async () => {
  const page = await context.newPage();
  await page.goto('chrome://version');
  const popup = await trigger(context, page, id);
  const pages = context.pages().length;
  await popup.evaluate(click('Fill form'));
  await expect
    .poll(() => popup.evaluate('document.querySelector("[role=alert]")?.textContent'))
    .toContain('cannot be inspected');
  expect(context.pages()).toHaveLength(pages);
});

test('toolbar profile selection persists and empty pages produce a useful result', async () => {
  const options = context.pages().find((page) => page.url().includes('/options.html'))!;
  await options.getByRole('button', { name: '+ New work profile', exact: true }).click();
  await options.getByLabel('Profile name', { exact: true }).fill('Work example');
  await options.getByLabel('First name', { exact: true }).fill('Jamie');
  await options.getByRole('button', { name: 'Save profile', exact: true }).click();
  await expect(options.getByText('Profile saved on this device.')).toBeVisible();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4321/forms/event/');
  const popup = await trigger(context, page, id);
  await popup.evaluate(`(() => {
    const select = document.querySelector('select');
    select.value = Array.from(select.options).find(option => option.textContent === 'Work example').value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  })()`);
  await expect
    .poll(() => popup.evaluate('document.body.innerText'))
    .toContain('Profile data changed.');
  await popup.evaluate(click('Fill form'));
  await expect(page.locator('#event-first')).toHaveValue('Jamie');
  await expect.poll(() => popup.evaluate('document.body.innerText')).toMatch(/fields? filled\./);
  await popup.close();
  await page.goto('http://127.0.0.1:4321/about/');
  const reopened = await trigger(context, page, id);
  expect(
    await reopened.evaluate("document.querySelector('select').selectedOptions[0].textContent"),
  ).toBe('Work example');
  await reopened.evaluate(click('Fill form'));
  await expect
    .poll(() => reopened.evaluate('document.body.innerText'))
    .toContain('No supported form fields found');
});
