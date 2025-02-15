import { useState, type FormEvent } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { RadioGroup, RadioGroupItem } from '~/components/ui/radio-group'
import { Label } from '~/components/ui/label'
import { ChevronLeft, ChevronRight, Eye, EyeOff, Send } from 'lucide-react'
import Logo from '~/assets/reskyow.svg'
import { Link, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { account } from '~/lib/appwrite'
import { ID } from 'appwrite'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { hazard_mapping } from '~/lib/data'

type Role = 'responder' | 'student' | 'teacher' | 'staff'

const Register = () => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [step, setStep] = useState(0)
  const navigate = useNavigate()
  const [role, setRole] = useState<Role | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phoneNumber: '',
    age: '',
    address: '',
    schoolName: '',
    schoolAddress: '',
    grade: '',
    section: '',
    buildingNo: '',
    guardianName: '',
    guardianAge: '',
    guardianRelationship: '',
    guardianAddress: '',
    guardianContactNumber: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement> | string
  ) => {
    if (typeof e === 'string') {
      return setFormData((prev) => ({ ...prev, buildingNo: e }))
    }

    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNext = () => setStep((prev) => prev + 1)
  const handleBack = () => setStep((prev) => prev - 1)

  const togglePasswordVisibility = () => setShowPassword(!showPassword)

  const isStepValid = () => {
    if (step === 0) {
      return !!role
    }

    if (step === 1) {
      return (
        formData.name &&
        formData.email &&
        formData.password &&
        formData.phoneNumber &&
        formData.age &&
        formData.address &&
        error.length === 0
      )
    }

    if (step === 2) {
      return (
        formData.schoolName &&
        formData.schoolAddress &&
        formData.buildingNo &&
        (role !== 'student' || (formData.grade && formData.section))
      )
    }

    if (step === 3 && role === 'student') {
      return (
        formData.guardianName &&
        formData.guardianAge &&
        formData.guardianRelationship &&
        formData.guardianAddress &&
        formData.guardianContactNumber
      )
    }

    return true
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const toastId = toast.loading('Creating account...')

    try {
      setIsSubmitting(true)

      const { email, password, phoneNumber, name, ...form } = formData

      // Create the account
      const createdUser = await account.create(
        ID.unique(3),
        email,
        password,
        name
      )

      // Make new account session
      await account.createEmailPasswordSession(createdUser.email, password)

      // Update phone number
      await account.updatePhone(phoneNumber, password)

      // Add additional information
      await account.updatePrefs({ ...form, role })

      toast.success('Account created successfully!', { id: toastId })

      // Redirect
      navigate('/home', { replace: true })
    } catch (error) {
      toast.error((error as any).message, { id: toastId })
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="gap-y-4">
            <h2 className="text-lg font-semibold text-center mb-4">
              Select your role
            </h2>
            <RadioGroup
              value={role || undefined}
              className="flex justify-center"
              onValueChange={(value) => setRole(value as Role)}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="responder" id="responder" />
                <Label htmlFor="responder">Responder</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student">Student</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="teacher" id="teacher" />
                <Label htmlFor="teacher">Teacher</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="staff" id="staff" />
                <Label htmlFor="staff">Staff</Label>
              </div>
            </RadioGroup>
            <Button
              onClick={handleNext}
              disabled={!isStepValid()}
              className="w-full mt-8 rounded-full h-12"
            >
              Next
              <ChevronRight className="h-6 w-6" />
            </Button>
          </div>
        )
      case 1:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4">
              Personal Information
            </h2>
            <Input
              name="name"
              className="rounded-full h-12 bg-muted px-4"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Full Name"
              required
            />
            <Input
              name="email"
              type="email"
              className="rounded-full h-12 bg-muted px-4"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              required
            />
            <div className="relative">
              <Input
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={handleInputChange}
                placeholder="Password"
                required
                className="pr-10 rounded-full bg-muted h-12 px-4"
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="absolute inset-y-0 right-0 flex items-center px-3 rounded-full text-gray-500"
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            <Input
              className="rounded-full h-12 bg-muted px-4"
              placeholder="+639XX XXX XXXX"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={(e) => {
                const value = e.target.value

                // Allow only numbers
                if (!/^\d*|\+$/.test(value)) return

                // Enforce max length of 11
                if (value.length > 13) return

                handleInputChange(e)

                // Validation: Must start with "09" and be exactly 11 digits
                if (!/^\+639\d{9}$/.test(value)) {
                  setError(
                    'Phone number must start with +63 and be 13 digits long.'
                  )
                } else {
                  setError('')
                }
              }}
              required
            />
            {error && <div className="text-xs text-red-500">{error}</div>}
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="age"
              type="number"
              value={formData.age}
              onChange={handleInputChange}
              placeholder="Age"
              required
            />
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Address"
              required
            />
            <div className="flex justify-between pt-3">
              <Button className="rounded-full h-12" onClick={handleBack}>
                <ChevronLeft className="h-6 w-6" />
                Back
              </Button>
              <Button
                className="rounded-full h-12"
                onClick={handleNext}
                disabled={!isStepValid()}
              >
                Next
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>
          </div>
        )
      case 2:
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4">
              Additional Information
            </h2>
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="schoolName"
              value={formData.schoolName}
              onChange={handleInputChange}
              placeholder="School Name"
              required
            />
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="schoolAddress"
              value={formData.schoolAddress}
              onChange={handleInputChange}
              placeholder="School Address"
              required
            />
            <Select
              onValueChange={handleInputChange}
              value={formData.buildingNo}
            >
              <SelectTrigger className="rounded-full h-12 bg-muted px-4 w-full">
                <SelectValue
                  className="placeholder:text-gray-500"
                  placeholder="Select building id"
                />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(hazard_mapping).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    {key}. {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {role === 'student' && (
              <>
                <Input
                  className="rounded-full h-12 bg-muted px-4"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  placeholder="Grade"
                  required
                />
                <Input
                  className="rounded-full h-12 bg-muted px-4"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  placeholder="Section"
                  required
                />
              </>
            )}

            <div className="flex justify-between pt-3">
              <Button className="rounded-full" onClick={handleBack}>
                <ChevronLeft className="h-6 w-6" />
                Back
              </Button>
              {role !== 'student' ? (
                <Button
                  className="rounded-full"
                  type="submit"
                  disabled={!isStepValid() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit'}
                  <Send className="h-6 w-6" />
                </Button>
              ) : (
                <Button
                  className="rounded-full"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                >
                  Next
                  <ChevronRight className="h-6 w-6" />
                </Button>
              )}
            </div>
          </div>
        )
      case 3:
        return role === 'student' ? (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-center mb-4">
              Guardian Information
            </h2>
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="guardianName"
              value={formData.guardianName}
              onChange={handleInputChange}
              placeholder="Guardian's Name"
              required
            />
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="guardianAge"
              type="number"
              value={formData.guardianAge}
              onChange={handleInputChange}
              placeholder="Guardian's Age"
              required
            />
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="guardianRelationship"
              value={formData.guardianRelationship}
              onChange={handleInputChange}
              placeholder="Relationship to Student"
              required
            />
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="guardianAddress"
              value={formData.guardianAddress}
              onChange={handleInputChange}
              placeholder="Guardian's Address"
              required
            />
            <Input
              className="rounded-full h-12 bg-muted px-4"
              name="guardianContactNumber"
              value={formData.guardianContactNumber}
              onChange={handleInputChange}
              placeholder="Guardian's Contact Number"
              required
            />
            <div className="flex justify-between pt-3">
              <Button className="rounded-full h-12" onClick={handleBack}>
                <ChevronLeft className="h-6 w-6" />
                Back
              </Button>
              <Button
                className="rounded-full h-12"
                type="submit"
                disabled={!isStepValid() || isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit'}
                <Send className="h-6 w-6" />
              </Button>
            </div>
          </div>
        ) : null
      default:
        return null
    }
  }

  return (
    <div className="h-full flex flex-col justify-between py-12 w-full max-w-lg mx-auto">
      <div className="flex-1 flex flex-col justify-center">
        <div className="mb-12 flex justify-center">
          <div className="size-32 bg-primary rounded-2xl flex items-center justify-center">
            <img
              className="size-20"
              src={Logo || '/placeholder.svg'}
              alt="Reskyow"
            />
          </div>
        </div>
        <h1 className="text-2xl font-medium text-center mb-8 text-gray-800">
          Create your account
        </h1>
        <form method="POST" onSubmit={onSubmit}>
          {renderStep()}
        </form>
      </div>
      <div className="mt-12 text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{' '}
          <Link to="/" className="text-primary font-medium hover:underline">
            Signin
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register
