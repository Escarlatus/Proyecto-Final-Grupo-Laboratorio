import { useEffect } from "react"
import { useNavigate } from "react-router-dom"

/**
 * Blocks access to a page if the user's role is not in `allowedRoles`.
 * Redirects to /app (index) which then redirects based on their real role.
 *
 * @param {string} userRole - The current user's role (e.g. "Solicitante")
 * @param {string[]} allowedRoles - Roles that ARE allowed on this page
 */
export function useRoleGuard(userRole, allowedRoles) {
  const navigate = useNavigate()

  useEffect(() => {
    // Still loading — don't redirect yet
    if (!userRole) return

    if (!allowedRoles.includes(userRole)) {
      navigate("/app", { replace: true })
    }
  }, [userRole, allowedRoles, navigate])
}
