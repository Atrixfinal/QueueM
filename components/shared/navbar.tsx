'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ThemeToggle } from './theme-toggle';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Menu, X, LogOut } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

export function Navbar() {
  const { user, isAuthenticated, logout, updateLocation } = useAuth();
  const [showLocationDialog, setShowLocationDialog] = useState(false);
  const [newLocation, setNewLocation] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLocationUpdate = async () => {
    if (newLocation.trim()) {
      try {
        await updateLocation(newLocation.trim());
        setShowLocationDialog(false);
        setNewLocation('');
      } catch (err) {
        console.error('Failed to update location');
      }
    }
  };

  return (
    <>
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            QueueM
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowLocationDialog(true)}
                className="gap-2"
              >
                <MapPin className="w-3.5 h-3.5" />
                {user?.location_current || 'Set Location'}
              </Button>
            )}

            {!isAuthenticated ? (
              <Link href="/auth">
                <Button variant="outline" size="sm">Sign In</Button>
              </Link>
            ) : (
              <>
                {user?.role === 'admin' && (
                  <Link href="/admin"><Button variant="ghost" size="sm">Admin</Button></Link>
                )}
                <Link href="/dashboard"><Button variant="ghost" size="sm">Dashboard</Button></Link>
                <Button variant="ghost" size="sm" onClick={logout} className="gap-1.5">
                  <LogOut className="w-3.5 h-3.5" /> Logout
                </Button>
              </>
            )}
            <ThemeToggle />
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border/40 px-4 py-4 space-y-2 bg-background">
            {isAuthenticated && (
              <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => { setShowLocationDialog(true); setMobileMenuOpen(false); }}>
                <MapPin className="w-3.5 h-3.5" /> {user?.location_current || 'Set Location'}
              </Button>
            )}
            {!isAuthenticated ? (
              <Link href="/auth" className="block">
                <Button variant="outline" size="sm" className="w-full">Sign In</Button>
              </Link>
            ) : (
              <>
                <Link href="/dashboard" className="block">
                  <Button variant="ghost" size="sm" className="w-full">Dashboard</Button>
                </Link>
                <Button variant="ghost" size="sm" className="w-full" onClick={logout}>Logout</Button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Change Location Dialog */}
      <Dialog open={showLocationDialog} onOpenChange={setShowLocationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>📍 Change Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Update your current location to find nearby hospitals.
            </p>
            {user?.location_home && (
              <p className="text-xs text-muted-foreground">
                Home location: <span className="font-medium text-foreground">{user.location_home}</span>
              </p>
            )}
            <div className="space-y-2">
              <Label>Current Location</Label>
              <Input
                placeholder="Enter city or address..."
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLocationUpdate()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowLocationDialog(false)}>Cancel</Button>
              <Button onClick={handleLocationUpdate} disabled={!newLocation.trim()}>Update</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
