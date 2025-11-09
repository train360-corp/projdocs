export const LoadingPage = ({msg}: {msg?: string}) => (
  <div className="w-full h-full flex flex-row items-center justify-center p-4 text-sm text-muted-foreground gap-2">
    <svg
      className="animate-spin h-4 w-4 text-muted-foreground"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
      />
    </svg>
    { typeof msg !== "undefined" && (
      <span>{msg}</span>
    )}
  </div>
)