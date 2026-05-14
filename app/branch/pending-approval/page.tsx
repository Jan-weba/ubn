// frontend/src/app/branch/pending-approval/page.tsx
// This page handles the INVITED/PENDING branch status flow:
// Branch manager changes temp password -> uploads pharmacy license -> awaits super admin approval

'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { CloudArrowUpIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

type BranchStatus = 'INVITED' | 'PENDING' | 'APPROVED' | 'REJECTED';

export default function BranchPendingApprovalPage() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [branchStatus, setBranchStatus] = useState<BranchStatus>('INVITED');

  // Read branchStatus from user object (set during login)
  useEffect(() => {
    if ((user as any)?.branchStatus) {
      setBranchStatus((user as any).branchStatus);
    }
  }, [user]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      toast.error(t('form.pleaseSelectFile'));
      return;
    }
    setUploading(true);
    try {
      // Step 1: Upload file to S3 via POST /upload/license (multipart)
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await api.post('/upload/license', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const { url } = uploadRes.data;

      // Step 2: Link license URL to branch via PUT /auth/branch/upload-license
      await api.put('/auth/branch/upload-license', { pharmacyLicense: url });

      toast.success(t('success.licenseUploaded'));
      setBranchStatus('PENDING');
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('pendingApproval.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const isPending = branchStatus === 'PENDING';

  return (
    <div className="min-h-screen bg-linear-to-br from-emerald-50 to-teal-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
        {/* Status icon */}
          <div className="text-center mb-8">
          <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 ${
              isPending ? 'bg-yellow-100' : 'bg-emerald-100'
            }`}>
            {isPending
                ? <ClockIcon className="w-8 h-8 text-yellow-600" />
              : <CloudArrowUpIcon className="w-8 h-8 text-emerald-600" />
            }
            </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {isPending ? t('pendingApproval.underReview') : t('pendingApproval.uploadBranchLicense')}
            </h1>
          <p className="text-sm text-gray-500 mt-2">
            {isPending
                ? 'Your branch license has been submitted. Our team will review it and approve your branch shortly.'
                : 'To activate your branch, please upload your pharmacy license. This will be reviewed by our admin team.'
              }
            </p>
        </div>

        {isPending ? (
            // Waiting state
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-xl p-4 text-center">
            <p className="text-yellow-800 dark:text-yellow-400 font-medium text-sm">
              Approval typically takes 1-2 business days
              </p>
            <p className="text-yellow-600 dark:text-yellow-500 text-xs mt-1">
              You will be notified once your branch is approved
              </p>
          </div>
        ) : (
            // Upload form
            <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Pharmacy License (PDF or image)
                </label>
              <div
                  className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                    file
                      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-300 dark:border-gray-600 hover:border-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/10'
                  }`}
                  onClick={() => document.getElementById('license-input')?.click()}
                >
                <CloudArrowUpIcon className={`w-8 h-8 mx-auto mb-2 ${file ? 'text-emerald-500' : 'text-gray-400'}`} />
                {file ? (
                    <>
                    <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{file.name}</p>
                    <p className="text-xs text-emerald-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                    <>
                    <p className="text-sm text-gray-500">{t('pendingApproval.clickToSelectFile')}</p>
                    <p className="text-xs text-gray-400 mt-1">{t('pendingApproval.fileTypes')}</p>
                  </>
                )}
                </div>
              <input
                  id="license-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={e => setFile(e.target.files?.[0] || null)}
                />
            </div>

            <button
                type="submit"
                disabled={!file || uploading}
                className="w-full text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: "#2D9B8A" }}
              >
              {uploading ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('pendingApproval.uploading')}</>
              ) : (
                  <><CheckCircleIcon className="w-5 h-5" /> Submit License</>
              )}
              </button>
          </form>
        )}

          <button
            onClick={logout}
            className="w-full mt-4 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          >
          Log out
          </button>
      </div>
    </div>
  </div>
);
}