import { FormEvent, KeyboardEvent, useEffect, useRef, useState } from 'react';

import Send from '~icons/Send';

type Role = 'user' | 'assistant';

type Message = {
  id: string;
  role: Role;
  content: string;
};

type Conversation = {
  id: string;
  title: string;
  messages: Message[];
};

const newId = () => crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

const welcomeMessage: Message = {
  id: newId(),
  role: 'assistant',
  content: 'How can I help you today?',
};

const maxMessageBytes = 8 * 1024;
const maxRequestBytes = 64 * 1024;
const maxRequestMessages = 50;
const utf8ByteLength = (value: string) => new TextEncoder().encode(value).byteLength;

const buildRequestMessages = (messages: Message[]) => {
  const requestMessages: { role: Role; content: string }[] = [];
  let totalBytes = 0;

  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index];
    const messageBytes = utf8ByteLength(message.content);

    if (
      message.id === welcomeMessage.id
      || !message.content
      || messageBytes > maxMessageBytes
    ) continue;
    if (requestMessages.length === maxRequestMessages || totalBytes + messageBytes > maxRequestBytes) break;

    requestMessages.unshift({ role: message.role, content: message.content });
    totalBytes += messageBytes;
  }

  return requestMessages;
};

export default function App() {
  const [conversations, setConversations] = useState<Conversation[]>([
    { id: newId(), title: 'New conversation', messages: [welcomeMessage] },
  ]);
  const [activeConversationId, setActiveConversationId] = useState(conversations[0].id);
  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const abortController = useRef<AbortController | null>(null);
  const threadEnd = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find(({ id }) => id === activeConversationId) ?? conversations[0];

  useEffect(() => {
    threadEnd.current?.scrollIntoView({ block: 'end' });
  }, [activeConversation?.messages, isSending]);

  useEffect(() => () => abortController.current?.abort(), []);

  const addConversation = () => {
    const conversation = { id: newId(), title: 'New conversation', messages: [welcomeMessage] };
    setConversations((current) => [conversation, ...current]);
    setActiveConversationId(conversation.id);
    setDraft('');
    setError(null);
    setIsSidebarOpen(false);
  };

  const updateMessages = (conversationId: string, update: (messages: Message[]) => Message[]) => {
    setConversations((current) => current.map((conversation) => (
      conversation.id === conversationId
        ? { ...conversation, messages: update(conversation.messages) }
        : conversation
    )));
  };

  const sendMessage = async () => {
    const content = draft.trim();
    if (isSending) return;
    if (utf8ByteLength(draft) > maxMessageBytes) {
      setError('Messages must be 8 KiB or smaller.');
      return;
    }
    if (!content) return;

    const conversationId = activeConversation.id;
    const userMessage: Message = { id: newId(), role: 'user', content };
    const assistantMessage: Message = { id: newId(), role: 'assistant', content: '' };
    const requestMessages = buildRequestMessages([...activeConversation.messages, userMessage]);

    if (!requestMessages.length) {
      setError('Unable to prepare a valid chat request.');
      return;
    }

    setDraft('');
    setError(null);
    setIsSending(true);
    updateMessages(conversationId, (messages) => [...messages, userMessage, assistantMessage]);
    setConversations((current) => current.map((conversation) => (
      conversation.id === conversationId && conversation.title === 'New conversation'
        ? { ...conversation, title: content.slice(0, 36) }
        : conversation
    )));

    const controller = new AbortController();
    abortController.current = controller;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: requestMessages }),
        signal: controller.signal,
      });

      if (!response.ok || !response.body) throw new Error('Chat request failed');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let responseText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        responseText += decoder.decode(value, { stream: true });
        updateMessages(conversationId, (messages) => messages.map((message) => (
          message.id === assistantMessage.id ? { ...message, content: responseText } : message
        )));
      }

      responseText += decoder.decode();
      updateMessages(conversationId, (messages) => messages.map((message) => (
        message.id === assistantMessage.id ? { ...message, content: responseText } : message
      )));
    } catch (caughtError) {
      if (!(caughtError instanceof DOMException && caughtError.name === 'AbortError')) {
        updateMessages(conversationId, (messages) => messages.filter(({ id }) => id !== assistantMessage.id));
        setError('Something went wrong. Please try again.');
      }
    } finally {
      if (abortController.current === controller) {
        abortController.current = null;
        setIsSending(false);
      }
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const stopResponse = () => abortController.current?.abort();

  return (
    <main className="flex h-full bg-app-gray-2 text-zinc-100">
      <aside className={`${isSidebarOpen ? 'fixed inset-0 z-20 flex w-full' : 'hidden'} tablet:static tablet:flex tablet:w-72 tablet:shrink-0`}>
        <button
          aria-label="Close conversations"
          className="flex-1 bg-black/50 tablet:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
        <div className="flex w-72 flex-col border-r border-white/10 bg-[#171717] p-3">
          <button
            className="flex items-center gap-3 rounded-lg border border-white/15 px-3 py-3 text-left text-sm transition hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-app-active"
            onClick={addConversation}
          >
            <span className="text-lg leading-none">+</span>
            New chat
          </button>
          <nav aria-label="Conversations" className="mt-4 flex-1 space-y-1 overflow-y-auto">
            {conversations.map((conversation) => (
              <button
                className={`block w-full truncate rounded-lg px-3 py-2.5 text-left text-sm transition focus:outline-none focus:ring-2 focus:ring-app-active ${conversation.id === activeConversation.id ? 'bg-white/10 text-white' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
                key={conversation.id}
                onClick={() => {
                  setActiveConversationId(conversation.id);
                  setError(null);
                  setIsSidebarOpen(false);
                }}
              >
                {conversation.title}
              </button>
            ))}
          </nav>
          <div className="border-t border-white/10 pt-3 text-xs text-zinc-500">ChatGPT</div>
        </div>
      </aside>

      <section className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 items-center border-b border-white/10 px-3 tablet:px-6">
          <button
            aria-label="Open conversations"
            className="mr-3 rounded p-2 text-zinc-300 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-app-active tablet:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            ☰
          </button>
          <img alt="ChatGPT" className="mr-2 h-6 w-6" src="/ChatGPT.png" />
          <span className="text-sm font-medium">ChatGPT</span>
        </header>

        <div className="flex-1 overflow-y-auto">
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 tablet:px-8">
            {activeConversation.messages.map((message) => (
              <article className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`} key={message.id}>
                {message.role === 'assistant' && <img alt="" className="mt-1 h-7 w-7 shrink-0" src="/ChatGPT.png" />}
                <p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === 'user' ? 'bg-app-active text-white' : 'bg-[#2f2f2f] text-zinc-100'}`}>
                  {message.content || (isSending ? <span className="animate-pulse text-zinc-400">Thinking…</span> : '')}
                </p>
              </article>
            ))}
            {error && <p className="rounded-lg border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">{error}</p>}
            <div ref={threadEnd} />
          </div>
        </div>

        <form className="mx-auto w-full max-w-3xl px-4 pb-4 tablet:px-8" onSubmit={handleSubmit}>
          <div className="flex items-end gap-2 rounded-2xl border border-white/15 bg-[#2f2f2f] p-2 shadow-lg">
            <textarea
              aria-label="Message ChatGPT"
              className="max-h-48 min-h-11 flex-1 resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-zinc-500"
              disabled={isSending}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
              placeholder="Message ChatGPT"
              rows={1}
              value={draft}
            />
            {isSending ? (
              <button aria-label="Stop generating" className="mb-1 rounded-lg bg-zinc-100 px-3 py-2 text-xs font-medium text-zinc-900 hover:bg-white focus:outline-none focus:ring-2 focus:ring-app-active" onClick={stopResponse} type="button">
                Stop
              </button>
            ) : (
              <button aria-label="Send message" className="mb-1 rounded-lg bg-app-active p-2 text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-app-active" disabled={!draft.trim()} type="submit">
                <Send className="text-white" size={20} />
              </button>
            )}
          </div>
          <p className="pt-2 text-center text-xs text-zinc-500">ChatGPT can make mistakes. Check important info.</p>
        </form>
      </section>
    </main>
  );
}
