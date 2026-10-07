import React from 'react';
import DealValue from './DealValue';
import {ShowerHead,Ticket,Utensils,Dumbbell,Users,Waves,HeartPulse,Music,Sparkles,Clock,Truck,Tag,MapPin,Info} from 'lucide-react';
const icons={shower:ShowerHead,ticket:Ticket,food:Utensils,fitness:Dumbbell,classes:Users,pool:Waves,trainer:HeartPulse,music:Music,culture:Sparkles,duration:Clock,delivery:Truck,savings:Tag,location:MapPin};
export default function BenefitContext({offer,details=false}){
 const summary=offer.benefitSummary||offer.sourceEvidence;
 if(!summary&&!offer.benefits?.length&&!offer.valueUsd)return null;
 return <div className="benefit-context"><DealValue value={offer.valueUsd}/>{summary&&<p className="benefit-summary">{summary}</p>}{offer.benefits?.length>0&&<ul className="benefit-chips" aria-label="What you get">{offer.benefits.map((b,i)=>{const Icon=icons[b.icon]||Sparkles;return <li key={i}><Icon size={14} aria-hidden="true"/><span>{b.label}</span></li>})}</ul>}{details&&offer.benefitCaveat&&<p className="benefit-caveat"><Info size={13} aria-hidden="true"/><span>{offer.benefitCaveat}</span></p>}</div>
}
