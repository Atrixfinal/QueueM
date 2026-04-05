'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, ArrowLeft, ArrowRight, Loader2, MapPin, Phone, Shield, Stethoscope, Building2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

type Step = 'phone' | 'otp' | 'category' | 'specialty' | 'location' | 'hospital' | 'confirm';

const CATEGORIES = [
  { value: 'emergency', label: '🚨 Emergency', desc: 'Immediate care needed', color: 'border-red-500 bg-red-50 dark:bg-red-950' },
  { value: 'vip', label: '⭐ VIP', desc: 'Priority service', color: 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950' },
  { value: 'regular', label: '📋 Regular', desc: 'Standard consultation', color: 'border-blue-500 bg-blue-50 dark:bg-blue-950' },
];

const SPECIALTIES = [
  'General Medicine', 'Cardiology', 'Neurology', 'Orthopedics',
  'Dermatology', 'Pediatrics', 'Ophthalmology', 'ENT',
  'Gynecology', 'Dental', 'Psychiatry', 'Emergency Medicine',
];

export default function LocationsPage() {
  const router = useRouter();
  const { user, isAuthenticated, sendGuestOTP, verifyOTP } = useAuth();

  const [step, setStep] = useState<Step>(isAuthenticated ? 'category' : 'phone');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Guest flow
  const [phone, setPhone] = useState('');
  const [guestLocation, setGuestLocation] = useState('');
  const [otp, setOtp] = useState('');
  const [gpsData, setGpsData] = useState<{ lat: number, lon: number } | null>(null);

  // Booking flow
  const [category, setCategory] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [nearbyHospitals, setNearbyHospitals] = useState<any[]>([]);
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [isFetchingHospitals, setIsFetchingHospitals] = useState(false);

  const handleDetectLocation = () => {
    if ("geolocation" in navigator) {
      setIsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsData({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
          setGuestLocation("GPS Location Detected");
          setIsLoading(false);
        },
        (error) => {
          setError("Location access denied or failed.");
          setIsLoading(false);
        }
      );
    } else {
      setError("Geolocation is not supported by your browser");
    }
  };

  const handleSendOTP = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await sendGuestOTP({ phone, location_current: guestLocation });
      setStep('otp');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await verifyOTP({ phone, otp });
      setStep('category');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    // In production, this would call the token creation API
    router.push('/dashboard');
  };

  const fetchNearbyHospitals = async () => {
    setIsFetchingHospitals(true);
    setError(null);
    try {
      let url = 'http://localhost:4000/hospitals/nearby?';
      if (gpsData) {
        url += `lat=${gpsData.lat}&lon=${gpsData.lon}`;
      } else {
        const queryLoc = user?.location_current || guestLocation;
        if (!queryLoc) throw new Error("Location not provided");
        url += `location=${encodeURIComponent(queryLoc)}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch hospitals');
      setNearbyHospitals(data.hospitals || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsFetchingHospitals(false);
    }
  };

  React.useEffect(() => {
    if (step === 'hospital' && nearbyHospitals.length === 0) {
      fetchNearbyHospitals();
    }
  }, [step]);

  const stepNumber = {
    phone: 1, otp: 2, category: 3, specialty: 4, location: 5, hospital: 6, confirm: 7,
  };
  const totalSteps = isAuthenticated ? 5 : 7;
  const currentStep = isAuthenticated
    ? stepNumber[step] - 2
    : stepNumber[step];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 px-4 py-8 max-w-2xl mx-auto w-full">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all duration-500 rounded-full"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* STEP: Phone Number (Guest only) */}
        {step === 'phone' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Phone className="w-5 h-5" /> Quick Access</CardTitle>
              <CardDescription>Enter your phone number and location to get a token without signing up.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input type="tel" placeholder="+91 9876543210" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Your Location</Label>
                <div className="flex gap-2">
                  <Input placeholder="New Delhi" value={guestLocation} onChange={(e) => { setGuestLocation(e.target.value); setGpsData(null); }} readOnly={!!gpsData} className="flex-1" />
                  <Button variant="outline" onClick={handleDetectLocation} disabled={isLoading} className="shrink-0" title="Detect GPS location">
                    <MapPin className="w-4 h-4 text-blue-600" />
                  </Button>
                </div>
              </div>
              <Button onClick={handleSendOTP} disabled={!phone || (!guestLocation && !gpsData) || isLoading} className="w-full gap-2">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                Send OTP
              </Button>
            </CardContent>
          </Card>
        )}

        {/* STEP: OTP Verification */}
        {step === 'otp' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Verify OTP</CardTitle>
              <CardDescription>Enter the OTP sent to {phone}. (Dev: use 123456)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>OTP Code</Label>
                <Input placeholder="123456" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} className="text-center text-2xl tracking-[0.5em] font-mono" />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('phone')} className="gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
                <Button onClick={handleVerifyOTP} disabled={otp.length < 6 || isLoading} className="flex-1 gap-2">
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Verify
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* STEP: Category */}
        {step === 'category' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Category</CardTitle>
              <CardDescription>Choose the type of visit.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  className={`w-full p-4 rounded-lg border-2 text-left transition-all ${category === cat.value ? cat.color + ' ring-2 ring-offset-2' : 'border-border hover:bg-muted/50'}`}
                  onClick={() => { setCategory(cat.value); setStep('specialty'); }}
                >
                  <div className="font-semibold text-lg">{cat.label}</div>
                  <div className="text-sm text-muted-foreground">{cat.desc}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* STEP: Specialty */}
        {step === 'specialty' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Stethoscope className="w-5 h-5" /> Select Department</CardTitle>
              <CardDescription>Choose the medical department you need.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                {SPECIALTIES.map((spec) => (
                  <button
                    key={spec}
                    className={`p-3 rounded-lg border text-sm font-medium text-center transition-all ${specialty === spec ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-500/20' : 'border-border hover:bg-muted/50'}`}
                    onClick={() => { setSpecialty(spec); setStep('hospital'); }}
                  >
                    {spec}
                  </button>
                ))}
              </div>
              <Button variant="outline" onClick={() => setStep('category')} className="mt-4 gap-1"><ArrowLeft className="w-4 h-4" /> Back</Button>
            </CardContent>
          </Card>
        )}

        {/* STEP: Hospital Selection */}
        {step === 'hospital' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Select Hospital</CardTitle>
              <CardDescription>Nearby hospitals within 50km ({user?.location_current || guestLocation || 'Unknown'}).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isFetchingHospitals ? (
                <div className="py-8 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p>Searching for nearby hospitals via OpenStreetMap...</p>
                </div>
              ) : nearbyHospitals.length > 0 ? (
                nearbyHospitals.map((h) => (
                  <button
                    key={h.id}
                    className={`w-full p-4 rounded-lg border text-left transition-all ${selectedHospital?.id === h.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950 ring-2 ring-blue-500/20' : 'border-border hover:bg-muted/50'}`}
                    onClick={() => { setSelectedHospital(h); setStep('confirm'); }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="font-semibold">{h.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5" /> {h.address}
                        </div>
                      </div>
                      <Badge variant="outline" className="shrink-0 ml-2">{h.distance}</Badge>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  No hospitals found within 50km of your location.
                </div>
              )}
              <Button variant="outline" onClick={() => setStep('specialty')} className="gap-1 mt-2 "><ArrowLeft className="w-4 h-4" /> Back</Button>
            </CardContent>
          </Card>
        )}

        {/* STEP: Confirm */}
        {step === 'confirm' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CheckCircle2 className="w-5 h-5 text-green-600" /> Confirm Booking</CardTitle>
              <CardDescription>Review your selection before getting your token.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Category</span>
                  <span className="font-medium capitalize">{category}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Department</span>
                  <span className="font-medium">{specialty}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Hospital</span>
                  <span className="font-medium">{selectedHospital?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Address</span>
                  <span className="font-medium text-right text-sm">{selectedHospital?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Distance</span>
                  <span className="font-medium">{selectedHospital?.distance}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep('hospital')} className="gap-1">
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                <Button onClick={handleConfirm} className="flex-1 gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  Get Token <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
    </div>
  );
}
