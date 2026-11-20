import { supabase } from './supabase';

const LOCAL='carteira-cloud-cache-v1';
const readLocal=()=>{try{return JSON.parse(localStorage.getItem(LOCAL))||{}}catch{return {}}};
const writeLocal=(v)=>localStorage.setItem(LOCAL,JSON.stringify(v));

export async function loadState(){
  const cache=readLocal();
  if(!supabase) return cache;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return cache;
  const {data,error}=await supabase.from('user_state').select('state,updated_at').eq('user_id',user.id).maybeSingle();
  if(error) throw error;
  if(data?.state){ writeLocal(data.state); return data.state; }
  if(Object.keys(cache).length) await saveState(cache);
  return cache;
}
export async function saveState(next){
  writeLocal(next); // cache imediato; nuvem é a fonte persistente
  if(!supabase) return next;
  const {data:{user}}=await supabase.auth.getUser();
  if(!user) return next;
  const {error}=await supabase.from('user_state').upsert({user_id:user.id,state:next,updated_at:new Date().toISOString()},{onConflict:'user_id'});
  if(error) throw error;
  return next;
}
export function localState(){return readLocal()}
export async function exportBackup(){
  const state=await loadState();
  const blob=new Blob([JSON.stringify({version:1,exportedAt:new Date().toISOString(),state},null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download=`carteira-invest-backup-${new Date().toISOString().slice(0,10)}.json`; a.click(); URL.revokeObjectURL(url);
}
