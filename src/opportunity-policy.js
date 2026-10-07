// Product scope: consumer offers and hosted experiences, not assistance services.
export function consumerOpportunity(offer){
 if(!offer)return false;
 let host='';try{host=new URL(offer.url).hostname.replace(/^www\./,'')}catch{}
 if(['glide.org','stanthonysf.org','sfmfoodbank.org','mowsf.org','openhand.org','uchsf.org','lavamaex.org','getcalfresh.org','211bayarea.org'].some(d=>host===d||host.endsWith('.'+d)))return false;
 return !/food bank|soup kitchen|shelter meal|hygiene hub|community meal service/i.test([offer.title,offer.category,offer.benefitSummary].filter(Boolean).join(' '));
}
