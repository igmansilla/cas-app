import { useEffect, useRef, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type AvatarStyle =
  | 'adventurer'
  | 'adventurer-neutral'
  | 'avataaars'
  | 'big-ears'
  | 'big-smile'
  | 'bottts'
  | 'croodles'
  | 'fun-emoji'
  | 'icons'
  | 'identicon'
  | 'lorelei'
  | 'micah'
  | 'miniavs'
  | 'notionists'
  | 'open-peeps'
  | 'personas'
  | 'pixel-art'
  | 'shapes'
  | 'thumbs'

function getDiceBearAvatar(seed: string, style: AvatarStyle = 'adventurer', size = 128) {
  const cleanSeed = encodeURIComponent(seed.toLowerCase().trim())
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${cleanSeed}&size=${size}`
}

export interface UserAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  showDropdown?: boolean
  avatarStyle?: AvatarStyle
}

export default function UserAvatar({
  size = 'md',
  showName = false,
  showDropdown = true,
  avatarStyle = 'adventurer',
}: UserAvatarProps) {
  const { user, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  const sizeClasses: Record<NonNullable<UserAvatarProps['size']>, string> = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
  }

  const getInitials = (name: string | null) => {
    if (!name) return 'U'
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    return name.substring(0, 2).toUpperCase()
  }

  const getAvatarColor = (email: string | null) => {
    if (!email) return 'bg-gray-400'
    const colors = [
      'bg-[#FF6B35]',
      'bg-emerald-500',
      'bg-blue-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
    ]
    const index = email.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length
    return colors[index]
  }

  const initials = getInitials(user.displayName)
  const avatarColor = getAvatarColor(user.email)
  const firstName = user.displayName?.split(' ')[0] || 'Usuario'

  const diceBearUrl = getDiceBearAvatar(user.email || user.uid || 'default', avatarStyle, 128)
  const avatarImageUrl = user.photoURL || (!imageError ? diceBearUrl : null)

  const renderAvatar = (className: string) => {
    if (avatarImageUrl && !imageError) {
      return (
        <img
          src={avatarImageUrl}
          alt={user.displayName || 'Avatar'}
          className={`${className} rounded-full object-cover`}
          onError={() => setImageError(true)}
        />
      )
    }
    return (
      <div className={`${className} ${avatarColor} rounded-full flex items-center justify-center text-white font-bold`}>
        {initials}
      </div>
    )
  }

  const handleLogout = async () => {
    setIsOpen(false)
    await signOut()
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => showDropdown && setIsOpen((v) => !v)}
        className={`flex items-center space-x-2 rounded-full transition-all ${
          showDropdown ? 'hover:ring-2 hover:ring-[#FF6B35] hover:ring-offset-2' : ''
        } focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:ring-offset-2`}
      >
        {renderAvatar(`${sizeClasses[size]} border-2 border-white shadow-md`)}
        {showName && (
          <div className="hidden sm:flex items-center space-x-1">
            <span className="text-gray-700 font-medium">{firstName}</span>
            {showDropdown && (
              <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        )}
      </button>

      {showDropdown && isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
          <div className="px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {renderAvatar('w-10 h-10')}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user.displayName || 'Usuario'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <Link
              to="/perfil"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <UserIcon className="w-4 h-4 mr-3 text-gray-400" />
              Mi perfil
            </Link>
            <Link
              to="/configuracion"
              onClick={() => setIsOpen(false)}
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Configuracion
            </Link>
          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Cerrar sesión
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
