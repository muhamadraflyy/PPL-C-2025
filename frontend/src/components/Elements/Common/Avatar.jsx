import { useState } from 'react'

export default function Avatar({ src, alt = "Avatar", size = "md", className = "", ...props }) {
  const [imageError, setImageError] = useState(false)
  
  const sizes = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-base", 
    lg: "w-24 h-24 text-2xl",
    xl: "w-32 h-32 text-4xl"
  }

  // Get initial from alt text
  const getInitial = () => {
    if (!alt || alt === "Avatar") return "U"
    return alt.charAt(0).toUpperCase()
  }

  // Show initial if no src or image failed to load
  const showInitial = !src || imageError

  return (
    <div className={`relative ${sizes[size]} ${className}`} {...props}>
      {showInitial ? (
        <div className={`${sizes[size]} rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold`}>
          {getInitial()}
        </div>
      ) : (
        <img 
          src={src} 
          alt={alt}
          className={`${sizes[size]} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      )}
    </div>
  )
}
