import { env } from 'cloudflare:workers';
import { SELF } from 'cloudflare:test';
import { afterEach, describe, expect, it, vi } from 'vitest';
import worker from '../worker';

const validBody = {
  messages: [{ role: 'user', content: 'Hello' }],
};

const chatRequest = (body: unknown, method = 'POST') => SELF.fetch('https://example.test/api/chat', {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: method === 'POST' ? JSON.stringify(body) : undefined,
});

const openAiEnv = (key?: string): Env => ({ ...env, CHAT_MODE: 'openai', OPENAI_API_KEY: key ?? '' });

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('POST /api/chat', () => {
  it('streams a mock plain-text response in multiple chunks', async () => {
    const response = await chatRequest(validBody);
    const reader = response.body?.getReader();

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    expect(reader).toBeDefined();

    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader!.read();
      if (done) break;
      chunks.push(value);
    }

    expect(chunks.length).toBeGreaterThan(1);
    expect(new TextDecoder().decode(Uint8Array.from(chunks.flatMap((chunk) => [...chunk])))).toBe('Mock response: streaming chat is ready.');
  });

  it('rejects unsupported methods', async () => {
    const response = await chatRequest(validBody, 'GET');

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
    await expect(response.json()).resolves.toEqual({
      error: { code: 'method_not_allowed', message: 'Request could not be processed.' },
    });
  });

  it.each([
    ['malformed JSON', '{', 400, 'invalid_request'],
    ['unknown role', { messages: [{ role: 'system', content: 'Hello' }] }, 400, 'invalid_request'],
    ['empty content', { messages: [{ role: 'user', content: '   ' }] }, 400, 'invalid_request'],
    ['too many messages', { messages: Array.from({ length: 51 }, () => ({ role: 'user', content: 'Hello' })) }, 413, 'payload_too_large'],
    ['oversized content', { messages: [{ role: 'user', content: 'a'.repeat(8 * 1024 + 1) }] }, 413, 'payload_too_large'],
    ['oversized aggregate content', { messages: Array.from({ length: 9 }, () => ({ role: 'user', content: 'a'.repeat(8 * 1024) })) }, 413, 'payload_too_large'],
  ])('rejects %s', async (_description, body, status, code) => {
    const response = typeof body === 'string'
      ? await SELF.fetch('https://example.test/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      })
      : await chatRequest(body);

    expect(response.status).toBe(status);
    await expect(response.json()).resolves.toEqual({
      error: { code, message: 'Request could not be processed.' },
    });
  });

  it('returns generic API not-found errors', async () => {
    const response = await SELF.fetch('https://example.test/api/unknown');

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'not_found', message: 'Request could not be processed.' },
    });
  });

  it('returns a generic error when OpenAI is unavailable', async () => {
    const response = await worker.fetch(new Request('https://example.test/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
    }), openAiEnv());

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'service_unavailable', message: 'Request could not be processed.' },
    });
  });

  it('returns a generic error for a failed OpenAI response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('provider details', { status: 500 })));

    const response = await worker.fetch(new Request('https://example.test/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
    }), openAiEnv('test-key'));

    expect(response.status).toBe(502);
    await expect(response.json()).resolves.toEqual({
      error: { code: 'upstream_error', message: 'Request could not be processed.' },
    });
  });

  it('forwards only response text deltas from streamed OpenAI SSE', async () => {
    const upstream = [
      'event: response.created\r\ndata: {"type":"response.created"}\r\n\r\n',
      'event: response.output_text.delta\r\ndata: {"type":"response.output_text.delta",\r\ndata: "delta":"Hello"}\r\n\r\n',
      'event: response.output_text.delta\r\ndata: {"delta":" world"}\r\n\r\n',
    ];
    const chunks = upstream.flatMap((part) => [part.slice(0, 11), part.slice(11)]);
    vi.stubGlobal('fetch', vi.fn(async () => new Response(new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(new TextEncoder().encode(chunk));
        controller.close();
      },
    }))));

    const response = await worker.fetch(new Request('https://example.test/api/chat', {
      method: 'POST',
      body: JSON.stringify(validBody),
    }), openAiEnv('test-key'));

    expect(response.status).toBe(200);
    expect(response.headers.get('Content-Type')).toBe('text/plain; charset=utf-8');
    await expect(response.text()).resolves.toBe('Hello world');
  });
});
