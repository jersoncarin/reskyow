import { registerPlugin } from '@capacitor/core'

export interface SimSlot {
  simSlot: number
  subscriptionId: number
  carrier: string
}

export interface SMSSenderPlugin {
  requestPermission(): Promise<void>
  getAllSimSlots(): Promise<{ sims: SimSlot[] }>
  sendSMS(options: {
    phoneNumber: string
    message: string
    simSlot?: number
  }): Promise<void>
}

const SMSSender = registerPlugin<SMSSenderPlugin>('SMSSender')

export default SMSSender
