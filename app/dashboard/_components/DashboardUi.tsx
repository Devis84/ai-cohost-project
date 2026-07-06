"use client";

export function FieldLabel({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-2">
      <label className="block text-sm font-bold text-gray-800">
        {title}
      </label>

      {description && (
        <p className="text-xs text-gray-400 leading-relaxed mt-1">
          {description}
        </p>
      )}
    </div>
  );
}

export function SectionHeader({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-7">
      <h2 className="text-2xl md:text-[28px] font-black tracking-tight mb-2 text-gray-950">
        {icon} {title}
      </h2>

      {description && (
        <p className="text-sm md:text-base text-gray-500 leading-relaxed max-w-3xl">
          {description}
        </p>
      )}
    </div>
  );
}

export function CommandCard({
  icon,
  title,
  description,
  href,
  onClick,
  dark = false,
  disabled = false,
}: {
  icon: string;
  title: string;
  description: string;
  href?: string;
  onClick?: () => void;
  dark?: boolean;
  disabled?: boolean;
}) {
  const className = `block w-full text-left rounded-3xl p-5 transition border min-h-[180px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30 ${
    dark
      ? "bg-black text-white border-black hover:opacity-90"
      : "bg-white text-gray-950 border-gray-200 hover:border-black/20 hover:shadow-lg"
  } ${disabled ? "opacity-50 pointer-events-none saturate-0" : ""}`;

  const content = (
    <>
      <div className="text-3xl mb-4">{icon}</div>

      <div className="font-black text-lg mb-2 leading-tight">
        {title}
      </div>

      <div
        className={`text-sm leading-relaxed ${
          dark ? "text-white/60" : "text-gray-500"
        }`}
      >
        {description}
      </div>
    </>
  );

  if (href) {
    return (
      <a href={href} className={className}>
        {content}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={className}
    >
      {content}
    </button>
  );
}

export function StatusPill({
  label,
  value,
  active,
}: {
  label: string;
  value: string;
  active: boolean;
}) {
  return (
    <div
      className={`rounded-3xl p-4 border shadow-sm ${
        active
          ? "bg-green-50 border-green-100 text-green-800"
          : "bg-gray-50 border-gray-100 text-gray-500"
      }`}
    >
      <div className="text-xs uppercase tracking-[0.2em] mb-2 opacity-60">
        {label}
      </div>

      <div className="text-xl font-black">
        {value}
      </div>
    </div>
  );
}

export function TextArea({
  placeholder,
  value,
  onChange,
  large = false,
}: {
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  large?: boolean;
}) {
  const helperText = placeholder.trim();

  const firstDotIndex = helperText.indexOf(".");

  const title =
    firstDotIndex > 0
      ? helperText.slice(0, firstDotIndex).trim()
      : helperText;

  const description =
    firstDotIndex > 0
      ? helperText.slice(firstDotIndex + 1).trim()
      : "";

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-sm font-bold text-gray-900">
          {title}
        </label>

        {description && (
          <p className="text-sm text-gray-500 leading-relaxed mt-1">
            {description}
          </p>
        )}
      </div>

      <textarea
        className={`w-full border border-gray-200 rounded-2xl p-4 text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-black/20 ${
          large ? "min-h-[220px]" : "min-h-[150px]"
        }`}
        placeholder="Write the details here..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}