import { useState, useEffect, useRef } from 'react'
import { useStore } from '../../store/useStore'
import { Badge } from '../../components/ui'
import { cn } from '../../lib/utils'
import {
  MessageSquare, Send, X, Settings, Trash2, Bot, User,
  Loader2, Key, AlertCircle, ChevronDown,
} from 'lucide-react'

/* ── Provider definitions ── */
const AI_PROVIDERS = [
  {
    id: 'openai',
    name: 'OpenAI',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
    defaultModel: 'gpt-4o-mini',
  },
  {
    id: 'groq',
    name: 'Groq',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768', 'llama-3.1-8b-instant'],
    defaultModel: 'llama-3.3-70b-versatile',
  },
  {
    id: 'gemini',
    name: 'Google Gemini',
    models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
    defaultModel: 'gemini-1.5-flash',
  },
  {
    id: 'openrouter',
    name: 'OpenRouter',
    models: ['anthropic/claude-3.5-sonnet', 'google/gemini-pro-1.5', 'meta-llama/llama-3.1-70b-instruct'],
    defaultModel: 'anthropic/claude-3.5-sonnet',
  },
]

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
}

interface ChatConfig {
  provider: string
  model: string
  apiKeys: Record<string, string>
}

const STORAGE_KEY = 'ct-chat-config'

function loadConfig(): ChatConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return { provider: 'openai', model: 'gpt-4o-mini', apiKeys: {}, ...JSON.parse(raw) }
  } catch { /* ignore */ }
  return { provider: 'openai', model: 'gpt-4o-mini', apiKeys: {} }
}

/* ── API call helpers ── */

async function callOpenAILike(
  url: string, apiKey: string, model: string,
  messages: { role: string; content: string }[],
  extra: Record<string, string> = {},
): Promise<string> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}`, ...extra },
    body: JSON.stringify({ model, messages, max_tokens: 2048 }),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data.choices?.[0]?.message?.content || 'No response.'
}

async function callGemini(
  apiKey: string, model: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`
  const sysMsg = messages.find(m => m.role === 'system')
  const contents = messages
    .filter(m => m.role !== 'system')
    .map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] }))
  const body: Record<string, unknown> = { contents }
  if (sysMsg) body.systemInstruction = { parts: [{ text: sysMsg.content }] }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Gemini error ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response.'
}

async function callAI(
  provider: string, model: string, apiKey: string,
  messages: { role: string; content: string }[],
): Promise<string> {
  switch (provider) {
    case 'openai':
      return callOpenAILike('https://api.openai.com/v1/chat/completions', apiKey, model, messages)
    case 'groq':
      return callOpenAILike('https://api.groq.com/openai/v1/chat/completions', apiKey, model, messages)
    case 'openrouter':
      return callOpenAILike('https://openrouter.ai/api/v1/chat/completions', apiKey, model, messages, {
        'HTTP-Referer': globalThis.location?.origin || '',
      })
    case 'gemini':
      return callGemini(apiKey, model, messages)
    default:
      throw new Error(`Unknown provider: ${provider}`)
  }
}

/* ── Component ── */

