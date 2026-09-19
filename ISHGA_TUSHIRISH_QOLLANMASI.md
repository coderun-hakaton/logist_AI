# Karvonboshi — Ishga tushirish qo'llanmasi

Bu hujjat loyihani mahalliy kompyuterda ishga tushirish, o'zgartirish kiritish va
hosting'ga qayta deploy qilish bo'yicha to'liq qo'llanma.

---

## 1. Loyiha haqida

**Karvonboshi** — O'zbekiston logistikasi uchun AI asosidagi marshrut
optimallashtirish platformasi. Marshrutlar **7 faktor** bo'yicha baholanadi:
xavfsizlik, yo'l sifati, tezlik, xarajat, qulaylik, ishonchlilik, ovqat va dam olish.

**Interfeys to'liq o'zbek tilida (lotin yozuvi).**

### Texnologiyalar

- **Frontend:** Next.js 13 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Auth va asosiy baza:** Supabase (PostgreSQL + Auth + Row Level Security)
- **Yordamchi backend:** FastAPI (Python) + MongoDB — AI chat va haydovchi arizalari
- **AI:** Emergent LLM kaliti orqali OpenAI `gpt-5.4` (javoblar oqim bilan keladi)
- **Xaritalar:** o'zi yozilgan SVG xarita (marshrutlar) + **Mapbox GL JS** (haydovchilar)
- **Grafiklar:** recharts

```
app/                    → sahifalar
  page.tsx              → landing
  login/  signup/       → autentifikatsiya
  driver-apply/         → OCHIQ haydovchi ariza formasi
  dashboard/
    page.tsx            → boshqaruv paneli
    routes/             → marshrut optimizatori
    orders/             → buyurtmalar (CRUD)
    fleet/              → avtopark
    drivers/            → haydovchilar + Mapbox xarita (admin/dispatcher)
    analytics/          → tahlil va grafiklar
    settings/           → profil va parol
components/             → UI komponentlar
  ai-chatbot.tsx        → AI yordamchi (backendga ulangan)
  drivers-mapbox.tsx    → Mapbox xarita komponenti
  uzbekistan-map.tsx    → SVG marshrut xaritasi
lib/                    → yordamchi kod
  supabase.ts           → Supabase klienti
  api.ts                → FastAPI backend bilan ishlash (tipli)
  route-optimizer.ts    → 7-faktor optimallashtirish algoritmi
  uzbekistan-data.ts    → shaharlar, magistrallar, xavfli hududlar
  order-labels.ts       → o'zbekcha holat/tur nomlari
  driver-onboarding.ts  → haydovchi akkaunt yaratish yordamchilari
backend/                → FastAPI
  server.py             → asosiy ilova (api_router)
  routers/chat.py       → AI chat (SSE)
  routers/driver_applications.py → arizalar CRUD
types/database.ts       → TypeScript tur ta'riflari
supabase/migrations/    → SQL sxema
memory/SPEC.md          → to'liq spetsifikatsiya
memory/test_credentials.md → test hisoblar
```

---

## 2. Mahalliy kompyuterda ishga tushirish

### Talablar
- Node.js 18+
- Python 3.11+
- MongoDB (mahalliy yoki bulutda)

### Frontend

```bash
npm install
```

Loyiha ildizida `.env.local` faylini yarating:

```
NEXT_PUBLIC_SUPABASE_URL=https://mcpxwefpdjedzunvniuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon kalit>
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=<mapbox pk.* tokeni>
```

```bash
npm run dev      # http://localhost:3000
npm run typecheck
```

### Backend (AI chat + haydovchi arizalari)

```bash
cd backend
pip install -r requirements.txt
```

`backend/.env` faylini yarating:

```
EMERGENT_LLM_KEY=<kalit>
MONGO_URL=mongodb://localhost:27017
DB_NAME=karvonboshi
CORS_ORIGINS=*
```

```bash
uvicorn server:app --host 0.0.0.0 --port 8001 --reload
```

Frontend `/api/*` so'rovlarini `next.config.js` dagi `rewrites` orqali
avtomatik `127.0.0.1:8001` ga uzatadi — qo'shimcha sozlash kerak emas.

---

## 3. ⚠️ MUHIM: "Confirm email" sozlamasi

Hozir Supabase'da **"Confirm email" YOQILGAN**. Bu degani:

- Yangi ro'yxatdan o'tgan foydalanuvchi email'dagi havolani bosmaguncha kira olmaydi
- **Tasdiqlangan haydovchilar ham tizimga kira olmaydi**

### O'chirish (tavsiya etiladi)

**Supabase Dashboard → Authentication → Sign In / Providers → Email →
"Confirm email" → OFF**

Shundan keyin:
- `admin@karvonboshi.uz` / `Karvon2026!` hisobi darhol ishlaydi
- Tasdiqlangan haydovchilar o'z telefon+paroli bilan kiradi

---

## 4. Backend (Supabase) — tayyor

