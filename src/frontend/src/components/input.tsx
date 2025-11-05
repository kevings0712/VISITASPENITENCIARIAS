import { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label?: string; error?: string };

export default function Input({ label, error, className = '', ...rest }: Props) {
  return (
    <label className="field">
      {label && <span className="label">{label}</span>}
      <input className={'input ' + className} {...rest} />
      {error && <span className="error">{error}</span>}
    </label>
  );
}
