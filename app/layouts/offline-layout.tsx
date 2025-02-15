import { Outlet } from 'react-router'
import { BottomNavigationOffline } from '~/components/bottom-nav'

const OfflineLayut = () => {
  return (
    <main className="flex min-h-dvh bg-background flex-col">
      <div className="flex-1 insets-top">
        <Outlet />
      </div>
      <BottomNavigationOffline />
    </main>
  )
}

export default OfflineLayut
