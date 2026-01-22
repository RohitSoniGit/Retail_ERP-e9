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

    // Skip database update for demo organization
    if (organization.id === DEMO_ORG_ID) {
      // Demo mode: just update local state, no database call
      return
    }

    // For real organizations, update the database
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
        // For demo, we'll use a mock organization if Supabase is not configured
        const { data, error } = await supabase
          .from("organizations")
          .select("*")
          .limit(1)
          .single()

        if (data && !error) {
          setOrganization(data)
        } else {
          // Create a demo organization for development
          // Using a valid UUID format to prevent database errors
          const demoOrg = {
            id: DEMO_ORG_ID,
            name: 'Demo Retail Store',
            gst_number: '27ABCDE1234F1Z5',
            address: '123 Demo Street, Mumbai, Maharashtra 400001',
            phone: '+91 9876543210',
            state_code: '27',
            gstin: '27ABCDE1234F1Z5',
            created_at: new Date().toISOString(),
          }
          setOrganization(demoOrg)
        }
      } catch (error) {
        console.warn('Using demo organization:', error)
        // Fallback to demo organization with valid UUID format
        const demoOrg = {
          id: DEMO_ORG_ID,
          name: 'Demo Retail Store',
          gst_number: '27ABCDE1234F1Z5',
          address: '123 Demo Street, Mumbai, Maharashtra 400001',
          phone: '+91 9876543210',
          state_code: '27',
          gstin: '27ABCDE1234F1Z5',
          created_at: new Date().toISOString(),
        }
        setOrganization(demoOrg)
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
