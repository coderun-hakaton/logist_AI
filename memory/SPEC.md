# Karvonboshi — Loyiha spetsifikatsiyasi

## Nima qiladi

O'zbekiston logistikasi uchun AI asosidagi marshrut optimallashtirish platformasi.
Yuk tashish marshrutlari **7 faktor** bo'yicha (0–10 ball) baholanadi: xavfsizlik,
yo'l sifati, tezlik, xarajat, qulaylik, ishonchlilik, ovqat va dam olish.

**Interfeys tili: to'liq o'zbek (lotin yozuvi).**

## Texnologiyalar

| Qatlam | Texnologiya |
|---|---|
| Frontend | Next.js 13.5 (App Router), React 18, TypeScript (strict), Tailwind CSS, shadcn/ui |
| Auth + asosiy DB | Supabase (PostgreSQL + Auth + RLS) — bulutda: `mcpxwefpdjedzunvniuf.supabase.co` |
| Yordamchi backend | FastAPI (`/app/backend`, port 8001) + MongoDB — AI chat va haydovchi arizalari |
| AI | Emergent LLM universal key → OpenAI `gpt-5.4` (SSE streaming) |
| Xarita | Ikki xil: o'zi yozilgan SVG xarita (marshrutlar) + **Mapbox GL JS** (haydovchilar) |
| Charts | recharts |

`/api/*` so'rovlari Next.js `rewrites` orqali `127.0.0.1:8001` ga uzatiladi
(`next.config.js`).

## Ma'lumotlar modeli

### Supabase (PostgreSQL, RLS yoqilgan)
- **profiles** — `id`(auth.users FK), email, name, role, phone, company, avatar_url
  - rollar: `admin` | `dispatcher` | `driver` | `customer`
  - ro'yxatdan o'tganda `handle_new_user` trigger orqali avtomatik yaratiladi
