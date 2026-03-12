/* ── Shared AI Service ── */

const AI_KEY = 'ct-chat-config'

interface AICfg {
  provider: string
  model: string
  apiKeys: Record<string, string>
}

function loadConfig(): AICfg {
  try {
    const raw = localStorage.getItem(AI_KEY)
    if (raw) return { provider: 'openai', model: 'gpt-4o-mini', apiKeys: {}, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { provider: 'openai', model: 'gpt-4o-mini', apiKeys: {} }
}

async function openaiPost(
  url: string,
  key: string,
  model: string,
  msgs: { role: string; content: string }[],
  extraHeaders: Record<string, string> = {},
) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}`, ...extraHeaders },
    body: JSON.stringify({ model, messages: msgs, max_tokens: 4096 }),
  })
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
  return ((await res.json()).choices?.[0]?.message?.content || '') as string
}

async function geminiPost(key: string, model: string, msgs: { role: string; content: string }[]) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`
  const sys = msgs.find(m => m.role === 'system')
  const contents = msgs
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const body: Record<string, unknown> = { contents }
  if (sys) body.systemInstruction = { parts: [{ text: sys.content }] }
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${res.statusText}`)
  return (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || ''
}

/** Call the configured AI provider with given messages. */
export async function callAI(msgs: { role: string; content: string }[]): Promise<string> {
  const cfg = loadConfig()
  const key = cfg.apiKeys[cfg.provider]
  if (!key) throw new Error('No API key configured. Set one in the AI Chatbot settings (bottom-right) first.')
  switch (cfg.provider) {
    case 'openai':
      return openaiPost('https://api.openai.com/v1/chat/completions', key, cfg.model, msgs)
    case 'groq':
      return openaiPost('https://api.groq.com/openai/v1/chat/completions', key, cfg.model, msgs)
    case 'openrouter':
      return openaiPost('https://openrouter.ai/api/v1/chat/completions', key, cfg.model, msgs, {
        'HTTP-Referer': globalThis.location?.origin || '',
      })
    case 'gemini':
      return geminiPost(key, cfg.model, msgs)
    default:
      throw new Error('Unknown AI provider')
  }
}

/** Check if the user has configured an AI provider. */
export function isAIConfigured(): boolean {
  const cfg = loadConfig()
  return Boolean(cfg.apiKeys[cfg.provider])
}
