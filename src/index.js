/**
 * <dotrino-share> — UI compartida del ecosistema Dotrino para COMPARTIR
 * un enlace. Un Web Component (custom element, Shadow DOM) reutilizable por
 * cualquier app (Vue o vanilla): el mismo modal para pronosticador, ajedrez,
 * cuarenta, etc. Muestra:
 *   - código QR del enlace (autohosteado, generado en el cliente; sin servicios
 *     de terceros — el enlace puede contener datos del usuario en el #fragment),
 *   - el enlace con botón de copiar,
 *   - botones de redes (WhatsApp, Telegram, X, Facebook) + "Más" (Web Share API).
 *
 * Filosofía Dotrino: autohosteado, Shadow DOM, sin JS de terceros ni cookies,
 * bilingüe es/en. NO toca identidad/transporte/almacenamiento: solo recibe una URL
 * ya armada (el llamador decide qué comparte; los datos de usuario van por
 * #fragment, que no llega al servidor ni es indexable).
 *
 * Uso (Vue o vanilla):
 *   <dotrino-share lang="es"></dotrino-share>
 *   const el = document.querySelector('dotrino-share')
 *   el.url = 'https://cuarenta.dotrino.com/#table=ABC'
 *   el.text = '¡Únete a mi mesa!'
 *   el.open = true                       // muestra el modal
 *   el.addEventListener('cc-share-close', () => { el.open = false })
 *
 * Atributos/propiedades: url, text, lang ('es'|'en'), heading, hint, open (bool).
 * Evento: 'cc-share-close' (al cerrar). Tema: variables CSS --ccs-* (ver abajo).
 */
import QRCode from 'qrcode'

const I18N = {
  es: {
    heading: 'Compartir',
    hint: 'Escanea el QR o comparte el enlace.',
    text: '¡Mira esto!',
    copy: 'Copiar',
    copied: '✓ Copiado',
    close: 'Cerrar',
    more: 'Más',
    track: 'Avísame cuando lo abran',
    trackHint: 'Recibe una notificación cuando alguien abra este enlace.',
    wa: 'WhatsApp', tg: 'Telegram', x: 'X', fb: 'Facebook'
  },
  en: {
    heading: 'Share',
    hint: 'Scan the QR or share the link.',
    text: 'Check this out!',
    copy: 'Copy',
    copied: '✓ Copied',
    close: 'Close',
    more: 'More',
    track: 'Notify me when opened',
    trackHint: 'Get a notification when someone opens this link.',
    wa: 'WhatsApp', tg: 'Telegram', x: 'X', fb: 'Facebook'
  }
}

const SVG = {
  wa: '<path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.5.1l-.7.9c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.2 0-.4.1-.5l.4-.4.2-.4c.1-.1 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1c0 1.2.9 2.4 1 2.6.1.2 1.8 2.7 4.3 3.8.6.3 1.1.4 1.5.5.6.2 1.2.2 1.6.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1l-.4-.2Z"/>',
  tg: '<path d="M21.9 4.3 18.6 19.7c-.2 1.1-.9 1.4-1.8.9l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.3 13l-4.8-1.5c-1-.3-1-1 .2-1.5L20.6 2.8c.9-.3 1.6.2 1.3 1.5Z"/>',
  x: '<path d="M18.2 2h3.3l-7.2 8.3L23 22h-6.6l-5.2-6.8L5.3 22H2l7.7-8.8L1.4 2H8l4.7 6.2L18.2 2Zm-1.2 18h1.8L7.1 3.9H5.2L17 20Z"/>',
  fb: '<path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.2c-1.2 0-1.6.8-1.6 1.6V12h2.7l-.4 2.9h-2.3v7A10 10 0 0 0 22 12Z"/>',
  more: '<path d="M12 2.2c3.2 0 3.6 0 4.9.1 1.2.1 1.8.3 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.3 1 .4 2.2.1 1.3.1 1.7.1 4.9s0 3.6-.1 4.9c-.1 1.2-.3 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .3-2.2.4-1.3.1-1.7.1-4.9.1s-3.6 0-4.9-.1c-1.2-.1-1.8-.3-2.2-.4a3.8 3.8 0 0 1-1.4-.9 3.8 3.8 0 0 1-.9-1.4c-.2-.4-.3-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.9c.1-1.2.3-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.3 2.2-.4C8.4 2.2 8.8 2.2 12 2.2Zm0 4.9a4.9 4.9 0 1 0 0 9.8 4.9 4.9 0 0 0 0-9.8Zm0 8.1a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm6.2-8.3a1.1 1.1 0 1 1-2.3 0 1.1 1.1 0 0 1 2.3 0Z"/>'
}

