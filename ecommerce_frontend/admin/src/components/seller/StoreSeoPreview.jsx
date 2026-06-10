import { buildSeoPreviewFromForm } from '../../utils/storeSeo';

export default function StoreSeoPreview({ storeForm, sellerMeta, seoFromServer }) {
  const seo = seoFromServer || buildSeoPreviewFromForm(storeForm, sellerMeta);

  if (!seo.metaTitle && !seo.metaDescription && !seo.metaKeywords) {
    return null;
  }

  return (
    <div className="mt-6 p-4 rounded-lg border border-[#E1E3E5] bg-[#F6F6F7] text-[13px] text-[#202223]">
      <p className="font-semibold mb-3 text-[14px]">Store SEO preview</p>
      <dl className="space-y-2">
        <div>
          <dt className="text-[#6D7175] text-[12px]">Meta title</dt>
          <dd className="font-medium break-words">{seo.metaTitle || '—'}</dd>
        </div>
        <div>
          <dt className="text-[#6D7175] text-[12px]">Meta description</dt>
          <dd className="break-words">
            {seo.metaDescription || (
              <span className="text-[#B98900]">
                Add your elevator pitch in Profile &amp; KYC to populate this field.
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt className="text-[#6D7175] text-[12px]">Meta keywords</dt>
          <dd className="break-words">{seo.metaKeywords || '—'}</dd>
        </div>
      </dl>
      <p className="text-[11px] text-[#6D7175] mt-3">
        Title format: Shop Now | Store name | Seller legal name (from KYC official name).
      </p>
    </div>
  );
}
