// frontend/src/app/patient/pharmacies/[id]/page.tsx

'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import api from '@/lib/api';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import toast from 'react-hot-toast';
import { useCart } from '@/context/CartContext';
import { ArrowLeftIcon, MapPinIcon, PhoneIcon, ShoppingCartIcon, BeakerIcon } from '@heroicons/react/24/outline';

interface Medication {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  quantity: number;
  requiresPrescription: boolean;
  imageUrl?: string;
}

interface Pharmacy {
  id: string;
  name: string;
  address: string;
  phone: string;
  latitude?: number;
  longitude?: number;
  medications: Medication[];
}

export default function PharmacyDetailsPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const { addToCart } = useCart();
  const [pharmacy, setPharmacy] = useState<Pharmacy | null>(null);
  const [branchId, setBranchId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  useEffect(() => { fetchPharmacyDetails(); }, [params.id]);

  const fetchPharmacyDetails = async () => {
    try {
      setLoading(true);
      const [pharmacyRes, branchesRes] = await Promise.all([
        api.get(`/pharmacies/${params.id}`),
        api.get(`/branches/pharmacy/${params.id}`).catch(() => ({ data: [] })),
      ]);
      setPharmacy(pharmacyRes.data);
      // Use the first approved branch ID for ordering
      const approvedBranch = (branchesRes.data as any[]).find(
        (b: any) => b.branchStatus === 'APPROVED'
      ) || branchesRes.data[0];
      if (approvedBranch) setBranchId(approvedBranch.id);
    } catch (error) {
      console.error('Failed to fetch pharmacy:', error);
      toast.error(t('pharmacies.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (medication: Medication) => {
    addToCart({
      medicationId: medication.id,
      name: medication.name,
      price: medication.price,
      quantity: 1,
      pharmacyId: pharmacy?.id || '',
      pharmacyName: pharmacy?.name || '',
      branchId: branchId,
      requiresPrescription: medication.requiresPrescription,
      imageUrl: medication.imageUrl,
    });
    router.push('/patient/cart');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
  }

  if (!pharmacy) {
    return (
      <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 dark:text-gray-400 mb-4">Pharmacy Not Found</p>
        <button onClick={() => router.back()} className="bg-[#1E4D8C] text-white px-6 py-2 rounded-xl hover:bg-[#1a3d6f]">
          Go Back
          </button>
      </div>
    </div>
  );
  }

  const filteredMedications = (pharmacy.medications || []).filter((med) => {
    const matchesSearch =
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || med.category === selectedCategory;
    return matchesSearch && matchesCategory && med.quantity > 0;
  });

  const categories = ['ALL', ...new Set((pharmacy.medications || []).map((med) => med.category))];

  return (
    <div className="flex-1 p-6 overflow-auto">
    <div className="max-w-7xl mx-auto space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
        <ArrowLeftIcon className="w-5 h-5" />
        Back
        </button>

      {/* Pharmacy Header */}
        <div className="bg-linear-to-r from-[#1E4D8C] to-[#1a3d6f] rounded-2xl shadow-xl p-8 text-white">
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{pharmacy.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start gap-3">
            <MapPinIcon className="w-6 h-6 mt-0.5 shrink-0" />
            <span className="text-blue-100">{pharmacy.address}</span>
          </div>
          <div className="flex items-center gap-3">
            <PhoneIcon className="w-6 h-6 shrink-0" />
            <a href={`tel:${pharmacy.phone}`} className="text-blue-100 hover:text-white font-medium underline">
              {pharmacy.phone}
              </a>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 space-y-4">
        <div className="relative">
          <input
              type="text"
              placeholder="Search medications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-6 py-4 pr-12 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-[#2D9B8A] dark:focus:border-[#2D9B8A] transition-colors"
            />
          <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"></div>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  selectedCategory === category
                    ? 'bg-linear-to-r from-[#2D9B8A] to-[#207a6c] text-white shadow-lg'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
              {category}
              </button>
          ))}
          </div>
      </div>

      <div className="text-gray-600 dark:text-gray-400 text-sm">
        {filteredMedications.length} Medications Found
        </div>

      {filteredMedications.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center">
          <BeakerIcon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
          <p className="text-gray-500 dark:text-gray-400 text-lg">
            No medications available matching your search
            </p>
        </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMedications.map((medication) => (
              <div key={medication.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all overflow-hidden">
              {medication.imageUrl ? (
                  <div className="h-48 bg-gray-100 dark:bg-gray-700/30">
                  <img src={medication.imageUrl} alt={medication.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                  <div className="h-48 bg-gray-100 dark:bg-gray-700/30 flex items-center justify-center">
                  <BeakerIcon className="w-16 h-16 text-gray-300 dark:text-gray-600" />
                </div>
              )}
                <div className="p-6 space-y-4">
                <div>
                  <h3 className="font-bold text-xl text-gray-800 dark:text-gray-100 mb-2">{medication.name}</h3>
                  <span className="inline-block px-3 py-1 bg-[#1E4D8C]/10 dark:bg-[#1E4D8C]/30 text-[#1E4D8C] dark:text-blue-400 rounded-full text-xs font-medium">
                    {medication.category}
                    </span>
                </div>
                {medication.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{medication.description}</p>
                )}
                  <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">In Stock:</span>
                    <span className="font-semibold text-gray-800 dark:text-gray-100">{medication.quantity} Units</span>
                  </div>
                  {medication.requiresPrescription && (
                      <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                      <span></span>
                      <span className="text-xs font-medium">Prescription Required</span>
                    </div>
                  )}
                  </div>
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Price</p>
                    <p className="text-2xl font-bold bg-linear-to-r from-[#1E4D8C] to-[#2D9B8A] bg-clip-text text-transparent">
                      {medication.price.toLocaleString()} RWF
                      </p>
                  </div>
                  <button
                      onClick={() => handleAddToCart(medication)}
                      className="bg-linear-to-r from-[#2D9B8A] to-[#207a6c] text-white px-4 py-3 rounded-xl font-semibold hover:from-[#207a6c] hover:to-[#185e53] transition-all shadow-lg flex items-center gap-2"
                    >
                    <ShoppingCartIcon className="w-5 h-5" />
                    Add to Cart
                    </button>
                </div>
              </div>
            </div>
          ))}
          </div>
      )}
      </div>
  </div>
);
}