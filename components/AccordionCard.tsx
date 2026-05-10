'use client'

import { useState } from 'react'

type Props = {
  icon: string
  title: string
  content?: string
  danger?: boolean
}

export default function AccordionCard({
  icon,
  title,
  content,
  danger = false,
}: Props) {

  const [open, setOpen] = useState(false)

  return (

    <div
      className={`rounded-[32px] shadow-xl border overflow-hidden transition-all duration-300 ${
        danger
          ? 'bg-gradient-to-br from-red-50 to-white border-red-100'
          : 'bg-white border-gray-100'
      }`}
    >

      {/* HEADER */}

      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 p-7 text-left"
      >

        <div className="flex items-center gap-5">

          <div
            className={`w-16 h-16 rounded-3xl flex items-center justify-center text-3xl ${
              danger
                ? 'bg-red-100'
                : 'bg-gray-100'
            }`}
          >

            {icon}

          </div>

          <div>

            <h2
              className={`text-2xl font-bold ${
                danger
                  ? 'text-red-700'
                  : 'text-gray-900'
              }`}
            >

              {title}

            </h2>

            <p className="text-gray-500 text-sm mt-1">

              Tap to expand

            </p>

          </div>

        </div>

        <div
          className={`text-2xl transition-transform duration-300 ${
            open
              ? 'rotate-180'
              : ''
          }`}
        >

          ⌄

        </div>

      </button>

      {/* CONTENT */}

      <div
        className={`grid transition-all duration-300 ease-in-out ${
          open
            ? 'grid-rows-[1fr]'
            : 'grid-rows-[0fr]'
        }`}
      >

        <div className="overflow-hidden">

          <div className="px-7 pb-7">

            <div className="bg-gray-50 rounded-2xl p-6 whitespace-pre-line leading-relaxed text-gray-700">

              {content || 'No information available.'}

            </div>

          </div>

        </div>

      </div>

    </div>
  )
}