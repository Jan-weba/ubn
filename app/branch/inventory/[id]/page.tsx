'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import LoadingSpinner from '@/components/shared/LoadingSpinner';
import { ArrowLeftIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const NAVY = '#1E4D8C';
const TEAL = '#2D9B8A';

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

export default function BranchEditMedicationPage() {
  const { t } = useTranslation();
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [backendReady, setBackendReady] = useState(true);
  const [med, setMed] = useState<any>(null);
  const [form, setForm] = useState<any>({});

  useEffect(() => { fetchMedication(); }, [params.id]);

  const fetchMedication = async () => {
    try {
      // GET /medications/:id is public — no role restriction — works for all roles
      const res = await api.get(`/medications/${params.id}`);
      const data = res.data;
      setMed(data);
      setForm({
        name: data.name || '',
        category: data.category || FDA_CATEGORIES[0],
        chemicalName: data.chemicalName || '',
        description: data.description || '',
        price: data.price || '',
        quantity: data.quantity || '',
        lowStockThreshold: data.lowStockThreshold ?? 10,
        requiresPrescription: data.requiresPrescription || false,
      });
    } catch {
      toast.error(t('errors.failedToLoadMedication'));
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // BACKEND PENDING: PUT /medications/:id
      // This endpoint currently restricts access to Role.PHARMACY only.
      // The backend team needs to add Role.BRANCH_MANAGER to the @Roles decorator
      // in medications.controller.ts. No frontend changes will be needed once done.
      await api.put(`/medications/${params.id}`, {
        name: form.name,
        category: form.category,
        chemicalName: form.chemicalName || undefined,
        description: form.description || undefined,
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity),
        lowStockThreshold: parseInt(form.lowStockThreshold),
        requiresPrescription: form.requiresPrescription,
      });
      toast.success(t('success.medicationUpdated'));
      router.push('/branch/inventory');
    } catch (err: any) {
      if (err?.response?.status === 403) {
        setBackendReady(false);
        toast.error(t('errors.backendNotEnabled'));
      } else {
        toast.error(err.response?.data?.message || t('errors.failedToLoad'));
      }
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-teal-400 transition-colors";
  const labelCls = "block text-sm font-semibold text-gray-700 mb-1";

  if (loading) return <div className="flex justify-center py-20"><LoadingSpinner /></div>;

  return (
    <div className="space-y-6 max-w-2xl mx-auto">

      <button onClick={() => router.push('/branch/inventory')}
        className="flex items-center gap-2 text-sm font-medium hover:underline"
        style={{ color: NAVY }}>
        <ArrowLeftIcon className="w-4 h-4" /> Back to Inventory
      </button>

      <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: NAVY }}>
        <h1 className="text-2xl font-bold">{t('branch.editMedication')}</h1>
        <p className="mt-1 text-white/70">{med?.name}</p>
      </div>

      {!backendReady && (
        <div className="flex items-start gap-3 px-4 py-4 rounded-xl border border-yellow-200 bg-yellow-50">
          <LockClosedIcon className="w-5 h-5 text-yellow-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">{t('branch.backendPending')}</p>
            <p className="text-xs text-yellow-700 mt-0.5">
              The backend team needs to add
              <span className="font-mono font-bold mx-1">Role.BRANCH_MANAGER</span>
              to the
              <span className="font-mono mx-1">PUT /medications/:id</span>
              endpoint. The form is fully built and will work immediately once access is granted.
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-gray-100 space-y-5">

        <div>
          <label className={labelCls}>Medication Name <span className="text-red-500">*</span></label>
          <input type="text" required value={form.name}
            onChange={e => setForm((f: any) => ({ ...f, name: e.target.value }))}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>{t('inventory.chemicalName')}</label>
          <input type="text" value={form.chemicalName}
            onChange={e => setForm((f: any) => ({ ...f, chemicalName: e.target.value }))}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Category <span className="text-red-500">*</span></label>
          <select required value={form.category}
            onChange={e => setForm((f: any) => ({ ...f, category: e.target.value }))}
            className={inputCls}>
            {FDA_CATEGORIES.map(c => <option key={c} value={c}>{t('medicationCategories.' + c) || c}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Price (RWF) <span className="text-red-500">*</span></label>
            <input type="number" required min="0" step="any" value={form.price}
              onChange={e => setForm((f: any) => ({ ...f, price: e.target.value }))}
              className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Quantity (units) <span className="text-red-500">*</span></label>
            <input type="number" required min="0" value={form.quantity}
              onChange={e => setForm((f: any) => ({ ...f, quantity: e.target.value }))}
              className={inputCls} />
          </div>
        </div>

        <div>
          <label className={labelCls}>{t('inventory.lowStockThresholdUnits')}</label>
          <input type="number" min="1" value={form.lowStockThreshold}
            onChange={e => setForm((f: any) => ({ ...f, lowStockThreshold: e.target.value }))}
            className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>{t('inventory.description')}</label>
          <textarea rows={3} value={form.description}
            onChange={e => setForm((f: any) => ({ ...f, description: e.target.value }))}
            className={`${inputCls} resize-none`} />
        </div>

        <div className="flex items-center gap-3">
          <input type="checkbox" id="rx" checked={form.requiresPrescription}
            onChange={e => setForm((f: any) => ({ ...f, requiresPrescription: e.target.checked }))}
            className="w-4 h-4 rounded" />
          <label htmlFor="rx" className="text-sm font-medium text-gray-700">{t('inventory.requiresPrescription')}</label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.push('/branch/inventory')}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all">
            Cancel
          </button>
          <button type="submit" disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
            style={{ backgroundColor: TEAL }}>
            {saving ? t('branch.saving') : t('common.saveChanges')}
          </button>
        </div>
      </form>
    </div>
  );
}
