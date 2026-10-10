'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type ReactNode } from 'react';
import { PublicKey } from '@solana/web3.js';
import { api } from '@/lib/api-client';
import './aeroroute.css';

export function Shell({ children, username, mode = 'demo' }: { children: ReactNode; username?: string; mode?: string }) {
  const router = useRouter(); const [error, setError] = useState(''); const [busy,setBusy]=useState(false);
  async function logout() { setBusy(true); try { await api('/api/auth',{action:'logout'}); localStorage.removeItem('auth:user'); if(mode==='firestore'){const {firebaseLogout}=await import('@/lib/firebase-client');await firebaseLogout();} router.push('/login');router.refresh(); } catch(e){setError(message(e));}finally{setBusy(false);} }
  return <div className="ar"><header><Link href="/" className="brand">Aero<b>Route</b></Link><nav>{username?<><Link href="/dashboard">Мой кабинет</Link><span className="muted">{username}</span><button className="secondary" disabled={busy} onClick={logout}>Выйти</button></>:<Link href="/login" className="button">Войти</Link>}</nav></header><main><div className="mode">{mode==='demo'?'Демо-режим: заказы и этапы сохраняются на этом сервере. Оплата и выплата имитируются; реальные полёты и движение средств не выполняются.':'Cloud Firestore: реальные аккаунты и данные. Escrow не настроен — оплата и запуск доставки недоступны.'}</div>{error&&<p role="alert" className="error">{error}</p>}{children}</main></div>;
}
export function message(error: unknown) { return error instanceof Error ? error.message : 'Не удалось выполнить действие'; }
export function Wallet() {
  const [address,setAddress]=useState('');const [error,setError]=useState('');const [busy,setBusy]=useState(false);
  async function connect(){setBusy(true);setError('');try{const provider=(window as unknown as {solana?:{isPhantom?:boolean;connect:()=>Promise<{publicKey:{toString:()=>string}}>}}).solana;if(!provider?.isPhantom)throw new Error('Установите Phantom, чтобы подключить Solana-кошелёк.');const result=await provider.connect();setAddress(new PublicKey(result.publicKey.toString()).toBase58());}catch(e){setError(message(e));}finally{setBusy(false);}}
  return <section className="card"><h3>Solana-кошелёк</h3><p className="muted">Подключается отдельно от аккаунта для будущих платежей. Подключение кошелька не означает оплату.</p>{address?<p className="wallet success">Подключён: {address}</p>:<button className="secondary" disabled={busy} onClick={connect}>{busy?'Подключение…':'Подключить Phantom'}</button>}{error&&<p className="error" role="alert">{error}</p>}</section>;
}
