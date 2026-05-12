import type { User } from '../api'

const SIZES = { sm: 24, md: 32, lg: 48 } as const
const FONT  = { sm: 10, md: 13, lg: 18 } as const

function initials(user: Pick<User, 'display_name' | 'email'>): string {
  const src = user.display_name?.trim() || user.email
  const parts = src.split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return src[0].toUpperCase()
}

interface Props {
  user: Pick<User, 'display_name' | 'email' | 'avatar_color'>
  size?: keyof typeof SIZES
  title?: string
}

export default function Avatar({ user, size = 'md', title }: Props) {
  const px = SIZES[size]
  return (
    <div
      title={title ?? (user.display_name || user.email)}
      style={{
        width: px,
        height: px,
        borderRadius: '50%',
        background: user.avatar_color,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: FONT[size],
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      {initials(user)}
    </div>
  )
}
