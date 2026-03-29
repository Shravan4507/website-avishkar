import React, { createContext, useContext, useState, useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { useToast } from '../toast/Toast';
import { useShakeDetector } from '../../hooks/useShakeDetector';
import { X, Bug } from 'lucide-react';
import './BugReport.css';

// ── Types ──
type BugCategory = 'ui' | 'payment' | 'registration' | 'performance' | 'other';

interface BugReportContextValue {
  openBugReport: () => void;
}

const BugReportContext = createContext<BugReportContextValue | null>(null);

// ── Hook ──
export const useBugReport = (): BugReportContextValue => {
  const ctx = useContext(BugReportContext);
  if (!ctx) throw new Error('useBugReport must be used inside <BugReportProvider>');
  return ctx;
};

// ── Provider + Modal ──
export const BugReportProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<BugCategory>('ui');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const openBugReport = useCallback(() => setIsOpen(true), []);
  const closeBugReport = useCallback(() => {
    if (!submitting) {
      setIsOpen(false);
      setDescription('');
      setCategory('ui');
    }
  }, [submitting]);

  // Shake-to-report (mobile only)
  useShakeDetector(openBugReport);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      toast.warning('Please describe the bug in at least 10 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const user = auth.currentUser;
      await addDoc(collection(db, 'bug_reports'), {
        category,
        description: description.trim(),
        pageUrl: window.location.href,
        userAgent: navigator.userAgent,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        userId: user?.uid || null,
        userEmail: user?.email || null,
        createdAt: serverTimestamp(),
      });

      toast.success('Bug reported! Thanks for helping us improve.');
      closeBugReport();
    } catch (err) {
      console.error('Bug report submission failed:', err);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const CATEGORIES: { value: BugCategory; label: string }[] = [
    { value: 'ui', label: 'UI / Visual Issue' },
    { value: 'payment', label: 'Payment Problem' },
    { value: 'registration', label: 'Registration Issue' },
    { value: 'performance', label: 'Performance / Slow' },
    { value: 'other', label: 'Other' },
  ];

  return (
    <BugReportContext.Provider value={{ openBugReport }}>
      {children}

      {isOpen && (
        <div className="bug-report-overlay" onClick={closeBugReport}>
          <div className="bug-report-modal" onClick={(e) => e.stopPropagation()}>
            <button className="bug-report-close" onClick={closeBugReport} aria-label="Close">
              <X size={18} />
            </button>

            <div className="bug-report-header">
              <h2 className="bug-report-title"><Bug size={22} /> Report a Bug</h2>
              <p className="bug-report-subtitle">Found something off? Let us know.</p>
            </div>

            <form className="bug-report-form" onSubmit={handleSubmit}>
              <div className="bug-field">
                <label htmlFor="bug-category">Category</label>
                <select
                  id="bug-category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as BugCategory)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="bug-field">
                <label htmlFor="bug-description">What happened?</label>
                <textarea
                  id="bug-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe the bug you encountered..."
                  maxLength={1000}
                />
              </div>

              <button
                type="submit"
                className="bug-submit-btn"
                disabled={submitting || description.trim().length < 10}
              >
                {submitting ? 'Submitting...' : 'Submit Report'}
              </button>

              <p className="bug-meta-note">
                Page URL and device info are automatically included.
              </p>
            </form>
          </div>
        </div>
      )}
    </BugReportContext.Provider>
  );
};
