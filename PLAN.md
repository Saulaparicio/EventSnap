# PLAN — Plataforma de Fotografía para Eventos en Vivo

> Sistema tipo LivePic: invitados escanean QR → toman foto → se aplica watermark automático → aparece en slideshow en tiempo real en pantallas del evento.

---

## 1. Visión general del producto

| Aspecto | Descripción |
|---|---|
| Nombre sugerido | **EventSnap** (o el que prefieras) |
| Tipo | SaaS web multi-tenant |
| Modelo de uso | El organizador crea un evento → genera QR → los invitados lo escanean y suben fotos → se muestra en pantallas del salón |
| Usuarios | Organizadores de eventos (bodas, corporativos, quinceañeras, graduaciones) |
| Acceso invitado | Sin registro, solo URL con QR |

---

## 2. Módulos del sistema

```
┌─────────────────────────────────────────────────────────────┐
│                       EventSnap Platform                     │
│                                                             │
│  ┌────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │ Web App    │   │   Backend    │   │  Live Slideshow  │  │
│  │ (invitado) │   │   API REST   │   │  (pantallas TV)  │  │
│  └────────────┘   └──────────────┘   └──────────────────┘  │
│                                                             │
│  ┌────────────┐   ┌──────────────┐   ┌──────────────────┐  │
│  │ Panel      │   │  Watermark   │   │  Almacenamiento  │  │
│  │ Admin      │   │  Engine      │   │  Cloud (S3/CDN)  │  │
│  └────────────┘   └──────────────┘   └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.1 Web App del invitado (mobile-first)
- Acceso vía QR → URL del evento sin login
- Interfaz de cámara nativa en el browser (`getUserMedia`)
- Preview de la foto antes de enviar
- Confirmación visual de envío
- Link de descarga de su foto con watermark aplicado

### 2.2 Panel de administrador (organizador)
- Registro/login del organizador
- Crear evento: nombre, fecha, logo, colores del watermark
- Generar y descargar código QR del evento
- Vista de galería del evento en tiempo real
- Moderación: aprobar/rechazar fotos antes de que salgan en pantalla (opcional)
- Estadísticas: total de fotos, fotos por hora
- Descarga de galería completa (ZIP)
- Configuración del slideshow: velocidad, orden, transiciones

### 2.3 Backend / API REST
- Autenticación de organizadores (JWT)
- CRUD de eventos
- Recepción y validación de fotos subidas
- Aplicación de watermark (procesamiento en servidor)
- Push de fotos nuevas via WebSocket / SSE
- Generación de QR codes
- Control de moderación

### 2.4 Watermark Engine
- Recibe la foto original
- Superpone logo del evento (esquina configurable)
- Añade texto: nombre del evento, fecha, hashtag (opcional)
- Controla opacidad, tamaño y posición del watermark
- Devuelve foto procesada en WebP optimizado

### 2.5 Live Slideshow (pantallas del evento)
- URL pública: `tudominio.com/live/{evento-slug}`
- Se abre en cualquier browser de TV, proyector o monitor
- Recibe fotos nuevas en tiempo real sin recargar la página
- Transiciones animadas entre fotos
- Modo fullscreen automático
- Configurable: velocidad de paso, orden (cronológico o aleatorio)
- Soporte para red local (sin internet) si se despliega en servidor local

### 2.6 Almacenamiento y CDN
- Fotos originales → almacenadas para respaldo
- Fotos con watermark → servidas desde CDN para velocidad
- Miniaturas (thumbnails) → para la galería del admin
- Retención configurable por evento (ej. 30 días)

---

## 3. Stack tecnológico recomendado

### Frontend
| Capa | Tecnología | Razón |
|---|---|---|
| Framework | **Next.js 14** (App Router) | SSR, routing, API routes en un solo proyecto |
| UI | **Tailwind CSS** + shadcn/ui | Rapidez de desarrollo, componentes listos |
| Estado global | **Zustand** | Liviano, simple |
| Cámara | `getUserMedia` API nativa | Sin dependencias, funciona en iOS/Android |
| QR display | `qrcode.react` | Generación de QR en el cliente |
| WebSocket cliente | `socket.io-client` | Para recibir fotos en el slideshow en tiempo real |

### Backend
| Capa | Tecnología | Razón |
|---|---|---|
| Runtime | **Node.js 20 LTS** | Ecosistema maduro, mismo lenguaje que frontend |
| Framework | **Express.js** (o Next.js API routes) | Simple, rápido de implementar |
| Auth | **NextAuth.js** / JWT | Sesiones seguras para organizadores |
| WebSocket | **Socket.io** | Comunicación bidireccional en tiempo real |
| ORM | **Prisma** | Type-safe, migraciones fáciles |
| Base de datos | **PostgreSQL** (Supabase) | Relacional, confiable, hosted gratis |

### Procesamiento de imágenes
| Tarea | Tecnología | Razón |
|---|---|---|
| Watermark engine | **Sharp** (Node.js) | Muy rápido, sin dependencias nativas pesadas |
| Redimensionado | Sharp | Thumbnails automáticos |
| Formato de salida | WebP | 30% más liviano que JPEG |
| Cola de procesamiento | **Bull** + Redis | Procesar watermarks en background sin bloquear API |

### Almacenamiento
| Capa | Tecnología | Razón |
|---|---|---|
| Archivos/Fotos | **AWS S3** o **Cloudflare R2** | R2 sin costo de egress, ideal para fotos |
| CDN | **Cloudflare CDN** (integrado con R2) | Entrega rápida global |
| Base de datos | **Supabase PostgreSQL** | Hosted, gratuito hasta cierto volumen |
| Cache / Cola | **Redis** (Upstash) | Para Bull queue y cache de sesiones |

### Infraestructura
| Componente | Plataforma | Plan inicial |
|---|---|---|
| Hosting app | **Vercel** | Free tier → Pro $20/mes |
| Base de datos | **Supabase** | Free → Pro $25/mes |
| Storage | **Cloudflare R2** | $0.015/GB/mes |
| Redis | **Upstash** | Free → Pay per use |
| Dominio | Cloudflare Registrar | ~$10/año |
| SSL | Automático en Vercel | Gratis |

**Costo estimado inicial: ~$0–$50/mes** dependiendo del volumen de eventos.

---

## 4. Modelo de datos (base de datos)

```sql
-- Organizador
Organization {
  id          UUID PK
  name        STRING
  email       STRING UNIQUE
  password    STRING (hashed)
  plan        ENUM (free, pro, business)
  created_at  TIMESTAMP
}

