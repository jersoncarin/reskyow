import { Outlet, redirect } from 'react-router'
import { Capacitor } from '@capacitor/core'
import { cn } from '~/lib/utils'
import { getCurrentUser } from '~/lib/appwrite'
import { Network } from '@capacitor/network'

export const clientLoader = async () => {
  if (Capacitor.isNativePlatform()) {
    const status = await Network.getStatus()
    if (!status.connected) return redirect('/offline')
  } else if (!navigator.onLine) {
    return redirect('/offline')
  }

  const user = await getCurrentUser()

  if (user) {
    return redirect('/home')
  }
}

const AuthLayout = () => {
  return (
    <main className="bg-background min-h-dvh w-full flex justify-center insets-y">
      <div
        className={cn('max-w-xl w-full mx-auto px-4', {
          'outline-dashed': !Capacitor.isNativePlatform(),
        })}
      >
        <Outlet />
      </div>
    </main>
  )
}

export default AuthLayout
