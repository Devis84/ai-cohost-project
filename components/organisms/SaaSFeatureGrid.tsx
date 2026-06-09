import {
  Bot,
  BookOpen,
  AlertTriangle,
  QrCode,
  LayoutDashboard,
  MessageCircle,
} from 'lucide-react'
import { FeatureItem } from '@/components/molecules/FeatureItem'

const FEATURES = [
  {
    icon: <Bot size={24} />,
    title: 'AI Concierge',
    description:
      '24/7 AI guest assistant that answers questions about WiFi, check-in, local tips, and more.',
  },
  {
    icon: <BookOpen size={24} />,
    title: 'Digital Welcome Book',
    description:
      'Beautiful guest-facing welcome page with property info, house rules, and local recommendations.',
  },
  {
    icon: <AlertTriangle size={24} />,
    title: 'Smart Issue Tracking',
    description:
      'Automatic escalation detection. Get notified instantly when guests report problems.',
  },
  {
    icon: <QrCode size={24} />,
    title: 'QR & NFC Access',
    description:
      'Generate QR codes and NFC tags for instant guest page access.',
  },
  {
    icon: <LayoutDashboard size={24} />,
    title: 'Host Dashboard',
    description:
      'Manage multiple properties, conversations, and cleaning tasks from one place.',
  },
  {
    icon: <MessageCircle size={24} />,
    title: 'Multi-Channel',
    description:
      'Coming soon: WhatsApp, Telegram integration for guest communication.',
  },
] as const

export function SaaSFeatureGrid() {
  return (
    <section id="features" className="bg-surface px-4 py-20 sm:px-6 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mb-14 text-center">
          <h2 className="mb-3 text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
            Everything you need to delight your guests
          </h2>
          <p className="mx-auto max-w-xl text-base text-outline">
            Powerful tools designed for modern property hosts. Simple to set up,
            delightful to use.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon, title, description }) => (
            <FeatureItem
              key={title}
              icon={icon}
              title={title}
              description={description}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
