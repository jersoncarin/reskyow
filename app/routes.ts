import {
  type RouteConfig,
  index,
  layout,
  route,
} from '@react-router/dev/routes'

export default [
  layout('layouts/auth-layout.tsx', [
    index('routes/auth/login.tsx'),
    route('register', 'routes/auth/register.tsx'),
    route('forgot-password', 'routes/auth/forgot-password.tsx'),
  ]),
  layout('layouts/main-layout.tsx', [
    route('home', 'routes/main/home.tsx'),
    route('history', 'routes/main/history.tsx'),
    route('profile', 'routes/main/profile.tsx'),
    route('hazard', 'routes/main/hazard.tsx'),
  ]),
  layout('layouts/offline-layout.tsx', [
    route('offline', 'routes/offline/index.tsx'),
    route('offline-hazard', 'routes/offline/hazard.tsx'),
  ]),
] satisfies RouteConfig
