# @dotrino/share

> **Parte del ecosistema [Dotrino](https://dotrino.com).** Dotrino es un ecosistema de aplicaciones centradas en la privacidad de los datos: tu información es tuya, y las decisiones sobre ella también — qué compartes, con quién, cuándo y por qué. Sin anuncios, sin cookies, sin rastreo de datos, sin vender tu identidad a nadie.

UI compartida del ecosistema **Dotrino** para **compartir un enlace**. Web
Component `<dotrino-share>` (custom element, Shadow DOM) reutilizable por
cualquier app (Vue o vanilla): el **mismo** modal de compartir para pronosticador,
ajedrez, cuarenta, etc.

Muestra **QR** (autohosteado, generado en el cliente — sin servicios de terceros),
el **enlace** con botón de copiar, y botones de **redes** (WhatsApp, Telegram, X,
Facebook) + "Más" (Web Share API nativa).

Autohosteado, Shadow DOM, **sin JS de terceros ni cookies**, bilingüe es/en. No
toca identidad/transporte/almacenamiento: solo recibe una URL ya armada (los datos
de usuario viajan por `#fragment`, que no llega al servidor ni es indexable).

## Uso

```js
import '@dotrino/share'
```

```html
<dotrino-share lang="es"></dotrino-share>
```

```js
const el = document.querySelector('dotrino-share')
el.url = 'https://cuarenta.dotrino.com/#table=ABC'
el.text = '¡Únete a mi mesa!'
el.open = true
el.addEventListener('cc-share-close', () => { el.open = false })
```

### Atributos / propiedades
- `url` — el enlace a compartir / del QR.
- `text` — texto corto para las redes.
- `lang` — `es` | `en`.
- `heading`, `hint` — textos opcionales.
- `open` — booleano: muestra/oculta el modal.
- `track` — booleano: muestra el toggle "avísame cuando lo abran" (requiere
  inyectar `.notifications`).
- `category` — categoría de prefs que togglea ese switch (default `shareOpened`).

### Propiedad JS
- `.notifications` — controlador de `createNotifications(...)` de
  `@dotrino/notifications`. Si se inyecta y está el atributo
  `track`, el modal muestra el toggle de seguimiento (enciende la categoría +
  pide permiso de notificaciones).

### Eventos
- `cc-share-close` — al cerrar el modal.
- `cc-share-shared` — al compartir; `detail { url, method }` con
  `method` ∈ `copy|wa|tg|x|fb|native`. Útil para que la app registre el
  seguimiento del contenido compartido.

### Acuses de apertura (ligado a notificaciones)
El "atado" con notificaciones se completa con `createShareReceipts(...)` de
`@dotrino/notifications`: el que **abre** un enlace firmado
manda el acuse (`receipts.report`), y el **autor** lo recibe como notificación
(`receipts.start`). Este componente aporta el opt-in (`track` + `.notifications`)
y el evento `cc-share-shared`. Ver el README de notificaciones.

### Tema (variables CSS)
`--ccs-bg`, `--ccs-text`, `--ccs-muted`, `--ccs-border`, `--ccs-accent`,
`--ccs-accent-text`, `--ccs-input-bg`, `--ccs-overlay`, `--ccs-radius`, `--ccs-shadow`.

### Slot de acciones extra
`<dotrino-share>` admite botones adicionales del llamador via `slot="actions"` (p. ej. Imprimir / PDF):
```html
<dotrino-share :url=... :open=...>
  <div slot="actions"><button @click=...>🖨 Imprimir</button></div>
</dotrino-share>
```