export function Chatbot() {
  const { profile, applications, roadmap, questions } = useStore()
  const [isOpen, setIsOpen] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState<ChatConfig>(loadConfig)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  function save(c: ChatConfig) { setConfig(c); localStorage.setItem(STORAGE_KEY, JSON.stringify(c)) }

  const prov = AI_PROVIDERS.find(p => p.id === config.provider) || AI_PROVIDERS[0]
  const hasKey = !!config.apiKeys[config.provider]

  function systemPrompt() {
    const ints = applications.filter(a =>
      ['Phone Screen','Technical Interview','Final Interview','Offer','Accepted'].includes(a.status)).length
    const roadmapPct = roadmap.length ? Math.round(roadmap.filter(r => r.completed).length / roadmap.length * 100) : 0
    const confPct = questions.length ? Math.round(questions.filter(q => q.status === 'Confident').length / questions.length * 100) : 0
    return `You are a career coach AI assistant in CareerTrack Pro. Help with interview prep, resume tips, career strategy, and technical questions.
User context:
- Name: ${profile.fullName} | Status: ${profile.currentStatus} | Field: ${profile.field}
- Target: ${profile.targetRoles.join(', ')} | Dream: ${profile.dreamCompanies.join(', ')}
- ${applications.length} applications, ${ints} interviews | Roadmap ${roadmapPct}% | ${confPct}% questions mastered
- Improving: ${profile.skillsToImprove.join(', ')}
Be concise, specific, and encouraging.`
  }

  async function handleSend() {
    if (!input.trim() || loading) return
    if (!hasKey) { setError('Configure your API key first.'); setShowSettings(true); return }
    setError('')
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: input, timestamp: new Date().toISOString() }
    const allMessages = [...messages, userMsg]
    setMessages(allMessages)
    setInput('')
    setLoading(true)
    try {
      const apiMsgs = [
        { role: 'system', content: systemPrompt() },
        ...allMessages.map(m => ({ role: m.role, content: m.content })),
      ]
      const reply = await callAI(config.provider, config.model, config.apiKeys[config.provider], apiMsgs)
      setMessages(prev => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: reply, timestamp: new Date().toISOString() }])
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Request failed. Check your API key.')
    }
    setLoading(false)
  }

  /* ── Floating trigger ── */
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg hover:shadow-elevated transition-all flex items-center justify-center group"
        aria-label="Open AI Chat"
      >
        <MessageSquare className="w-6 h-6 group-hover:scale-110 transition-transform" />
        {!hasKey && <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />}
      </button>
    )
  }

  /* ── Chat panel ── */
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[600px] max-h-[80vh] bg-white dark:bg-gray-900 rounded-xl shadow-elevated border border-gray-200 dark:border-gray-800 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gradient-to-r from-brand-600 to-brand-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="text-sm font-bold tracking-tight">AI Career Coach</span>
          <Badge className="bg-white/20 text-white text-[10px]">{prov.name}</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowSettings(v => !v)} className="p-1.5 hover:bg-white/20 rounded-lg" title="Settings"><Settings className="w-4 h-4" /></button>
          <button onClick={() => setMessages([])} className="p-1.5 hover:bg-white/20 rounded-lg" title="Clear"><Trash2 className="w-4 h-4" /></button>
          <button onClick={() => setIsOpen(false)} className="p-1.5 hover:bg-white/20 rounded-lg" title="Close"><X className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Settings */}
      {showSettings && (
        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 space-y-3 flex-shrink-0">
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Provider</label>
            <select
              value={config.provider}
              onChange={e => {
                const p = AI_PROVIDERS.find(x => x.id === e.target.value)!
                save({ ...config, provider: p.id, model: p.defaultModel })
              }}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 dark:text-gray-100"
              title="AI provider"
            >
              {AI_PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">Model</label>
            <select
              value={config.model}
              onChange={e => save({ ...config, model: e.target.value })}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 dark:text-gray-100"
              title="AI model"
            >
              {prov.models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block flex items-center gap-1">
              <Key className="w-3 h-3" /> API Key ({prov.name})
            </label>
            <input
              type="password"
              value={config.apiKeys[config.provider] || ''}
              onChange={e => save({ ...config, apiKeys: { ...config.apiKeys, [config.provider]: e.target.value } })}
              placeholder={`Enter ${prov.name} API key`}
              className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 dark:text-gray-100"
            />
            <p className="text-[10px] text-gray-400 mt-1">Stored locally in your browser only — never sent to any server.</p>
          </div>
          <button onClick={() => setShowSettings(false)} className="w-full text-xs font-medium text-brand-600 hover:text-brand-700 py-1">
            <ChevronDown className="w-3 h-3 inline mr-1" /> Collapse settings
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && !showSettings && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Bot className="w-10 h-10 text-brand-300 dark:text-brand-700 mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">AI Career Coach</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[250px] mb-4">
              Ask about interview prep, resume tips, career strategy, or any questions.
            </p>
            {!hasKey ? (
              <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-xs text-brand-600 hover:underline">
                <Key className="w-3 h-3" /> Configure API key to start
              </button>
            ) : (
              <div className="space-y-2 w-full">
                {[
                  'How should I prepare for a GenAI interview?',
                  'Review my application strategy',
                  'What skills should I focus on?',
                ].map(q => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="w-full text-left text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-3 py-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-750 transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {messages.map(msg => (
          <div key={msg.id} className={cn('flex gap-2', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
            {msg.role === 'assistant' && (
              <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4 text-brand-600 dark:text-brand-400" />
              </div>
            )}
            <div className={cn(
              'max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed',
              msg.role === 'user'
                ? 'bg-brand-600 text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-md',
            )}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl rounded-bl-md px-4 py-3">
              <Loader2 className="w-4 h-4 animate-spin text-brand-500" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-100 dark:border-red-800">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() } }}
            placeholder={hasKey ? 'Ask anything about your career...' : 'Configure API key first...'}
            disabled={!hasKey}
            className="flex-1 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 dark:text-gray-100 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-400 disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || loading || !hasKey}
            className="p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Send message"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
