import { useSession } from '@clerk/react'
import { createClient } from '@supabase/supabase-js'
import { useMemo } from 'react'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const useSupabase = () => {
  const { session } = useSession()

  return useMemo(() => {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        // La clave aquí es inyectar dinámicamente el token de Clerk en lugar del de Supabase Auth
        // NOTA: Lo he comentado temporalmente. Como tienes RLS desactivado en Supabase, 
        // no necesitas enviar el token de Clerk por ahora. Esto evita el error 401 PGRST301.
        fetch: async (url, options = {}) => {
          /*
          if (session) {
            const clerkToken = await session.getToken({ template: 'supabase' })
            if (clerkToken) {
              const headers = new Headers(options?.headers)
              headers.set('Authorization', `Bearer ${clerkToken}`)
              options.headers = headers
            }
          }
          */
          return fetch(url, options)
        },
      },
    })
  }, [session])
}
