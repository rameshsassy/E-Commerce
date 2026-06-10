import { MessageCircle, Lock } from 'lucide-react';
import { getProductLockMessage, getProductLockWhatsAppUrl } from '../../utils/productLock';

export default function ApprovedProductLockBanner({ product, className = '' }) {
  const whatsappUrl = getProductLockWhatsAppUrl(product);

  return (
    <div
      className={`rounded-xl border border-[#FED7AA] bg-[#FFF8F0] p-4 md:p-5 text-[#202223] ${className}`}
      role="alert"
    >
      <div className="flex gap-3 items-start">
        <div className="shrink-0 w-10 h-10 rounded-full bg-[#F59E0B]/15 text-[#B45309] flex items-center justify-center">
          <Lock size={20} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[15px] mb-1">Product locked after approval</p>
          <p className="text-sm text-[#6D7175] leading-relaxed">
            {getProductLockMessage(product?.title)}
          </p>
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 mt-3 px-4 py-2 rounded-md bg-[#25D366] hover:bg-[#1ebe57] text-white text-sm font-semibold transition-colors"
          >
            <MessageCircle size={18} />
            Contact on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
