"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"

export default function TestMigrationPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const runMigration = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/migrate/commodity', {
        method: 'POST',
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({ error: 'Failed to run migration', details: error })
    }
    setLoading(false)
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Migration</h1>
      
      <Button onClick={runMigration} disabled={loading}>
        {loading ? 'Checking...' : 'Check/Run Commodity Migration'}
      </Button>
      
      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{JSON.stringify(result, null, 2)}</pre>
          
          {result.sql && (
            <div className="mt-4">
              <h3 className="font-bold">SQL to run in Supabase:</h3>
              <code className="block bg-black text-white p-2 rounded mt-2">
                {result.sql}
              </code>
            </div>
          )}
        </div>
      )}
    </div>
  )
}