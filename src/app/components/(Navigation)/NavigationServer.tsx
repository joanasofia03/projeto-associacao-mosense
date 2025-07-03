import { getCurrentUser } from './actions'
import { Navigation } from './NavigationClient'

export async function NavigationServer() {
    const { user, profile, error } = await getCurrentUser()

    const userData = {
        isLoggedIn: !!user || !!profile,
        userName: profile?.nome || null,
        userType: profile?.tipo || null,
        error: error
    }

    return <Navigation initialUserData={userData} />
}