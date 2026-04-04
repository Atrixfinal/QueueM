'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Navbar } from '@/components/shared/navbar';
import { Footer } from '@/components/shared/footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2 } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

export default function AuthPage() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Login form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register form
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regSex, setRegSex] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState('');
  const [regMedical, setRegMedical] = useState('');
  const [regAllergies, setRegAllergies] = useState('');
  const [regLocation, setRegLocation] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await login({ phone: loginPhone, password: loginPassword });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await register({
        name: regName,
        phone: regPhone,
        password: regPassword,
        sex: regSex || undefined,
        blood_group: regBloodGroup || undefined,
        medical_conditions: regMedical || undefined,
        allergies: regAllergies || undefined,
        location_home: regLocation || undefined,
      });
      router.push('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Welcome to QueueM</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Tabs defaultValue="login">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">Login</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">Sign Up</TabsTrigger>
              </TabsList>

              {/* LOGIN TAB */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-phone">Phone Number</Label>
                    <Input id="login-phone" type="tel" placeholder="+91 9876543210" value={loginPhone} onChange={(e) => setLoginPhone(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Input id="login-password" type="password" placeholder="••••••••" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in...</> : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              {/* SIGNUP TAB */}
              <TabsContent value="signup">
                <form onSubmit={handleRegister} className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reg-name">Full Name *</Label>
                      <Input id="reg-name" placeholder="Abhinav" value={regName} onChange={(e) => setRegName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="reg-phone">Phone Number *</Label>
                      <Input id="reg-phone" type="tel" placeholder="+91 9876543210" value={regPhone} onChange={(e) => setRegPhone(e.target.value)} required />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-password">Password *</Label>
                    <Input id="reg-password" type="password" placeholder="Min 6 characters" value={regPassword} onChange={(e) => setRegPassword(e.target.value)} required minLength={6} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Sex</Label>
                      <Select value={regSex} onValueChange={setRegSex}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Blood Group</Label>
                      <Select value={regBloodGroup} onValueChange={setRegBloodGroup}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent>
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-medical">Medical Conditions</Label>
                    <Input id="reg-medical" placeholder="Diabetes, Hypertension, etc." value={regMedical} onChange={(e) => setRegMedical(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-allergies">Allergies</Label>
                    <Input id="reg-allergies" placeholder="Penicillin, etc." value={regAllergies} onChange={(e) => setRegAllergies(e.target.value)} />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reg-location">Home Location *</Label>
                    <Input id="reg-location" placeholder="New Delhi" value={regLocation} onChange={(e) => setRegLocation(e.target.value)} required />
                  </div>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</> : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}
