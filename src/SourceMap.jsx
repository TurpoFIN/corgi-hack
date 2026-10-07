import React,{useState} from 'react';
import {Globe,ChevronDown,Search,ArrowUpRight} from 'lucide-react';
export default function SourceMap({map}){
 const [open,setOpen]=useState(false),[category,setCategory]=useState('all'),[query,setQuery]=useState('');
 if(!map)return null;
 const sources=map.sources.filter(s=>(category==='all'||s.category===category)&&[s.name,s.target].join(' ').toLowerCase().includes(query.toLowerCase()));
 return <section className="source-map"><button className="source-map-heading" onClick={()=>setOpen(!open)} aria-expanded={open}><Globe size={14}/><strong>Scout’s source map</strong><span>{map.sources.length} routes · {Object.keys(map.categories).length} categories</span><ChevronDown size={14}/></button>{open&&<div className="source-map-body"><div className="source-map-filter"><Search size={13}/><input placeholder="Find a source…" aria-label="Find a source" value={query} onChange={e=>setQuery(e.target.value)}/></div><div className="source-categories"><button aria-pressed={category==='all'} onClick={()=>setCategory('all')}>All</button>{Object.entries(map.categories).map(([id,label])=><button key={id} aria-pressed={category===id} onClick={()=>setCategory(id)}>{label}</button>)}</div><p>Research routes. Scout checks current offers, eligibility and price before adding a plan.</p><div className="source-directory">{sources.map(s=><a key={s.id} href={s.url} target="_blank" rel="noreferrer"><strong>{s.name}<ArrowUpRight size={12}/></strong><span>{s.target}</span></a>)}</div></div>}</section>
}
