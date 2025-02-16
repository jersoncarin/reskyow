import type React from 'react'
import {
  User,
  Map,
  History,
  OctagonAlert,
  LoaderCircle,
  Users,
} from 'lucide-react'
import { cn } from '~/lib/utils'
import { NavLink, useNavigation } from 'react-router'

const BottomNavigation = ({ role }: { role: string }) => {
  return (
    <div className="z-50 w-full sticky bottom-0">
      <div className="relative h-full pt-1 ">
        {/* Background */}
        <div className="absolute inset-0 bg-background border-t"></div>

        {/* Navigation items */}
        <nav className="relative h-full max-w-lg mx-auto flex items-center justify-around insets-bottom">
          <NavItem
            link="/home"
            icon={<OctagonAlert size={24} />}
            label="Emergency"
          />
          <NavItem
            link="/history"
            icon={<History size={24} />}
            label="History"
          />
          {role === 'responder' && (
            <NavItem link="/users" icon={<Users size={24} />} label="Users" />
          )}
          <NavItem link="/hazard" icon={<Map size={24} />} label="Hazard Map" />
          <NavItem link="/profile" icon={<User size={24} />} label="Profile" />
        </nav>
      </div>
    </div>
  )
}

const BottomNavigationOffline = () => {
  return (
    <div className="z-50 w-full sticky bottom-0">
      <div className="relative h-full pt-1 ">
        {/* Background */}
        <div className="absolute inset-0 bg-background border-t"></div>

        {/* Navigation items */}
        <nav className="relative h-full max-w-lg mx-auto flex items-center justify-around insets-bottom">
          <NavItem
            link="/offline"
            icon={<OctagonAlert size={24} />}
            label="Emergency"
          />
          <NavItem
            link="/offline-hazard"
            icon={<Map size={24} />}
            label="Hazard Map"
          />
        </nav>
      </div>
    </div>
  )
}

const NavItem = ({
  icon,
  label,
  link,
}: {
  icon: React.ReactNode
  label: string
  link: string
}) => {
  const navigation = useNavigation()
  const isNavigating = Boolean(navigation.location)

  if (isNavigating && navigation.location?.pathname === link) {
    icon = <LoaderCircle size={24} className="animate-spin" />
  }

  return (
    <NavLink
      to={link}
      className={({ isActive, isPending }) =>
        cn(
          'flex flex-col items-center justify-center px-3 py-2',
          isActive ? 'text-primary' : 'text-muted-foreground',
          isPending ? 'pointer-events-none' : 'pointer-events-auto'
        )
      }
    >
      {icon}
      <span className="text-xs mt-1">{label}</span>
    </NavLink>
  )
}

export { BottomNavigationOffline }

export default BottomNavigation