const CSS = `
  :host { font-family: var(--ccs-font, system-ui, -apple-system, Segoe UI, Roboto, sans-serif); }
  .overlay {
    position: fixed; inset: 0; background: var(--ccs-overlay, rgba(0,0,0,.6));
    display: flex; align-items: center; justify-content: center; z-index: var(--ccs-z, 1000); padding: 1rem;
  }
  .modal {
    background: var(--ccs-bg, #1c1c1e); color: var(--ccs-text, #f2f2f2);
    border: 1px solid var(--ccs-border, rgba(255,255,255,.12)); border-radius: var(--ccs-radius, 14px);
    padding: 1.4rem; max-width: 340px; width: 100%; position: relative; text-align: center;
    box-shadow: var(--ccs-shadow, 0 18px 50px rgba(0,0,0,.5));
  }
  .close {
    position: absolute; top: .4rem; right: .6rem; background: none; border: none;
    color: var(--ccs-muted, #9a9a9a); font-size: 1.6rem; cursor: pointer; line-height: 1; padding: .2rem .4rem;
  }
  h3 { margin: 0 0 .3rem; font-size: 1.15rem; color: var(--ccs-accent, #cda350); }
  .hint { font-size: .82rem; color: var(--ccs-muted, #9a9a9a); margin: 0 0 1rem; }
  .qr { width: 220px; height: 220px; max-width: 100%; border-radius: 8px; background: #fff; padding: 6px; box-sizing: border-box; }
  .qr-ph { width: 220px; height: 220px; max-width: 100%; border-radius: 8px; background: var(--ccs-bg-2, #2a2a2c); display: inline-block; }
  .url-row { display: flex; gap: .4rem; margin-top: .8rem; }
  .url-row input {
    flex: 1; min-width: 0; background: var(--ccs-input-bg, #111); border: 1px solid var(--ccs-border, rgba(255,255,255,.12));
    border-radius: 8px; padding: .5rem; color: var(--ccs-text, #f2f2f2); font-size: .78rem;
  }
  .copy {
    background: var(--ccs-accent, #cda350); color: var(--ccs-accent-text, #1c1c1e); border: none;
    padding: .5rem 1rem; border-radius: 8px; cursor: pointer; font-weight: 600; white-space: nowrap; font-size: .85rem;
  }
  .social { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; margin-top: .9rem; }
  .ico {
    width: 40px; height: 40px; border-radius: 50%; border: none; cursor: pointer;
    display: inline-flex; align-items: center; justify-content: center; color: #fff;
    transition: filter .15s ease, transform .1s ease;
  }
  .ico:hover { filter: brightness(1.1); }
  .ico:active { transform: scale(.94); }
  .ico svg { width: 20px; height: 20px; fill: currentColor; }
  .ico.wa { background: #25d366; }
  .ico.tg { background: #2aabee; }
  .ico.x  { background: #000; }
  .ico.fb { background: #1877f2; }
  .ico.ig { background: linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5); }
  .ext-actions { display: flex; flex-wrap: wrap; gap: .5rem; justify-content: center; }
  ::slotted(*) { margin-top: .9rem; }
  .track {
    display: flex; align-items: center; gap: .7rem; text-align: left;
    margin-top: .9rem; padding-top: .9rem; border-top: 1px solid var(--ccs-border, rgba(255,255,255,.12));
  }
  .track-text { flex: 1; min-width: 0; }
  .track-label { font-size: .82rem; font-weight: 600; }
  .track-hint { font-size: .72rem; color: var(--ccs-muted, #9a9a9a); margin-top: .15rem; }
  .switch {
    flex-shrink: 0; width: 42px; height: 24px; border-radius: 999px; border: none;
    background: var(--ccs-bg-2, #2a2a2c); position: relative; cursor: pointer; padding: 0;
    transition: background .15s ease;
  }
  .switch.on { background: var(--ccs-accent, #cda350); }
  .switch .knob {
    position: absolute; top: 3px; left: 3px; width: 18px; height: 18px; border-radius: 50%;
    background: #fff; transition: transform .15s ease;
  }
  .switch.on .knob { transform: translateX(18px); }
`

