import React from 'react';

const TIMELINE_KEYS = [
  'orderPlaced',
  'orderAccepted',
  'orderDispatched',
  'orderShipped',
  'orderInTransit',
  'orderDelivered',
  'estimatedDelivery',
];

export default function OrderStatusTimeline({ timeline, activeIndex }) {
  const steps = TIMELINE_KEYS.map((key) => timeline?.[key]).filter((s) => s?.label);

  return (
    <div className="bg-white rounded-2xl border-2 border-gray-900 p-6 md:p-8 overflow-x-auto">
      <h3 className="text-lg font-bold text-gray-900 mb-8">Order Status</h3>
      <div className="min-w-[720px] relative pt-2 pb-4">
        <div className="absolute top-[18px] left-4 right-4 h-1 bg-gray-300 rounded-full" aria-hidden />
        <div
          className="absolute top-[18px] left-4 h-1 bg-[#FFE566] rounded-full transition-all duration-300"
          style={{
            width:
              activeIndex <= 0 || steps.length <= 1
                ? '0%'
                : `calc(${(activeIndex / (steps.length - 1)) * 100}% - 2rem)`,
            maxWidth: 'calc(100% - 2rem)',
          }}
          aria-hidden
        />
        <div className="relative flex justify-between gap-2">
          {steps.map((step, i) => {
            const done = i <= activeIndex;
            return (
              <div key={step.label} className="flex flex-col items-center text-center flex-1 min-w-[90px]">
                <div
                  className={`w-4 h-4 rounded-full border-2 border-gray-900 z-10 ${
                    done ? 'bg-[#FFE566] scale-125' : 'bg-gray-500'
                  }`}
                />
                <p className="mt-4 text-xs italic text-gray-800 font-medium leading-tight">{step.label}</p>
                <p className="mt-1 text-[10px] text-gray-600 whitespace-nowrap">{step.formatted || '—'}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
