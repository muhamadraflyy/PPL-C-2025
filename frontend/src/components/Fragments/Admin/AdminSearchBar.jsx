import { Search } from 'lucide-react';
import Input from '../../Elements/Inputs/Input';

export default function AdminSearchBar({ 
  placeholder = "Cari...",
  value, 
  onChange,
  className = "" 
}) {
  return (
    <div className={`relative ${className}`}>
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10"
        value={value}
        onChange={onChange}
      />
    </div>
  );
}



