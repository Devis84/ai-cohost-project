'use client'

import { useRouter } from 'next/navigation'

export default function LogoutButton() {
  const router = useRouter()

  const logout = () => {

    document.cookie =
      'ai_cohost_auth=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax'

    router.push('/login')
  }

  return (
    <button
      onClick={logout}
      className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-2xl transition"
    >
      Logout
    </button>
  )
}