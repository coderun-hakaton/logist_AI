# Karvonboshi — test hisoblar

## Admin / dispatcher

| Maydon | Qiymat |
|---|---|
| Email | `admin@karvonboshi.uz` |
| Parol | `Karvon2026!` |
| Rol | `admin` |
| Ism | Akmal Karimov |

⚠️ **Holat:** akkaunt Supabase'da yaratilgan, lekin **"Confirm email" yoqilgan**
bo'lgani uchun tizimga kira olmaydi (`email_not_confirmed`).

**Yechim (foydalanuvchi bajaradi):**
Supabase Dashboard → Authentication → Sign In / Providers → Email →
**"Confirm email"** ni **OFF** qilish. Shundan keyin yuqoridagi hisob darhol ishlaydi.

Muqobil: shu email'ga kelgan tasdiqlash havolasini bosish.

## Haydovchi hisoblari

Haydovchilar alohida ro'yxatdan o'tmaydi — `/driver-apply` orqali ariza topshiradi,
admin tasdiqlaydi, so'ng quyidagi shaklda kiradi:

- **Email:** `{telefon raqamlari}@drivers.karvonboshi.uz`
  masalan `+998 90 308 50 68` → `998903085068@drivers.karvonboshi.uz`
- **Parol:** ariza topshirganda haydovchi o'zi kiritgan parol

### Test uchun topshirilgan arizalar (MongoDB, `pending`)

| Ism | Telefon | Parol | Transport |
|---|---|---|---|
| Rustam Karimov | +998 90 123 45 67 | `driver123` | MAN TGX / 01 A 777 AA |
| Bobur Toshmatov | +998 90 308 50 68 | `haydovchi123` | Isuzu NPR 75 / 01 A 555 BB |

Bu arizalarni `/dashboard/drivers` → "Kutilmoqda" tab'ida tasdiqlash yoki rad etish mumkin.

## Haydovchi kabineti (`/driver`)

Tasdiqlangandan keyin haydovchi yuqoridagi email + parol bilan kiradi va
avtomatik `/driver` kabinetiga tushadi. Kabinetda:

- o'ziga biriktirilgan reyslar (`orders.driver_id`)
- **«Yo'lga chiqdim»** (assigned → in_transit) va **«Yetkazildi»** (in_transit → delivered) tugmalari
- statistika: faol/yetkazilgan reyslar, km, daromad
- har bir reys uchun Mapbox marshrut xaritasi

**Kabinetni sinash uchun:** admin sifatida kirib, `/dashboard/orders` da buyurtma
yaratayotganda "Haydovchi" maydonida tasdiqlangan haydovchini tanlang va holatni
`Biriktirildi` qilib qo'ying. So'ng haydovchi hisobi bilan kirib `/driver` ni tekshiring.
Admin/dispatcher sidebar'dagi «Haydovchi kabineti» havolasi orqali ham ko'rishi mumkin.
