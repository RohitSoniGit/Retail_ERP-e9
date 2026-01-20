"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { getSupabaseBrowserClient } from "@/lib/supabase/client"
import type { Organization } from "@/lib/types"

interface OrganizationContextType {
  organization: Organization | null
  loading: boolean
  setOrganization: (org: Organization) => void
}

const OrganizationContext = createContext<OrganizationContextType>({
  organization: null,
  loading: true,
  setOrganization: () => {},
})

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrganization() {
      const supabase = getSupabaseBrowserClient()
      
      // For demo, we'll use the first organization
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .limit(1)
        .single()

      if (data && !error) {
        setOrganization(data)
      }
      setLoading(false)
    }

    loadOrganization()
  }, [])

  return (
    <OrganizationContext.Provider value={{ organization, loading, setOrganization }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  return useContext(OrganizationContext)
}
