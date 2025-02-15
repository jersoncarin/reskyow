import { useEffect, useRef, useState, type FC } from 'react'
import {
  AlertOctagon,
  Upload,
  CameraIcon,
  Video,
  Pencil,
  X,
  Building,
  CheckCircle,
  Clock,
  Play,
} from 'lucide-react'
import { Camera, CameraResultType } from '@capacitor/camera'
import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Textarea } from '~/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import {
  client,
  db,
  DB_COLLECTION_ID,
  DB_ID,
  FUNCTION_ID,
  functions,
  getCurrentUser,
  storage,
  STORAGE_BUCKET_ID,
} from '~/lib/appwrite'
import type { Route } from './+types/home'
import { hazard_mapping } from '~/lib/data'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Network, type ConnectionStatus } from '@capacitor/network'
import { Capacitor } from '@capacitor/core'
import { ExecutionMethod, ID, Query } from 'appwrite'
import { toast } from 'sonner'
import type { Models } from 'appwrite'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { cn, formatDate, jsonToFile } from '~/lib/utils'
import { Browser } from '@capacitor/browser'
import { useNavigate } from 'react-router'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'

export interface Media {
  id: string
  type: 'image' | 'video'
  url: string
  file: File
}

export type MediaItem = {
  type: 'image' | 'video'
  url: string
  thumbnailUrl?: string // For video thumbnails
}

function MediaItem({ item }: { item: string }) {
  const url = storage.getFileView(STORAGE_BUCKET_ID, item)
  const isVideo = /\.(mp4|mov|avi|webm|mkv)$/i.test(item)
  const imageRef = useRef<HTMLImageElement>(null)

  return (
    <button
      className="relative w-full h-32 flex-shrink-0"
      onClick={() => Browser.open({ url })}
    >
      <video
        controls={false}
        src={url}
        className="object-cover w-full h-32 rounded"
      />
      <img
        ref={imageRef}
        onError={() => imageRef.current?.remove()}
        src={url}
        className="absolute inset-0 object-cover w-full h-32 rounded"
      />
      {isVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded">
          <Play className="w-6 h-6 text-white" />
        </div>
      )}
    </button>
  )
}

export const clientLoader = async () => {
  const user = await getCurrentUser()
  const emergencies = await fetchLatestDocument(
    user!.$id,
    user?.prefs.role !== 'responder'
  )

  // We will use ! to assert that user is not null
  // since we are redirecting to the login page if the user is not logged in
  return { user: user!, emergencies }
}

// Fetch the latest unresolved document
const fetchLatestDocument = async (userId: string, isUser = true) => {
  try {
    const response = await db.listDocuments(
      DB_ID,
      DB_COLLECTION_ID,
      [
        Query.equal('is_resolved', false),
        isUser ? Query.equal('senderId', userId) : null,
        Query.orderDesc('$createdAt'), // Sort by latest
      ].filter((item) => item !== null) as string[]
    )

    return response
  } catch (error) {
    console.error('Error fetching document:', error)
  }
}

