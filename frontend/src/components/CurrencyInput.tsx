import React, { useRef } from 'react';

interface CurrencyInputProps {
  value: number; // value in reais (e.g. 1200.50)
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

  // Format a float to Brazilian currency string (no R$ symbol)
  const formatDisplay = (val: number): string => {
    if (val === 0) return '';
    return val.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Strip everything that's not a digit
    const digits = e.target.value.replace(/\D/g, '');
    if (digits === '') {
      onChange(0);
      return;
    }
    // Treat the digits as cents: last 2 are decimal places
    const cents = parseInt(digits, 10);
    const reais = cents / 100;
    onChange(reais);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Allow: Backspace, Delete, Tab, Escape, arrows, home, end
    const allowed = ['Backspace', 'Delete', 'Tab', 'Escape', 'ArrowLeft', 'ArrowRight', 'Home', 'End'];
    if (allowed.includes(e.key)) return;
    // Block anything that's not a digit
    if (!/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  };

  const baseStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.875rem 0.875rem 0.875rem 2.5rem',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.2)',
    color: 'white',
    fontSize: '1.125rem',
    outline: 'none',
    boxSizing: 'border-box',
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
      placeholder={placeholder}
      required={required}
      style={baseStyle}
    />
  );
};

export default CurrencyInput;
