import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Eye, EyeOff, LogIn } from 'lucide-react'
import Logo from '~/assets/reskyow.svg'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { account } from '~/lib/appwrite'
import { registerNotifications } from '~/root'

const Login = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const form = e.target as HTMLFormElement

    const formData = new FormData(form)

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const toastId = toast.loading('Signing in...')
    try {
      setLoading(true)
      await account.createEmailPasswordSession(email, password)

      toast.success('You have successfully signed in!', { id: toastId })

      // Redirect to the home page
      navigate('/home', { replace: true })

      // Wait for the redirect to complete
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast.loading('Registering notifications...', { id: toastId })

      // Wait if the token_created listener registered
      setTimeout(async () => {
        // Register the notification after login
        await registerNotifications()

        // Wait for the notification to be registered
        toast.success('Notifications registered!', { id: toastId })
      }, 3000)
    } catch (error) {
      toast.error((error as any).message, { id: toastId })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full py-12 flex flex-col justify-between">
      <div className="flex-1 flex flex-col justify-center">
        <div className="w-full max-w-lg mx-auto">
          <div className="mb-12 flex justify-center">
            <div className="size-32 bg-primary rounded-2xl flex items-center justify-center">
              <img
                className="size-20 pointer-events-none"
                src={Logo}
                alt="Reskyow"
              />
            </div>
          </div>

          <h1 className="text-2xl font-medium text-center mb-8 text-gray-800">
            Welcome back!
          </h1>

          <form method="POST" onSubmit={onSubmit} className="space-y-5">
            <div>
              <Input
                name="email"
                type="email"
                placeholder="Email"
                className="w-full h-12 px-4 rounded-full text-sm bg-muted bg-opacity-50 border transition-all duration-300 ease-in-out"
              />
            </div>
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                className="w-full h-12 px-4 rounded-full text-sm bg-muted bg-opacity-50 border transition-all duration-300 ease-in-out pr-12"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-500"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>
            <Button
              disabled={loading}
              type="submit"
              className="w-full h-12 text-sm font-medium rounded-full text-white transition-colors duration-300 ease-in-out"
            >
              {loading ? 'Signing in...' : 'Sign in'}
              <LogIn />
            </Button>
          </form>

          <div className="mt-3 text-center">
            <Link
              to="/forgot-password"
              className="text-muted-foreground text-sm font-medium hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{' '}
          <Link
            to="/register"
            className="text-primary font-medium hover:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login
