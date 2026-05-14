// frontend/src/components/pharmacy/SupportBot.tsx

'use client';

import { useTranslation } from 'react-i18next';

import { useState } from 'react';
import { ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface SupportBotProps {
  open?: boolean;
  onOpen?: () => void;
  onClose?: () => void;
}

export default function SupportBot({
  open: openProp, onOpen, onClose }: SupportBotProps) {
  const { t } = useTranslation();
  const [internalOpen, setInternalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', issue: '' });

  // If props are provided, use them (controlled). Otherwise manage state internally.
  const isOpen     = openProp  !== undefined ? openProp  : internalOpen;
  const handleOpen  = onOpen  ?? (() => setInternalOpen(true));
  const handleClose = onClose ?? (() => setInternalOpen(false));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);

      // Reset form and close modal after 2 seconds
      setTimeout(() => {
        setFormData({ name: '', email: '', issue: '' });
        setSubmitSuccess(false);
        handleClose();
      }, 2000);
    }, 1000);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <>
    {/* Floating Support Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-teal-500 hover:bg-teal-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-110"
        aria-label={t('supportBot.contactSupport')}
      >
      <ChatBubbleLeftRightIcon className="w-6 h-6" />
    </button>

    {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

        {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
          {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
            <XMarkIcon className="w-6 h-6" />
          </button>

          {/* Header */}
            <div className="mb-6">
            <div className="w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center mb-4">
              <ChatBubbleLeftRightIcon className="w-6 h-6 text-teal-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">{t('supportBot.contactSupport')}</h2>
            <p className="text-gray-600 text-sm mt-1">
              {t('supportBot.hereToHelp')}
              </p>
          </div>

          {/* Success Message */}
            {submitSuccess ? (
              <div className="py-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('supportBot.messageSent')}</h3>
              <p className="text-gray-600">{t('supportBot.getBackSoon')}</p>
            </div>
          ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">{t('supportBot.fullName')}</label>
                <input
                    type="text" id="name" name="name" value={formData.name}
                    onChange={handleChange} required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder={t('form.name')}
                  />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">{t('supportBot.emailAddress')}</label>
                <input
                    type="email" id="email" name="email" value={formData.email}
                    onChange={handleChange} required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all"
                    placeholder={t('form.email')}
                  />
              </div>
              <div>
                <label htmlFor="issue" className="block text-sm font-medium text-gray-700 mb-1">{t('supportBot.describeIssue')}</label>
                <textarea
                    id="issue" name="issue" value={formData.issue}
                    onChange={handleChange} required rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent outline-none transition-all resize-none"
                    placeholder={t('supportBot.describeIssuePlaceholder')}
                  />
              </div>
              <button
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-teal-500 hover:bg-teal-600 disabled:bg-teal-300 text-white font-medium py-3 rounded-lg transition-colors"
                >
                {isSubmitting ? t('common.saving') : t('supportBot.sendMessage')}
                </button>
            </form>
          )}
          </div>
      </div>
    )}
    </>
);
}

