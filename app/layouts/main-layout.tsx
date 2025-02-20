import { Outlet, redirect, useNavigate } from 'react-router'
import BottomNavigation from '~/components/bottom-nav'
import { account, getCurrentUser } from '~/lib/appwrite'
import { Capacitor, type PluginListenerHandle } from '@capacitor/core'
import { Network } from '@capacitor/network'
import { useEffect, type FC } from 'react'
import type { Route } from './+types/main-layout'
import type { Models } from 'appwrite'
import { PushNotifications } from '@capacitor/push-notifications'

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
  const navigate = useNavigate()

  useEffect(() => {
    const abortController = new AbortController()
    let handleListener: PluginListenerHandle | null = null

    // Add a listener for push notifications
    PushNotifications.addListener('pushNotificationActionPerformed', () => {
      navigate('/home', { replace: true })
    }).then((listener) => {
      handleListener = listener
    })

    window.addEventListener(
      'token_created',
      async (event: any) => {
        const token = event.detail
        console.log('Received token:', token)

        let session: Models.Session | null = null

        try {
          session = await account.getSession('current')
        } catch (e) {}

        try {
          if (!session) {
            throw new Error('No session found')
          }

          // Try to create a push target but when its already created, update it
          // This is to avoid creating multiple push targets for the same session
          await account.createPushTarget(session.$id, token.toString())

          console.log('Token has been created')
        } catch (e: any) {
          // Assuming the error is because the push target already exists
          // Update the push target instead
          if (session) {
            // We don't need to use await instead because it will throw an error
            // when the push target doesn't exist so we dont want to pollute with so many try catch blocks
            account
              .updatePushTarget(session.$id, token.toString())
              .then(() => {
                console.log('Updated push token')
              })
              .catch((e) => {
                console.error('Error updating push token', e)
              })
          }
        } finally {
          console.log('Token has been updated')
        }
      },
      {
        signal: abortController.signal,
      }
    )

    return () => {
      abortController.abort()

      // Remove the listener when the component is unmounted
      if (handleListener)
        handleListener
          .remove()
          .finally(() => console.log('Removed notification listener'))
    }
  }, [])

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
