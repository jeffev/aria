/// <reference types="vite/client" />

interface ElectronAPI {
  setExpanded: (expanded: boolean) => void
  getConfig:   (key: string) => Promise<unknown>
  setConfig:   (key: string, value: unknown) => void
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI
    SpeechRecognition: typeof SpeechRecognition
    webkitSpeechRecognition: typeof SpeechRecognition
  }
}

export {}
