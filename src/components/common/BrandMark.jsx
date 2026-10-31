export default function BrandMark({ inverse = false, className = "" }) {
  return (
    <div
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-2xl ${
        inverse
          ? "bg-white text-emerald-700"
          : "bg-emerald-600 text-white shadow-lg shadow-emerald-600/15"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="size-6"
      >
        <path d="M6 15c0-5 4.6-8.9 11-9-0.1 6.4-4 11-9 11-1.9 0-3.4-0.7-4-1.5" />
        <path d="M7 17c1.4-3.6 4.5-6.7 8.5-8.8" />
      </svg>
    </div>
  );
}
