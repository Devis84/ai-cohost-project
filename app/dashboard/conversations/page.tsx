"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

type Property = {
  id: string
  property_name: string | null
  slug: string | null
}

type Conversation = {
  conversation_id: string
  property_id: string
  guest_name?: string | null
  guest_contact?: string | null
  channel?: string | null
  last_message?: string | null
  last_sender?: string | null
  last_message_at?: string | null
  priority?: string | null
  requires_host?: boolean | null
  issue_detected?: string | null
  unread_count?: number | null
  status?: string | null
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [properties, setProperties] = useState<Map<string, Property>>(new Map())
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterChannel, setFilterChannel] = useState<string | null>(null)
  const [filterPriority, setFilterPriority] = useState<string | null>(null)

  async function loadData() {
    try {
      setLoading(true)

      // Fetch properties
      const propsRes = await fetch("/api/properties")
      const propsData = await propsRes.json()
      const propsMap = new Map<string, Property>()
      if (propsData.properties) {
        propsData.properties.forEach((prop: Property) => {
          propsMap.set(prop.id, prop)
        })
      }
      setProperties(propsMap)

      // Fetch conversations
      const convRes = await fetch("/api/conversations")
      const convData = await convRes.json()
      const allConversations = (convData.conversations || []) as Conversation[]
      
      // Sort by last_message_at descending (most recent first)
      const sorted = allConversations.sort((a, b) => {
        const timeA = new Date(a.last_message_at || 0).getTime()
        const timeB = new Date(b.last_message_at || 0).getTime()
        return timeB - timeA
      })

      setConversations(sorted)
    } catch (err) {
      console.error("Failed to load conversations:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Filter conversations based on search and filters
  const filteredConversations = conversations.filter((conv) => {
    const property = properties.get(conv.property_id)
    const propertyName = property?.property_name || conv.property_id
    const guestName = conv.guest_name || "Guest"
    const lastMessage = conv.last_message || ""

    // Search filter
    const searchLower = searchQuery.toLowerCase()
    if (searchLower) {
      const matchesSearch =
        propertyName.toLowerCase().includes(searchLower) ||
        guestName.toLowerCase().includes(searchLower) ||
        lastMessage.toLowerCase().includes(searchLower)
      if (!matchesSearch) return false
    }

    // Channel filter
    if (filterChannel && conv.channel !== filterChannel) {
      return false
    }

    // Priority filter
    if (filterPriority && conv.priority !== filterPriority) {
      return false
    }

    return true
  })

  const getChannelIcon = (channel?: string | null) => {
    switch (channel) {
      case "whatsapp":
        return "💬"
      case "telegram":
        return "📱"
      case "guest_portal":
        return "🌐"
      case "web":
        return "💻"
      default:
        return "💬"
    }
  }

  const getPriorityColor = (priority?: string | null) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-900"
      case "high":
        return "bg-orange-100 text-orange-900"
      case "normal":
        return "bg-blue-100 text-blue-900"
      case "low":
        return "bg-gray-100 text-gray-900"
      default:
        return "bg-gray-100 text-gray-900"
    }
  }

  const formatTime = (dateString?: string | null) => {
    if (!dateString) return "—"
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return "now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const truncateMessage = (message?: string | null, length: number = 100) => {
    if (!message) return "—"
    return message.length > length
      ? message.substring(0, length) + "..."
      : message
  }

  // Get available channels and priorities from data
  const availableChannels = Array.from(
    new Set(conversations.map((c) => c.channel).filter(Boolean))
  )
  const availablePriorities = Array.from(
    new Set(conversations.map((c) => c.priority).filter(Boolean))
  )

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* HERO */}
        <div className="bg-gradient-to-br from-black via-zinc-900 to-zinc-800 text-white rounded-[32px] p-6 sm:p-8 shadow-2xl mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2">
            Conversations
          </h1>
          <p className="text-white/60">
            Track all guest conversations across properties and channels.
          </p>
        </div>

        {/* FILTERS & SEARCH */}
        <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-4 sm:p-6 mb-6">
          {/* Search */}
          <div className="mb-4 sm:mb-0">
            <input
              type="text"
              placeholder="Search by property, guest name, or message..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 border border-black/10 rounded-xl text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
            {/* Channel Filter */}
            <select
              value={filterChannel || ""}
              onChange={(e) =>
                setFilterChannel(e.target.value || null)
              }
              className="px-3 py-2 border border-black/10 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Channels</option>
              {availableChannels.map((channel) => (
                <option key={channel} value={channel || ""}>
                  {channel}
                </option>
              ))}
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority || ""}
              onChange={(e) =>
                setFilterPriority(e.target.value || null)
              }
              className="px-3 py-2 border border-black/10 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-black"
            >
              <option value="">All Priorities</option>
              {availablePriorities.map((priority) => (
                <option key={priority} value={priority || ""}>
                  {priority}
                </option>
              ))}
            </select>

            {/* Clear Filters */}
            <button
              onClick={() => {
                setSearchQuery("")
                setFilterChannel(null)
                setFilterPriority(null)
              }}
              className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-200 transition"
            >
              Clear
            </button>
          </div>
        </div>

        {/* CONVERSATIONS LIST */}
        {loading ? (
          // Loading State
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-8 text-center">
            <div className="inline-block mb-4">
              <div className="w-8 h-8 border-4 border-black/10 border-t-black rounded-full animate-spin" />
            </div>
            <p className="text-gray-600">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-8 text-center">
            <div className="text-4xl mb-3">💬</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchQuery || filterChannel || filterPriority
                ? "No conversations found"
                : "No conversations yet"}
            </h3>
            <p className="text-gray-600">
              {searchQuery || filterChannel || filterPriority
                ? "Try adjusting your search or filters."
                : "Guest conversations will appear here."}
            </p>
          </div>
        ) : (
          // Conversations Grid
          <div className="space-y-3 sm:space-y-4">
            {filteredConversations.map((conv) => {
              const property = properties.get(conv.property_id)
              const propertyName =
                property?.property_name || conv.property_id
              const guestName = conv.guest_name || "Guest"

              return (
                <div key={conv.conversation_id}>
                  <Link
                    href={`/dashboard/conversations/${conv.conversation_id}`}
                    className="block bg-white rounded-[20px] shadow-md border border-black/5 p-4 sm:p-5 hover:shadow-lg transition cursor-pointer"
                  >
                    {/* Header: Property & Time */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base">
                          {propertyName}
                        </h3>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {guestName}
                          {conv.guest_contact && (
                            <span> • {conv.guest_contact}</span>
                          )}
                        </p>
                      </div>
                      <span className="text-xs sm:text-sm text-gray-500 whitespace-nowrap flex-shrink-0">
                        {formatTime(conv.last_message_at)}
                      </span>
                    </div>

                    {/* Message Preview */}
                    <div className="mb-3 pb-3 border-b border-gray-100">
                      <p className="text-xs sm:text-sm text-gray-700 line-clamp-2">
                        {truncateMessage(conv.last_message)}
                      </p>
                    </div>

                    {/* Footer: Channel, Priority, Status */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Channel */}
                      <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-100">
                        {getChannelIcon(conv.channel)}
                        <span className="text-gray-700 capitalize">
                          {conv.channel || "unknown"}
                        </span>
                      </span>

                      {/* Priority Badge */}
                      {conv.priority && (
                        <span
                          className={`inline-block text-xs px-2 py-1 rounded-full ${getPriorityColor(
                            conv.priority
                          )} capitalize font-medium`}
                        >
                          {conv.priority}
                        </span>
                      )}

                      {/* Requires Host Indicator */}
                      {conv.requires_host && (
                        <span className="inline-block text-xs px-2 py-1 rounded-full bg-yellow-100 text-yellow-900 font-medium">
                          ⚠️ Needs Review
                        </span>
                      )}

                      {/* Unread Indicator */}
                      {conv.unread_count && conv.unread_count > 0 && (
                        <span className="ml-auto text-xs font-bold bg-black text-white px-2 py-1 rounded-full">
                          {conv.unread_count} new
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              )
            })}
          </div>
        )}

        {/* SUMMARY */}
        {!loading && conversations.length > 0 && (
          <div className="mt-6 text-sm text-gray-600 text-center">
            Showing {filteredConversations.length} of {conversations.length}{" "}
            conversations
          </div>
        )}
      </div>
    </div>
  )
}