-- Evento
Event {
  id           UUID PK
  org_id       UUID FK → Organization
  name         STRING
  slug         STRING UNIQUE  -- usado en la URL del QR
  date         DATE
  status       ENUM (active, closed, archived)
  watermark_config JSON  -- { logo_url, position, opacity, text, color }
  slideshow_config JSON  -- { speed, order, transition, auto_approve }
  qr_code_url  STRING
  created_at   TIMESTAMP
}

-- Foto
Photo {
  id            UUID PK
  event_id      UUID FK → Event
  original_url  STRING  -- S3/R2 foto original
  watermarked_url STRING -- S3/R2 foto con watermark
  thumbnail_url STRING
  status        ENUM (pending, approved, rejected)
  uploaded_at   TIMESTAMP
  file_size     INTEGER
  width         INTEGER
  height        INTEGER
}
```

---

## 5. Flujos principales

### Flujo A — Invitado sube una foto

```
1. Invitado escanea QR con celular
2. Browser abre: tudominio.com/e/{slug}
3. App pide permiso de cámara
4. Invitado toma foto (o sube desde galería)
5. Preview de la foto → botón "Enviar"
6. POST /api/events/{slug}/photos con multipart/form-data
7. Backend guarda original en R2
8. Bull queue procesa watermark con Sharp
9. Foto procesada guardada en R2
10. Socket.io emite evento "new_photo" a todos los slideshow conectados
11. Slideshow muestra la foto nueva con transición
12. Invitado recibe link de descarga de su foto con watermark
```

### Flujo B — Organizador crea evento

```
1. Organizador hace login en /admin
2. Dashboard → "Nuevo evento"
3. Llena: nombre, fecha, logo, configuración watermark
4. Sistema genera slug único y QR code
5. Descarga QR en PNG/SVG para imprimir
6. Abre /live/{slug} en la TV del evento
7. Monitorea fotos entrantes en tiempo real
```

### Flujo C — Slideshow en pantalla

```
1. Organizador abre tudominio.com/live/{slug} en la TV
2. Navegador muestra pantalla fullscreen
3. Socket.io conectado al canal del evento
4. Cada vez que llega foto nueva → transición animada
5. Ciclo entre fotos aprobadas con intervalo configurado
6. Muestra nombre del evento y timestamp en cada foto
```

---

## 6. API Endpoints principales

```
# Públicos (invitados)
GET    /api/events/:slug          → info básica del evento
POST   /api/events/:slug/photos   → subir foto

