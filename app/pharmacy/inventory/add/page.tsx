'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { ArrowLeftIcon, PlusIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline';

const FDA_CATEGORIES = [
  'Analgesics & Antipyretics', 'Antibiotics & Antimicrobials', 'Antifungals',
  'Antivirals & Antiretrovirals', 'Antimalaria', 'Antituberculosis',
  'Antiparasitics & Anthelmintics', 'Cardiovascular & Antihypertensives',
  'Antidiabetics', 'Gastrointestinal', 'Respiratory & Bronchodilators',
  'Central Nervous System', 'Vitamins, Minerals & Supplements', 'Dermatologicals',
  'Ophthalmologicals', 'ENT (Ear, Nose & Throat)', 'Hormones & Endocrine',
  'Vaccines & Biologicals', 'Oncologicals', 'Immunosuppressants', 'Contraceptives',
  'Haematologicals', 'Musculoskeletal & Anti-inflammatories', 'Urological',
  'Psychiatric & Psychotropic', 'Anesthetics', 'Diagnostics & Contrast Media',
  'Traditional & Herbal Medicines', 'Other',
];

type Mode = 'manual' | 'upload';

export default function AddMedicationPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('manual');
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<any[]>([]);
  const [branchesLoading, setBranchesLoading] = useState(true);

  const [form, setForm] = useState({
    name: '',
    branchId: '',
    category: FDA_CATEGORIES[0],
    chemicalName: '',
    description: '',
    price: '',           // correct DTO field name
    quantity: '',        // correct DTO field name
    lowStockThreshold: '10',
    requiresPrescription: false,
  });

  useEffect(() => {
    api.get('/branches/my-branches')
      .then(res => {
        const list = res.data?.data ?? res.data ?? [];
        setBranches(list);
        if (list.length === 1) setForm(f => ({ ...f, branchId: list[0].id }));
      })
      .catch(() => toast.error(t('errors.failedToLoadBranches')))
      .finally(() => setBranchesLoading(false));
  }, []);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.branchId) { toast.error(t('form.selectBranch')); return; }
    setLoading(true);
    try {
      await api.post('/medications', {
        branchId: form.branchId,
        name: form.name,
        chemicalName: form.chemicalName || undefined,
        description: form.description || undefined,
        category: form.category,
        price: parseFloat(form.price),           // correct field name
        quantity: parseInt(form.quantity),        // correct field name
        lowStockThreshold: parseInt(form.lowStockThreshold),
        requiresPrescription: form.requiresPrescription,
      });
      toast.success(t('success.medicationAdded'));
      router.push('/pharmacy/inventory');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to add medication');
    } finally { setLoading(false); }
  };

  const inputCls = "w-full px-3 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none text-sm";
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1";

  return (
    <div className="space-y-6">
    <div className="flex items-center gap-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm">
        <ArrowLeftIcon className="w-5 h-5" /> Back
        </button>
    </div>

    <div className="bg-linear-to-r from-[#1E4D8C] via-[#2563a8] to-[#1a3d6f] rounded-2xl p-6 text-white">
      <h1 className="text-2xl font-bold mb-1">{t('pharmacy.addMedication')}</h1>
      <p className="text-blue-100 text-sm">{t('inventory.addMedicationSubtitle')}</p>
    </div>

    {/* Mode switcher */}
      <div className="flex bg-white rounded-xl shadow-sm border border-gray-200 p-1 w-fit">
      <button onClick={() => setMode('manual')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'manual' ? 'bg-teal-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
        <PlusIcon className="w-4 h-4" /> Add Manually
        </button>
      <button onClick={() => setMode('upload')}
          className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${mode === 'upload' ? 'bg-teal-500 text-white shadow' : 'text-gray-600 hover:text-gray-900'}`}>
        <ArrowUpTrayIcon className="w-4 h-4" /> Upload File
        </button>
    </div>

    {/* Manual form */}
      {mode === 'manual' && (
        <form onSubmit={handleManualSubmit} className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-3">{t('inventory.medicationInfo')}</h2>

        {/* Branch selector — required */}
          <div>
          <label className={labelCls}>Branch <span className="text-red-500">*</span></label>
          {branchesLoading ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
          ) : (
              <select
                required
                value={form.branchId}
                onChange={e => setForm({ ...form, branchId: e.target.value })}
                className={inputCls}
              >
              <option value="">{t('inventory.selectBranch')}</option>
              {branches.map((b: any) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
              ))}
              </select>
          )}
            <p className="text-xs text-gray-500 mt-1">{t('inventory.medicationAddedToBranch')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Medication Name <span className="text-red-500">*</span></label>
            <input type="text" required value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className={inputCls} placeholder="e.g. Paracetamol 500mg" />
          </div>
          <div>
            <label className={labelCls}>{t('inventory.genericName')}</label>
            <input type="text" value={form.chemicalName}
                onChange={e => setForm({ ...form, chemicalName: e.target.value })}
                className={inputCls} placeholder="e.g. Acetaminophen" />
          </div>
          <div>
            <label className={labelCls}>Category <span className="text-red-500">*</span></label>
            <select required value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className={inputCls}>
              {FDA_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            <p className="text-xs text-gray-500 mt-1">{t('inventory.rwandaFdaCategories')}</p>
          </div>
          <div>
            <label className={labelCls}>Unit Price (RWF) <span className="text-red-500">*</span></label>
            <input type="number" required min="0" step="0.01" value={form.price}
                onChange={e => setForm({ ...form, price: e.target.value })}
                className={inputCls} placeholder="e.g. 500" />
          </div>
          <div>
            <label className={labelCls}>Quantity In Stock <span className="text-red-500">*</span></label>
            <input type="number" required min="0" value={form.quantity}
                onChange={e => setForm({ ...form, quantity: e.target.value })}
                className={inputCls} placeholder="e.g. 100" />
          </div>
          <div>
            <label className={labelCls}>{t('inventory.lowStockThresholdUnits')}</label>
            <input type="number" min="1" value={form.lowStockThreshold}
                onChange={e => setForm({ ...form, lowStockThreshold: e.target.value })}
                className={inputCls} placeholder="e.g. 10" />
            <p className="text-xs text-gray-500 mt-1">{t('inventory.alertWhenBelow')}</p>
          </div>
        </div>

        <div>
          <label className={labelCls}>{t('inventory.description')}</label>
          <textarea value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              className={`${inputCls} resize-none`} rows={3}
              placeholder={t('inventory.searchPlaceholder')} />
        </div>

        <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <input type="checkbox" id="prescription" checked={form.requiresPrescription}
              onChange={e => setForm({ ...form, requiresPrescription: e.target.checked })}
              className="w-4 h-4 text-teal-500 rounded" />
          <label htmlFor="prescription" className="text-sm font-medium text-gray-700">
            Requires Prescription — this medication will only be dispensed with a valid prescription
            </label>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
              className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50">
            Cancel
            </button>
          <button type="submit" disabled={loading}
              className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-2">
            {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : 'Add Medication'}
            </button>
        </div>
      </form>
    )}

      {/* Upload mode — bulk upload endpoint doesn't exist on backend, show info */}
      {mode === 'upload' && (
        <div className="bg-white rounded-xl shadow-md p-6 space-y-5">
        <h2 className="text-lg font-bold text-gray-900 border-b pb-3">{t('inventory.bulkUpload')}</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 text-sm text-amber-800">
          <p className="font-semibold mb-1">{t('inventory.bulkUploadNotAvailable')}</p>
          <p className="text-amber-700">{t('inventory.bulkUploadDesc')}</p>
        </div>
        <button onClick={() => setMode('manual')}
            className="px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium">
          Switch to Manual Entry
          </button>
      </div>
    )}
    </div>
);
}
