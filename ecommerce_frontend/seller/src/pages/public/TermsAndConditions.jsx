import { Link } from 'react-router-dom';

export default function TermsAndConditions() {
  return (
    <div className="max-w-3xl mx-auto p-6 md:p-10 animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Terms and Conditions</h1>
      <p className="text-text-muted text-sm mb-8">Last updated: May 2026</p>

      <div className="glass-panel p-6 md:p-8 space-y-6 text-sm text-text-muted leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-text mb-2">Seller agreement</h2>
          <p>
            By registering as a seller on Aashansh, you confirm that you are authorised to represent
            the organisation you list, that the information you provide is accurate, and that you
            will comply with applicable laws. Aashansh may store and use your data to operate the
            marketplace, verify your identity, and process orders.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text mb-2">Marketplace use</h2>
          <p>
            Sellers are responsible for product listings, pricing, fulfilment, and customer
            communication within platform policies. Aashansh may approve, reject, or remove listings
            that violate guidelines.
          </p>
        </section>
        <section>
          <h2 className="text-lg font-semibold text-text mb-2">Contact</h2>
          <p>
            For questions about these terms, use the{' '}
            <Link to="/support" className="text-primary hover:underline">
              Support
            </Link>{' '}
            page.
          </p>
        </section>
      </div>

      <p className="mt-8">
        <Link to="/" className="text-primary hover:underline text-sm">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
