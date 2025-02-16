import { Outlet, redirect } from 'react-router'
import BottomNavigation from '~/components/bottom-nav'
import { getCurrentUser } from '~/lib/appwrite'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'
import type { FC } from 'react'
import type { Route } from './+types/main-layout'

export const clientLoader = async () => {
  if (Capacitor.isNativePlatform()) {
    const status = await Network.getStatus()
    if (!status.connected) return redirect('/offline')
  } else if (!navigator.onLine) {
    return redirect('/offline')
  }

  const user = await getCurrentUser()

  if (!user) {
    return redirect('/')
  }

  return user
}

const MainLayout: FC<Route.ComponentProps> = ({ loaderData }) => {
  return (
    <main className="flex min-h-dvh bg-background flex-col">
      <div className="flex-1 insets-top">
        <Outlet />
      </div>
      <BottomNavigation role={loaderData.prefs.role} />
    </main>
  )
}

export default MainLayout
