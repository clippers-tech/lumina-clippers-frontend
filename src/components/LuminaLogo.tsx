import Image from "next/image"

interface LuminaLogoProps {
  size?: number
  className?: string
}

export function LuminaLogo({ size = 32, className = "" }: LuminaLogoProps) {
  return (
    <Image
      src="/logo.png"
      alt="Lumina Clippers"
      width={size}
      height={size}
      className={`rounded-lg ${className}`}
      priority
    />
  )
}
