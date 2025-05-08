import { Square, Compass } from "lucide-react"

interface MasonicLogoProps {
  className?: string
  size?: "sm" | "md" | "lg"
}

export function MasonicLogo({ className = "", size = "md" }: MasonicLogoProps) {
  const sizeClasses = {
    sm: "h-8 w-8",
    md: "h-12 w-12",
    lg: "h-16 w-16",
  }

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 flex items-center justify-center">
        <Square className="h-full w-full text-blue-700" strokeWidth={1.5} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Compass className="h-3/4 w-3/4 text-blue-800" strokeWidth={1.5} />
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-blue-900">G</span>
      </div>
    </div>
  )
}
