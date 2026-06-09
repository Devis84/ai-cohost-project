import type { ReactNode } from 'react'

export interface FeatureItemProps {
  icon: ReactNode
  title: string
  description: string
}

export function FeatureItem({ icon, title, description }: FeatureItemProps) {
  return (
    <div className="group rounded-2xl bg-surface-container-lowest p-6 shadow-md transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent transition-colors duration-300 group-hover:bg-accent group-hover:text-on-accent">
        {icon}
      </div>

      <h3 className="mb-2 text-lg font-semibold text-on-surface">
        {title}
      </h3>

      <p className="text-sm leading-relaxed text-outline">
        {description}
      </p>
    </div>
  )
}
