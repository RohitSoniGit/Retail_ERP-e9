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

    try {
      const supabase = getSupabaseBrowserClient()

      // Create a clean update object, mapping form fields to database columns
      const updateData: any = {}
      
      // Direct field mappings (form field -> database column)
      const directFields = [
        'name', 'address', 'phone', 'state_code', 
        'logo_url', 'email', 'website'
      ]
      
      directFields.forEach(field => {
        if (field in updates) {
          updateData[field] = updates[field as keyof Organization]
        }
      })

      // Handle GSTIN field mapping (form uses 'gstin', database has both 'gstin' and 'gst_number')
      if ('gstin' in updates) {
        updateData.gstin = updates.gstin
        updateData.gst_number = updates.gstin // Also update gst_number for compatibility
      }

      // Handle settings as JSONB
      if ('settings' in updates && updates.settings) {
        updateData.settings = updates.settings
      }

      console.log('Updating organization with data:', updateData)

      const { data, error } = await supabase
        .from("organizations")
        .update(updateData)
        .eq("id", organization.id)
        .select()

      if (error) {
        console.error('Failed to update organization:', error)
        console.error('Update data that failed:', updateData)
        throw error
      }

      console.log('Successfully updated organization:', data)

      // Update local state only after successful database update
      const updatedOrg = { ...organization, ...updates }
      setOrganization(updatedOrg)
      
    } catch (error) {
      console.error('Error updating organization:', error)
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
          console.log('Loaded organization data:', data[0])
          setOrganization(data[0])
          setError(null)
        } else {
          console.warn('No organizations found in database')
          setError('No organizations found. Please run the setup script first.')
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