- **vehicles** — owner_id, type, capacity, license_plate, fuel_type, fuel_consumption,
  status (`available`/`on_route`/`maintenance`/`offline`), current_lat/lng
  - ⚠️ `brand` ustuni bulutdagi bazada **hozircha yo'q** — kod ustun bo'lmasa ham
    ishlaydi (insert xatolik bersa, brand'siz qayta urinadi)
- **orders** — order_number (`KB-XXXXXX`), customer_id, driver_id, vehicle_id,
  cargo_type/weight, origin/destination (address + lat/lng), pickup_date,
  delivery_deadline, estimated_cost, status
  - status: `pending` → `assigned` → `in_transit` → `delivered` (+ `cancelled`, `delayed`)
- **routes**, **rest_stops**, **feedback** — sxemada mavjud

### MongoDB (FastAPI backend)
- **driver_applications** — haydovchi arizalari (ochiq `/driver-apply` formasi)
  - first_name, last_name, phone, password, city, experience_years, has_vehicle,
    car_brand, car_plate, capacity_kg, license_categories, hujjat URL'lari,
    status (`pending`/`approved`/`rejected`), driver_id, reviewed_by, rejection_reason
- **chat_messages** — AI chat tarixi (`session_id` bo'yicha)

> Arizalar ataylab Supabase'da emas — bulutdagi bazada DDL huquqi yo'q (anon kalit).
> Supabase'ga ko'chirish uchun SQL tayyor: `supabase/migrations/20260919120000_driver_applications.sql`

## Backend API (barchasi `/api` prefiksida, `api_router`da)

| Metod | Yo'l | Vazifa |
|---|---|---|
| GET | `/api/health` | Servis holati |
| POST | `/api/chat` | AI chat (SSE stream, `{session_id, message}`) |
| POST | `/api/driver-applications` | Yangi ariza (201; dublikat telefon → 409) |
| GET | `/api/driver-applications` | Arizalar ro'yxati (`?status=` filtri) |
| GET | `/api/driver-applications/{id}` | Bitta ariza (topilmasa 404) |
| PATCH | `/api/driver-applications/{id}` | Tasdiqlash / rad etish |

## Sahifalar va oqimlar

### Ommaviy
- `/` — landing: hero, 7 faktor, xususiyatlar, "qanday ishlaydi", CTA
- `/driver-apply` — **haydovchi arizasi** (3 bo'limli forma: shaxsiy, transport, hujjatlar)
  → backendga yuboriladi → muvaffaqiyat ekrani
- `/login`, `/signup` — Supabase auth (signup'da 4 rol tanlanadi)

### Dashboard (`/dashboard/*`, auth talab qiladi)- **`/dashboard`** — statistika kartalari, SVG marshrut xaritasi, avtopark holati, oxirgi buyurtmalar
- **`/dashboard/routes`** — marshrut optimizatori: shahar tanlash, yuk/transport turi,
  7 prioritet slayderi → asosiy marshrut + 2 alternativa, ball tahlili, dam olish
  maskanlari, ogohlantirishlar, AI xulosa
- **`/dashboard/orders`** — buyurtmalar CRUD: yaratish dialogi (avtomatik narx hisobi
  bilan), holat o'zgartirish, o'chirish, qidiruv + tab filtrlar, mobil kartalar
- **`/dashboard/fleet`** — avtopark: transport qo'shish dialogi, holat o'zgartirish, o'chirish
- **`/dashboard/drivers`** *(faqat admin/dispatcher)* — 4 tab:
  Kutilmoqda (tasdiqlash/rad etish) · Ro'yxat · Rad etilgan · **Xarita (Mapbox)**
- **`/dashboard/analytics`** — recharts: holat donut, oylik xarajat, viloyat hajmi + KPI
- **`/dashboard/settings`** — profil tahrirlash, parol o'zgartirish

### Haydovchi kabineti (`/driver`, faqat kirgan foydalanuvchi)

Mobil uchun mo'ljallangan alohida panel (sidebar yo'q, faqat yuqori panel):

- **Statistika:** faol reyslar, yetkazilgan reyslar, bosib o'tilgan km, umumiy daromad
- **Reyslar ro'yxati:** faqat `orders.driver_id = auth.uid()` bo'lgan buyurtmalar
  (RLS `orders_select_participants` shuni ta'minlaydi)
- **Filtrlar:** Faol / Yetkazilgan / Barchasi
- **Holat o'zgartirish (2 qadam):**
  - `assigned` → **«Yo'lga chiqdim»** → `in_transit`
  - `in_transit` → **«Yetkazildi»** → `delivered` (+ `actual_arrival` yoziladi)
  - RLS `orders_update_participants` haydovchiga o'z buyurtmasini yangilashga ruxsat beradi
- **Marshrut xaritasi:** har bir reys kartasida «Marshrutni ko'rish» → Mapbox'da
  jo'nash (yashil) va yetkazish (qizil) nuqtalari + punktir chiziq (`components/trip-mapbox.tsx`)
- **Eslatmalar:** buyurtma `notes` maydoni sariq ogohlantirish sifatida ko'rsatiladi

**Yo'naltirish:** `driver` roli bilan kirgan foydalanuvchi `/login` dan to'g'ridan-to'g'ri
`/driver` ga tushadi; `/dashboard` ga kirsa ham avtomatik `/driver` ga qaytariladi.
Admin/dispatcher sidebar'dagi «Haydovchi kabineti» havolasi orqali kabinetni ko'rib turishi mumkin.

### AI chatbot
Dashboard yuqori panelidagi robot tugmasi → suzuvchi panel.
Backend `/api/chat` orqali `gpt-5.4`, javoblar token-token (SSE) keladi,
tarix MongoDB'da `session_id` bo'yicha saqlanadi. Tizim promptida O'zbekiston
magistrallari, yoqilg'i narxi, dam olish maskanlari va 7-faktor metodikasi bor.

## Haydovchi onboarding oqimi

1. Haydovchi `/driver-apply` da ariza to'ldiradi (telefon + parol o'zi tanlaydi)
2. Ariza MongoDB'ga `pending` holatda tushadi
3. Admin/dispatcher `/dashboard/drivers` → "Kutilmoqda" tab'da ko'radi
4. **Tasdiqlash** → alohida (sessiyani buzmaydigan) Supabase klient bilan auth
   akkaunt yaratiladi: email = `{raqamlar}@drivers.karvonboshi.uz`, rol = `driver`.
   Ariza `approved` bo'ladi, parol bazadan o'chiriladi
5. Haydovchi shu email + o'z paroli bilan `/login` orqali kiradi → **`/driver` kabinetiga tushadi**

Tasdiqlashdan keyin admin ekranida **kirish ma'lumotlari dialogi** chiqadi
(login email + nusxalash tugmasi) — admin uni haydovchiga yetkazadi.
SMS yuborish qo'shilmagan (foydalanuvchi so'roviga ko'ra).

## Auth va rollar

- Supabase email+parol. Rol `profiles.role` da.
- `admin` / `dispatcher` — hamma narsaga ruxsat, haydovchilar sahifasi ko'rinadi
- `driver` / `customer` — haydovchilar sahifasi yashirin, RLS ma'lumotni cheklaydi
- ⚠️ **Muhim:** Supabase'da "Confirm email" YOQILGAN bo'lsa, yangi akkauntlar
  (shu jumladan tasdiqlangan haydovchilar) email havolasini bosmaguncha kira
  olmaydi. Yechim: Supabase Dashboard → Authentication → Sign In / Providers →
  Email → "Confirm email" OFF.

## Muhit o'zgaruvchilari

`/app/.env.local` (frontend):
```
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
```
`/app/backend/.env`:
```
EMERGENT_LLM_KEY, MONGO_URL, DB_NAME, CORS_ORIGINS
```

## Ishga tushirish

Supervisor bilan: `backend` (uvicorn :8001), `frontend` (next dev :3000, `directory=/app`),
`mongodb`. Qayta ishga tushirish: `sudo supervisorctl restart backend frontend`.

## Bajarilmagan / kelajakda

- `vehicles.brand` ustuni va `driver_applications` jadvali Supabase'ga ko'chirilmagan
  (SQL migratsiya fayllari tayyor, foydalanuvchi o'zi ishga tushirishi mumkin)
- Hujjat yuklash `driver-docs` Storage bucket'iga bog'langan — bucket yaratilmagan,
  shuning uchun fayllar yuklanmaydi (ariza hujjatsiz o'tadi, ogohlantirish chiqadi)
- Marshrut chiziqlari — shaharlar orasidagi to'g'ri chiziq (real yo'l geometriyasi emas)