const EmergencyHomeScreen: FC<Route.ComponentProps> = ({
  loaderData: { user, emergencies },
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [latestEmergency, setLatestEmergency] = useState<Models.Document[]>([])
  const [isNetworkConnected, setIsNetworkConnected] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [buildingId, setBuildingId] = useState(user?.prefs.buildingNo || '')
  const [description, setDescription] = useState(
    `There is an emergency in ${
      hazard_mapping[buildingId as keyof typeof hazard_mapping]
    } bldg no. #${buildingId}, Please respond as soon as possible.`
  )
  const [media, setMedia] = useState<Media[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEmergency, setIsEmergency] = useState(false)
  const [tempDescription, setTempDescription] = useState(description)
  const navigate = useNavigate()

  // We will sync all offline emergency alerts
  useEffect(() => {
    const syncOfflineAlerts = async () => {
      let toastId = toast.loading('Syncing offline emergency alerts...')

      const offlineAlerts = await Filesystem.readdir({
        path: 'offline/emergencies',
        directory: Directory.Data,
      })

      for await (const file of offlineAlerts.files) {
        if (file.type === 'directory') continue

        try {
          const response = await Filesystem.readFile({
            path: `offline/emergencies/${file.name}`,
            directory: Directory.Data,
            encoding: Encoding.UTF8,
          })

          const emergency = JSON.parse(response.data.toString())

          const media = emergency.media.map(
            (item: any) => jsonToFile(item) as File
          ) as File[]

          const results = await Promise.allSettled(
            media.map((item) =>
              storage.createFile(STORAGE_BUCKET_ID, ID.unique(), item)
            )
          )

          const files = results
            .filter((result) => result.status === 'fulfilled')
            .map((result) => result.value.$id)

          const rejected = results.filter(
            (result) => result.status === 'rejected'
          )

          if (rejected.length > 0) {
            toast.error(
              'Failed to upload some media due to size exceed limit.',
              {
                id: toastId,
              }
            )
          }

          // Once the notification is sent, we will save the emergency alert to the database
          await db.createDocument(DB_ID, DB_COLLECTION_ID, ID.unique(), {
            building_id: buildingId,
            description,
            senderId: user?.$id,
            senderName: user?.name,
            is_resolved: false,
            media: files,
          })

          toast.success('Offline emergency alerts synced successfully.', {
            id: toastId,
          })

          // Delete the file once it is synced
          await Filesystem.deleteFile({
            path: `offline/emergencies/${file.name}`,
            directory: Directory.Data,
          })
        } catch (error) {
          console.error('Error reading offline emergency alert:', error)
        }
      }
    }

    syncOfflineAlerts().catch(console.error)
  }, [])

  useEffect(() => {
    setDescription(
      `There is an emergency in ${
        hazard_mapping[buildingId as keyof typeof hazard_mapping]
      } bldg no. #${buildingId}, Please respond as soon as possible.`
    )
  }, [buildingId])

  useEffect(() => {
    const handleNetworkChange = (status: ConnectionStatus) => {
      setIsNetworkConnected(status.connected)
    }

    const handleNetworkChangeWeb = () => {
      setIsNetworkConnected(navigator.onLine)
    }

    if (Capacitor.isNativePlatform()) {
      Network.addListener('networkStatusChange', handleNetworkChange)
      Network.getStatus().then(handleNetworkChange)
    } else {
      window.addEventListener('online', handleNetworkChangeWeb)
      window.addEventListener('offline', handleNetworkChangeWeb)
      handleNetworkChangeWeb()
    }

    return () => {
      if (Capacitor.isNativePlatform()) {
        Network.removeAllListeners()
      } else {
        window.removeEventListener('online', handleNetworkChangeWeb)
        window.removeEventListener('offline', handleNetworkChangeWeb)
      }
    }
  }, [])

  useEffect(() => {
    if (emergencies) {
      setLatestEmergency(emergencies.documents)

      if (user.prefs.role === 'responder') {
        setSelectedId(emergencies.documents[0]?.$id || null)
        setBuildingId(emergencies.documents[0]?.building_id || '')
        setDescription(emergencies.documents[0]?.description || '')
      }
    }

    const unsubscribe = client.subscribe(
      `databases.${DB_ID}.collections.${DB_COLLECTION_ID}.documents`,
      async () => {
        console.log('Document updated')
        const response = await fetchLatestDocument(
          user!.$id,
          user?.prefs.role !== 'responder'
        )

        if (response) {
          setLatestEmergency(response.documents)

          if (user.prefs.role === 'responder') {
            setSelectedId(response.documents[0]?.$id || null)
            setBuildingId(response.documents[0]?.building_id || '')
            setDescription(response.documents[0]?.description || '')
          }
        }
      }
    )

    return () => {
      unsubscribe()
    }
  }, [emergencies])

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
    if (!isNetworkConnected) {
      // Fallback offline mode
      toast.error('No internet connection, trying offline mode now...')

      // Still we can respond emergency using local sms and the app will sync once the connection is back
      navigate('/offline')
      return
    }

    setSubmitting(true)

    if (user?.prefs.role === 'responder' && selectedId !== null) {
      try {
        await db.updateDocument(DB_ID, DB_COLLECTION_ID, selectedId, {
          is_resolved: true,
        })

        toast.success('Emergency resolved successfully')
      } catch (error) {
        console.error('Error resolving emergency:', error)
        toast.error('Failed to resolve emergency')
      } finally {
        setSubmitting(false)
        setIsEmergency(false)
      }

      return
    }

    const toastId = toast.loading('Sending emergency alert')

    const body = `There is an emergency in ${
      hazard_mapping[buildingId as keyof typeof hazard_mapping]
    } building no. #${buildingId}, Please respond as soon as possible.`
    const smsBody = `Reskyow Emergency Alert!!!\n\nPlease go to building #${buildingId}\n\nYou can view the full detail and media in the app\nNote: This is an offline emergency alert.`

    try {
      await functions.createExecution(
        FUNCTION_ID,
        JSON.stringify({
          senderId: user?.$id,
          title: 'Emergency Alert, Please Respond',
          body,
          smsBody,
        }),
        false,
        '/send-notification',
        ExecutionMethod.POST
      )

      const results = await Promise.allSettled(
        media.map((item) =>
          storage.createFile(STORAGE_BUCKET_ID, ID.unique(), item.file)
        )
      )

      const files = results
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value.$id)

      const rejected = results.filter((result) => result.status === 'rejected')

      if (rejected.length > 0) {
        toast.error('Failed to upload some media due to size exceed limit.', {
          id: toastId,
        })
      }

      // Once the notification is sent, we will save the emergency alert to the database
      await db.createDocument(DB_ID, DB_COLLECTION_ID, ID.unique(), {
        building_id: buildingId,
        description,
        senderId: user?.$id,
        senderName: user?.name,
        is_resolved: false,
        media: files,
      })

      toast.success('Emergency alert sent successfully', { id: toastId })
    } catch (err) {
      console.error('Error sending emergency alert:', err)
      toast.error('Failed to send emergency alert', { id: toastId })
    } finally {
      setSubmitting(false)
      setIsEmergency(false)
    }
  }

  return (
    <div className="flex flex-col items-center h-full bg-background w-full">
      <header className="fixed top-0 w-full insets-top bg-background flex items-center justify-center px-3 pb-3 z-50">
        <h1 className="text-lg font-semibold mt-1">Emergency</h1>
      </header>

      <main className="mt-24 p-4 max-w-lg mx-auto flex-col flex w-full">
        <div className="flex-grow flex items-center justify-center w-full">
          <Dialog open={isEmergency} onOpenChange={setIsEmergency}>
            <DialogTrigger asChild>
              <button
                disabled={
                  (user?.prefs.role === 'responder' &&
                    latestEmergency.length === 0) ||
                  submitting
                }
                className={cn(
                  'w-72 h-72 bg-red-600 rounded-full flex flex-col items-center justify-center shadow-lg hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-300 transition-all duration-300 relative',
                  {
                    'pulse-btn':
                      user?.prefs.role !== 'responder' ||
                      latestEmergency.length === 0,
                    'bg-green-600':
                      user?.prefs.role === 'responder' &&
                      latestEmergency.length > 0,
                    'hover:bg-green-700':
                      user?.prefs.role === 'responder' &&
                      latestEmergency.length > 0,
                    'focus:ring-green-300':
                      user?.prefs.role === 'responder' &&
                      latestEmergency.length > 0,
                    'pulse-g-btn':
                      user?.prefs.role === 'responder' &&
                      latestEmergency.length > 0,
                  }
                )}
                aria-label="Emergency Button"
              >
                <AlertOctagon
                  size={100}
                  className="text-white mb-2 relative z-10"
                />
                <span className="text-white text-xl font-bold relative z-10">
                  {user?.prefs.role === 'responder'
                    ? latestEmergency.length > 0
                      ? 'Ongoing'
                      : 'Waiting for emergency'
                    : 'Tap for Emergency'}
                </span>
                {latestEmergency.length > 0 &&
                  user?.prefs.role === 'responder' && (
                    <div className="text-xs text-white">
                      Tap the button to resolved
                    </div>
                  )}
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
                  {user.prefs.role === 'responder'
                    ? "You are about to resolve the emergency, meaning the patient/rescued is in good condition, don't proceed if you have any hesitation."
                    : media.length > 0
                    ? 'You are about to send an emergency alert to the responder including attached images and videos. Are you sure you want to proceed?'
                    : 'You are about to send an emergency alert to the responder without attach images and videos. Are you sure you want to proceed?'}
                </p>
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
                disabled={user.prefs.role === 'responder'}
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
          <div
            className={cn('w-full inline-flex mt-2 gap-x-2', {
              'mb-8': user?.prefs.role !== 'responder',
            })}
          >
            <p className="text-sm break-keep">
              {buildingId
                ? description
                : 'Waiting for emergency, please standby.'}
            </p>
            {user?.prefs.role !== 'responder' && (
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
            )}
          </div>

          {user?.prefs.role !== 'responder' && (
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
              <button
                onClick={takePhoto}
                className="flex flex-col items-center"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-green-500 text-white rounded-full hover:bg-green-600">
                  <CameraIcon size={24} />
                </div>
                <span className="mt-2 text-sm">Take Photo</span>
              </button>
            </div>
          )}

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

          {user.prefs.role !== 'responder' && (
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
          )}
        </div>
        {latestEmergency.length > 0 && (
          <div className="mb-3 mt-4">
            <h1 className="text-xl font-bold text-center">Emergencies</h1>
            <h2 className="text-xs text-center text-gray-500">
              (Tap the card to change emergency status)
            </h2>
          </div>
        )}
        {latestEmergency.length > 0 && (
          <div className="flex flex-col space-y-4 w-full max-w-md">
            {latestEmergency.map((event) => (
              <Card
                onClick={() => {
                  setSelectedId(event.$id)
                  setBuildingId(event.building_id)
                  setDescription(event.description)
                }}
                key={event.$id}
                className={cn(
                  'bg-stone-50 shadow-sm cursor-pointer ',
                  selectedId === event.$id
                    ? 'border-2 border-green-500'
                    : 'border-2 border-transparent'
                )}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">
                    {formatDate(event.$createdAt)}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center mb-2 text-sm text-muted-foreground">
                    <Building className="w-4 h-4 mr-1" />
                    <span>Building ID: {event.building_id}</span>
                  </div>
                  <p className="text-sm mb-3">{event.description}</p>
                  <Badge
                    variant={event.is_resolved ? 'secondary' : 'default'}
                    className="flex items-center w-fit"
                  >
                    {event.is_resolved ? (
                      <CheckCircle className="w-3 h-3 mr-1" />
                    ) : (
                      <Clock className="w-3 h-3 mr-1" />
                    )}
                    {event.is_resolved ? 'Resolved' : 'Ongoing'}
                  </Badge>
                  {event.media.length > 0 && (
                    <div className="pt-2">
                      <h3 className="text-sm font-semibold mb-2">Media:</h3>
                      <div className="grid grid-cols-2 gap-2 pb-2">
                        {event.media.map((item: any) => (
                          <MediaItem key={item} item={item} />
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default EmergencyHomeScreen
