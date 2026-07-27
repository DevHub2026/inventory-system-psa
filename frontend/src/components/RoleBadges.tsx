import { Badge, type Tone } from '@/components/ui'
import type { User } from '@/types'

type UserRole = NonNullable<User['roles']>[number]

interface RoleBadgesProps {
  roles?: UserRole[]
  maxVisible?: number
  emptyLabel?: string
}

const ROLE_TONES: Tone[] = ['blue', 'violet', 'teal', 'orange', 'green', 'yellow', 'gray']

function roleTone(role: UserRole): Tone {
  const seed = `${role.id}-${role.name}`.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
  return ROLE_TONES[seed % ROLE_TONES.length]
}

function roleLabel(name: string): string {
  return name.replace(/[_-]+/g, ' ').toUpperCase()
}

export function RoleBadges({ roles = [], maxVisible = 2, emptyLabel = 'No role assigned' }: RoleBadgesProps) {
  if (roles.length === 0) {
    return <Badge tone="gray">{emptyLabel}</Badge>
  }

  const visibleRoles = roles.slice(0, maxVisible)
  const hiddenRoles = roles.slice(maxVisible)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visibleRoles.map((role) => (
        <Badge key={role.id} tone={roleTone(role)}>{roleLabel(role.name)}</Badge>
      ))}
      {hiddenRoles.length > 0 && (
        <Badge tone="gray" className="cursor-help" title={hiddenRoles.map((role) => roleLabel(role.name)).join(', ')}>
          +{hiddenRoles.length} more
        </Badge>
      )}
    </div>
  )
}