# Privados (organizador autenticado)
POST   /api/auth/login
POST   /api/auth/register

GET    /api/events                → listar mis eventos
POST   /api/events                → crear evento
PUT    /api/events/:id            → editar evento
DELETE /api/events/:id            → eliminar evento

GET    /api/events/:id/photos     → fotos del evento (con filtros)
PUT    /api/events/:id/photos/:photoId → moderar foto (approve/reject)
DELETE /api/events/:id/photos/:photoId → eliminar foto

GET    /api/events/:id/qr         → generar/regenerar QR
GET    /api/events/:id/download   → ZIP con galería completa
GET    /api/events/:id/stats      → estadísticas del evento

# WebSocket eventos (Socket.io)
event: "new_photo"   → { photo: Photo }  → emitido a room del evento
event: "photo_approved" → moderación
event: "join_event"  → cliente se une al room del evento
```

---

## 7. Configuración del watermark

El organizador puede configurar por evento:

```json
{
  "logo_url": "https://cdn.../logo.png",
  "logo_position": "bottom-right",   // top-left, top-right, bottom-left, bottom-right, center
  "logo_size": 15,                    // % del ancho de la foto
  "logo_opacity": 0.8,
  "text": "Boda de Ana & Carlos · 21.06.2026",
  "text_position": "bottom-center",
  "text_color": "#FFFFFF",
  "text_size": 28,                    // px
  "text_font": "Montserrat",
  "background_bar": true,             // barra semitransparente detrás del texto
  "background_opacity": 0.4
}
```

---

## 8. Slideshow — características

- Fullscreen al hacer click / automático en TV
- Transiciones: fade, slide, zoom (seleccionable)
- Velocidad configurable: 3s / 5s / 10s por foto
- Orden: cronológico, aleatorio, más recientes primero
- Overlay con nombre del evento y logo (opcional)
- QR code del evento visible en esquina (para que otros invitados también suban fotos)
- Modo oscuro/fondo negro por defecto para TV
- Si no hay fotos aún: pantalla de espera animada con instrucciones

---

## 9. Seguridad

| Riesgo | Mitigación |
|---|---|
| Subida de contenido inapropiado | Moderación manual antes de publicar (modo seguro activado por defecto) + opción de IA moderation (AWS Rekognition) |
| Spam de fotos | Rate limiting por IP: máx 5 fotos cada 10 minutos |
| Acceso no autorizado al admin | JWT + refresh tokens, 2FA opcional |
| Fotos de otros eventos | Cada foto ligada al slug del evento, validada en backend |
| Abuso de almacenamiento | Límite configurable de fotos por evento según plan |
| Datos personales (GDPR) | Fotos eliminadas automáticamente tras retención (default 30 días) |

---

## 10. Estructura de carpetas del proyecto

```
eventsnap/
├── apps/
│   ├── web/                    # Next.js app principal
│   │   ├── app/
│   │   │   ├── (admin)/        # Panel organizador
│   │   │   │   ├── dashboard/
│   │   │   │   ├── events/
│   │   │   │   └── settings/
│   │   │   ├── e/[slug]/       # Web app invitado
│   │   │   ├── live/[slug]/    # Slideshow pantallas
│   │   │   └── api/            # API routes
│   │   ├── components/
│   │   │   ├── camera/
│   │   │   ├── slideshow/
│   │   │   ├── watermark-preview/
│   │   │   └── ui/
│   │   └── lib/
│   │       ├── db/             # Prisma client
│   │       ├── storage/        # R2/S3 helpers
│   │       ├── watermark/      # Sharp engine
│   │       └── socket/         # Socket.io setup
├── prisma/
│   └── schema.prisma
├── public/
├── .env.local
└── package.json
```

---

## 11. Variables de entorno necesarias

```env
# Base de datos
DATABASE_URL=postgresql://...

