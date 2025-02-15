import type { FC } from 'react'
import {
  account,
  FUNCTION_ID,
  functions,
  getCurrentUser,
  storage,
  STORAGE_BUCKET_ID,
} from '~/lib/appwrite'
import type { Route } from './+types/profile'
import { useRef, useState } from 'react'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Camera, AtSign, Phone, Lock, User, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router'
import { ExecutionMethod, ID } from 'appwrite'
import { Card } from '~/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { hazard_mapping } from '~/lib/data'

export const clientLoader = async () => {
  const user = await getCurrentUser()

  // We will use ! to assert that user is not null
  // since we are redirecting to the login page if the user is not logged in
  return user!
}

const Profile: FC<Route.ComponentProps> = ({ loaderData }) => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [user, setUser] = useState({
    name: loaderData.name,
    email: loaderData.email,
    phone: loaderData.phone,
    password: '',
    age: loaderData.prefs.age,
    address: loaderData.prefs.address,
    schoolName: loaderData.prefs.schoolName,
    schoolAddress: loaderData.prefs.schoolAddress,
    grade: loaderData.prefs.grade,
    section: loaderData.prefs.section,
    buildingNo: loaderData.prefs.buildingNo,
    guardianName: loaderData.prefs.guardianName,
    guardianAge: loaderData.prefs.guardianAge,
    guardianRelationship: loaderData.prefs.guardianRelationship,
    guardianAddress: loaderData.prefs.guardianAddress,
    guardianContactNumber: loaderData.prefs.guardianContactNumber,
    profilePhoto: loaderData.prefs.profilePhoto,
    licensePhoto: loaderData.prefs.licensePhoto,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement> | string) => {
    if (typeof e === 'string') {
      setUser({ ...user, buildingNo: e })
      return
    }

    setUser({ ...user, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsSubmitting(true)

    try {
      const { name, email, password, phone, ...form } = user

      // Update user profile
      await account.updateName(name)

      // Prevent from unnecessary updates
      if (
        email !== loaderData.email ||
        password ||
        phone !== loaderData.phone
      ) {
        // Update email and password also phone
        await functions.createExecution(
          FUNCTION_ID,
          JSON.stringify({
            userId: loaderData.$id,
            email,
            password,
            phone,
          }),
          false,
          '/update-profile',
          ExecutionMethod.POST
        )
      }

      // Update Refs
      await account.updatePrefs({ ...form, role: loaderData.prefs.role })

      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error((error as any).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const iName = e.target.name
      const file = e.target.files[0]
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const toastLoading = toast.loading('Uploading...')

          if (e.target && typeof e.target.result === 'string') {
            const response = await storage.createFile(
              STORAGE_BUCKET_ID,
              ID.unique(),
              file,
              undefined,
              (progress) => {
                toast.loading(`Uploading ${progress.progress}%...`, {
                  id: toastLoading,
                })
              }
            )

            const url = storage.getFileView(STORAGE_BUCKET_ID, response.$id)

            // Remove unnecessary fields like name, phone, email, password
            const { name, phone, email, password, ...form } = loaderData.prefs

            await account.updatePrefs({ ...form, [iName]: url })

            toast.success(
              `${
                iName === 'profilePhoto' ? 'Profile' : 'License'
              } photo uploaded successfully`,
              {
                id: toastLoading,
              }
            )

            setUser({ ...user, [iName]: e.target.result })
          }
        } catch (err) {
          toast.error((err as any)?.message || 'Failed to upload profile photo')
        }
      }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const onLogout = async () => {
    setIsLoggingOut(true)
    await account.deleteSession('current')

    setIsLoggingOut(false)
    toast.success('Logged out successfully')

    // Redirect to login page
    navigate('/', { replace: true })
  }

  return (
    <div className="h-full bg-background text-foreground">
      <header className="fixed top-0 w-full insets-top z-10 bg-background flex items-center justify-center px-3 pb-3">
        <h1 className="text-lg font-semibold mt-1">My Profile</h1>
      </header>
      <main className="p-4 mt-12 max-w-lg mx-auto">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-2 border-primary">
                <AvatarImage
                  className="object-cover"
                  src={user.profilePhoto}
                  alt="Profile photo"
                />
                <AvatarFallback className="text-xl font-bold">
                  {user.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="profile-photo"
                className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer shadow-lg"
              >
                <Camera size={16} />
                <input
                  id="profile-photo"
                  type="file"
                  name="profilePhoto"
                  className="hidden"
                  onChange={handleFileChange}
                  accept="image/*"
                />
              </label>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <Label
                htmlFor="email"
                className="text-sm font-medium text-muted-foreground"
              >
                Name
              </Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={user.name}
                  onChange={handleChange}
                  className="rounded-full bg-muted pl-9 text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="name"
                className="text-sm font-medium text-muted-foreground"
              >
                Name
              </Label>
              <div className="relative mt-1">
                <AtSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={user.email}
                  onChange={handleChange}
                  className="rounded-full bg-muted pl-9 text-sm"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="phone"
                className="text-sm font-medium text-muted-foreground"
              >
                Phone
              </Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  className="rounded-full bg-muted pl-9 text-sm"
                  placeholder="+639XX XXX XXXX"
                  name="phone"
                  value={user.phone}
                  onChange={(e) => {
                    const value = e.target.value

                    // Allow only numbers
                    if (!/^\d*|\+$/.test(value)) return

                    // Enforce max length of 11
                    if (value.length > 13) return

                    handleChange(e)

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
              </div>
            </div>
            <div>
              <Label
                htmlFor="password"
                className="text-sm font-medium text-muted-foreground"
              >
                Password
              </Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Leave it blank if no changes"
                  value={user.password}
                  onChange={handleChange}
                  className="rounded-full bg-muted pl-9 text-sm"
                />
              </div>
            </div>

            {loaderData.prefs.role === 'responder' && (
              <div className="flex flex-col gap-y-1">
                <Label
                  htmlFor="license"
                  className="text-sm font-medium text-muted-foreground"
                >
                  License ID
                </Label>
                <Card
                  id="license"
                  className="w-full mx-auto cursor-pointer overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="aspect-[1.586/0.7] relative">
                    {user.licensePhoto ? (
                      <img
                        src={user.licensePhoto}
                        alt="License ID"
                        style={{ objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 text-gray-500">
                        <Upload size={48} />
                        <p className="mt-2 text-sm font-medium">
                          Upload license ID
                        </p>
                        <p className="text-xs">Click to change</p>
                      </div>
                    )}
                  </div>
                  <input
                    name="licensePhoto"
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                </Card>
              </div>
            )}

            <div className="flex flex-col gap-y-3">
              <h2 className="text-sm text-muted-foreground text-center font-medium mt-4">
                Additional Information
              </h2>
              <div>
                <Label
                  htmlFor="age"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Current Age
                </Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="Current age of the user"
                  value={user.age}
                  onChange={handleChange}
                  className="rounded-full bg-muted text-sm"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="address"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Address
                </Label>
                <Input
                  id="address"
                  name="address"
                  type="text"
                  placeholder="Enter your address"
                  value={user.address}
                  onChange={handleChange}
                  className="rounded-full bg-muted text-sm"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="schoolName"
                  className="text-sm font-medium text-muted-foreground"
                >
                  School Name
                </Label>
                <Input
                  id="schoolName"
                  name="schoolName"
                  type="text"
                  placeholder="Enter school name"
                  value={user.schoolName}
                  onChange={handleChange}
                  className="rounded-full bg-muted text-sm"
                  required
                />
              </div>
              <div>
                <Label
                  htmlFor="schoolAddress"
                  className="text-sm font-medium text-muted-foreground"
                >
                  School Address
                </Label>
                <Input
                  id="schoolAddress"
                  name="schoolAddress"
                  type="text"
                  placeholder="Enter school address"
                  value={user.schoolAddress}
                  onChange={handleChange}
                  className="rounded-full bg-muted text-sm"
                  required
                />
              </div>
              {loaderData.prefs.role === 'student' && (
                <>
                  <div>
                    <Label
                      htmlFor="grade"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Grade
                    </Label>
                    <Input
                      id="grade"
                      name="grade"
                      type="text"
                      placeholder="Enter grade"
                      value={user.grade}
                      onChange={handleChange}
                      className="rounded-full bg-muted text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="section"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Section
                    </Label>
                    <Input
                      id="section"
                      name="section"
                      type="text"
                      placeholder="Enter section"
                      value={user.section}
                      onChange={handleChange}
                      className="rounded-full bg-muted text-sm"
                      required
                    />
                  </div>
                </>
              )}
              <div>
                <Label
                  htmlFor="buildingNo"
                  className="text-sm font-medium text-muted-foreground"
                >
                  Building No.
                </Label>
                <Select
                  name="buildingNo"
                  onValueChange={handleChange}
                  value={user.buildingNo}
                >
                  <SelectTrigger
                    id="buildingNo"
                    className="rounded-full h-12 bg-muted px-4 w-full"
                  >
                    <SelectValue placeholder="Select building id" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(hazard_mapping).map(([key, value]) => (
                      <SelectItem key={key} value={key}>
                        {key}. {value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Guardian Information */}
              {loaderData.prefs.role === 'student' && (
                <>
                  <div>
                    <Label
                      htmlFor="guardianName"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Guardian Name
                    </Label>
                    <Input
                      id="guardianName"
                      name="guardianName"
                      type="text"
                      placeholder="Enter guardian's name"
                      value={user.guardianName}
                      onChange={handleChange}
                      className="rounded-full bg-muted text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="guardianAge"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Guardian Age
                    </Label>
                    <Input
                      id="guardianAge"
                      name="guardianAge"
                      type="number"
                      placeholder="Enter guardian's age"
                      value={user.guardianAge}
                      onChange={handleChange}
                      className="rounded-full bg-muted text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="guardianRelationship"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Guardian Relationship
                    </Label>
                    <Input
                      id="guardianRelationship"
                      name="guardianRelationship"
                      type="text"
                      placeholder="Enter relationship to guardian"
                      value={user.guardianRelationship}
                      onChange={handleChange}
                      className="rounded-full bg-muted text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="guardianAddress"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Guardian Address
                    </Label>
                    <Input
                      id="guardianAddress"
                      name="guardianAddress"
                      type="text"
                      placeholder="Enter guardian's address"
                      value={user.guardianAddress}
                      onChange={handleChange}
                      className="rounded-full bg-muted text-sm"
                      required
                    />
                  </div>
                  <div>
                    <Label
                      htmlFor="guardianContactNumber"
                      className="text-sm font-medium text-muted-foreground"
                    >
                      Guardian Contact Number
                    </Label>
                    <Input
                      id="guardianContactNumber"
                      name="guardianContactNumber"
                      type="tel"
                      placeholder="Enter guardian's contact number"
                      value={user.guardianContactNumber}
                      onChange={handleChange}
                      className="rounded-full bg-muted text-sm"
                      required
                    />
                  </div>
                </>
              )}
            </div>
          </div>
          <footer className="py-4 border-t border-border max space-y-3">
            <Button
              disabled={isSubmitting}
              type="submit"
              className="w-full rounded-full"
            >
              {isSubmitting ? 'Saving changes...' : 'Save changes'}
            </Button>
            <Button
              disabled={isLoggingOut}
              onClick={onLogout}
              className="w-full rounded-full"
              variant="secondary"
            >
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </Button>
          </footer>
        </form>
      </main>
    </div>
  )
}

export default Profile
