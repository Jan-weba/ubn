// frontend/src/app/pharmacy/inventory/[id]/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import PharmacyTopbar from '@/components/pharmacy/PharmacyTopbar';
import PharmacySidebar from '@/components/pharmacy/PharmacySidebar';
import SupportBot from '@/components/pharmacy/SupportBot';
import { ArrowLeftIcon, PencilIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FDA_CATEGORIES = [
  'Analgesics & Antipyretics','Antibiotics & Antimicrobials','Antifungals','Antivirals & Antiretrovirals',
  'Antimalaria','Antituberculosis','Antiparasitics & Anthelmintics','Cardiovascular & Antihypertensives',
  'Antidiabetics','Gastrointestinal','Respiratory & Bronchodilators','Central Nervous System',
  'Vitamins, Minerals & Supplements','Dermatologicals','Ophthalmologicals','ENT (Ear, Nose & Throat)',
  'Hormones & Endocrine','Vaccines & Biologicals','Oncologicals','Immunosuppressants',
  'Contraceptives','Haematologicals','Musculoskeletal & Anti-inflammatories','Urological',
  'Psychiatric & Psychotropic','Anesthetics','Diagnostics & Contrast Media',
  'Traditional & Herbal Medicines','Other',
];

export default function EditMedicationPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [med, setMed] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => { fetchMedication(); }, [params.id]);

  const fetchMedication = async () => {
    try {
      const res = await api.get(`/medications/${params.id}`);
      setMed(res.data);
      setForm({
        name: res.data.name || '',
        category: res.data.category || FDA_CATEGORIES[0],
        dosage: res.data.dosage || '',
        description: res.data.description || '',
        unitPrice: res.data.unitPrice || res.data.price || '',
        quantityInStock: res.data.quantityInStock || res.data.quantity || '',
        lowStockThreshold: res.data.lowStockThreshold || '10',
        requiresPrescription: res.data.requiresPrescription || false,
        manufacturer: res.data.manufacturer || '',
        expiryDate: res.data.expiryDate ? new Date(res.data.expiryDate).toISOString().split('T')[0] : '',
      });
    } catch { toast.error(t('errors.failedToLoadMedication')); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/medications/${params.id}`, {
        name: form.name,
        category: form.category,
        chemicalName: form.dosage || undefined,
        description: form.description || undefined,
        price: parseFloat(form.unitPrice),       // correct field name
        quantity: parseInt(form.quantityInStock), // correct field name
        lowStockThreshold: parseInt(form.lowStockThreshold),
        requiresPrescription: form.requiresPrescription,
      });
      toast.success(t('success.medicationUpdated'));
      setEditing(false);
      fetchMedication();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to remove "${med?.name}" from inventory?`)) return;
    setDeleting(true);
    try {
      await api.delete(`/medications/${params.id}`);
      toast.success(t('success.medicationRemoved'));
      router.push('/pharmacy/inventory');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally { setDeleting(false); }
  };

  const inputCls = "w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm";
  const viewCls = "w-full px-3 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-lg text-sm text-gray-800";

  if (loading) return (
    <div className="flex min-h-screen bg-gray-50">
    <PharmacySidebar /><SupportBot />
    <div className="flex-1 flex flex-col lg:ml-72"><PharmacyTopbar />
      <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
    </div>
  </div>
);

  if (!med) return null;

  const stockStatus = form.quantityInStock == 0 ? 'out' :
    form.quantityInStock <= (form.lowStockThreshold || 10) ? 'low' : 'ok';

  return (
    <div className="flex min-h-screen bg-gray-50">
    <PharmacySidebar /><SupportBot />
    <div className="flex-1 flex flex-col lg:ml-72">
      <PharmacyTopbar />
      <main className="flex-1 p-4 lg:p-8 overflow-auto">
        <div className="max-w-3xl mx-auto space-y-6">

          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
            <ArrowLeftIcon className="w-4 h-4" /> Back to Inventory
            </button>

          {/* Header card */}
            <div className="bg-linear-to-r from-[#1E4D8C] to-[#2563a8] rounded-2xl p-6 text-white flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">{med.name}</h1>
              <p className="text-blue-200 text-sm">{med.category}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                stockStatus === 'out' ? 'bg-red-500 text-white' :
                stockStatus === 'low' ? 'bg-yellow-400 text-yellow-900' :
                'bg-green-400 text-green-900'
              }`}>
              {stockStatus === 'out' ? 'Out of Stock' : stockStatus === 'low' ? 'Low Stock' : 'In Stock'}
              </span>
          </div>

          {/* Actions bar */}
            <div className="flex gap-3">
            {!editing ? (
                <>
                <button onClick={() => setEditing(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium">
                  <PencilIcon className="w-4 h-4" /> Edit Medication
                  </button>
                <button onClick={handleDelete} disabled={deleting}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  <TrashIcon className="w-4 h-4" /> {deleting ? 'Removing...' : 'Remove'}
                  </button>
              </>
            ) : (
                <>
                <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                  <CheckIcon className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                <button onClick={() => { setEditing(false); fetchMedication(); }}
                    className="flex items-center gap-2 px-5 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">
                  <XMarkIcon className="w-4 h-4" /> Cancel
                  </button>
              </>
            )}
            </div>

          {/* Form / View */}
            <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
            <h2 className="text-base font-bold text-gray-900 border-b pb-3">{t('inventory.medicationInfo')}</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('common.name')}</label>
                {editing
                    ? <input type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className={inputCls} />
                  : <div className={viewCls}>{form.name}</div>}
                </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('pharmacy.category')}</label>
                {editing
                    ? <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className={inputCls}>
                      {FDA_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                  : <div className={viewCls}>{form.category}</div>}
                </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('inventory.dosageStrength')}</label>
                {editing
                    ? <input type="text" value={form.dosage} onChange={e => setForm({...form, dosage: e.target.value})} className={inputCls} />
                  : <div className={viewCls}>{form.dosage || '—'}</div>}
                </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('inventory.manufacturer')}</label>
                {editing
                    ? <input type="text" value={form.manufacturer} onChange={e => setForm({...form, manufacturer: e.target.value})} className={inputCls} />
                  : <div className={viewCls}>{form.manufacturer || '—'}</div>}
                </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('inventory.unitPriceRwf')}</label>
                {editing
                    ? <input type="number" min="0" value={form.unitPrice} onChange={e => setForm({...form, unitPrice: e.target.value})} className={inputCls} />
                  : <div className={`${viewCls} font-semibold text-teal-600`}>{Number(form.unitPrice).toLocaleString()} RWF</div>}
                </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('inventory.quantityInStock')}</label>
                {editing
                    ? <input type="number" min="0" value={form.quantityInStock} onChange={e => setForm({...form, quantityInStock: e.target.value})} className={inputCls} />
                  : <div className={`${viewCls} ${stockStatus !== 'ok' ? 'text-red-600 font-semibold' : ''}`}>{form.quantityInStock} units</div>}
                </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('pharmacy.lowStockThreshold')}</label>
                {editing
                    ? <input type="number" min="1" value={form.lowStockThreshold} onChange={e => setForm({...form, lowStockThreshold: e.target.value})} className={inputCls} />
                  : <div className={viewCls}>{form.lowStockThreshold} units</div>}
                </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">{t('inventory.expiryDate')}</label>
                {editing
                    ? <input type="date" value={form.expiryDate} onChange={e => setForm({...form, expiryDate: e.target.value})} className={inputCls} />
                  : <div className={viewCls}>{form.expiryDate || '—'}</div>}
                </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">{t('inventory.description')}</label>
              {editing
                  ? <textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} className={`${inputCls} resize-none`} rows={3} />
                : <div className={`${viewCls} min-h-[60px]`}>{form.description || '—'}</div>}
              </div>

            <div className={`flex items-center gap-3 p-3 rounded-lg ${form.requiresPrescription ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50 border border-gray-200'}`}>
              {editing
                  ? <input type="checkbox" checked={form.requiresPrescription} onChange={e => setForm({...form, requiresPrescription: e.target.checked})} className="w-4 h-4 text-teal-500 rounded" />
                : <span>{form.requiresPrescription ? '' : ''}</span>}
                <span className="text-sm font-medium text-gray-700">
                {form.requiresPrescription ? 'Requires Prescription' : 'No Prescription Required'}
                </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
);
}