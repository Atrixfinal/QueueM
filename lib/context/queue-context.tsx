'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Token, QueueStatus, CreateTokenPayload } from '@/lib/types/queue';
import * as queueApi from '@/lib/api/queue';

interface QueueContextType {
  currentToken: Token | null;
  queueStatus: QueueStatus | null;
  isLoading: boolean;
  error: string | null;
  bookToken: (payload: CreateTokenPayload) => Promise<Token>;
  clearToken: () => void;
}

const QueueContext = createContext<QueueContextType | null>(null);

export function QueueProvider({ children }: { children: ReactNode }) {
  const [currentToken, setCurrentToken] = useState<Token | null>(null);
  const [queueStatus, setQueueStatus] = useState<QueueStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const bookToken = async (payload: CreateTokenPayload): Promise<Token> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await queueApi.createToken(payload);
      setCurrentToken(result.token);
      return result.token;
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to book token';
      setError(msg);
      throw new Error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearToken = () => {
    setCurrentToken(null);
    setQueueStatus(null);
  };

  return (
    <QueueContext.Provider
      value={{ currentToken, queueStatus, isLoading, error, bookToken, clearToken }}
    >
      {children}
    </QueueContext.Provider>
  );
}

export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) throw new Error('useQueue must be used within a QueueProvider');
  return context;
}
