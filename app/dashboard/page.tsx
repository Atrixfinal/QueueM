'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Clock, Users, Hash, Building2, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/hooks/use-auth';

export default function DashboardPage() {
  const { user } = useAuth();

  // Demo token data
  const demoToken = {
    number: 45,
    status: 'waiting' as const,
    position: 3,
    estimatedWait: 12,
    category: 'Regular',
    specialty: 'Cardiology',
    hospital: {
      name: 'City General Hospital',
      address: '123 Main Street, New Delhi',
      apiEndpoint: 'api.citygen.demo',
      sentAt: '3:45 PM',
      status: 'accepted',
    },
  };

  const progressPercent = Math.max(10, 100 - (demoToken.position / 10) * 100);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, {user?.name || 'Guest'}</p>
      </div>

      {/* Token Display */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm opacity-80">Your Token</p>
              <p className="text-5xl font-bold mt-1">#{demoToken.number}</p>
            </div>
            <Badge className="bg-white/20 text-white border-white/30 text-sm px-3 py-1">
              {demoToken.status.charAt(0).toUpperCase() + demoToken.status.slice(1)}
            </Badge>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 opacity-80" />
              <div>
                <p className="text-xs opacity-80">Position</p>
                <p className="font-semibold">{demoToken.position} of 10</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 opacity-80" />
              <div>
                <p className="text-xs opacity-80">Est. Wait</p>
                <p className="font-semibold">{demoToken.estimatedWait} min</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Hash className="w-4 h-4 opacity-80" />
              <div>
                <p className="text-xs opacity-80">Category</p>
                <p className="font-semibold">{demoToken.category}</p>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Queue Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Progress</CardTitle>
          <CardDescription>Real-time tracking of your position</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Position in queue</span>
              <span className="font-medium">{demoToken.position} / 10</span>
            </div>
            <Progress value={progressPercent} />
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-muted-foreground">Currently serving: #42</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hospital Integration Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" /> Hospital Integration
          </CardTitle>
          <CardDescription>Token sent to the hospital's queue system</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold">{demoToken.hospital.name}</p>
                <p className="text-sm text-muted-foreground">{demoToken.hospital.address}</p>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 gap-1">
                <CheckCircle2 className="w-3 h-3" /> Sent
              </Badge>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground">API Endpoint</p>
                <p className="font-mono text-xs mt-0.5 flex items-center gap-1">
                  <Globe className="w-3 h-3" /> {demoToken.hospital.apiEndpoint}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Sent at</p>
                <p className="font-medium mt-0.5">{demoToken.hospital.sentAt}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Response: Accepted ✅</span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>
              <strong>Demo Mode:</strong> Using fake hospital data. In production, this connects to the real hospital API and token data flows directly to their queue system.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Queue History */}
      <Card>
        <CardHeader>
          <CardTitle>Queue History</CardTitle>
          <CardDescription>Your recent queue visits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { number: 45, hospital: 'City General Hospital', specialty: 'Cardiology', status: 'waiting', date: 'Today' },
              { number: 38, hospital: 'Metro Heart Institute', specialty: 'General Medicine', status: 'completed', date: 'Yesterday' },
              { number: 22, hospital: 'Apollo Medical Center', specialty: 'Orthopedics', status: 'completed', date: '2 days ago' },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="text-lg font-bold text-muted-foreground w-10">#{item.number}</div>
                  <div>
                    <p className="font-medium text-sm">{item.hospital}</p>
                    <p className="text-xs text-muted-foreground">{item.specialty} · {item.date}</p>
                  </div>
                </div>
                <Badge variant={item.status === 'completed' ? 'secondary' : 'default'} className="capitalize">
                  {item.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
