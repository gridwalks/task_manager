import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { setProfile(null); setLoading(false); return }

    setLoading(true)
    supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        setProfile(data)
        setLoading(false)
      })
  }, [user])

  const isAdmin = profile?.role === 'admin'
  const isPending = profile?.status === 'pending'
  const isSuspended = profile?.status === 'suspended'
  const isActive = profile?.status === 'active'

  return (
    <ProfileContext.Provider value={{ profile, loading, isAdmin, isPending, isSuspended, isActive }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  return useContext(ProfileContext)
}
