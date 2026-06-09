import { useEffect, useRef } from 'react'
import { Bot } from 'lucide-react'
import { Button, Input, SuggestionChip } from '@/components/ui'
import { GuestChatBubble } from '@/components/molecules/GuestChatBubble'
import type { ChatMessage } from '@/types/guest'

const SUGGESTIONS = [
  "What's the WiFi?",
  'How do I check in?',
  'Best pizza nearby?',
  'Where can I park?',
  'House rules?',
  'How does checkout work?',
]

export interface GuestConciergeProps {
  messages: ChatMessage[]
  chatInput: string
  chatLoading: boolean
  onInputChange: (value: string) => void
  onSend: (messageOverride?: string) => void
}

export function GuestConcierge({
  messages,
  chatInput,
  chatLoading,
  onInputChange,
  onSend,
}: GuestConciergeProps) {
  const chatRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!chatRef.current) {
      return
    }
    chatRef.current.scrollTop = chatRef.current.scrollHeight
  }, [messages, chatLoading])

  return (
    <section
      id="ai-concierge"
      className="bg-primary text-on-primary rounded-[32px] p-5 md:p-8 shadow-2xl"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
        <div>
          <div className="uppercase tracking-[0.3em] text-xs text-on-primary/40 mb-4">
            AI CONCIERGE
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-3">
            Need help during your stay?
          </h2>
          <p className="text-on-primary/60 text-base md:text-lg max-w-2xl">
            Ask about WiFi, parking, house rules, restaurants, transport, check-in, checkout and
            more.
          </p>
        </div>
        <div>
          <Bot size={48} />
        </div>
      </div>

      {/* Suggestion chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {SUGGESTIONS.map((suggestion) => (
          <SuggestionChip
            key={suggestion}
            label={suggestion}
            onClick={() => onSend(suggestion)}
            className="bg-on-primary/10 text-on-primary border-on-primary/20 hover:bg-on-primary/20"
          />
        ))}
      </div>

      {/* Chat area */}
      <div className="bg-on-primary/5 border border-on-primary/10 rounded-[28px] overflow-hidden">
        <div
          ref={chatRef}
          className="h-[380px] md:h-[420px] overflow-y-auto p-4 md:p-6 space-y-4"
        >
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-on-primary/40 text-center px-4">
              Start by asking a question about your stay.
            </div>
          )}

          {messages.map((message) => (
            <GuestChatBubble key={message.id} message={message} />
          ))}

          {chatLoading && (
            <div className="bg-on-primary/10 border border-on-primary/10 text-on-primary mr-auto max-w-[85%] rounded-3xl px-5 py-4">
              AI Concierge is typing...
            </div>
          )}
        </div>

        {/* Input bar */}
        <div className="border-t border-on-primary/10 p-3 md:p-4 flex flex-col sm:flex-row gap-3">
          <Input
            value={chatInput}
            onChange={(event) => onInputChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                onSend()
              }
            }}
            placeholder="Ask your AI Concierge..."
            className="flex-1"
          />
          <Button
            onClick={() => onSend()}
            disabled={chatLoading || !chatInput.trim()}
            variant="secondary"
            size="lg"
          >
            Send
          </Button>
        </div>
      </div>
    </section>
  )
}
