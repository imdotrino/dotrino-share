export declare class DotrinoShare extends HTMLElement {
  url: string
  text: string
  open: boolean
  /** Controlador opcional de createNotifications(...): habilita el toggle "avísame cuando lo abran" (atributo `track`). */
  notifications: any | null
}

/** Evento emitido cuando el usuario comparte (copiar/red/Web Share nativo). */
export interface CcShareSharedEvent extends CustomEvent {
  detail: { url: string; method: 'copy' | 'wa' | 'tg' | 'x' | 'fb' | 'native' }
}

declare global {
  interface HTMLElementTagNameMap { 'dotrino-share': DotrinoShare }
  interface HTMLElementEventMap {
    'cc-share-close': CustomEvent
    'cc-share-shared': CcShareSharedEvent
  }
}
