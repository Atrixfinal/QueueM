'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Users, Clock, Zap, BarChart3, AlertCircle } from 'lucide-react';

export default function AdminPage() {
  const [error, setError] = useState<string | null>(null);

  // Demo metrics
  const metrics = [
    { title: 'Total Waiting', value: 24, icon: Users, color: 'text-blue-600 dark:text-blue-400', desc: 'people in queue' },
    { title: 'Avg Wait Time', value: '12m', icon: Clock, color: 'text-orange-600 dark:text-orange-400', desc: 'minutes' },
    { title: 'Active Counters', value: 6, icon: Zap, color: 'text-green-600 dark:text-green-400', desc: 'counters open' },
    { title: 'Tokens Served', value: 89, icon: BarChart3, color: 'text-purple-600 dark:text-purple-400', desc: 'today' },
  ];

  // Demo tokens
  const tokens = [
    { number: 42, status: 'serving', position: '-', time: '2:30 PM', wait: '-' },
    { number: 43, status: 'waiting', position: 1, time: '2:35 PM', wait: '5m' },
    { number: 44, status: 'waiting', position: 2, time: '2:40 PM', wait: '10m' },
    { number: 45, status: 'waiting', position: 3, time: '2:45 PM', wait: '15m' },
    { number: 46, status: 'waiting', position: 4, time: '2:50 PM', wait: '20m' },
  ];

  const statusColors: Record<string, string> = {
    waiting: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
    serving: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <Card key={m.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
                <Icon className={`h-4 w-4 ${m.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{m.value}</div>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Queue Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button className="w-full" size="lg">Call Next Token</Button>
            <Button variant="outline" className="w-full" size="lg">Skip Current Token</Button>
            <Button variant="destructive" className="w-full" size="lg">Close Counter</Button>
            <div className="pt-4 border-t text-center">
              <p className="text-sm text-muted-foreground">
                Counter Status: <span className="font-semibold text-foreground">🟢 Open</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Live Queue */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Live Queue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Token #</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Wait</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tokens.map((t) => (
                    <TableRow key={t.number}>
                      <TableCell className="font-semibold text-lg">#{t.number}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[t.status]}>
                          {t.status.charAt(0).toUpperCase() + t.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{t.position}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{t.time}</TableCell>
                      <TableCell>{t.wait}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
