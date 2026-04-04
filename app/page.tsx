'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Timer, MapPin, Shield, Zap, ArrowRight, Smartphone, BarChart3 } from 'lucide-react';

export default function HomePage() {
  const features = [
    { icon: Timer, title: 'Real-Time Tracking', description: 'See your position in the queue and estimated wait time, updated live.' },
    { icon: MapPin, title: 'Find Nearby Hospitals', description: 'Auto-detect your location to find the closest service centers.' },
    { icon: Shield, title: 'Secure & Private', description: 'Your medical data is encrypted and only shared with your chosen hospital.' },
    { icon: Zap, title: 'Instant Token', description: 'Get your queue token in seconds — no registration needed for emergencies.' },
    { icon: Smartphone, title: 'Mobile Friendly', description: 'Works on any device. No app download required.' },
    { icon: BarChart3, title: 'Smart Analytics', description: 'Hospitals get real-time insights to optimize wait times and staffing.' },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <section className="flex-1 flex items-center justify-center px-4 py-20 sm:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border bg-muted/50 text-sm text-muted-foreground">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
            Live Queue Tracking
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            Skip the Wait.
            <br />
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
              Queue Smarter.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Book your hospital queue token online, track your position in real-time,
            and arrive just when it's your turn. No more waiting rooms.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/locations">
              <Button size="lg" className="gap-2 text-base px-8 py-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg shadow-blue-600/25">
                Get Token <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" size="lg" className="gap-2 text-base px-8 py-6 rounded-xl">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 pt-8 max-w-lg mx-auto">
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">5K+</div>
              <div className="text-xs text-muted-foreground">Tokens Served</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">50+</div>
              <div className="text-xs text-muted-foreground">Hospitals</div>
            </div>
            <div className="text-center">
              <div className="text-2xl sm:text-3xl font-bold">~8m</div>
              <div className="text-xs text-muted-foreground">Avg Wait Time</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Why QueueM?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              A smarter way to manage hospital queues — for patients and healthcare providers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="group p-6 rounded-xl border bg-card hover:shadow-lg hover:shadow-blue-600/5 transition-all duration-300 hover:-translate-y-1"
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600/10 to-purple-600/10 flex items-center justify-center mb-4 group-hover:from-blue-600/20 group-hover:to-purple-600/20 transition-colors">
                    <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl font-bold">Ready to skip the queue?</h2>
          <p className="text-muted-foreground text-lg">
            No registration needed for emergency visits. Just enter your phone number and get a token.
          </p>
          <Link href="/locations">
            <Button size="lg" className="gap-2 text-base px-8 py-6 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
              Get Started <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
