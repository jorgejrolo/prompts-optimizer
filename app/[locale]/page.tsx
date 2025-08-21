import { getDictionary } from '@/lib/dictionaries'
import HomeClient from '@/components/HomeClient'
export const dynamic='force-static'
export const revalidate=0
export const generateStaticParams=()=>[{locale:'en'},{locale:'es'}]
export default async function Page({params}:{params:{locale:'en'|'es'}}){const dict=await getDictionary(params.locale);return(<main className='min-h-screen'><HomeClient dict={dict as any} localeUI={params.locale}/></main>)}
