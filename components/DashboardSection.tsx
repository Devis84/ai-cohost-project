type Props = {
  title: string
  subtitle?: string
  icon?: string
  children: React.ReactNode
}

export default function DashboardSection({
  title,
  subtitle,
  icon,
  children,
}: Props) {

  return (

    <section className="bg-white rounded-[36px] shadow-xl border border-gray-100 overflow-hidden">

      {/* HEADER */}

      <div className="p-8 border-b border-gray-100">

        <div className="flex items-start gap-5">

          {icon && (

            <div className="w-16 h-16 rounded-3xl bg-gray-100 flex items-center justify-center text-3xl shrink-0">

              {icon}

            </div>

          )}

          <div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">

              {title}

            </h2>

            {subtitle && (

              <p className="text-gray-500 leading-relaxed max-w-2xl">

                {subtitle}

              </p>

            )}

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="p-8">

        {children}

      </div>

    </section>
  )
}