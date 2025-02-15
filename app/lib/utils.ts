import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { Directory, Encoding, Filesystem } from '@capacitor/filesystem'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const formatDate = (isoString: string) => {
  return format(new Date(isoString), 'MMM dd, yyyy hh:mm a')
}

export function fileToJSON(file: File) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () =>
      resolve({
        bytes:
          typeof reader.result === 'string'
            ? reader.result.split(',')[1]
            : null,
        lastModified: new Date(file.lastModified).toISOString(),
        name: file.name,
        size: file.size,
        type: file.type,
        webkitRelativePath: file.webkitRelativePath,
      })
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function jsonToFile(json: {
  bytes: string
  name: string
  type: string
  lastModified: string
}): File {
  const { bytes, name, type, lastModified } = json

  if (!bytes) {
    throw new Error('Invalid file data: Missing bytes.')
  }

  // Decode Base64 to binary string
  const byteCharacters = atob(bytes)
  const byteArrays: Uint8Array[] = []

  // Convert binary string to Uint8Array
  for (let i = 0; i < byteCharacters.length; i += 512) {
    const slice = byteCharacters.slice(i, i + 512)
    const byteNumbers = new Array(slice.length)

    for (let j = 0; j < slice.length; j++) {
      byteNumbers[j] = slice.charCodeAt(j)
    }

    byteArrays.push(new Uint8Array(byteNumbers))
  }

  return new File(byteArrays, name, {
    type,
    lastModified: new Date(lastModified).getTime(),
  })
}

export async function respondersPhoneNumber() {
  try {
    const result = await Filesystem.readFile({
      path: 'cache/responders.json',
      directory: Directory.Data,
      encoding: Encoding.UTF8,
    })

    return JSON.parse(result.data.toString()) as string[]
  } catch (e) {
    return [] as string[]
  }
}
