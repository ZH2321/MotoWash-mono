'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useBookingContext } from '@/contexts/booking-context';
import { Check } from 'lucide-react';

interface Package {
  id: string;
  name: string;
  price: number;
  description: string;
  features: string[];
}

interface Addon {
  id: string;
  name: string;
  price: number;
  description: string;
}

const PACKAGES: Package[] = [
  {
    id: 'basic',
    name: 'แพ็กเกจล้างธรรมดา',
    price: 99,
    description: 'ล้างพื้นฐาน เหมาะสำหรับการใช้งานทั่วไป',
    features: ['ล้างตัวถัง', 'ล้างล้อและยาง', 'รับ-ส่งฟรี'],
  },
  {
    id: 'premium',
    name: 'แพ็กเกจล้างพรีเมียม',
    price: 179,
    description: 'ล้างครบครัน พร้อมเคลือบเงา',
    features: ['ล้างตัวถัง + เคลือบเงา', 'ล้างล้อและยาง + ยางดำ', 'ทำความสะอาดเครื่องยนต์', 'รับ-ส่งฟรี'],
  },
];

const ADDONS: Addon[] = [
  {
    id: 'interior',
    name: 'ทำความสะอาดภายใน',
    price: 50,
    description: 'ทำความสะอาดเบาะ ห้องเก็บของ',
  },
  {
    id: 'chain',
    name: 'ทำความสะอาดโซ่',
    price: 30,
    description: 'ล้างและหล่อลื่นโซ่',
  },
];

interface PackageSelectionProps {
  onNext: () => void;
  onPrev: () => void;
}

export function PackageSelection({ onNext }: PackageSelectionProps) {
  const { state, dispatch } = useBookingContext();
  const [selectedPackageId, setSelectedPackageId] = useState<string>(
    state.selectedPackage?.id || ''
  );
  const [selectedAddonIds, setSelectedAddonIds] = useState<string[]>(
    state.selectedAddons?.map(a => a.id) || []
  );

  const selectedPackage = PACKAGES.find(p => p.id === selectedPackageId);
  const selectedAddons = ADDONS.filter(a => selectedAddonIds.includes(a.id));
  const totalPrice = (selectedPackage?.price || 0) + selectedAddons.reduce((sum, addon) => sum + addon.price, 0);

  const handlePackageSelect = (packageId: string) => {
    setSelectedPackageId(packageId);
    const pkg = PACKAGES.find(p => p.id === packageId);
    if (pkg) {
      dispatch({ type: 'SET_PACKAGE', payload: pkg });
    }
  };

  const handleAddonToggle = (addonId: string) => {
    const newSelectedAddonIds = selectedAddonIds.includes(addonId)
      ? selectedAddonIds.filter(id => id !== addonId)
      : [...selectedAddonIds, addonId];
    
    setSelectedAddonIds(newSelectedAddonIds);
    
    const addons = ADDONS.filter(a => newSelectedAddonIds.includes(a.id));
    dispatch({ type: 'SET_ADDONS', payload: addons });
  };

  const handleNext = () => {
    if (selectedPackage) {
      onNext();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-4">เลือกแพ็กเกจบริการ</h2>
        
        <div className="space-y-4">
          {PACKAGES.map((pkg) => (
            <Card
              key={pkg.id}
              className={`cursor-pointer border-2 transition-all ${
                selectedPackageId === pkg.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handlePackageSelect(pkg.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{pkg.name}</CardTitle>
                    <CardDescription>{pkg.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">฿{pkg.price}</div>
                    {selectedPackageId === pkg.id && (
                      <Badge className="bg-blue-600">
                        <Check className="h-3 w-3 mr-1" />
                        เลือกแล้ว
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1 text-sm">
                  {pkg.features.map((feature, index) => (
                    <li key={index} className="flex items-center">
                      <Check className="h-4 w-4 text-green-600 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">บริการเสริม</h3>
        
        <div className="space-y-3">
          {ADDONS.map((addon) => (
            <Card key={addon.id} className="border">
              <CardContent className="pt-4">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id={addon.id}
                    checked={selectedAddonIds.includes(addon.id)}
                    onCheckedChange={() => handleAddonToggle(addon.id)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{addon.name}</h4>
                        <p className="text-sm text-gray-600">{addon.description}</p>
                      </div>
                      <div className="font-bold text-blue-600">+฿{addon.price}</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Summary */}
      {selectedPackage && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle className="text-lg">สรุปการเลือก</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>{selectedPackage.name}</span>
                <span>฿{selectedPackage.price}</span>
              </div>
              {selectedAddons.map((addon) => (
                <div key={addon.id} className="flex justify-between text-gray-600">
                  <span>+ {addon.name}</span>
                  <span>฿{addon.price}</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>รวม</span>
                <span className="text-blue-600">฿{totalPrice}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        className="w-full"
        onClick={handleNext}
        disabled={!selectedPackage}
      >
        ถัดไป: เลือกสถานที่
      </Button>
    </div>
  );
}