export default function DashboardChatPage() {
  return (
    <div className="min-h-screen bg-background p-10">
      <h1 className="text-3xl font-bold text-on-surface mb-4">Host Dashboard</h1>

      <p className="text-outline mb-8">Welcome to your AI Co-Host control panel.</p>

      <div className="flex flex-col gap-4">
        <a
          href="/dashboard/conversations"
          className="text-accent underline hover:opacity-80 transition"
        >
          Conversations
        </a>

        <a
          href="/dashboard/issues"
          className="text-accent underline hover:opacity-80 transition"
        >
          Issues
        </a>
      </div>
    </div>
  )
}
