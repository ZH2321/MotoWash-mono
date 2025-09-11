'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Clock } from 'lucide-react';
import Link from 'next/link';
import { useLiff } from '@/hooks/use-liff';
import { LoadingSpinner } from '@/components/loading-spinner';

export default function LiffPage() {
  const { isReady, user, error } = useLiff();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">เกิดข้อผิดพลาด</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            สวัสดี {user?.displayName}! 👋
          </h1>
          <p className="text-gray-600">Campus MotoWash</p>
        </div>

        {/* Action Cards */}
        <div className="space-y-4">
          <Link href="/liff/book">
            <Card className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center">
                  <Calendar className="mr-3 h-8 w-8 text-blue-600" />
                  <div>
                    <CardTitle>จองคิวล้างมอเตอร์ไซค์</CardTitle>
                    <CardDescription>
                      เลือกแพ็กเกจ กำหนดสถานที่ และเลือกเวลา
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/liff/status">
            <Card className="cursor-pointer transition-all hover:scale-105 hover:shadow-lg">
              <CardHeader>
                <div className="flex items-center">
                  <Clock className="mr-3 h-8 w-8 text-green-600" />
                  <div>
                    <CardTitle>เช็คสถานะล่าสุด</CardTitle>
                    <CardDescription>
                      ดูสถานะการจองและประวัติการใช้บริการ
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </Link>
        </div>

        {/* Quick Stats */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลการใช้บริการ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">0</div>
                <div className="text-sm text-gray-600">การจองครั้งนี้</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">0</div>
                <div className="text-sm text-gray-600">คะแนนรีวิว</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}