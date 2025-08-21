import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
function pick(al:string){const sup=['en','es'];const parts=(al||'').split(',').map(s=>{const[t,q]=s.trim().split(';');const qq=q?.split('=')[1]?parseFloat(q.split('=')[1]):1;const b=(t||'').split('-')[0].toLowerCase();return{b,qq}}).sort((a,b)=>b.qq-a.qq);for(const p of parts){if(sup.includes(p.b))return p.b}return 'en'}
export default function Page(){const al=headers().get('accept-language')||'';redirect('/'+pick(al))}
