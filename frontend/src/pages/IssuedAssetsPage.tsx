import { useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { MyPermanentIssuancesView } from '@/components/issuance/MyPermanentIssuancesView'
import { PermanentIssuanceUserDirectory } from '@/components/issuance/PermanentIssuanceUserDirectory'
import { UserPermanentIssuancesPanel } from '@/components/issuance/UserPermanentIssuancesPanel'
import { useAuth } from '@/hooks/useAuth'
import type { IssuanceUserSummary } from '@/types/permanentIssuance'
import { canManageIssuance } from '@/utils/roleHelpers'

export function IssuedAssetsPage() {
  const { user } = useAuth()
  const isManager = canManageIssuance(user)
  const [selectedUser, setSelectedUser] = useState<IssuanceUserSummary | null>(null)

  if (isManager) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Issued Assets"
          subtitle="Accountability directory for permanently issued property and equipment."
        />

        {selectedUser ? (
          <UserPermanentIssuancesPanel
            user={selectedUser}
            onBack={() => setSelectedUser(null)}
          />
        ) : (
          <PermanentIssuanceUserDirectory onSelectUser={setSelectedUser} />
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Issued Assets"
        subtitle="Property and equipment permanently issued to you."
      />
      <MyPermanentIssuancesView />
    </div>
  )
}
