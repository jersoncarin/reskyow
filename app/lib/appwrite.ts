import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'
import { Account, Client, Databases, Functions, ID, Storage } from 'appwrite'

const client = new Client()

client.setEndpoint('https://cloud.appwrite.io/v1').setProject('reskyow')

export const FUNCTION_ID = '679bbdb8002b28a309c8'
export const STORAGE_BUCKET_ID = '679b0b580032dcedd5b7'
export const DB_ID = '679b0b9c0021e883ecec'
export const DB_COLLECTION_ID = '67b00ef1002bbc70b0e6'

const account = new Account(client)
const functions = new Functions(client)
const storage = new Storage(client)
const db = new Databases(client)

export async function getCurrentUser() {
  try {
    return await account.get()
  } catch (err) {
    return null
  }
}

export const updatePushToken = async () => {
  const token = await Filesystem.readFile({
    path: 'fcm/token.txt',
    directory: Directory.Data,
    encoding: Encoding.UTF8,
  })

  try {
    const session = await account.getSession('current')
    await account.createPushTarget(session.$id, token.data.toString())
  } catch (e) {
    console.error('Error updating push token', e)
  } finally {
    console.log('Updating push token', token.data.toString())
  }
}

export { client, account, functions, storage, db }
