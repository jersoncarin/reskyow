import { Query } from 'appwrite'
import { useRef, type FC } from 'react'
import {
  db,
  DB_COLLECTION_ID,
  DB_ID,
  getCurrentUser,
  storage,
  STORAGE_BUCKET_ID,
} from '~/lib/appwrite'
import type { Route } from './+types/history'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { cn, formatDate } from '~/lib/utils'
import { Building, Cat, CheckCircle, Clock, Play } from 'lucide-react'
import { Badge } from '~/components/ui/badge'
import { Browser } from '@capacitor/browser'
import { UserInfoModal } from '~/components/user-info-card'

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

export function MediaItem({ item }: { item: string }) {
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

// Fetch the latest unresolved document
const fetchLatestDocument = async (userId: string, isUser = true) => {
  try {
    const response = await db.listDocuments(
      DB_ID,
      DB_COLLECTION_ID,
      [
        Query.equal('is_resolved', true),
        isUser ? Query.equal('senderId', userId) : null,
        Query.orderDesc('$createdAt'), // Sort by latest
      ].filter((item) => item !== null) as string[]
    )

    return response
  } catch (error) {
    console.error('Error fetching document:', error)
  }
}

const History: FC<Route.ComponentProps> = ({ loaderData: { emergencies } }) => {
  return (
    <div className="h-full bg-background text-foreground">
      <header className="fixed top-0 w-full insets-top z-10 bg-background flex items-center justify-center px-3 pb-3">
        <h1 className="text-lg font-semibold mt-1">Emergency History</h1>
      </header>
      <main className="flex-1 p-4 mt-12 max-w-lg mx-auto">
        <div className="flex flex-col space-y-4 w-full max-w-lg">
          {emergencies && emergencies.documents.length > 0 ? (
            emergencies.documents.map((event) => (
              <Card
                key={event.$id}
                className={cn('bg-stone-50 shadow-sm cursor-pointer ')}
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
                  <UserInfoModal senderId={event.senderId} />
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
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-96 flex-col gap-y-3">
              <Cat className="w-24 h-24 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">
                No data available right now.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default History
