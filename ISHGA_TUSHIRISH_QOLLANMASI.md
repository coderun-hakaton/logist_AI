# Karvonboshi — Ishga tushirish qo'llanmasi

Bu hujjat loyihani mahalliy kompyuterda ishga tushirish, o'zgartirish kiritish va
hosting (Supabase + Netlify)'ga qayta deploy qilish bo'yicha qo'llanma.

---

## 1. Loyiha haqida

- **Texnologiyalar:** Next.js 13 (App Router) + TypeScript + Tailwind CSS + shadcn/ui
- **Backend:** Supabase (PostgreSQL + Auth + Row Level Security) — alohida server kodi yo'q,
  butun ma'lumotlar bazasi va autentifikatsiya Supabase orqali boshqariladi.
- **Hosting:** Netlify (frontend), Supabase (backend, allaqachon bulutda ishlaydi)

```
app/            → sahifalar (dashboard, login, signup va h.k.)
components/     → qayta ishlatiladigan UI qismlari (ai-chatbot, auth-provider va h.k.)
lib/            → yordamchi funksiyalar (supabase.ts, route-optimizer.ts, uzbekistan-data.ts)
types/          → TypeScript tur ta'riflari (database.ts)
supabase/migrations/ → ma'lumotlar bazasi sxemasi (SQL)
netlify.toml    → Netlify build sozlamalari
```

---

## 2. Mahalliy kompyuterda ishga tushirish

### Talablar
- Node.js 18 yoki undan yuqori versiya
- npm

### Qadamlar

```bash
# 1. Repozitoriyani yuklab oling (yoki shu zip'ni oching)
cd Karvonboshi

# 2. Paketlarni o'rnating
npm install

# 3. .env.local faylini yarating (loyiha ildizida) va quyidagini kiriting:
```

`.env.local` fayli:
```
NEXT_PUBLIC_SUPABASE_URL=https://mcpxwefpdjedzunvniuf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1jcHh3ZWZwZGplZHp1bnZuaXVmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODExOTg3MTUsImV4cCI6MjA5Njc3NDcxNX0.3OWTK1UokB8LdkpUvje2TM42ySnPp9JmdkGb_WenyD4
```

```bash
# 4. Dasturni ishga tushiring
npm run dev

# 5. Brauzerda oching
http://localhost:3000
```

---

## 3. Backend (Supabase) — allaqachon tayyor

Loyiha uchun Supabase loyihasi allaqachon yaratilgan va sozlangan:

- **Loyiha URL:** `https://mcpxwefpdjedzunvniuf.supabase.co`
- **Dashboard:** https://supabase.com/dashboard/project/mcpxwefpdjedzunvniuf
- **Jadvallar:** `profiles`, `vehicles`, `orders`, `routes`, `rest_stops`, `feedback`
- Barcha jadvallarda **Row Level Security (RLS)** yoqilgan — foydalanuvchilar faqat
  o'zlariga tegishli ma'lumotlarni ko'radi/o'zgartiradi.
- Ro'yxatdan o'tganda profil avtomatik yaratiladi (`handle_new_user` trigger orqali).

### Email tasdiqlash haqida
Supabase'da **"Confirm email"** sozlamasi yoqilgan bo'lishi mumkin — bunda foydalanuvchi
ro'yxatdan o'tgach, emailidagi havolani bosmaguncha tizimga kira olmaydi. Frontend kodi
buni to'g'ri boshqaradi: agar tasdiqlash kerak bo'lsa, "Emailingizni tasdiqlang" ekrani
ko'rsatiladi (dashboard'ga majburan yo'naltirilmaydi).

Buni yoqish/o'chirish: **Supabase Dashboard → Authentication → Sign In / Providers → Email
→ "Confirm email"**

### Ma'lumotlar bazasini o'zgartirish kerak bo'lsa
Yangi SQL migratsiya faylini `supabase/migrations/` papkasiga qo'shing va uni
Supabase Dashboard → SQL Editor orqali ishga tushiring (yoki Supabase CLI:
`supabase db push`).

---

## 4. Frontend (Netlify) — allaqachon ulangan

- **Sayt:** https://karvonboshi.netlify.app
- **Netlify boshqaruv paneli:** https://app.netlify.com/projects/karvonboshi
- GitHub repozitoriyasi bilan ulangan: `main` branch'ga har safar `git push` qilinganda,
  Netlify **avtomatik ravishda** yangi versiyani build qilib, saytga chiqaradi.
- Kerakli environment variable'lar (`NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_ANON_KEY`) Netlify sozlamalarida allaqachon kiritilgan.

### Yangi o'zgarish qilinganda nima qilish kerak?
```bash
git add .
git commit -m "O'zgarish tavsifi"
git push origin main
```
Shundan so'ng Netlify avtomatik build boshlaydi. Holatini shu yerdan kuzatishingiz mumkin:
https://app.netlify.com/projects/karvonboshi/deploys

---

## 5. Xavfsizlik bo'yicha muhim eslatmalar

- **GitHub Personal Access Token**'ni hech qachon chatda, kodda yoki ochiq joyda
  ulashmang. Agar tasodifan ulashib qo'ysangiz, uni darhol
  **GitHub → Settings → Developer settings → Personal access tokens** orqali
  **Revoke** qiling.
- Token yaratganda faqat kerakli repozitoriyaga (**Fine-grained token**, faqat
  `Contents: Read and write`) ruxsat bering — hech qachon to'liq/klassik
  (`ghp_...`, keng ruxsatli) token ishlatmang.
- `NEXT_PUBLIC_...` bilan boshlanuvchi Supabase kalitlari brauzerga ochiq bo'ladi —
  bu normal holat (RLS ma'lumotlarni himoya qiladi), lekin Supabase'ning
  **service_role** kaliti hech qachon frontendga yoki ochiq joyga qo'yilmasligi kerak.

---

## 6. Tez-tez uchraydigan muammolar

| Muammo | Yechim |
|---|---|
| `npm run dev` ishga tushmayapti | Node.js versiyasini tekshiring (`node -v`, 18+ kerak), `npm install` qayta bajaring |
| Login/signup ishlamayapti | `.env.local` faylida Supabase URL/key to'g'ri ekanini tekshiring |
| Dashboard bo'sh ko'rinadi | Bu normal — hali buyurtma/transport qo'shilmagan, RLS tufayli faqat o'zingizga tegishli ma'lumot ko'rinadi |
| Netlify build xato beradi | https://app.netlify.com/projects/karvonboshi/deploys dagi log'ni oching, xato matnini ko'rib chiqing |
