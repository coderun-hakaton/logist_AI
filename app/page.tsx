'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  Route, Shield, Gauge, Wallet, Bed, Clock, UtensilsCrossed,
  Truck, ArrowRight, MapPin, TrendingUp, CheckCircle2,
  Menu, X, Sparkles, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const factors = [
  { icon: Shield, title: 'Safety Score', desc: 'Accident statistics, road conditions, weather analysis', color: 'text-red-500', bg: 'bg-red-500/10' },
  { icon: Route, title: 'Road Quality', desc: 'Asphalt condition, construction zones, pothole detection', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Gauge, title: 'Speed & Time', desc: 'Fastest route with traffic, borders, checkpoints', color: 'text-cyan-500', bg: 'bg-cyan-500/10' },
  { icon: Wallet, title: 'Cost Optimization', desc: 'Fuel, toll roads, customs, driver wages', color: 'text-green-500', bg: 'bg-green-500/10' },
  { icon: Bed, title: 'Driver Comfort', desc: 'Rest stops, hotel quality, amenities', color: 'text-amber-500', bg: 'bg-amber-500/10' },
  { icon: Clock, title: 'Reliability', desc: 'Historical on-time delivery rate analysis', color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
  { icon: UtensilsCrossed, title: 'Food & Rest', desc: 'Halal restaurants, safe parking, clean facilities', color: 'text-orange-500', bg: 'bg-orange-500/10' },
];

const features = [
  { title: 'AI Route Optimization', desc: '7-factor intelligent routing that goes beyond distance to consider real-world conditions across Uzbekistan.', icon: Sparkles },
  { title: 'Interactive Map', desc: 'Color-coded route segments showing safety levels, live tracking, and waypoint details.', icon: MapPin },
  { title: 'Fleet Management', desc: 'Track vehicles, monitor maintenance, analyze fuel consumption, and manage driver performance.', icon: Truck },
  { title: 'Real-time Analytics', desc: 'Cost analysis, delivery time metrics, safety reports, and CO2 emissions tracking.', icon: TrendingUp },
];

const stats = [
  { value: '12+', label: 'Cities Connected' },
  { value: '7', label: 'AI Factors' },
  { value: '15+', label: 'Verified Rest Stops' },
  { value: '24/7', label: 'Route Monitoring' },
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
      {/* Navigation */}
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
              <a href="#features" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#factors" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">7 Factors</a>
              <a href="#how" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">How it Works</a>
            </div>

            <div className="hidden md:flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button size="sm">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>

            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden bg-white dark:bg-background border-b border-border px-4 py-4 space-y-3">
            <a href="#features" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#factors" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>7 Factors</a>
            <a href="#how" className="block text-sm font-medium text-muted-foreground hover:text-foreground" onClick={() => setMobileMenuOpen(false)}>How it Works</a>
            <div className="flex gap-2 pt-2">
              <Link href="/login" className="flex-1"><Button variant="outline" size="sm" className="w-full">Sign In</Button></Link>
              <Link href="/signup" className="flex-1"><Button size="sm" className="w-full">Get Started</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-[0.015] pointer-events-none" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="secondary" className="mb-6 animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-primary" />
            AI-Powered Route Optimization
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-balance animate-slide-up">
            Intelligent logistics for{' '}
            <span className="bg-gradient-to-r from-primary to-chart-2 bg-clip-text text-transparent">
              Uzbekistan's roads
            </span>
          </h1>

          <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto text-balance animate-slide-up" style={{ animationDelay: '0.1s' }}>
            Karvonboshi optimizes delivery routes using 7 real-world factors — from safety and road quality
            to driver comfort and halal rest stops. Not just the shortest path, the smartest one.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Link href="/signup">
              <Button size="lg" className="w-full sm:w-auto">
                Start Optimizing Routes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                View Demo Dashboard
              </Button>
            </Link>
          </div>

          {/* Stats */}
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

      {/* 7 Factors */}
      <section id="factors" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">The 7 Pillars</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Optimization beyond distance
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Every route is scored across seven critical factors that impact real-world delivery outcomes.
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

      {/* Features */}
      <section id="features" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">Platform Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Everything you need to manage your fleet
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

      {/* How it works */}
      <section id="how" className="py-20 bg-secondary/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3">How It Works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              From origin to destination in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Enter Route Details', desc: 'Specify origin, destination, cargo type, vehicle, and delivery deadline.' },
              { step: '02', title: 'AI Optimization', desc: 'Our engine analyzes all 7 factors and generates optimal routes with alternatives.' },
              { step: '03', title: 'Track & Deliver', desc: 'Assign drivers, track in real-time, and receive alerts throughout the journey.' },
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
            <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-10" />
            <div className="relative">
              <h2 className="text-3xl font-bold mb-4">Ready to optimize your fleet?</h2>
              <p className="text-white/90 mb-8 max-w-xl mx-auto">
                Join logistics companies across Uzbekistan using Karvonboshi to deliver smarter, safer, and more cost-effectively.
              </p>
              <Link href="/signup">
                <Button size="lg" variant="secondary">
                  Create Free Account
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
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
            <span className="text-sm text-muted-foreground ml-2">— Smart routes for Uzbekistan</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 Karvonboshi. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
