import React from 'react';
import {Gem} from 'lucide-react';
import './deal-value.css';
export default function DealValue({value}){
 if(!Number.isFinite(value)||value<=0)return null;
 return <span className="deal-value"><Gem size={16} aria-hidden="true"/><strong>${value.toLocaleString('en-US',{maximumFractionDigits:0})}</strong> value</span>;
}
