'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/app/lib/supabase/client'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkSession() {
      const supabase = createClient()
      await supabase.auth.getSession()
      // Middleware já faz redirect se não houver sessão
      // Este componente apenas mostra loading
      setLoading(false)
    }

    checkSession()
  }, [])

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
      }}>
        <div>Carregando...</div>
      </div>
    )
  }

  return <>{children}</>
}