# Auth
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://tudominio.com

# Storage (Supabase o S3 compatible)
STORAGE_REGION=us-east-1
STORAGE_ENDPOINT=https://<project-id>.supabase.co/storage/v1/s3
STORAGE_ACCESS_KEY_ID=...
STORAGE_SECRET_ACCESS_KEY=...
STORAGE_BUCKET_NAME=eventsnap-photos
STORAGE_PUBLIC_URL=https://<project-id>.supabase.co/storage/v1/object/public/eventsnap-photos

# Redis (Upstash)
REDIS_URL=redis://...

# Email (para registro/notificaciones)
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
```

---

## 12. Fases de desarrollo

### Fase 1 — MVP (4–6 semanas)
- [ ] Setup del proyecto (Next.js, Prisma, Supabase, R2)
- [ ] Auth de organizadores (registro/login)
- [ ] CRUD de eventos
- [ ] Web app invitado: cámara + upload
- [ ] Watermark engine básico (logo + texto)
- [ ] Slideshow básico (polling cada 5s)
- [ ] Generación de QR

### Fase 2 — Tiempo real + calidad (2–3 semanas)
- [ ] Socket.io para push en tiempo real
- [ ] Cola de procesamiento con Bull + Redis
- [ ] Panel de moderación
- [ ] Configuración avanzada de watermark
- [ ] Transiciones del slideshow
- [ ] Link de descarga para invitados
- [ ] Descarga ZIP de galería completa

### Fase 3 — Producción + monetización (2–3 semanas)
- [ ] Planes de pago (Free / Pro / Business) con Stripe
- [ ] Límites por plan (fotos, eventos activos, retención)
- [ ] Email notifications
- [ ] Analytics del evento
- [ ] Moderación con IA (Rekognition)
- [ ] Modo offline / servidor local para eventos sin internet
- [ ] App móvil (React Native o PWA)

---

## 13. Costos estimados en producción

| Volumen | Storage (R2) | DB (Supabase) | Hosting (Vercel) | Redis | Total/mes |
|---|---|---|---|---|---|
| 0–5 eventos/mes | ~$0 | $0 (free) | $0 (free) | $0 (free) | **$0** |
| 20–50 eventos/mes | ~$5 | $25 (pro) | $20 (pro) | $0–5 | **~$50** |
| 100+ eventos/mes | ~$20 | $25 | $20 | $10 | **~$75** |

*Cada evento de 200 personas subiendo 2 fotos = ~400 fotos × ~2MB = ~800MB por evento*

---

## 14. Diferenciadores vs competencia (LivePic, etc.)

| Feature | LivePic | EventSnap (tu versión) |
|---|---|---|
| QR por evento | ✅ | ✅ |
| Watermark automático | ✅ | ✅ con configuración avanzada |
| Live slideshow | ✅ | ✅ |
| Moderación | Básica | ✅ manual + IA opcional |
| Servidor local (sin internet) | ❓ | ✅ Fase 3 |
| White-label (tu logo) | ❓ | ✅ plan Business |
| Descarga ZIP galería | ❓ | ✅ |
| Open source / self-hosted | ❌ | Opcional |
| Precio | Suscripción fija | Pay per event o suscripción |

---

*Documento generado como plan de arquitectura para desarrollo de plataforma EventSnap.*
*Próximo paso: implementar Fase 1 — MVP.*
