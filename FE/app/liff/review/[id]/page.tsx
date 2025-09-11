'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useBooking } from '@/hooks/use-booking';
import { LoadingSpinner } from '@/components/loading-spinner';
import { Star } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: booking, isLoading } = useBooking(id as string);

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast.error('กรุณาให้คะแนน');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: id,
          rating,
          comment,
        }),
      });

      if (response.ok) {
        toast.success('ส่งรีวิวสำเร็จ ขอบคุณสำหรับความคิดเห็น!');
        router.push(`/liff/booking/${id}`);
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (error) {
      toast.error('เกิดข้อผิดพลาด กรุณาลองใหม่');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!booking || booking.status !== 'COMPLETED') {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-red-600">ไม่สามารถรีวิวได้</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-gray-600">
              รีวิวได้เฉพาะการจองที่เสร็จสิ้นแล้วเท่านั้น
            </p>
            <Button onClick={() => router.push('/liff')}>
              กลับหน้าหลัก
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl font-bold">รีวิวการให้บริการ</h1>

        {/* Booking Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">
              {booking.packageName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-gray-600">
              {new Date(booking.scheduledDate).toLocaleDateString('th-TH')} • {booking.timeSlot}
            </div>
          </CardContent>
        </Card>

        {/* Review Form */}
        <Card>
          <CardHeader>
            <CardTitle>ความพึงพอใจ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Rating */}
            <div>
              <div className="mb-3 text-sm font-medium">ให้คะแนน</div>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((value) => (
                  <button
                    key={value}
                    onClick={() => setRating(value)}
                    className="transition-all hover:scale-110"
                  >
                    <Star
                      className={`h-8 w-8 ${
                        value <= rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  {rating === 1 && 'แย่มาก'}
                  {rating === 2 && 'แย่'}
                  {rating === 3 && 'พอใช้'}
                  {rating === 4 && 'ดี'}
                  {rating === 5 && 'ดีมาก'}
                </div>
              )}
            </div>

            {/* Comment */}
            <div>
              <div className="mb-3 text-sm font-medium">ความคิดเห็น (ไม่บังคับ)</div>
              <Textarea
                placeholder="แบ่งปันประสบการณ์การใช้บริการ..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
              />
            </div>

            {/* Submit Button */}
            <Button
              className="w-full"
              onClick={handleSubmitReview}
              disabled={isSubmitting || rating === 0}
            >
              {isSubmitting ? 'กำลังส่ง...' : 'ส่งรีวิว'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}