import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { authService } from '../../services/authService'

// Import profile pages
import ClientProfilePage from '../../pages/Client/ProfilePage'
import FreelancerProfilePage from '../../pages/Freelancer/ProfilePage'

export default function ProfileRouter() {
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial role
    const currentRole = authService.getActiveRole()
    setRole(currentRole)
    setLoading(false)

    // Listen for role changes
    const handleRoleChange = (event) => {
      const newRole = event.detail?.role || authService.getActiveRole()
      setRole(newRole)
    }

    window.addEventListener('userRoleChanged', handleRoleChange)
    
    return () => {
      window.removeEventListener('userRoleChanged', handleRoleChange)
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Redirect based on role
  if (role === 'freelancer') {
    return <FreelancerProfilePage />
  } else if (role === 'client') {
    return <ClientProfilePage />
  } else {
    // If no role or admin, redirect to dashboard
    return <Navigate to="/dashboard" replace />
  }
}
