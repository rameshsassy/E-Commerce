import { Link, Outlet } from 'react-router-dom';

/** Minimal shell for seller.aashansh.org login / register pages */
export default function SellerAuthLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-bg">
      <header className="p-4 md:p-6 border-b border-glass-border">
        <Link to="/login" className="inline-flex items-center gap-3">
          <img
            src="/brand/aashansh-logo.png"
            alt="Aashansh"
            className="h-10 w-auto object-contain"
          />
          <span className="text-sm font-semibold text-text-muted">Seller Portal</span>
        </Link>
      </header>
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>
    </div>
  );
}
