import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router'
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem'
import type { Route } from './+types/root'
import stylesheet from './app.css?url'
import { useEffect } from 'react'
import { SplashScreen } from '@capacitor/splash-screen'
import SafeArea from './lib/safe-area-insets'
import { Toaster } from './components/ui/sonner'
import { LoaderCircle } from 'lucide-react'
import { PushNotifications } from '@capacitor/push-notifications'
import '~/lib/sentry'
import { Capacitor } from '@capacitor/core'
import { FUNCTION_ID, functions } from './lib/appwrite'
import { ExecutionMethod } from 'appwrite'

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
  { rel: 'stylesheet', href: stylesheet },
]

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="light" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="viewport-fit=cover, width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
        />
        <meta name="theme-color" content="#000000" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Toaster theme="light" className="insets-m-top" position="top-center" />
        <Scripts />
      </body>
    </html>
  )
}

export const registerNotifications = async () => {
  let permStatus = await PushNotifications.checkPermissions()

  if (permStatus.receive === 'prompt') {
    permStatus = await PushNotifications.requestPermissions()
  }

  if (permStatus.receive !== 'granted') {
    throw new Error('User denied permissions!')
  }

  await PushNotifications.register()
}

export default function App() {
  useEffect(() => {
    let isMounted = false
    SplashScreen.hide().then(() => {
      SafeArea.getSafeAreaInsets().then(({ insets }) => {
        if (insets) {
          // Set CSS variables dynamically on the root element
          document.documentElement.style.setProperty(
            '--insets-top',
            `${insets.top}px`
          )
          document.documentElement.style.setProperty(
            '--insets-bottom',
            `${insets.bottom}px`
          )
          document.documentElement.style.setProperty(
            '--insets-left',
            `${insets.left}px`
          )
          document.documentElement.style.setProperty(
            '--insets-right',
            `${insets.right}px`
          )
        }
      })

      if (Capacitor.isNativePlatform()) {
        PushNotifications.addListener('registration', async (token) => {
          console.log('Push registration:', token.value)
          // Dispatch the event on the window object
          window.dispatchEvent(
            new CustomEvent('token_created', { detail: token.value })
          )
        })

        registerNotifications().catch(console.error)
      }

      functions
        .createExecution(
          FUNCTION_ID,
          JSON.stringify({}),
          false,
          '/responders',
          ExecutionMethod.GET
        )
        .then(async (res) => {
          try {
            await Filesystem.writeFile({
              path: 'cache/responders.json',
              data: res.responseBody,
              directory: Directory.Data,
              encoding: Encoding.UTF8,
              recursive: true,
            })
          } catch (e) {
            console.log("Couldn't write responders number to file", e)
          }
        })
        .catch(console.error)

      isMounted = true
    })

    return () => {
      if (isMounted && Capacitor.isNativePlatform()) {
        PushNotifications.removeAllListeners()
      }
    }
  }, [])

  return <Outlet />
}

export function HydrateFallback() {
  return (
    <main className="bg-background min-h-dvh w-full flex justify-center items-center insets-y">
      <div className="max-w-xl w-full mx-auto px-4 flex justify-center">
        <LoaderCircle className="text-primary animate-spin size-12" />
      </div>
    </main>
  )
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!'
  let details = 'An unexpected error occurred.'
  let stack: string | undefined

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error'
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message
    stack = error.stack
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  )
}
