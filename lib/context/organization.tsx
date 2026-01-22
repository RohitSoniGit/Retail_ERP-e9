"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Organization } from "@/lib/types"
import { DEMO_ORG_ID } from "@/lib/constants"

interface OrganizationContextType {
  organization: Organization | null
  organizationId: string | null
  loading: boolean
  setOrganization: (org: Organization) => void
  updateOrganization: (updates: Partial<Organization>) => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  organizationId: null,
  loading: true,
  setOrganization: () => { },
  updateOrganization: async () => { },
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) return

    const updatedOrg = { ...organization, ...updates }
    setOrganization(updatedOrg)

    try {
      const supabase = getSupabaseBrowserClient()

      // Filter out fields that shouldn't be updated (like id, created_at)
      const { id, created_at, ...updateData } = updates as any

      console.log('Updating organization with data:', updateData)

      const { error } = await supabase
        .from("organizations")
        .update(updateData)
        .eq("id", organization.id)

      if (error) {
        console.error('Failed to update organization:', error)
        console.error('Update data that failed:', updateData)
        // Revert local state on error
        setOrganization(organization)
        throw error
      }
    } catch (error) {
      console.error('Error updating organization:', error)
      // Revert local state on error
      setOrganization(organization)
      throw error
    }
  }

  useEffect(() => {
    async function loadOrganization() {
      const supabase = getSupabaseBrowserClient()

      try {
        // Fetch organizations from database
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .limit(1)

        if (error) {
          console.error('Error loading organization:', error)
          throw error
        }

        if (data && data.length > 0) {
          setOrganization(data[0])
        } else {
          console.error('No organizations found in database. Please create an organization first.')
          throw new Error('No organizations found in database')
        }
      } catch (error) {
        console.error('Failed to load organization:', error)
        // Don't set any fallback - let the app handle the error state
        setOrganization(null)
      }

      setLoading(false)
    }

    loadOrganization()
  }, [])

  return (
    <OrganizationContext.Provider value={{
      organization,
      organizationId: organization?.id || null,
      loading,
      setOrganization,
      updateOrganization
    }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  return useContext(OrganizationContext)
}
