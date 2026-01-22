"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Organization } from "@/lib/types"

interface OrganizationContextType {
  organization: Organization | null
  organizationId: string | null
  loading: boolean
  error: string | null
  setOrganization: (org: Organization) => void
  updateOrganization: (updates: Partial<Organization>) => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  organizationId: null,
  loading: true,
  error: null,
  setOrganization: () => { },
  updateOrganization: async () => { },
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) return

    const updatedOrg = { ...organization, ...updates }
    setOrganization(updatedOrg)

    try {
      const supabase = getSupabaseBrowserClient()

      // Filter out fields that shouldn't be updated (like id, created_at)
      const { id, created_at, ...updateData } = updates as any

      const { error } = await supabase
        .from("organizations")
        .update(updateData)
        .eq("id", organization.id)

      if (error) {
        console.error('Failed to update organization:', error)
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
      try {
        const supabase = getSupabaseBrowserClient()

        // Fetch organizations from database
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .limit(1)

        if (error) {
          console.error('Error loading organization:', error)
          setError(`Database error: ${error.message}`)
          return
        }

        if (data && data.length > 0) {
          setOrganization(data[0])
          setError(null)
        } else {
          console.warn('No organizations found in database')
          setError('No organizations found. Please set up your organization first.')
        }
      } catch (error) {
        console.error('Failed to load organization:', error)
        setError('Failed to connect to database. Please check your configuration.')
      } finally {
        setLoading(false)
      }
    }

    loadOrganization()
  }, [])

  return (
    <OrganizationContext.Provider value={{
      organization,
      organizationId: organization?.id || null,
      loading,
      error,
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