- **Loyiha URL:** `https://mcpxwefpdjedzunvniuf.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/mcpxwefpdjedzunvniuf
- **Jadvallar:** `profiles`, `vehicles`, `orders`, `routes`, `rest_stops`, `feedback`
- Barcha jadvallarda **RLS** yoqilgan — foydalanuvchi faqat o'ziga tegishli
  ma'lumotni ko'radi (admin/dispatcher hammasini ko'radi)
- Ro'yxatdan o'tganda profil `handle_new_user` trigger orqali avtomatik yaratiladi

### Ixtiyoriy SQL migratsiya

`supabase/migrations/20260919120000_driver_applications.sql` faylida:

1. `driver_applications` jadvali (arizalarni Supabase'da saqlash uchun)
2. `vehicles.brand` ustuni (transport modelini saqlash uchun)
3. `driver-docs` Storage bucket (guvohnoma/tex pasport nusxalari uchun)

**Bu majburiy emas** — hozirda arizalar FastAPI backend + MongoDB'da saqlanadi
va to'liq ishlaydi. SQL'ni ishga tushirish uchun:
Supabase Dashboard → SQL Editor → fayl mazmunini qo'yib "Run".

> Ishga tushirgandan keyin: transport modeli (`brand`) saqlanadigan bo'ladi va
> hujjat fayllari yuklanadi. Arizalarni Supabase'ga ko'chirish uchun kodda
> `lib/api.ts` chaqiruvlarini Supabase so'rovlariga o'zgartirish kerak bo'ladi.

---

## 5. Haydovchi onboarding oqimi

1. Haydovchi `/driver-apply` sahifasida ariza to'ldiradi — telefon raqami va
   o'zi tanlagan parol bilan
2. Ariza `pending` holatda backendga tushadi
3. Admin yoki dispetcher `/dashboard/drivers` → **"Kutilmoqda"** tab'ida ko'radi
4. **Tasdiqlash** tugmasi → Supabase'da haydovchi akkaunti yaratiladi:
   - email: `{telefon raqamlari}@drivers.karvonboshi.uz`
   - rol: `driver`
   - parol: ariza topshirganda kiritilgan parol
5. Haydovchi `/login` orqali shu email + parol bilan kiradi

Admin sessiyasi buzilmasligi uchun akkaunt alohida (sessiyasiz) Supabase
klienti orqali yaratiladi — `lib/driver-onboarding.ts`.

---

## 6. Test hisoblar

| Rol | Email | Parol |
|---|---|---|
| Admin | `admin@karvonboshi.uz` | `Karvon2026!` |

Batafsil: `memory/test_credentials.md`

---

## 7. Deploy

### Netlify (frontend)

Diqqat: loyihada endi **Python backend** ham bor. Netlify faqat frontend'ni
xizmat qiladi — AI chat va haydovchi arizalari ishlashi uchun backend'ni
alohida joyda (Railway, Render, Fly.io va h.k.) joylashtirib, `next.config.js`
dagi `rewrites` manzilini shu backend URL'iga o'zgartirish kerak:

```js
destination: 'https://sizning-backend.onrender.com/api/:path*'
```

Netlify environment variable'lari:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
```

```bash
git add .
git commit -m "O'zgarish tavsifi"
git push origin main
```

---

## 8. Xavfsizlik eslatmalari

- **GitHub Personal Access Token**'ni hech qachon chatda yoki kodda ulashmang.
  Tasodifan ulashsangiz — darhol **Revoke** qiling.
- `NEXT_PUBLIC_...` bilan boshlanuvchi kalitlar brauzerga ochiq bo'ladi — bu
  normal (Supabase'ni RLS himoya qiladi, Mapbox `pk.*` tokeni ommaviy).
- Supabase'ning **service_role** kaliti va Mapbox `sk.*` tokeni **hech qachon**
  frontend'ga qo'yilmasligi kerak.
- Mapbox tokeniga Mapbox Console'da domen cheklovi qo'yish tavsiya etiladi.
- `EMERGENT_LLM_KEY` faqat `backend/.env` da — brauzerga chiqmaydi.

---

## 9. Tez-tez uchraydigan muammolar

| Muammo | Yechim |
|---|---|
| Login ishlamaydi, `email_not_confirmed` | 3-bo'limga qarang — "Confirm email"ni o'chiring |
| AI chatbot javob bermaydi | Backend ishlayotganini tekshiring: `curl localhost:8001/api/health` |
| Xarita bo'sh / kulrang | `.env.local` da `NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN` borligini va `npm run dev` qayta ishga tushganini tekshiring |
| Transport modeli saqlanmaydi | `vehicles.brand` ustuni yo'q — 4-bo'limdagi SQL'ni ishga tushiring |
| Hujjat fayllari yuklanmaydi | `driver-docs` bucket yo'q — 4-bo'limdagi SQL'ni ishga tushiring |
| Dashboard bo'sh | Normal — hali buyurtma/transport qo'shilmagan |
| `npm run dev` ishlamaydi | `node -v` (18+ kerak), `npm install` qayta bajaring |
