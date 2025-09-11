'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useState } from 'react';

export default function OfflinePage() {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await fetch('/');
      window.location.reload();
    } catch (error) {
      setTimeout(() => setIsRetrying(false), 2000);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <WifiOff className="mx-auto h-16 w-16 text-gray-400" />
          <CardTitle className="text-2xl">ไม่มีการเชื่อมต่ออินเทอร์เน็ต</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="mb-6">
            กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ตของคุณ
            และลองใหม่อีกครั้ง
          </CardDescription>
          <Button 
            onClick={handleRetry} 
            disabled={isRetrying}
            className="w-full"
          >
            {isRetrying ? (
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            ลองใหม่อีกครั้ง
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}