import type { ChatMessage } from '@/types/guest'

export interface GuestChatBubbleProps {
  message: ChatMessage
}

export function GuestChatBubble({ message }: GuestChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={[
        'max-w-[88%] md:max-w-[85%] rounded-3xl px-5 py-4',
        isUser
          ? 'bg-surface-container-lowest text-on-surface ml-auto'
          : 'bg-on-primary/10 border border-on-primary/10 text-on-primary mr-auto',
      ].join(' ')}
    >
      <div className="text-xs opacity-50 mb-2 uppercase tracking-wide">
        {isUser ? 'You' : 'AI Concierge'}
      </div>
      <div className="leading-relaxed whitespace-pre-line">{message.content}</div>
    </div>
  )
}
