import React, { useState } from 'react';

interface RegistryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegistryModal: React.FC<RegistryModalProps> = ({ isOpen, onClose }) => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyDetails = (itemTitle: string) => {
    const textToCopy = `James & Amber Wedding - ${itemTitle}: BDO Savings 0045 2819 4021 (Amber Marie C.) / GCash 0917 842 9014 (James Alexander P.)`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(textToCopy).catch(() => {});
    }
    setToastMessage(`Details for "${itemTitle}" copied to clipboard!`);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  return (
    <div className="fixed inset-0 z-50 items-center justify-center p-3 sm:p-4 modal-backdrop bg-black/60 transition-opacity flex">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-4 sm:p-7 shadow-2xl border border-stone-200 relative max-h-[92vh] flex flex-col overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close Registry Modal"
          className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 w-8 h-8 rounded-full bg-stone-100/90 text-stone-400 hover:text-stone-700 hover:bg-stone-200 transition flex items-center justify-center cursor-pointer shadow-sm"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>

        {/* Compact Registry Header */}
        <div className="text-center mb-2 sm:mb-4 shrink-0 pr-6 pl-2">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-primary/10 text-red-primary flex items-center justify-center mx-auto mb-1 shadow-sm">
            <span className="material-symbols-outlined text-lg sm:text-xl">card_giftcard</span>
          </div>
          <p className="font-script text-xl sm:text-3xl text-red-primary leading-tight">James &amp; Amber</p>
          <h3 className="font-editorial text-sm sm:text-xl uppercase tracking-wider text-stone-900 mt-0.5">
            Gift Registry
          </h3>
          <p className="text-[10px] sm:text-xs text-stone-500 font-sans-ui mt-0.5 max-w-md mx-auto leading-tight sm:leading-relaxed">
            Your love and presence are the greatest gifts. If you'd like to help us begin our married life together, here are items &amp; experiences we treasure.
          </p>
        </div>

        {/* Inner Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2.5 sm:space-y-3.5 pr-1">
          {/* Registry Items Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            {/* Item 1: Spain Honeymoon Fund */}
            <div className="bg-beige-paper border border-stone-200 rounded-xl p-2 sm:p-3 flex flex-col justify-between hover:border-red-primary/30 transition shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base sm:text-lg">flight_takeoff</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-editorial text-xs sm:text-sm font-semibold text-stone-900 leading-tight">
                    Spain Honeymoon Fund
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-600 font-sans-ui mt-0.5 leading-tight">
                    Madrid &amp; Seville exploration.
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-stone-200/70 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-red-primary font-label">Any Amount</span>
                <button
                  type="button"
                  onClick={() => copyDetails('Spain Honeymoon Fund')}
                  className="px-2 sm:px-2.5 py-1 bg-red-primary hover:bg-red-accent text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-label rounded-lg transition cursor-pointer"
                >
                  Contribute
                </button>
              </div>
            </div>

            {/* Item 2: Artisan Ceramic Dining Set */}
            <div className="bg-beige-paper border border-stone-200 rounded-xl p-2 sm:p-3 flex flex-col justify-between hover:border-red-primary/30 transition shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base sm:text-lg">dinner_dining</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-editorial text-xs sm:text-sm font-semibold text-stone-900 leading-tight">
                    Artisan Dining Set
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-600 font-sans-ui mt-0.5 leading-tight">
                    Handcrafted 16-pc stoneware.
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-stone-200/70 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-stone-700 font-label">PHP 8,500</span>
                <button
                  type="button"
                  onClick={() => copyDetails('Ceramic Dining Set')}
                  className="px-2 sm:px-2.5 py-1 bg-blue-primary hover:bg-blue-dark text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-label rounded-lg transition cursor-pointer"
                >
                  Gift This
                </button>
              </div>
            </div>

            {/* Item 3: Espresso & Coffee Station */}
            <div className="bg-beige-paper border border-stone-200 rounded-xl p-2 sm:p-3 flex flex-col justify-between hover:border-red-primary/30 transition shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-stone-200 text-stone-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base sm:text-lg">coffee_maker</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-editorial text-xs sm:text-sm font-semibold text-stone-900 leading-tight">
                    Espresso &amp; Coffee Station
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-600 font-sans-ui mt-0.5 leading-tight">
                    Morning rituals &amp; hosting.
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-stone-200/70 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-stone-700 font-label">PHP 12,000</span>
                <button
                  type="button"
                  onClick={() => copyDetails('Espresso Station')}
                  className="px-2 sm:px-2.5 py-1 bg-blue-primary hover:bg-blue-dark text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-label rounded-lg transition cursor-pointer"
                >
                  Gift This
                </button>
              </div>
            </div>

            {/* Item 4: Fine Linen Bedding Set */}
            <div className="bg-beige-paper border border-stone-200 rounded-xl p-2 sm:p-3 flex flex-col justify-between hover:border-red-primary/30 transition shadow-sm">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-base sm:text-lg">bed</span>
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-editorial text-xs sm:text-sm font-semibold text-stone-900 leading-tight">
                    Fine Linen Bedding Set
                  </h4>
                  <p className="text-[10px] sm:text-xs text-stone-600 font-sans-ui mt-0.5 leading-tight">
                    Washed French linen collection.
                  </p>
                </div>
              </div>
              <div className="mt-2 pt-1.5 border-t border-stone-200/70 flex items-center justify-between">
                <span className="text-[10px] sm:text-xs font-semibold text-stone-700 font-label">PHP 7,200</span>
                <button
                  type="button"
                  onClick={() => copyDetails('Linen Bedding')}
                  className="px-2 sm:px-2.5 py-1 bg-blue-primary hover:bg-blue-dark text-white text-[9px] sm:text-[10px] font-bold uppercase tracking-wider font-label rounded-lg transition cursor-pointer"
                >
                  Gift This
                </button>
              </div>
            </div>
          </div>

          {/* Wishing Well & Bank Details Card */}
          <div className="bg-beige-paper p-2.5 sm:p-3.5 rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1.5">
            <div className="flex items-center gap-1.5 text-red-primary font-label font-bold uppercase tracking-wider text-[10px] sm:text-xs">
              <span className="material-symbols-outlined text-sm sm:text-base">account_balance</span>
              <span>Direct Bank &amp; Wishing Well Details</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono text-[9px] sm:text-[10px] bg-white p-2 sm:p-2.5 rounded-lg border border-stone-200">
              <div className="p-1">
                <span className="block text-stone-400 font-sans uppercase text-[8px] font-bold">BDO Savings Account</span>
                <span className="text-stone-800 font-semibold text-xs">0045 2819 4021</span>
                <span className="block text-stone-500 font-sans text-[8px] sm:text-[9px]">Amber Marie C.</span>
              </div>
              <div className="p-1">
                <span className="block text-stone-400 font-sans uppercase text-[8px] font-bold">GCash / Maya Transfer</span>
                <span className="text-stone-800 font-semibold text-xs">0917 842 9014</span>
                <span className="block text-stone-500 font-sans text-[8px] sm:text-[9px]">James Alexander P.</span>
              </div>
            </div>
            <p className="text-[9px] sm:text-[10px] text-stone-500 font-sans-ui leading-tight">
              A physical wishing well box will also be placed by the ballroom entrance at Montebello Villa Hotel for cards &amp; notes.
            </p>
          </div>

          {/* Notification Toast */}
          {toastMessage && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-label text-center animate-fadeIn">
              {toastMessage}
            </div>
          )}
        </div>

        {/* Pinned Bottom Action Footer */}
        <div className="mt-2 sm:mt-3 pt-2 sm:pt-2.5 border-t border-stone-200 text-center shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2 rounded-xl bg-stone-800 hover:bg-stone-900 text-white text-xs uppercase tracking-wider font-label transition shadow-md cursor-pointer"
          >
            Back to Invitation
          </button>
        </div>
      </div>
    </div>
  );
};
