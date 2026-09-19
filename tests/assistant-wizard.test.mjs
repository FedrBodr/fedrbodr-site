import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const script = html.match(/<script id="assistant-wizard">([\s\S]*?)<\/script>/)?.[1] || '';

test('wizard script exists and talks to studio API with credentials', () => {
  assert.ok(script.length > 500, 'wizard script missing');
  assert.match(script, /https:\/\/studio\.fedrbodr\.com/);
  assert.match(script, /credentials:\s*"include"/);
});

test('sends personal mode and source attribution', () => {
  assert.match(script, /mode:\s*"personal"/);
  assert.match(script, /source:\s*"fedrbodr\.com"/);
});

test('carries current consent versions', () => {
  assert.match(script, /DIAGNOSTIC_CONSENT_VERSION\s*=\s*"2026-09-18-v1"/);
  assert.match(script, /LEAD_CONSENT_VERSION\s*=\s*"2026-09-10-v1"/);
});

test('renders AI output via textContent only', () => {
  assert.doesNotMatch(script, /innerHTML\s*=/);
  assert.match(script, /textContent/);
});

test('handles rate limit and network errors with telegram fallback', () => {
  assert.match(script, /RATE_LIMITED/);
  assert.match(script, /DIAGNOSTIC_UNAVAILABLE/);
  assert.match(script, /https:\/\/t\.me\/FedrBodr/);
});

test('diagnose requires checked consent receipt header', () => {
  assert.match(script, /X-Diagnostic-Consent/);
  assert.match(script, /assistant-consent/);
});

test('handoff waits plausible elapsed time and includes honeypot', () => {
  assert.match(script, /handoffStartedAt/);
  assert.match(script, /website/);
});
