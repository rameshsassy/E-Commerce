import React from 'react';

const ColorPickerField = ({ label, value, onChange, error }) => {
  const handlePickerChange = (e) => {
    onChange(e.target.value);
  };

  const handleTextChange = (e) => {
    const val = e.target.value;
    onChange(val);
  };

  // Basic check to see if the value is a valid 6-char HEX color
  const isValidHex = /^#[0-9A-F]{6}$/i.test(value);

  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && <label className="text-sm font-semibold text-foreground">{label}</label>}
      <div className="flex items-center gap-3">
        {/* Color swatch picker */}
        <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-glass-border shrink-0 cursor-pointer hover:scale-105 transition-transform bg-zinc-900">
          <input
            type="color"
            value={isValidHex ? value : '#000000'}
            onChange={handlePickerChange}
            className="absolute inset-[-6px] w-[calc(100%+12px)] h-[calc(100%+12px)] cursor-pointer border-none p-0"
          />
        </div>
        
        {/* HEX string input */}
        <input
          type="text"
          value={value}
          onChange={handleTextChange}
          placeholder="#000000"
          maxLength={7}
          className={`input-field font-mono text-sm uppercase py-2.5 px-4 rounded-xl flex-1 ${
            error ? 'border-error/50 focus:border-error' : ''
          }`}
        />
      </div>
      {error && <span className="text-xs text-error mt-0.5">{error}</span>}
    </div>
  );
};

export default ColorPickerField;
