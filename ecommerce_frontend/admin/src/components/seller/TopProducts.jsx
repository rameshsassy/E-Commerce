import React from 'react';
import { Package } from 'lucide-react';

const TopProducts = ({ products }) => {
  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h3 className="text-xl font-bold mb-6">Top Performing Products</h3>
      
      {products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 opacity-50">
          <Package size={48} className="mb-2" />
          <p className="text-text-muted">No sales data yet.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {products.map((product, index) => (
            <div key={product.id} className="flex items-center gap-4 p-4 bg-surface-hover rounded-xl border border-glass-border transition-all hover:border-primary/30 hover:shadow-glow">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-lg shrink-0">
                #{index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold truncate">{product.title}</p>
                <p className="text-xs text-text-muted mt-1">{product.quantity} Units Sold</p>
              </div>
              <div className="text-right shrink-0">
                <p className="font-bold text-success">Rs. {product.revenue.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TopProducts;
