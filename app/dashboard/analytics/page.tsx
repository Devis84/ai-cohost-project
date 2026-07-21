"use client";

import { useEffect, useState } from "react";

type AnalyticsMetrics = {
  totalProperties: number;
  totalConversations: number;
  totalMessages: number;
  guestMessages: number;
  aiMessages: number;
  mostActiveProperty: {
    property_id: string | null;
    property_name: string | null;
    conversations: number;
    messages: number;
  } | null;
  recentActivity: {
    conversation_id: string;
    property_name: string | null;
    guest_name: string | null;
    last_message_at: string | null;
    status: string;
  }[];
  propertyStats: {
    property_id: string | null;
    property_name: string | null;
    conversations: number;
    messages: number;
  }[];
};

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<AnalyticsMetrics | null>(
    null
  );

  async function loadAnalytics() {
    try {
      if (metrics) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await fetch(
        "/api/dashboard-analytics"
      );
      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data.success) {
        throw new Error("Unable to load analytics right now");
      }

      setMetrics(data.metrics);
    } catch (err) {
      setError("Unable to load analytics right now");
      console.error("Analytics error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-gray-300 border-t-black rounded-full" />
          </div>
          <p className="mt-4 text-gray-600 font-semibold">
            Loading analytics...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-red-50 border border-red-200 rounded-[24px] p-6">
            <p className="text-red-700 font-semibold">
              ❌ Error loading analytics
            </p>
            <p className="text-red-600 text-sm mt-2">
              {error}
            </p>
            <button
              onClick={loadAnalytics}
              disabled={refreshing}
              className="mt-4 px-4 py-2 bg-red-700 text-white rounded-lg font-semibold hover:bg-red-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {refreshing ? "Retrying..." : "Retry"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-6 text-center">
            <p className="text-gray-600 font-semibold">
              📊 No data available
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f6f1e8] to-[#f0e9dd]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-32">
        {/* HERO SECTION */}
        <div className="mb-8 sm:mb-10">
          <h1 className="text-4xl sm:text-5xl font-black mb-2">
            📊 Analytics
          </h1>
          <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
            Track AI conversations, guest engagement, and usage across all your properties.
          </p>
          <button
            type="button"
            onClick={loadAnalytics}
            disabled={refreshing}
            className="mt-4 inline-flex items-center rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {refreshing ? "Refreshing..." : "Refresh Analytics"}
          </button>
        </div>

        {/* KEY METRICS GRID */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-8 sm:mb-10">
          {/* Total Properties */}
          <div className="bg-white rounded-[20px] shadow-md border border-black/5 p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-gray-600 font-semibold mb-2">
              Properties
            </div>
            <div className="text-2xl sm:text-3xl font-black">
              {metrics.totalProperties}
            </div>
          </div>

          {/* Total Conversations */}
          <div className="bg-white rounded-[20px] shadow-md border border-black/5 p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-gray-600 font-semibold mb-2">
              Conversations
            </div>
            <div className="text-2xl sm:text-3xl font-black">
              {metrics.totalConversations}
            </div>
          </div>

          {/* Total Messages */}
          <div className="bg-white rounded-[20px] shadow-md border border-black/5 p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-gray-600 font-semibold mb-2">
              Messages
            </div>
            <div className="text-2xl sm:text-3xl font-black">
              {metrics.totalMessages}
            </div>
          </div>

          {/* AI Reply Rate */}
          <div className="bg-white rounded-[20px] shadow-md border border-black/5 p-4 sm:p-5">
            <div className="text-xs sm:text-sm text-gray-600 font-semibold mb-2">
              AI Coverage
            </div>
            <div className="text-2xl sm:text-3xl font-black">
              {metrics.totalMessages > 0
                ? Math.round(
                    (metrics.aiMessages /
                      metrics.totalMessages) *
                      100
                  )
                : 0}
              %
            </div>
          </div>
        </div>

        {/* MESSAGE BREAKDOWN & MOST ACTIVE */}
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-10">
          {/* Message Breakdown */}
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-5">
              💬 Message Breakdown
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {/* Guest Messages */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    Guest Messages
                  </span>
                  <span className="text-lg font-black">
                    {metrics.guestMessages}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width:
                        metrics.totalMessages > 0
                          ? `${(
                              (metrics.guestMessages /
                                metrics.totalMessages) *
                              100
                            ).toFixed(1)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>

              {/* AI Replies */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-700">
                    AI Replies
                  </span>
                  <span className="text-lg font-black">
                    {metrics.aiMessages}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{
                      width:
                        metrics.totalMessages > 0
                          ? `${(
                              (metrics.aiMessages /
                                metrics.totalMessages) *
                              100
                            ).toFixed(1)}%`
                          : "0%",
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Most Active Property */}
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-5">
              🔥 Most Active Property
            </h2>

            {metrics.mostActiveProperty ? (
              <div className="space-y-3 sm:space-y-4">
                <div className="bg-gray-50 rounded-[16px] p-4 sm:p-5">
                  <p className="text-sm text-gray-600 mb-1">
                    Property
                  </p>
                  <p className="text-lg sm:text-xl font-black break-words">
                    {metrics.mostActiveProperty
                      .property_name ||
                      "Unknown"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-blue-50 rounded-[16px] p-3 sm:p-4">
                    <p className="text-xs text-gray-600 font-semibold">
                      Conversations
                    </p>
                    <p className="text-xl sm:text-2xl font-black mt-1">
                      {
                        metrics.mostActiveProperty
                          .conversations
                      }
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-[16px] p-3 sm:p-4">
                    <p className="text-xs text-gray-600 font-semibold">
                      Messages
                    </p>
                    <p className="text-xl sm:text-2xl font-black mt-1">
                      {metrics.mostActiveProperty.messages}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">
                No activity yet
              </p>
            )}
          </div>
        </div>

        {/* PROPERTY STATS TABLE */}
        {metrics.propertyStats.length > 0 && (
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-5 sm:p-6 mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-5">
              📈 Property Breakdown
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 sm:px-4 font-semibold text-gray-600">
                      Property
                    </th>
                    <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-600">
                      Conversations
                    </th>
                    <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-600">
                      Messages
                    </th>
                    <th className="text-right py-3 px-2 sm:px-4 font-semibold text-gray-600">
                      Avg. Msgs
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.propertyStats.map((stat) => (
                    <tr
                      key={stat.property_id}
                      className="border-b border-gray-100 hover:bg-gray-50 transition"
                    >
                      <td className="py-3 px-2 sm:px-4 font-semibold">
                        {stat.property_name ||
                          "Unknown"}
                      </td>
                      <td className="text-right py-3 px-2 sm:px-4">
                        {stat.conversations}
                      </td>
                      <td className="text-right py-3 px-2 sm:px-4">
                        {stat.messages}
                      </td>
                      <td className="text-right py-3 px-2 sm:px-4 font-semibold">
                        {stat.conversations > 0
                          ? (
                              stat.messages /
                              stat.conversations
                            ).toFixed(1)
                          : 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* RECENT ACTIVITY */}
        {metrics.recentActivity.length > 0 && (
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-black mb-4 sm:mb-5">
              ⏱️ Recent Activity
            </h2>

            <div className="space-y-3">
              {metrics.recentActivity.map(
                (activity) => {
                  const date = activity.last_message_at
                    ? new Date(
                        activity.last_message_at
                      ).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A";

                  return (
                    <div
                      key={activity.conversation_id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-[16px] hover:bg-gray-100 transition"
                    >
                      <div className="min-w-0 flex-1 mb-2 sm:mb-0">
                        <p className="text-sm font-semibold truncate">
                          {activity.property_name ||
                            "Unknown Property"}
                        </p>
                        <p className="text-xs text-gray-600 truncate">
                          {activity.guest_name || "Guest"}
                        </p>
                      </div>

                      <div className="flex items-center gap-3 sm:gap-4">
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {date}
                        </span>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-semibold ${
                            activity.status ===
                            "active"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-200 text-gray-700"
                          }`}
                        >
                          {activity.status}
                        </span>
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          </div>
        )}

        {/* EMPTY STATE */}
        {metrics.totalConversations === 0 && (
          <div className="bg-white rounded-[24px] shadow-lg border border-black/5 p-8 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h2 className="text-2xl font-black mb-2">
              No conversations yet
            </h2>
            <p className="text-gray-600 max-w-sm mx-auto mb-4">
              Once guests start messaging your AI Co-Host,
              you&apos;ll see analytics and activity here.
            </p>
            <a
              href="/dashboard/inbox"
              className="inline-flex rounded-xl bg-black text-white px-4 py-2 text-sm font-semibold hover:opacity-90 transition"
            >
              Open Inbox
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
