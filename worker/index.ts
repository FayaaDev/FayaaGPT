const MAX_MESSAGES = 50;
const MAX_CONTENT_BYTES = 8 * 1024;
const MAX_TOTAL_CONTENT_BYTES = 64 * 1024;
const MAX_REQUEST_BYTES = 80 * 1024;
const encoder = new TextEncoder();

type ParsedBody =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413 };

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const errorResponse = (status: number, code: string, headers?: HeadersInit) => Response.json(
  { error: { code, message: 'Request could not be processed.' } },
  { status, headers },
);

async function parseJsonBody(request: Request): Promise<ParsedBody> {
  const reader = request.body?.getReader();
  if (!reader) return { ok: false, status: 400 };

  const chunks: Uint8Array[] = [];
  let size = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      size += value.byteLength;
      if (size > MAX_REQUEST_BYTES) {
        await reader.cancel();
        return { ok: false, status: 413 };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false, status: 400 };
  } finally {
    reader.releaseLock();
  }

  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(body)) };
  } catch {
    return { ok: false, status: 400 };
  }
}

function validateMessages(value: unknown): 400 | 413 | undefined {
  if (!Array.isArray(value) || value.length === 0) return 400;
  if (value.length > MAX_MESSAGES) return 413;

  let totalBytes = 0;
  for (const message of value) {
    if (
      typeof message !== 'object'
      || message === null
      || Array.isArray(message)
      || !('role' in message)
      || !('content' in message)
      || (message.role !== 'user' && message.role !== 'assistant')
      || typeof message.content !== 'string'
      || message.content.trim().length === 0
    ) return 400;

    const contentBytes = encoder.encode(message.content).byteLength;
    if (contentBytes > MAX_CONTENT_BYTES) return 413;

    totalBytes += contentBytes;
    if (totalBytes > MAX_TOTAL_CONTENT_BYTES) return 413;
  }

  return undefined;
}

function mockStream(signal: AbortSignal): ReadableStream<Uint8Array> {
  const chunks = ['Mock response: ', 'streaming chat ', 'is ready.'];
  let index = 0;
  let closed = false;
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;

  const close = () => {
    if (closed) return;
    closed = true;
    signal.removeEventListener('abort', close);
    streamController?.close();
  };

  return new ReadableStream({
    start(controller) {
      streamController = controller;
      if (signal.aborted) close();
      else signal.addEventListener('abort', close, { once: true });
    },
    pull(controller) {
      if (closed) return;

      controller.enqueue(encoder.encode(chunks[index]));
      index += 1;
      if (index === chunks.length) close();
    },
    cancel() {
      close();
    },
  });
}

function openAiTextStream(body: ReadableStream<Uint8Array>, signal: AbortSignal): ReadableStream<Uint8Array> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let event = '';
  let data: string[] = [];
  let closed = false;
  let streamController: ReadableStreamDefaultController<Uint8Array> | undefined;

  const close = () => {
    if (closed) return;
    closed = true;
    signal.removeEventListener('abort', cancelUpstream);
    streamController?.close();
  };

  const cancelUpstream = () => {
    close();
    void reader.cancel().catch(() => undefined);
  };

  const dispatch = () => {
    if (event === 'response.output_text.delta') {
      try {
        const value: unknown = JSON.parse(data.join('\n'));
        if (
          typeof value === 'object'
          && value !== null
          && 'delta' in value
          && typeof value.delta === 'string'
        ) {
          streamController?.enqueue(encoder.encode(value.delta));
        }
      } catch {
        // Ignore malformed provider events rather than exposing them.
      }
    }
    event = '';
    data = [];
  };

  const processLine = (line: string) => {
    if (line === '') {
      dispatch();
      return;
    }
    if (line.startsWith(':')) return;

    const separator = line.indexOf(':');
    const field = separator === -1 ? line : line.slice(0, separator);
    const value = separator === -1 ? '' : line.slice(separator + 1).replace(/^ /, '');
    if (field === 'event') event = value;
    if (field === 'data') data.push(value);
  };

  const process = (text: string) => {
    buffer += text;
    while (true) {
      const match = /\r\n|\r|\n/.exec(buffer);
      if (!match || match.index === undefined) return;
      processLine(buffer.slice(0, match.index));
      buffer = buffer.slice(match.index + match[0].length);
    }
  };

  return new ReadableStream({
    start(controller) {
      streamController = controller;
      signal.addEventListener('abort', cancelUpstream, { once: true });
      if (signal.aborted) cancelUpstream();

      void (async () => {
        try {
          while (!closed) {
            const { done, value } = await reader.read();
            if (done) break;
            process(decoder.decode(value, { stream: true }));
          }
          process(decoder.decode());
          if (buffer) processLine(buffer);
          if (data.length > 0) dispatch();
          close();
        } catch {
          close();
        } finally {
          reader.releaseLock();
        }
      })();
    },
    async cancel() {
      close();
      await reader.cancel();
    },
  });
}

async function openAiStream(
  request: Request,
  env: Env,
  messages: ChatMessage[],
): Promise<Response> {
  if (!env.OPENAI_API_KEY) return errorResponse(503, 'service_unavailable');

  let upstream: Response;
  try {
    upstream = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: env.OPENAI_MODEL, input: messages, stream: true, store: false }),
      signal: request.signal,
    });
  } catch {
    return errorResponse(502, 'upstream_error');
  }

  if (!upstream.ok || !upstream.body) return errorResponse(502, 'upstream_error');

  return new Response(openAiTextStream(upstream.body, request.signal), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

async function handleChat(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') {
    return errorResponse(405, 'method_not_allowed', { Allow: 'POST' });
  }

  const parsed = await parseJsonBody(request);
  if (!parsed.ok) {
    return errorResponse(parsed.status, parsed.status === 413 ? 'payload_too_large' : 'invalid_request');
  }

  if (
    typeof parsed.value !== 'object'
    || parsed.value === null
    || Array.isArray(parsed.value)
    || !('messages' in parsed.value)
  ) {
    return errorResponse(400, 'invalid_request');
  }

  const validationError = validateMessages(parsed.value.messages);
  if (validationError) {
    return errorResponse(validationError, validationError === 413 ? 'payload_too_large' : 'invalid_request');
  }

  const messages = parsed.value.messages as ChatMessage[];
  if (env.CHAT_MODE === 'openai') return openAiStream(request, env, messages);

  return new Response(mockStream(request.signal), {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}

export default {
  async fetch(request, env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname === '/api/chat') return handleChat(request, env);
    if (pathname.startsWith('/api/')) return errorResponse(404, 'not_found');
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
