import {
  AlertOctagon,
  CameraIcon,
  Info,
  Pencil,
  Upload,
  Video,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Media } from '../main/home'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import { hazard_mapping } from '~/lib/data'
import { Textarea } from '~/components/ui/textarea'
import { cn, fileToJSON, respondersPhoneNumber } from '~/lib/utils'
import { Camera, CameraResultType } from '@capacitor/camera'
import { toast } from 'sonner'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Capacitor } from '@capacitor/core'
import SMSSender, { type SimSlot } from '~/lib/sms'

const Offline = () => {
  const [selectedSimSlot, setSelectedSimSlot] = useState<string>('0')
  const [sims, setSims] = useState<SimSlot[]>([])
  const [media, setMedia] = useState<Media[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [buildingId, setBuildingId] = useState('25')
  const [description, setDescription] = useState(
    `There is an emergency in ${
      hazard_mapping[buildingId as keyof typeof hazard_mapping]
    } bldg no. #${buildingId}, Please respond as soon as possible.`
  )
  const [tempDescription, setTempDescription] = useState(description)

  useEffect(() => {
    SMSSender.requestPermission()
      .then(async () => {
        const slots = await SMSSender.getAllSimSlots()
        setSims(slots.sims)
      })
      .catch(() => {
        toast.error('Failed to request SMS permission')
      })
  }, [])

  useEffect(() => {
    setDescription(
      `There is an emergency in ${
        hazard_mapping[buildingId as keyof typeof hazard_mapping]
      } bldg no. #${buildingId}, Please respond as soon as possible.`
    )
  }, [buildingId])

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach((file) => {
        addMediaToList(file)
      })
    }
  }

  const addMediaToList = (file: File) => {
    const newMedia: Media = {
      id: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'video',
      url: URL.createObjectURL(file),
      file,
    }
    setMedia((prevMedia) => [...prevMedia, newMedia])
  }

  const takePhoto = async () => {
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Uri,
      })

      if (image.webPath) {
        const response = await fetch(image.webPath)
        const blob = await response.blob()
        const file = new File([blob], 'captured_photo.jpg', {
          type: 'image/jpeg',
        })
        addMediaToList(file)
      }
    } catch (error) {
      console.error('Error taking photo:', error)
    }
  }

  const handleSaveDescription = () => {
    setDescription(tempDescription)
    setIsDialogOpen(false)
  }

  const removeMedia = (id: string) => {
    setMedia((prevMedia) => prevMedia.filter((item) => item.id !== id))
  }

  const handleSubmit = async () => {
    setSubmitting(true)

    let toastId = toast.loading('Saving emergency data offline...')

    const mediaResolved = await Promise.all(
      media.map((item) => fileToJSON(item.file))
    )

    const toSavedOffline = {
      buildingId,
      description: tempDescription,
      media: mediaResolved,
    }

    if (Capacitor.isNativePlatform()) {
      await Filesystem.writeFile({
        path: `offline/emergencies/${buildingId}-${Date.now()}.json`,
        data: JSON.stringify(toSavedOffline),
        directory: Directory.Data,
        encoding: Encoding.UTF8,
        recursive: true,
      })
    } else {
      // Good for development purposes
      localStorage.setItem(
        `emergency-${buildingId}-${Date.now()}`,
        JSON.stringify(toSavedOffline)
      )
    }

    toastId = toast.success('Emergency data saved offline', { id: toastId })

    // Delay for 500ms to show the success message
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Get all responders phone numbers
    const phoneNumbers = await respondersPhoneNumber()

    const smsBody = `Reskyow Emergency Alert!!!\n\nPlease go to building #${buildingId}\n\nYou can view the full detail and media in the app\nNote: This is an offline emergency alert.`

    toastId = toast.loading('Sending Emergency Alert SMS to all responders...')

    for await (const phoneNumber of phoneNumbers) {
      // We need to delay the SMS sending to avoid blocking the sim
      await new Promise((resolve) => setTimeout(resolve, 500))

      toastId = toast.loading(`Sending SMS to ${phoneNumber}...`, {
        id: toastId,
      })

      // Send SMS to the responder
      await SMSSender.sendSMS({
        phoneNumber: phoneNumber,
        message: smsBody,
        simSlot: parseInt(selectedSimSlot),
      })
    }

    toast.success('Emergency Alert SMS sent to all responders', {
      id: toastId,
    })

    setSubmitting(false)
    setIsEmergency(false)
  }

  return (
    <div className="flex flex-col items-center h-full bg-background w-full">
      <header className="fixed top-0 w-full insets-top bg-background flex items-center justify-center px-3 pb-3 z-50">
        <h1 className="text-lg font-semibold mt-1">Offline Emergency Mode</h1>
      </header>
      <main className="mt-24 p-4 max-w-lg mx-auto flex-col flex w-full">
        <div className="flex-grow flex items-center justify-center w-full">
          <Dialog open={isEmergency} onOpenChange={setIsEmergency}>
            <DialogTrigger asChild>
              <button
                className={cn(
                  'pulse-btn w-72 h-72 bg-red-600 rounded-full flex flex-col items-center justify-center shadow-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 relative'
                )}
                aria-label="Emergency Button"
              >
                <AlertOctagon
                  size={100}
                  className="text-white mb-2 relative z-10"
                />
                <span className="text-white text-xl font-bold relative z-10">
                  Tap for Emergency
                </span>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-sm rounded-xl">
              <DialogHeader>
                <VisuallyHidden>
                  <DialogTitle>Are you sure to perform this action</DialogTitle>
                </VisuallyHidden>
              </DialogHeader>
              <div className="flex items-center flex-col gap-3">
                <AlertOctagon size={70} />
                <p className="text-center text-sm">
                  {media.length > 0
                    ? 'You are about to send an emergency alert to the responder including attached images and videos. Are you sure you want to proceed?'
                    : 'You are about to send an emergency alert to the responder without attach images and videos. Are you sure you want to proceed?'}
                </p>
                <Select
                  value={selectedSimSlot}
                  onValueChange={setSelectedSimSlot}
                >
                  <SelectTrigger
                    disabled={submitting}
                    className="w-full disabled:opacity-1"
                  >
                    <SelectValue placeholder="Select sim" />
                  </SelectTrigger>
                  <SelectContent>
                    {sims.map((sim) => (
                      <SelectItem
                        key={sim.carrier}
                        value={sim.simSlot.toString()}
                      >
                        {sim.carrier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleSubmit}>
                {submitting ? 'Proceeding' : 'Proceed'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>

        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-lg font-semibold mb-2">Building ID:</h2>
          <div className="flex items-center mb-2">
            <Select value={buildingId} onValueChange={setBuildingId}>
              <SelectTrigger
                disabled={submitting}
                className="w-full disabled:opacity-1"
              >
                <SelectValue placeholder="Select Building" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(hazard_mapping).map(([key, value]) => (
                  <SelectItem key={key} value={key}>
                    [#{key}] {value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className={cn('w-full inline-flex mt-2 gap-x-2 mb-8')}>
            <p className="text-sm break-keep">{description}</p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="link" size="icon">
                  <Pencil className="size-10" size={24} />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-sm rounded-xl">
                <DialogHeader>
                  <DialogTitle>Edit Description</DialogTitle>
                </DialogHeader>
                <Textarea
                  value={tempDescription}
                  onChange={(e) => setTempDescription(e.target.value)}
                  className="min-h-[100px]"
                />
                <Button onClick={handleSaveDescription}>Save</Button>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex justify-evenly space-x-4 mb-6">
            <label className="flex flex-col items-center cursor-pointer">
              <div className="flex items-center justify-center w-12 h-12 bg-blue-500 text-white rounded-full hover:bg-blue-600">
                <Upload size={24} />
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/*,video/*"
                onChange={handleFileUpload}
                multiple
              />
              <span className="mt-2 text-sm">Upload Photo/Video</span>
            </label>
            <button onClick={takePhoto} className="flex flex-col items-center">
              <div className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600">
                <CameraIcon size={24} />
              </div>
              <span className="mt-2 text-sm">Take Photo</span>
            </button>
          </div>

          {media.length > 0 && (
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-2">Uploaded Media</h3>
              <div className="grid grid-cols-2 gap-2">
                {media.map((item) => (
                  <div key={item.id} className="relative">
                    {item.type === 'image' ? (
                      <img
                        src={item.url || '/placeholder.svg'}
                        alt="Uploaded image"
                        className="w-full h-32 object-cover rounded"
                      />
                    ) : (
                      <video
                        src={item.url}
                        className="w-full h-32 object-cover rounded"
                        controls
                      />
                    )}
                    <Button
                      variant="link"
                      size="icon"
                      className="absolute top-1 right-1"
                      onClick={() => removeMedia(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="flex items-center">
              <CameraIcon className="mr-2 text-gray-500" size={20} />
              <span className="text-gray-700">
                {media.filter((m) => m.type === 'image').length} images
              </span>
            </div>
            <div className="flex items-center">
              <Video className="mr-2 text-gray-500" size={20} />
              <span className="text-gray-700">
                {media.filter((m) => m.type === 'video').length} videos
              </span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md bg-white rounded-lg shadow-md p-6 mt-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
            <div className="text-justify text-sm text-gray-500">
              You're currently offline, but you can still send an emergency
              alert to a responder via SMS. Please select the building and
              describe the emergency. You can also upload photos and videos for
              additional details, but they will only be sent once you're back
              online and sync your data. Only the SMS will be sent immediately
              using the local SMS service.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default Offline
