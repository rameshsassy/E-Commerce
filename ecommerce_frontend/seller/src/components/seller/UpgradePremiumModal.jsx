import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Zap, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const DEFAULT_REDIRECT_MS = 4500;

export default function UpgradePremiumModal({
  open,
  onClose,
  feature = 'premium',
  autoRedirect = false,
  redirectDelayMs = DEFAULT_REDIRECT_MS,
}) {
  const navigate = useNavigate();
  const [secondsLeft, setSecondsLeft] = useState(Math.ceil(redirectDelayMs / 1000));
  const { user } = useAuth();
  const plan = user?.subscriptionPlan || 'free';

  const COPY = {
    multiple_addresses: {
      title: 'Upgrade to add more addresses',
      body: plan === 'pro'
        ? 'Your pro plan has a limit on store addresses. Upgrade to Premium to add unlimited pickup and warehouse locations.'
        : 'Your free plan includes one store address. Upgrade to Pro or Premium to add pickup and warehouse locations.',
    },
    multiple_stores: {
      title: 'Upgrade to create more stores',
      body: plan === 'pro'
        ? 'Your pro plan includes up to 5 storefronts. Upgrade to Premium to run unlimited stores.'
        : 'Your free plan includes one storefront. Upgrade to Pro or Premium to run multiple branded stores.',
    },
    multiple_categories: {
      title: 'Upgrade required',
      body: 'You need to upgrade to Pro or Premium to use multiple category paths.',
    },
    free_category_path: {
      title: 'Pro and Premium Feature',
      body: 'Listing products under multiple categories is only available for Pro and Premium sellers. Upgrade to Pro or Premium to list products in multiple categories.',
    },
    bulk_purchase: {
      title: 'Pro and Premium Feature',
      body: 'Bulk Purchase / B2B is only available for Pro and Premium sellers. Upgrade to Pro or Premium to enable B2B inquiries.',
    },
    premium: {
      title: 'Pro and Premium Feature',
      body: 'Subscription and Custom Order purchase types are only available for Pro and Premium sellers. Upgrade to Pro or Premium to unlock these options.',
    },
  };

  useEffect(() => {
    if (!open || !autoRedirect) return undefined;

    setSecondsLeft(Math.ceil(redirectDelayMs / 1000));
    const redirectTimer = setTimeout(() => {
      onClose();
      navigate('/seller/premium');
    }, redirectDelayMs);

    const tick = setInterval(() => {
      setSecondsLeft((s) => Math.max(0, s - 1));
    }, 1000);

    return () => {
      clearTimeout(redirectTimer);
      clearInterval(tick);
    };
  }, [open, autoRedirect, redirectDelayMs, navigate, onClose]);

  if (!open) return null;

  const copy = COPY[feature] || COPY.premium;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-premium-title"
      onClick={autoRedirect ? undefined : onClose}
    >
      <div
        className="relative w-full max-w-md rounded-2xl bg-white shadow-xl border border-[#E1E3E5] p-6 text-[#202223]"
        onClick={(e) => e.stopPropagation()}
      >
        {!autoRedirect && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 text-[#6D7175] hover:text-[#202223] p-1"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        <div className="flex items-center gap-3 mb-4 pr-8">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#FFF4E5] text-[#B98900]">
            <Zap size={22} fill="currentColor" />
          </span>
          <h2 id="upgrade-premium-title" className="text-lg font-bold">
            {copy.title}
          </h2>
        </div>

        <p className="text-[14px] text-[#6D7175] leading-relaxed mb-4">{copy.body}</p>

        {autoRedirect ? (
          <p className="text-[13px] text-[#202223] font-medium">
            Redirecting to Premium in {secondsLeft}s…
          </p>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/seller/premium');
              }}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md bg-[#008060] hover:bg-[#006e52] text-white font-medium text-[14px]"
            >
              <Zap size={16} />
              Upgrade now
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-md border border-[#8C9196] text-[#202223] font-medium text-[14px] hover:bg-[#F6F6F7]"
            >
              Not now
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
