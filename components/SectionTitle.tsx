type Props = {
  eyebrow?: string
  title: string
  subtitle?: string
}

export default function SectionTitle({
  eyebrow,
  title,
  subtitle,
}: Props) {

  return (

    <div className="mb-6">

      {eyebrow && (

        <div className="uppercase tracking-[0.22em] text-[11px] font-semibold text-gray-400 mb-2">

          {eyebrow}

        </div>

      )}

      <h2 className="text-3xl font-bold tracking-tight text-gray-900">

        {title}

      </h2>

      {subtitle && (

        <p className="text-gray-500 mt-2 leading-relaxed max-w-2xl">

          {subtitle}

        </p>

      )}

    </div>
  )
}