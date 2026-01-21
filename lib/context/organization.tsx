"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Organization } from "@/lib/types"

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
  setOrganization: () => {},
  updateOrganization: async () => {},
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  const updateOrganization = async (updates: Partial<Organization>) => {
    if (!organization) return
    
    const updatedOrg = { ...organization, ...updates }
    setOrganization(updatedOrg)
    
    // In a real app, you would update the database here
    // For demo purposes, we'll just update the local state
    try {
      const supabase = getSupabaseBrowserClient()
      await supabase
        .from("organizations")
        .update(updates)
        .eq("id", organization.id)
    } catch (error) {
      console.warn('Demo mode: Organization update simulated locally')
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
          const demoOrg = {
            id: 'demo-org-id',
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
        // Fallback to demo organization
        const demoOrg = {
          id: 'demo-org-id',
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
