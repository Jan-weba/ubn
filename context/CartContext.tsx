// frontend/src/context/CartContext.tsx

'use client';

import { useTranslation } from 'react-i18next';

import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';

interface CartItem {
  medicationId: string;
  name: string;
  price: number;
  quantity: number;
  pharmacyId: string;
  branchId: string;
  pharmacyName: string;
  requiresPrescription: boolean;
  imageUrl?: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (medicationId: string) => void;
  updateQuantity: (medicationId: string, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
  pharmacyId: string | null;
  branchId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { t } = useTranslation();
  const [items, setItems] = useState<CartItem[]>([]);
  const [pharmacyId, setPharmacyId] = useState<string | null>(null);
  const [branchId, setBranchId] = useState<string | null>(null);

  // Load cart from localStorage
  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      const parsed = JSON.parse(savedCart);
      setItems(parsed.items || []);
      setPharmacyId(parsed.pharmacyId || null);
      setBranchId(parsed.branchId || null);
    }
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify({ items, pharmacyId, branchId }));
  }, [items, pharmacyId, branchId]);

  const addToCart = (item: CartItem) => {
    // Check if adding from different pharmacy branch
    if (branchId && branchId !== item.branchId) {
      toast.error(t('cart2.onePharmacyOnly'));
      return;
    }

    // Check if item already exists
    const existingItem = items.find((i) => i.medicationId === item.medicationId);

    if (existingItem) {
      setItems(
        items.map((i) =>
        i.medicationId === item.medicationId
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        )
      );
      toast.success(t('cart2.quantityUpdated'));
    } else {
      setItems([...items, item]);
      setPharmacyId(item.pharmacyId);
      setBranchId(item.branchId);
      toast.success(t('cart2.addedToCart'));
    }
  };

  const removeFromCart = (medicationId: string) => {
    const newItems = items.filter((i) => i.medicationId !== medicationId);
    setItems(newItems);

    if (newItems.length === 0) {
      setPharmacyId(null);
      setBranchId(null);
    }

    toast.success(t('cart2.removedFromCart'));
  };

  const updateQuantity = (medicationId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(medicationId);
      return;
    }

    setItems(
      items.map((i) =>
      i.medicationId === medicationId ? { ...i, quantity } : i
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    setPharmacyId(null);
    setBranchId(null);
    toast.success(t('cart2.cartCleared'));
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getItemCount = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotal,
        getItemCount,
        pharmacyId,
        branchId,
      }}
    >
    {children}
    </CartContext.Provider>
);
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};