class DotrinoShare extends HTMLElement {
  static get observedAttributes () { return ['url', 'text', 'lang', 'heading', 'hint', 'open', 'track', 'category'] }

  constructor () {
    super()
    this.attachShadow({ mode: 'open' })
    this._url = ''
    this._text = ''
    this._qr = ''
    this._copied = false
    this._notifications = null   // controlador opcional (createNotifications) para el toggle de seguimiento
    this._onKey = (e) => { if (e.key === 'Escape' && this._isOpen) this._close() }
  }

  connectedCallback () { this._render(); document.addEventListener('keydown', this._onKey) }
  disconnectedCallback () { document.removeEventListener('keydown', this._onKey) }

  attributeChangedCallback (name) {
    if (name === 'url') { this._url = this.getAttribute('url') || ''; this._genQR() }
    if (name === 'text') this._text = this.getAttribute('text') || ''
    if (name === 'open' && this._isOpen) { this._copied = false; this._genQR() }
    this._render()
  }

  /* ----- propiedades (para frameworks que setean props, no atributos) ----- */
  set url (v) { this._url = v || ''; this.setAttribute('url', this._url) }
  get url () { return this._url }
  set text (v) { this._text = v || ''; if (v != null) this.setAttribute('text', v) }
  get text () { return this._text }
  set open (v) { if (v) this.setAttribute('open', ''); else this.removeAttribute('open') }
  get open () { return this._isOpen }

  /** Controlador opcional de createNotifications(...): habilita el toggle "avísame cuando lo abran". */
  set notifications (c) { this._notifications = c || null; this._render() }
  get notifications () { return this._notifications }

  get _isOpen () { return this.hasAttribute('open') }
  get _category () { return this.getAttribute('category') || 'shareOpened' }
  get _lang () { return (this.getAttribute('lang') || 'es').toLowerCase().startsWith('en') ? 'en' : 'es' }
  get _t () { return I18N[this._lang] }
  get _shareText () { return this._text || this.getAttribute('text') || this._t.text }

  async _genQR () {
    const url = this._url
    if (!url) { this._qr = ''; return }
    try {
      const data = await QRCode.toDataURL(url, { margin: 1, width: 320, errorCorrectionLevel: 'M' })
      if (url === this._url) { this._qr = data; this._render() }
    } catch (_) { this._qr = ''; this._render() }
  }

  _close () { this.removeAttribute('open'); this.dispatchEvent(new CustomEvent('cc-share-close', { bubbles: true, composed: true })) }

  // Avisa al llamador que el usuario efectivamente compartió (copiar/red/nativo).
  // Permite a la app registrar el seguimiento del contenido compartido.
  _emitShared (method) {
    this.dispatchEvent(new CustomEvent('cc-share-shared', {
      detail: { url: this._url, method }, bubbles: true, composed: true,
    }))
  }

