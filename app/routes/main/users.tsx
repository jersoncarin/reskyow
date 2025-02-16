'use client'

import type React from 'react'

import { useEffect, useState, useCallback } from 'react'
import { LoaderCircle, User, Search } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { ExecutionMethod, type Models } from 'appwrite'
import { UserInfoModal } from '~/components/user-info-card'
import { FUNCTION_ID, functions, getCurrentUser } from '~/lib/appwrite'
import debounce from 'lodash.debounce'
import { redirect } from 'react-router'

export const clientLoader = async () => {
  const user = await getCurrentUser()

  if (user?.prefs.role !== 'responder') {
    return redirect('/')
  }
}

const Users = () => {
  const [users, setUsers] = useState<Models.User<Models.Preferences>[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const fetchUsers = useCallback(
    debounce((searchTerm: string) => {
      setLoading(true)
      functions
        .createExecution(
          FUNCTION_ID,
          JSON.stringify({
            search: searchTerm,
          }),
          false,
          '/user',
          ExecutionMethod.GET
        )
        .then((data) => {
          const users = JSON.parse(
            data.responseBody
          ) as Models.User<Models.Preferences>[]
          setUsers(users)
        })
        .catch(console.error)
        .finally(() => setLoading(false))
    }, 300),
    []
  )

  useEffect(() => {
    fetchUsers(search)
  }, [search, fetchUsers])

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  return (
    <div className="h-full bg-background text-foreground">
      <header className="fixed top-0 w-full insets-top z-10 bg-background flex flex-col items-center justify-center px-3 pb-3">
        <h1 className="text-lg font-semibold mt-1">Users</h1>
      </header>
      <main className="flex-1 p-4 mt-8 max-w-lg mx-auto">
        <div className="sticky top-10 bg-background z-10 pb-3">
          <div className="w-full max-w-lg relative">
            <Input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={handleSearchChange}
              className="pl-10 "
            />
            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
          </div>
        </div>
        <div className="flex flex-col space-y-4 w-full max-w-lg">
          {loading ? (
            <div className="flex items-center justify-center w-full h-96 flex-col gap-y-3">
              <LoaderCircle
                width={30}
                height={30}
                className="text-primary animate-spin"
              />
            </div>
          ) : users && users.length > 0 ? (
            users.map((user) => (
              <Card
                key={user.$id}
                className="bg-stone-50 shadow-sm cursor-pointer"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold flex items-center">
                    <Avatar className="w-10 h-10 mr-3">
                      <AvatarImage
                        src={user.prefs.profilePhoto}
                        alt={user.name}
                      />
                      <AvatarFallback>
                        <User className="w-6 h-6" />
                      </AvatarFallback>
                    </Avatar>
                    {user.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col space-y-1 text-sm text-muted-foreground">
                    <span>Email: {user.email}</span>
                    <span>Phone: {user.phone}</span>
                  </div>
                  <UserInfoModal senderId={user.$id} />
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="flex items-center justify-center w-full h-96 flex-col gap-y-3">
              <User className="w-24 h-24 text-muted-foreground" />
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

export default Users
