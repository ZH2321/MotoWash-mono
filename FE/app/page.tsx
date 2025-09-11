'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PWAInstallHint } from '@/components/pwa-install-hint';
import { Clock, MapPin, Star, Smartphone } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="px-4 py-16 text-center">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-6xl">
            Campus <span className="text-blue-600">MotoWash</span>
          </h1>
          <p className="mb-8 text-xl text-gray-600 md:text-2xl">
            จองคิวล้างมอเตอร์ไซค์ออนไลน์ รับ-ส่งถึงที่
          </p>
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Link href="/liff">
              <Button size="lg" className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                <Smartphone className="mr-2 h-5 w-5" />
                เปิด LIFF (สำหรับ LINE)
              </Button>
            </Link>
            <Link href="/admin/login">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                เข้าสู่ระบบแอดมิน
              </Button>
            </Link>
          </div>
          <PWAInstallHint />
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-16">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            ทำไมต้องเลือกเรา?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="text-center">
              <CardHeader>
                <MapPin className="mx-auto h-12 w-12 text-blue-600" />
                <CardTitle>รับ-ส่งถึงที่</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  เราจะไปรับมอเตอร์ไซค์ที่หอพักหรือคณะของคุณ
                  และส่งคืนเมื่อล้างเสร็จแล้ว
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Clock className="mx-auto h-12 w-12 text-green-600" />
                <CardTitle>จองคิวออนไลน์</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  จองคิวได้ล่วงหน้า ไม่ต้องรอคิว
                  ติดตามสถานะได้แบบเรียลไทม์
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Star className="mx-auto h-12 w-12 text-yellow-600" />
                <CardTitle>บริการมืออาชีพ</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  ทีมงานมืออาชีพ ใช้อุปกรณ์คุณภาพ
                  รับประกันความสะอาด
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-white px-4 py-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            แพ็กเกจบริการ
          </h2>
          <div className="grid gap-8 md:grid-cols-2">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">แพ็กเกจล้างธรรมดา</CardTitle>
                <div className="text-2xl font-bold text-blue-600">฿99</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• ล้างตัวถัง</li>
                  <li>• ล้างล้อและยาง</li>
                  <li>• รับ-ส่งฟรี</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 border-blue-500">
              <CardHeader>
                <CardTitle className="text-xl">แพ็กเกจล้างพรีเมียม</CardTitle>
                <div className="text-2xl font-bold text-blue-600">฿179</div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• ล้างตัวถัง + เคลือบเงา</li>
                  <li>• ล้างล้อและยาง + ยางดำ</li>
                  <li>• ทำความสะอาดเครื่องยนต์</li>
                  <li>• รับ-ส่งฟรี</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 px-4 py-8 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h3 className="mb-4 text-xl font-bold">Campus MotoWash</h3>
          <p className="text-gray-400">
            บริการล้างมอเตอร์ไซค์คุณภาพ รับ-ส่งถึงที่
          </p>
        </div>
      </footer>
    </div>
  );
}