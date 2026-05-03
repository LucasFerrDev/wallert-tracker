import React, { useRef } from 'react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  placeholder?: string;
  required?: boolean;
  style?: React.CSSProperties;
}

/**
 * Brazilian currency input mask.
 * Stores value as a float (reais), displays as "1.200,00".
 * User types digits only — last 2 digits are always cents.
 */
const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = '0,00',
  required = false,
  style,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDisplay = (val: number): string => {
    if (val === 0) return '';
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    if (digits === '') { onChange(0); return; }
    const cents = parseInt(digits, 10);
    onChange(cents / 100);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    if (!/^\d$/.test(e.key)) e.preventDefault();
  };

  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '9px 12px 9px 2.25rem',
    borderRadius: '8px',
    border: '1px solid #EDEDED',
    background: '#ffffff',
    color: '#1a1a1a',
    fontSize: '13px',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    ...style,
  };

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={formatDisplay(value)}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onFocus={e => {
        e.target.style.borderColor = '#F97316';
        e.target.style.boxShadow = '0 0 0 3px rgba(249,115,22,0.12)';
      }}
      onBlur={e => {
        e.target.style.borderColor = '#EDEDED';
        e.target.style.boxShadow = 'none';
      }}
      placeholder={placeholder}
      required={required}
      style={baseStyle}
    />
  );
};

export default CurrencyInput;
