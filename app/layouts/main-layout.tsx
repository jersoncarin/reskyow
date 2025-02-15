import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { useEffect } from 'react'
import { Outlet, redirect } from 'react-router'
import BottomNavigation from '~/components/bottom-nav'
import { account, getCurrentUser } from '~/lib/appwrite'
import { Device } from '@capacitor/device'
import { Capacitor } from '@capacitor/core'
import { Network } from '@capacitor/network'

Object.defineProperty(navigator, 'onLine', {
  get: () => false,
  configurable: true,
})

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
}

const MainLayout = () => {
  useEffect(() => {
    const updatePushToken = async () => {
      const deviceId = await Device.getId()
      const token = await Filesystem.readFile({
        path: 'fcm/token.txt',
        directory: Directory.Data,
        encoding: Encoding.UTF8,
      })

      try {
        await account.createPushTarget(
          deviceId.identifier,
          token.data.toString()
        )
      } catch (e) {
        await account.updatePushTarget(
          deviceId.identifier,
          token.data.toString()
        )
      } finally {
        console.log('Updating push token', token.data.toString())
      }
    }

    window.addEventListener('token_created', updatePushToken)

    return () => {
      window.removeEventListener('token_created', updatePushToken)
    }
  }, [])

  return (
    <main className="flex min-h-dvh bg-background flex-col">
      <div className="flex-1 insets-top">
        <Outlet />
      </div>
      <BottomNavigation />
    </main>
  )
}

export default MainLayout
