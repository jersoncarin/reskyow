import { Button } from '~/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog'
import { Avatar, AvatarImage, AvatarFallback } from '~/components/ui/avatar'
import { ScrollArea } from '~/components/ui/scroll-area'
import { ExecutionMethod, type Models } from 'appwrite'
import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { FUNCTION_ID, functions } from '~/lib/appwrite'

export const UserInfoModal = ({ senderId }: { senderId: string }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null)

  useEffect(() => {
    if (isDialogOpen && senderId) {
      functions
        .createExecution(
          FUNCTION_ID,
          JSON.stringify({
            senderId,
          }),
          false,
          '/user',
          ExecutionMethod.GET
        )
        .then((data) => {
          const user = JSON.parse(
            data.responseBody
          ) as Models.User<Models.Preferences>
          setUser(user)
        })
        .catch(console.error)
    }
  }, [isDialogOpen, senderId])

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className="py-0 h-5 mt-3" variant="link" size="sm">
          View User Info
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md !rounded-lg">
        <DialogHeader>
          <DialogTitle>User Information</DialogTitle>
        </DialogHeader>
        {user ? (
          <ScrollArea className="max-h-[80vh] pr-4">
            <div className="grid gap-4 py-4">
              <div className="flex items-center justify-center">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={user.prefs.profilePhoto} alt={user.name} />
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <InfoItem label="Name" value={user.name} />
              <InfoItem label="Email" value={user.email} />
              <InfoItem label="Phone" value={user.phone} />
              <InfoItem label="Age" value={user.prefs.age} />
              <InfoItem label="Address" value={user.prefs.address} />
              <InfoItem label="School Name" value={user.prefs.schoolName} />
              <InfoItem
                label="School Address"
                value={user.prefs.schoolAddress}
              />
              <InfoItem label="Building No." value={user.prefs.buildingNo} />

              {user.prefs.role === 'student' && (
                <>
                  <InfoItem label="Grade" value={user.prefs.grade} />
                  <InfoItem label="Section" value={user.prefs.section} />
                  <InfoItem
                    label="Guardian Name"
                    value={user.prefs.guardianName}
                  />
                  <InfoItem
                    label="Guardian Age"
                    value={user.prefs.guardianAge}
                  />
                  <InfoItem
                    label="Guardian Relationship"
                    value={user.prefs.guardianRelationship}
                  />
                  <InfoItem
                    label="Guardian Address"
                    value={user.prefs.guardianAddress}
                  />
                  <InfoItem
                    label="Guardian Contact Number"
                    value={user.prefs.guardianContactNumber}
                  />
                </>
              )}

              {user.prefs.role === 'responder' && user.prefs.licensePhoto && (
                <div className="grid gap-2">
                  <span className="font-medium">License ID:</span>
                  <img
                    src={user.prefs.licensePhoto || '/placeholder.svg'}
                    alt="License ID"
                    className="w-full h-auto"
                  />
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex items-center justify-center h-32">
            <LoaderCircle width={30} height={30} className="animate-spin" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
const InfoItem = ({ label, value }: { label: string; value: string }) => (
  <div className="grid grid-cols-4 items-center gap-4">
    <span className="text-right font-medium">{label}:</span>
    <span className="col-span-3">{value}</span>
  </div>
)