  async _copy () {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(this._url)
      else this._copyFallback(this._url)
      this._copied = true; this._render()
      setTimeout(() => { this._copied = false; this._render() }, 1800)
    } catch (_) { this._copyFallback(this._url) }
    this._emitShared('copy')
  }

  _copyFallback (text) {
    try {
      const ta = document.createElement('textarea')
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0'
      this.shadowRoot.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
    } catch (_) { /* sin portapapeles */ }
  }

  _openWin (href) { window.open(href, '_blank', 'noopener') }
  _shareTo (key) {
    const u = encodeURIComponent(this._url)
    const text = encodeURIComponent(this._shareText)
    if (key === 'wa') this._openWin(`https://wa.me/?text=${text}%20${u}`)
    else if (key === 'tg') this._openWin(`https://t.me/share/url?url=${u}&text=${text}`)
    else if (key === 'x') this._openWin(`https://twitter.com/intent/tweet?text=${text}&url=${u}`)
    else if (key === 'fb') this._openWin(`https://www.facebook.com/sharer/sharer.php?u=${u}`)
    else if (key === 'more') { this._shareNative(); return }
    this._emitShared(key)
  }
  async _shareNative () {
    if (typeof navigator.share === 'function') {
      try { await navigator.share({ title: this._shareText, text: this._shareText, url: this._url }); this._emitShared('native') } catch (_) {}
    } else { this._copy() }
  }

  // Toggle "avísame cuando lo abran": activa/desactiva la categoría en el
  // controlador de notificaciones. Al encender, pide permiso del navegador.
  async _toggleTrack () {
    const c = this._notifications
    if (!c) return
    const cat = this._category
    const turnOn = c.get(cat) === false || c.get(cat) == null
    if (turnOn && typeof c.requestPermission === 'function') { try { await c.requestPermission() } catch (_) {} }
    if (typeof c.set === 'function') c.set(cat, turnOn)
    this._render()
  }

  _render () {
    const root = this.shadowRoot
    if (!this._isOpen) { root.innerHTML = '' ; return }
    const t = this._t
    const heading = this.getAttribute('heading') || t.heading
    const hint = this.getAttribute('hint') || t.hint
    const showTrack = this.hasAttribute('track') && this._notifications
    const trackOn = showTrack && this._notifications.get(this._category) !== false
    const trackRow = showTrack ? `
          <div class="track">
            <div class="track-text">
              <div class="track-label">${t.track}</div>
              <div class="track-hint">${t.trackHint}</div>
            </div>
            <button class="switch${trackOn ? ' on' : ''}" data-act="track" role="switch" aria-checked="${trackOn ? 'true' : 'false'}" aria-label="${t.track}"><span class="knob"></span></button>
          </div>` : ''
    root.innerHTML = `
      <style>${CSS}</style>
      <div class="overlay" part="overlay">
        <div class="modal" part="modal">
          <button class="close" data-act="close" aria-label="${t.close}">&times;</button>
          <h3>${heading}</h3>
          <p class="hint">${hint}</p>
          ${this._qr ? `<img class="qr" src="${this._qr}" alt="QR" />` : '<span class="qr-ph"></span>'}
          <div class="url-row">
            <input type="text" readonly value="${(this._url || '').replace(/"/g, '&quot;')}" data-act="select" />
            <button class="copy" data-act="copy">${this._copied ? t.copied : t.copy}</button>
          </div>
          <div class="social" role="group">
            <button class="ico wa" data-share="wa" title="${t.wa}" aria-label="${t.wa}"><svg viewBox="0 0 24 24">${SVG.wa}</svg></button>
            <button class="ico tg" data-share="tg" title="${t.tg}" aria-label="${t.tg}"><svg viewBox="0 0 24 24">${SVG.tg}</svg></button>
            <button class="ico x"  data-share="x"  title="${t.x}"  aria-label="${t.x}"><svg viewBox="0 0 24 24">${SVG.x}</svg></button>
            <button class="ico fb" data-share="fb" title="${t.fb}" aria-label="${t.fb}"><svg viewBox="0 0 24 24">${SVG.fb}</svg></button>
            <button class="ico ig" data-share="more" title="${t.more}" aria-label="${t.more}"><svg viewBox="0 0 24 24">${SVG.more}</svg></button>
          </div>
          <!-- acciones extra del llamador (p. ej. Imprimir / PDF). Vacío => nada. -->
          <div class="ext-actions" part="actions"><slot name="actions"></slot></div>
          ${trackRow}
        </div>
      </div>`
    root.querySelector('.overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) this._close() })
    root.querySelector('[data-act="close"]').addEventListener('click', () => this._close())
    root.querySelector('[data-act="copy"]').addEventListener('click', () => this._copy())
    const inp = root.querySelector('[data-act="select"]'); inp.addEventListener('focus', () => inp.select())
    root.querySelectorAll('[data-share]').forEach(b => b.addEventListener('click', () => this._shareTo(b.getAttribute('data-share'))))
    const trackBtn = root.querySelector('[data-act="track"]'); if (trackBtn) trackBtn.addEventListener('click', () => this._toggleTrack())
  }
}

if (typeof customElements !== 'undefined' && !customElements.get('dotrino-share')) {
  customElements.define('dotrino-share', DotrinoShare)
}

export { DotrinoShare }
