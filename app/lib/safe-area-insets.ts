import { registerPlugin, WebPlugin } from '@capacitor/core'

export interface Insets {
  top: number
  bottom: number
  left: number
  right: number
}

export class SafeAreaInsets extends WebPlugin {
  async getSafeAreaInsets(): Promise<{ insets: Insets }> {
    return {
      insets: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
    }
  }
}

const SafeArea = registerPlugin<SafeAreaInsets>('SafeAreaInsets', {
  web: () => new SafeAreaInsets(),
})

export default SafeArea
