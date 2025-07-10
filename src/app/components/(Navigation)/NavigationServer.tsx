import { redirect } from 'next/navigation'
import { getCurrentUser } from './actions'
import { Navigation } from './NavigationClient'

export async function NavigationServer() {
    const { user, profile, error } = await getCurrentUser()

    if (error && error.includes('Sessão inválida')) {
        redirect('/login')
    }

    const userData = {
        isLoggedIn: !!user || !!profile,
        userName: profile?.nome || null,
        userType: profile?.tipo || null,
        error: error
    }

    return <Navigation initialUserData={userData} />
}

