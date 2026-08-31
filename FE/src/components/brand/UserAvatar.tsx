/**
 * UserAvatar — a circular user avatar showing the hosted `avatarUrl` image, falling back to derived initials on missing URL or image load error.
 * Sizes via `size` (`sm | md | lg | xl`); resets its error state whenever `avatarUrl` changes so a new URL retries loading.
 * Lives in `components/brand/`; used wherever a user is represented (header menu, user lists, profile).
 */
import { useState, useEffect } from 'react'

interface Props {
  name: string
  avatarUrl?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const SIZE_CLASSES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-xs',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-56 h-56 text-5xl',
}

function getInitials(name: string): string {
  return name.trim().split(/\s+/).slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('') || 'U'
}

export default function UserAvatar({ name, avatarUrl, size = 'md', className = '' }: Props) {
  const [imgError, setImgError] = useState(false)
  useEffect(() => { setImgError(false) }, [avatarUrl])
  const showImage = !!avatarUrl && !imgError

  return (
    <div className={`flex items-center justify-center rounded-full bg-brand/10 border border-accent/30 shrink-0 overflow-hidden ${SIZE_CLASSES[size]} ${className}`}>
      {showImage ? (
        <img
          src={avatarUrl}
          alt={name}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <span className="text-accent font-bold select-none">{getInitials(name)}</span>
      )}
    </div>
  )
}
