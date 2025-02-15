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
