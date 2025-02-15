import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { RefreshCcw } from 'lucide-react'
import Logo from '~/assets/reskyow.svg'
import { Link } from 'react-router'
import { toast } from 'sonner'
import { account } from '~/lib/appwrite'

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()

    const form = e.target as HTMLFormElement

    const formData = new FormData(form)

    const email = formData.get('email') as string

    const toastId = toast.loading('Sending password reset email...')
    try {
      setLoading(true)

      await account.createRecovery(
        email,
        'https://reskyow-prod.vercel.app/password-reset'
      )

      toast.success(
        'Password reset link has been sent to your email, please check your inbox.',
        { id: toastId }
      )
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
            Forgot password
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
            <Button
              disabled={loading}
              type="submit"
              className="w-full h-12 text-sm font-medium rounded-full text-white transition-colors duration-300 ease-in-out"
            >
              {loading ? 'Sending...' : 'Send password reset link'}
              <RefreshCcw />
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600">
          Remember your account ?{' '}
          <Link to="/" className="text-primary font-medium hover:underline">
            Signin
          </Link>
        </p>
      </div>
    </div>
  )
}

export default ForgotPassword
