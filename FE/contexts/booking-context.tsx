'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';

interface BookingState {
  selectedPackage: any;
  selectedAddons: any[];
  pickupLocation: { lat: number; lng: number; address: string } | null;
  dropoffLocation: { lat: number; lng: number; address: string } | null;
  sameLocation: boolean;
  selectedDate: string | null;
  selectedSlot: string | null;
}

type BookingAction =
  | { type: 'SET_PACKAGE'; payload: any }
  | { type: 'SET_ADDONS'; payload: any[] }
  | { type: 'SET_PICKUP_LOCATION'; payload: { lat: number; lng: number; address: string } }
  | { type: 'SET_DROPOFF_LOCATION'; payload: { lat: number; lng: number; address: string } }
  | { type: 'SET_SAME_LOCATION'; payload: boolean }
  | { type: 'SET_SELECTED_DATE'; payload: string }
  | { type: 'SET_SELECTED_SLOT'; payload: string }
  | { type: 'RESET' };

const initialState: BookingState = {
  selectedPackage: null,
  selectedAddons: [],
  pickupLocation: null,
  dropoffLocation: null,
  sameLocation: true,
  selectedDate: null,
  selectedSlot: null,
};

function bookingReducer(state: BookingState, action: BookingAction): BookingState {
  switch (action.type) {
    case 'SET_PACKAGE':
      return { ...state, selectedPackage: action.payload };
    case 'SET_ADDONS':
      return { ...state, selectedAddons: action.payload };
    case 'SET_PICKUP_LOCATION':
      return { ...state, pickupLocation: action.payload };
    case 'SET_DROPOFF_LOCATION':
      return { ...state, dropoffLocation: action.payload };
    case 'SET_SAME_LOCATION':
      return { ...state, sameLocation: action.payload };
    case 'SET_SELECTED_DATE':
      return { ...state, selectedDate: action.payload };
    case 'SET_SELECTED_SLOT':
      return { ...state, selectedSlot: action.payload };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const BookingContext = createContext<{
  state: BookingState;
  dispatch: React.Dispatch<BookingAction>;
} | null>(null);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  return (
    <BookingContext.Provider value={{ state, dispatch }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBookingContext() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBookingContext must be used within BookingProvider');
  }
  return context;
}