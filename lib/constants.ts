/**
 * Application-wide constants
 */

/**
 * Demo organization ID used when Supabase is not configured or in demo mode
 * This is a valid UUID format to prevent database errors
 */
export const DEMO_ORG_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Check if an organization ID is the demo organization
 */
export function isDemoOrganization(orgId: string | null | undefined): boolean {
    return orgId === DEMO_ORG_ID
}
