'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Route, Shield, Gauge, Wallet, Bed, Clock, UtensilsCrossed,
  Truck, ArrowRight, MapPin, TrendingUp,
  Menu, X, Sparkles, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const factors = [
  { icon: Shield, title: 'Xavfsizlik', desc: 'Avariya statistikasi, yo\'l holati, ob-havo tahlili', color: 'text-red-500', bg: 'bg-red-500/10' },
  { icon: Route, title: "Yo'l sifati", desc: 'Asfalt holati, qurilish zonalar, qazilgan joylar', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Gauge, title: 'Tezlik va vaqt', desc: 'Tirbandlik, chegara va postlarni hisobga olish', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { icon: Wallet, title: 'Xarajat optimallashtirish', desc: 'Yoqilg\'i, to\'lo\'v yo\'llari, bojxona, haydovchi maoshi', color: 'text-green-500', bg: 'bg-green-500/10' },
  { icon: Bed, title: 'Haydovchi qulayligi', desc: 'Dam olish maskanlari, mehmonxona sifati, sharoitlar', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Clock, title: 'Ishonchlilik', desc: 'O\'z vaqtida yetkazish tarixi tahlili', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { icon: UtensilsCrossed, title: 'Ovqat va dam olish', desc: 'Halol taomlar, xavfsiz avtoturargoh, toza sharoitlar', color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

const features = [
  { title: 'AI marshrut optimallashtirish', desc: 'Masofadan tashqari 7 real faktorni hisobga oluvchi aqlli marshrutlashtirish — O\'zbekiston bo\'ylab.', icon: Sparkles },
  { title: 'Interaktiv xarita', desc: 'Xavfsizlik darajasi bo\'yicha rang-kodlangan yo\'l segmentlari, jonli kuzatish va nuqtalar tafsilotlari.', icon: MapPin },
  { title: 'Avtopark boshqaruvi', desc: 'Transportlarni kuzatish, texnik xizmatni rejalashtirish, yoqilg\'i sarfini tahlil qilish.', icon: Truck },
  { title: 'Real vaqt tahlili', desc: 'Xarajat tahlili, yetkazish vaqti ko\'rsatkichlari, xavfsizlik hisobotlari va CO2 kuzatuvi.', icon: TrendingUp },
];

const stats = [
  { value: '12+', label: "Shaharlar qamrovi" },
  { value: '7', label: 'AI faktorlari' },
  { value: '15+', label: 'Tekshirilgan dam olish maskanlari' },
  { value: '24/7', label: 'Marshrut monitoringi' },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50/30 to-white dark:from-background dark:via-background">
      {/* Navigatsiya */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/80 dark:bg-background/80 backdrop-blur-lg border-b border-border shadow-sm' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
                <Route className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold tracking-tight">Karvonboshi</span>
            </div>

            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Xususiyatlar</a>
              <a href="#factors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">7 Faktor</a>
              <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Qanday ishlaydi</a>
              <Link href="/driver-apply" className="text-sm font-medium text-primary hover:underline transition-colors">
                Haydovchi bo'lish
              </Link>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Kirish</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Boshlash
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              data-testid="nav-mobile-menu-btn"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-background border-b border-border px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Xususiyatlar</a>
            <a href="#factors" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>7 Faktor</a>
            <a href="#how" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Qanday ishlaydi</a>
            <Link href="/driver-apply" className="block text-sm font-medium text-primary" onClick={() => setMobileMenuOpen(false)}>Haydovchi bo'lish</Link>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Kirish</Button></Link>
              <Link href="/signup" className="flex-1"><Button size="sm" className="w-full">Boshlash</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
            AI asosidagi marshrut optimallashtirish
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance animate-slide-up">
            O'zbekiston yo'llari uchun{' '}
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              aqlli logistika
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Karvonboshi yuk yetkazish marshrutlarini 7 real faktor asosida optimallashtiradi —
            xavfsizlik va yo'l sifatidan haydovchi qulayligi va halol dam olish maskanlarigacha.
            Eng qisqa yo'l emas — eng aqlli yo'l.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto" data-testid="hero-start-btn">
                Marshrutlarni optimallashtirishni boshlang
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                Demo panelga kirish
              </Button>
            </Link>
          </div>

          {/* Statistika */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary">{stat.value}</div>
                <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7 Faktor */}
      <section id="factors" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">7 ustun</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Masofadan ham muhimroq mezonlar
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Har bir marshrut real hayotdagi yetkazish natijasiga ta'sir etuvchi yetti muhim faktor bo'yicha baholanadi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {factors.map((factor, idx) => (
              <Card
                key={factor.title}
                className={`p-5 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  idx === 6 ? 'lg:col-span-2' : ''
                }`}
              >
                <div className={`w-10 h-10 rounded-lg ${factor.bg} flex items-center justify-center mb-3`}>
                  <factor.icon className={`w-5 h-5 ${factor.color}`} />
                </div>
                <h3 className="font-semibold text-base mb-1">{factor.title}</h3>
                <p className="text-sm text-muted-foreground">{factor.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Xususiyatlar */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">Platforma imkoniyatlari</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Avtoparkingizni boshqarish uchun hamma narsa
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="p-6 flex gap-4 items-start hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Qanday ishlaydi */}
      <section id="how" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">Qanday ishlaydi</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Boshlang'ich nuqtadan manzilgacha — uch qadamda
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: "Marshrut ma'lumotlarini kiriting", desc: "Jo'nash nuqtasi, manzil, yuk turi, transport va yetkazish muddatini belgilang." },
              { step: '02', title: 'AI optimallashtirish', desc: 'Dvigatel 7 faktorni tahlil qilib, alternativalari bilan optimal marshrutlarni taklif qiladi.' },
              { step: '03', title: 'Kuzatib borish va yetkazish', desc: 'Haydovchini biriktiring, real vaqtda kuzating va ogohlantirishlar oling.' },
            ].map((item, idx) => (
              <div key={item.step} className="relative">
                {idx < 2 && (
                  <ChevronRight className="hidden md:block absolute top-6 -right-4 w-8 h-8 text-border" />
                )}
                <div className="text-5xl font-bold text-primary/20 mb-2">{item.step}</div>
                <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="relative overflow-hidden p-10 text-center bg-gradient-to-br from-primary to-chart-2 text-white border-0">
            <div className="relative">
              <h2 className="text-3xl font-bold mb-4">Avtoparkingizni optimallashtirishga tayyormisiz?</h2>
              <p className="text-white/90 mb-8 max-w-xl mx-auto">
                O'zbekiston bo'ylab logistika kompaniyalari Karvonboshi bilan aqlliroq, xavfsizroq va
                tejamkor yetkazadi.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/signup">
                  <Button size="lg" variant="secondary" data-testid="cta-create-account-btn">
                    Bepul akkaunt yaratish
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link href="/driver-apply">
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white">
                    Haydovchi bo'lish
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Route className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold">Karvonboshi</span>
            <span className="text-sm text-muted-foreground ml-2">— O'zbekiston uchun aqlli yo'nalishlar</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Karvonboshi. Barcha huquqlar himoyalangan.</p>
        </div>
      </footer>
    </div>
  );
}
