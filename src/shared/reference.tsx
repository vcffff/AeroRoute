"use client";

import { useState } from "react";

const defaultDestination = "г. Алматы, ул. Кунаева, 12 (Площадка Dostyk Plaza)";
const pricing = {
  docs: { price: "2 900 ₸", eta: "~14 минут в пути" },
  std: { price: "3 800 ₸", eta: "~16 минут в пути" },
  express: { price: "5 400 ₸", eta: "~12 минут в пути (Приоритет)" },
};

export default function AeroRoutePage() {
  const [parcel, setParcel] = useState<keyof typeof pricing>("docs");
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [destination, setDestination] = useState(defaultDestination);

  function toggleCoverage() {
    setOutOfBounds(!outOfBounds);
    setDestination(outOfBounds ? defaultDestination : "пос. Боралдай, ул. Абая 44 (вне зоны)");
  }

  return (
    <>
<header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.03)]"><div className="h-20 w-full px-gutter flex items-center justify-between gap-space-md"><div className="flex items-center gap-space-lg"><a className="flex items-center gap-space-sm" data-path="glavnaya" href="#"><img alt="AeroRoute Logo" className="h-8 w-auto object-contain" src="https://lh3.googleusercontent.com/aida/AEtjO1WMEqAR55rOOyx3lp2KLbGTWmn-VM37MBx9u0Pa_PEwzT6dXEdLr_o1I-jItST_ZW7hkcUQn4VeP1jR4MYXiwh2jd4lsqad87UIiCpbtr8VqWGQpRf7WnnPchmp-ce0HH5GNnus8SItlTlpiQDNmbSkLiNGuK_4C-XbbqtuD4mEOOZ4ZUVfo65YiK-g7VUd-RRpHM5fS1L0uw3AXntECCxgfPr2LxMxQi85HXLGfoMlYAeobUohzmz1CShH" /><span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">AeroRoute</span></a><nav className="hidden md:flex items-center gap-space-xs p-space-xs rounded-full bg-surface-container-low" data-active-classes="bg-surface-subtle text-primary font-label-lg"><a className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all" data-path="kak-eto-rabotaet" href="#how-it-works">Как это работает</a><a className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all" data-path="dlya-operatorov" href="/operator">Для операторов</a></nav></div><div className="flex items-center gap-space-sm"><a className="px-space-lg py-space-sm rounded-full font-label-lg text-label-lg text-on-surface bg-surface-container-lowest hover:bg-surface-container hover:text-on-surface shadow-sm transition-all" data-path="avtorizaciya" href="/login">Войти</a><a className="px-space-lg py-space-sm rounded-full font-label-lg text-label-lg text-on-primary-container bg-primary-container hover:bg-cyan-interactive hover:text-on-primary shadow-sm hover:shadow transition-all" data-path="otpravit-posylku" href="/customer">Отправить посылку</a><div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"><span className="material-symbols-outlined text-on-primary text-[18px]">person</span></div></div></div></header><main className="w-full pt-20 bg-background"><div className="flex flex-col w-full">

<section className="w-full px-gutter py-space-xl overflow-hidden relative" id="delivery">

<div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
<div className="absolute top-1/2 left-1/4 w-80 h-80 bg-tertiary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>
<div className="max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start relative z-10">

<div className="lg:col-span-5 flex flex-col gap-space-lg">
<p className="text-body-sm text-cyan-interactive rounded-2xl bg-primary-container/10 px-space-md py-space-sm">Карта и расчёт — демонстрация. Реальной телеметрии и оплаты здесь нет.</p>

<div className="inline-flex items-center gap-space-xs self-start px-space-md py-space-xs rounded-full bg-surface-container-low shadow-sm">
<span className="w-2.5 h-2.5 rounded-full bg-status-delivered animate-pulse"></span>
<span className="font-label-md text-label-md text-on-surface-variant">Коридор KZ-AIR-04: Медеу — Самал открыт</span>
<span className="material-symbols-outlined text-[16px] text-cyan-interactive">cloud_done</span>
</div>

<div className="flex flex-col gap-space-sm">
<h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
            Твоя посылка.<br />
<span className="text-cyan-interactive">Новый маршрут.</span>
</h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
            Автономная доставка небольших посылок дронами по Алматы и Астане — с прозрачным эскроу-протоколом и попиксельным 3D-трекингом коридора.
          </p>
</div>

<div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-xl shadow-surface-variant/40 flex flex-col gap-space-md relative">
<div className="flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-cyan-interactive text-[22px]">flight_takeoff</span>
<span className="font-headline-sm text-headline-sm text-on-surface">Рассчитать доставку</span>
</div>
<span className="font-label-sm text-label-sm text-cyan-interactive bg-primary-container/15 px-space-sm py-space-xs rounded-full">
              Режим Demo 2.4
            </span>
</div>

<div className="flex flex-col gap-space-xs">

<div className="flex items-center gap-space-sm bg-surface-container-low rounded-2xl px-space-md py-space-sm transition-all focus-within:bg-surface-container-lowest focus-within:shadow-md">
<div className="w-7 h-7 rounded-full bg-cyan-interactive/15 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-cyan-interactive text-[16px]">trip_origin</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Откуда</span>
<input className="font-body-md text-body-md text-on-surface bg-transparent outline-none truncate" id="origin-input" type="text" defaultValue="г. Алматы, пр. Аль-Фараби, 77 (Дронопорт Самал)" aria-label="Откуда" />
</div>
<button className="text-on-surface-variant hover:text-cyan-interactive transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">my_location</span>
</button>
</div>

<div className="ml-7 flex flex-col gap-1 my-0.5">
<span className="w-1 h-1 rounded-full bg-outline-variant"></span>
<span className="w-1 h-1 rounded-full bg-outline-variant"></span>
</div>

<div className="flex items-center gap-space-sm bg-surface-container-low rounded-2xl px-space-md py-space-sm transition-all focus-within:bg-surface-container-lowest focus-within:shadow-md">
<div className="w-7 h-7 rounded-full bg-tertiary-container/20 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-tertiary text-[16px]">location_on</span>
</div>
<div className="flex flex-col min-w-0 flex-1">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Куда</span>
<input className="font-body-md text-body-md text-on-surface bg-transparent outline-none truncate" id="dest-input" type="text" value={destination} onChange={(event) => setDestination(event.target.value)} aria-label="Куда" />
</div>
<button className="text-on-surface-variant hover:text-cyan-interactive transition-colors" type="button">
<span className="material-symbols-outlined text-[18px]">swap_vert</span>
</button>
</div>
</div>

<div className="flex flex-col gap-space-xs">
<span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Тип отправления</span>
<div className="grid grid-cols-3 gap-space-xs" id="package-selector">
<button data-type="docs" type="button" onClick={() => setParcel("docs")} disabled={outOfBounds} aria-pressed={parcel === "docs"} className={`parcel-pill px-space-sm py-space-xs rounded-2xl font-label-md text-label-md flex flex-col items-center gap-0.5 transition-all disabled:opacity-50 ${parcel === "docs" ? "bg-cyan-interactive text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}`}>
<span>Документы</span>
<span className="font-label-sm text-label-sm opacity-80">до 0.5 кг</span>
</button>
<button data-type="std" type="button" onClick={() => setParcel("std")} disabled={outOfBounds} aria-pressed={parcel === "std"} className={`parcel-pill px-space-sm py-space-xs rounded-2xl font-label-md text-label-md flex flex-col items-center gap-0.5 transition-all disabled:opacity-50 ${parcel === "std" ? "bg-cyan-interactive text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}`}>
<span>Стандарт</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">до 2.0 кг</span>
</button>
<button data-type="express" type="button" onClick={() => setParcel("express")} disabled={outOfBounds} aria-pressed={parcel === "express"} className={`parcel-pill px-space-sm py-space-xs rounded-2xl font-label-md text-label-md flex flex-col items-center gap-0.5 transition-all disabled:opacity-50 ${parcel === "express" ? "bg-cyan-interactive text-on-primary shadow-sm" : "bg-surface-container-low text-on-surface hover:bg-surface-container"}`}>
<span>Экспресс-бокс</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">до 4.5 кг</span>
</button>
</div>
</div>

<div className="rounded-2xl bg-surface-subtle p-space-md flex items-center justify-between">
<div className="flex items-center gap-space-xs">
<span className="material-symbols-outlined text-cyan-interactive">schedule</span>
<div className="flex flex-col">
<span className="font-label-md text-label-md text-on-surface" id="calc-eta">{outOfBounds ? "Требуется наземный курьер" : pricing[parcel].eta}</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Прямой эшелон 120м</span>
</div>
</div>
<div className="text-right">
<div className="font-headline-sm text-headline-sm text-on-surface" id="calc-price">{outOfBounds ? "Недоступно" : pricing[parcel].price}</div>
<div className="font-label-sm text-label-sm text-cyan-interactive">Solana Escrow Lock</div>
</div>
</div>

<button onClick={() => window.location.assign("/customer")} className="w-full py-space-md rounded-full bg-primary-container text-on-primary-container hover:bg-cyan-interactive hover:text-on-primary font-headline-sm text-headline-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-space-xs active:scale-[0.99]" type="button">
<span>Создать заказ</span>
<span className="material-symbols-outlined">arrow_forward</span>
</button>

<div className="flex items-center justify-between pt-space-xs">
<button className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors flex items-center gap-1" id="toggle-oob-demo" type="button" onClick={toggleCoverage} aria-expanded={outOfBounds}>
<span className="material-symbols-outlined text-[15px]">info</span>
<span>{outOfBounds ? "Вернуть стандартный маршрут Медеу" : "Проверить адрес вне зоны покрытия (>18 км)"}</span>
</button>
<span className="font-label-sm text-label-sm text-outline">Qazpost API v2</span>
</div>

<div id="oob-notice" className={`rounded-2xl bg-amber-vibrant/15 p-space-sm items-start gap-space-sm ${outOfBounds ? "flex" : "hidden"}`} role="status">
<span className="material-symbols-outlined text-tertiary shrink-0 mt-0.5">warning</span>
<p className="font-body-sm text-body-sm text-on-tertiary-container">
<strong>Вне радиуса автономных дронопортов.</strong> Доставка в пос. Боралдай (&gt;22 км) требует наземной комбинированной передачи через курьера Qazpost.
            </p>
</div>
</div>

<div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
<span className="material-symbols-outlined text-status-delivered text-[18px]">verified_user</span>
<span>Средства замораживаются в смарт-контракте и списываются только по PIN-коду получателя</span>
</div>
</div>

<div className="lg:col-span-7 flex flex-col gap-space-sm">

<div className="flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md rounded-full px-space-md py-space-xs shadow-sm">
<div className="flex items-center gap-space-sm">
<span className="w-2.5 h-2.5 rounded-full bg-status-airborne animate-ping"></span>
<span className="font-label-md text-label-md text-on-surface">Канал телеметрии: ALM-SECTOR-EAST</span>
<span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-space-xs py-0.5 rounded-md">43.238° N, 76.945° E</span>
</div>
<div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px] text-cyan-interactive">air</span>
<span>Ветер: 3.2 м/с ЮВ · Ясно</span>
</div>
</div>

<div className="relative w-full h-[580px] bg-slate-900 rounded-lg overflow-hidden shadow-2xl flex flex-col justify-between p-space-lg select-none">

<svg className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none" fill="none" viewBox="0 0 700 580" xmlns="http://www.w3.org/2000/svg">
<defs>
<pattern height="40" id="grid-pattern" patternUnits="userSpaceOnUse" width="40">
<path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(25, 185, 231, 0.08)" strokeWidth="1"></path>
</pattern>
<linearGradient gradientUnits="userSpaceOnUse" id="flightPathGradient" x1="120" x2="560" y1="440" y2="120">
<stop offset="0%" stopColor="#19B9E7" stopOpacity="0.8"></stop>
<stop offset="50%" stopColor="#22C55E" stopOpacity="1"></stop>
<stop offset="100%" stopColor="#FFD028" stopOpacity="0.9"></stop>
</linearGradient>
</defs>

<rect fill="url(#grid-pattern)" height="580" width="700"></rect>

<path d="M-50 520 Q 150 490 320 540 T 750 510" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="2"></path>
<path d="M-50 460 Q 200 420 400 480 T 750 440" fill="none" stroke="rgba(255, 255, 255, 0.06)" strokeWidth="1.5"></path>
<path d="M-50 400 Q 180 360 480 410 T 750 370" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1"></path>

<path d="M 40 450 L 660 380" stroke="rgba(25, 185, 231, 0.15)" strokeLinecap="round" strokeWidth="5"></path>
<text fill="rgba(255,255,255,0.3)" fontFamily="Inter" fontSize="9" x="50" y="440">пр. Аль-Фараби</text>
<path d="M 280 560 L 290 40" stroke="rgba(25, 185, 231, 0.15)" strokeLinecap="round" strokeWidth="4"></path>
<text fill="rgba(255,255,255,0.3)" fontFamily="Inter" fontSize="9" x="300" y="520">пр. Достык (на Медеу)</text>
<path d="M 60 220 L 640 180" stroke="rgba(255, 255, 255, 0.12)" strokeLinecap="round" strokeWidth="3"></path>
<text fill="rgba(255,255,255,0.3)" fontFamily="Inter" fontSize="9" x="80" y="210">пр. Абая</text>

<polygon fill="rgba(239, 68, 68, 0.15)" points="510,240 600,210 630,280 540,310" stroke="#EF4444" strokeDasharray="4 4" strokeWidth="1.5"></polygon>
<text fill="#EF4444" fontFamily="Inter" fontSize="9" fontWeight="600" x="525" y="270">БПЗ: Телевышка Кок-Тобе</text>

<path d="M 140 430 Q 320 330 520 150" fill="none" id="drone-corridor-path" stroke="url(#flightPathGradient)" strokeDasharray="8 6" strokeWidth="3.5"></path>


<circle cx="140" cy="430" fill="rgba(25, 185, 231, 0.2)" r="16"></circle>
<circle cx="140" cy="430" fill="#19B9E7" r="6"></circle>

<circle cx="520" cy="150" fill="rgba(255, 208, 40, 0.25)" r="18"></circle>
<circle cx="520" cy="150" fill="#FFD028" r="6"></circle>
</svg>

<div className="relative z-10 flex items-center justify-between">
<div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-space-sm flex items-center gap-space-sm shadow-md">
<span className="w-2.5 h-2.5 rounded-full bg-status-delivered animate-ping"></span>
<div className="flex flex-col">
<span className="text-white font-label-md text-label-md">Коридор №4: Самал → Медеу</span>
<span className="text-slate-400 font-label-sm text-label-sm">Эшелон: 140м AGL · Разрешен ААК РК</span>
</div>
</div>

<div className="flex items-center bg-slate-900/80 backdrop-blur-md p-1 rounded-full">
<button className="px-space-md py-1 rounded-full bg-cyan-interactive text-white font-label-sm text-label-sm font-semibold shadow">Алматы</button>
<button className="px-space-md py-1 rounded-full text-slate-300 hover:text-white font-label-sm text-label-sm transition-colors">Астана (Есиль)</button>
</div>
</div>

<div className="relative z-10 self-center -mt-8 flex flex-col items-center">

<div className="relative flex items-center justify-center">
<div className="w-16 h-16 rounded-full bg-cyan-interactive/20 animate-ping absolute"></div>
<div className="w-12 h-12 rounded-full bg-slate-950/90 border border-status-airborne/50 flex items-center justify-center shadow-lg shadow-cyan-interactive/30">
<span className="material-symbols-outlined text-status-airborne text-[24px]">flight</span>
</div>
</div>

<div className="mt-2 bg-slate-900/95 backdrop-blur-md rounded-2xl p-space-sm shadow-2xl flex flex-col gap-1 w-64 border border-slate-700/50">
<div className="flex items-center justify-between border-b border-slate-800 pb-1">
<div className="flex items-center gap-1">
<span className="font-label-md text-label-md text-white font-bold">БПЛА AR-408</span>
<span className="px-1.5 py-0.2 rounded text-[10px] bg-status-delivered/20 text-status-delivered font-semibold">В пути</span>
</div>
<span className="text-[11px] font-mono text-cyan-300">ETA: 08:42</span>
</div>
<div className="grid grid-cols-3 gap-1 text-center pt-1">
<div className="bg-slate-800/60 rounded p-1">
<span className="text-[9px] text-slate-400 block uppercase">Скорость</span>
<span className="text-[11px] font-mono text-white font-semibold">48 км/ч</span>
</div>
<div className="bg-slate-800/60 rounded p-1">
<span className="text-[9px] text-slate-400 block uppercase">Высота</span>
<span className="text-[11px] font-mono text-white font-semibold">140 м</span>
</div>
<div className="bg-slate-800/60 rounded p-1">
<span className="text-[9px] text-slate-400 block uppercase">Заряд АКБ</span>
<span className="text-[11px] font-mono text-status-delivered font-semibold">89%</span>
</div>
</div>
</div>
</div>

<div className="relative z-10 grid grid-cols-2 gap-space-md">

<div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-space-sm flex items-center gap-space-sm border border-slate-800">
<div className="w-8 h-8 rounded-full bg-cyan-interactive/20 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-cyan-interactive text-[18px]">adjust</span>
</div>
<div className="flex flex-col min-w-0">
<span className="text-white font-label-md text-label-md truncate">Станция А-1: Самал</span>
<span className="text-slate-400 font-label-sm text-label-sm">Взлет совершен в 14:18</span>
</div>
</div>

<div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-space-sm flex items-center gap-space-sm border border-slate-800">
<div className="w-8 h-8 rounded-full bg-amber-vibrant/20 flex items-center justify-center shrink-0">
<span className="material-symbols-outlined text-amber-vibrant text-[18px]">flag</span>
</div>
<div className="flex flex-col min-w-0">
<span className="text-white font-label-md text-label-md truncate">Точка B-3: Dostyk Hub</span>
<span className="text-amber-300 font-label-sm text-label-sm">Посадочная площадка свободна</span>
</div>
</div>
</div>

<div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-space-md py-1 bg-slate-950/80 backdrop-blur-sm rounded-full text-center">
<span className="text-[10px] font-label-sm text-slate-400">
              Демо-маршрут: не является фактической навигационной картой и предназначен для демонстрации протокола.
            </span>
</div>
</div>

<div className="grid grid-cols-3 gap-space-sm">
<div className="bg-surface-container-lowest rounded-2xl p-space-sm flex items-center gap-space-sm shadow-sm">
<span className="material-symbols-outlined text-cyan-interactive">radar</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Радар коридора</span>
<span className="font-label-md text-label-md text-on-surface">3 БПЛА на линии</span>
</div>
</div>
<div className="bg-surface-container-lowest rounded-2xl p-space-sm flex items-center gap-space-sm shadow-sm">
<span className="material-symbols-outlined text-status-delivered">shield_with_heart</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Отказоустойчивость</span>
<span className="font-label-md text-label-md text-on-surface">Парашют BRS Ready</span>
</div>
</div>
<div className="bg-surface-container-lowest rounded-2xl p-space-sm flex items-center gap-space-sm shadow-sm">
<span className="material-symbols-outlined text-amber-vibrant">speed</span>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-on-surface-variant">Среднее время</span>
<span className="font-label-md text-label-md text-on-surface">12-16 мин по городу</span>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="w-full px-gutter py-space-xl bg-surface-container-low" id="how-it-works">
<div className="max-w-[1360px] mx-auto flex flex-col gap-space-lg">
<div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
<div className="flex flex-col gap-1">
<span className="font-label-md text-label-md text-cyan-interactive uppercase tracking-wider font-bold">Сценарии доставки</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">
            Когда важна каждая минута
          </h2>
</div>
<p className="font-body-md text-body-md text-on-surface-variant max-w-md">
          Воздушные коридоры минуют дорожные заторы в часы пик на Аль-Фараби и Сарыарка, гарантируя прибытие груза по секундомеру.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg">

<div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
<div className="flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="w-12 h-12 rounded-2xl bg-primary-container/20 flex items-center justify-center text-cyan-interactive group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
<span className="material-symbols-outlined text-[28px]">description</span>
</div>
<span className="px-space-md py-space-xs rounded-full bg-surface-subtle font-label-sm text-label-sm text-cyan-interactive font-bold">
                До 1.0 кг
              </span>
</div>
<div className="flex flex-col gap-1">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Документы и договоры</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
                Срочная передача оригиналов документов, доверенностей и банковских карт между офисами и нотариусами за 15–20 минут без риска застрять в пробках.
              </p>
</div>
</div>
<div className="mt-space-lg pt-space-sm border-t border-surface-container-low flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Обычный трафик: 75 мин</span>
<span className="font-label-md text-label-md text-status-delivered font-bold">AeroRoute: 14 мин</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
<div className="flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="w-12 h-12 rounded-2xl bg-tertiary-fixed/30 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
<span className="material-symbols-outlined text-[28px]">medical_services</span>
</div>
<span className="px-space-md py-space-xs rounded-full bg-surface-subtle font-label-sm text-label-sm text-tertiary font-bold">
                До 3.0 кг
              </span>
</div>
<div className="flex flex-col gap-1">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Небольшие посылки и аптека</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
                Доставка рецептурных медикаментов, контактных линз, гаджетов и малогабаритных покупок из дарксторов в термозащитных контейнерах.
              </p>
</div>
</div>
<div className="mt-space-lg pt-space-sm border-t border-surface-container-low flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Температурный бокс: +4°C</span>
<span className="font-label-md text-label-md text-status-delivered font-bold">AeroRoute: 18 мин</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
<div className="flex flex-col gap-space-md">
<div className="flex items-center justify-between">
<div className="w-12 h-12 rounded-2xl bg-amber-vibrant/20 flex items-center justify-center text-amber-vibrant group-hover:bg-amber-vibrant group-hover:text-on-surface transition-colors">
<span className="material-symbols-outlined text-[28px]">bolt</span>
</div>
<span className="px-space-md py-space-xs rounded-full bg-surface-subtle font-label-sm text-label-sm text-amber-vibrant font-bold">
                Приоритетный коридор
              </span>
</div>
<div className="flex flex-col gap-1">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Срочные отправления</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
                Критически важная экспресс-доставка запчастей, образцов лабораторий и ключей с гарантированным выделением коридора вне очереди.
              </p>
</div>
</div>
<div className="mt-space-lg pt-space-sm border-t border-surface-container-low flex items-center justify-between">
<span className="font-label-sm text-label-sm text-on-surface-variant">Резервирование борта: &lt; 2 мин</span>
<span className="font-label-md text-label-md text-status-delivered font-bold">AeroRoute: 12 мин</span>
</div>
</div>
</div>
</div>
</section>

<section className="w-full px-gutter py-space-xl bg-surface" id="coverage">
<div className="max-w-[1360px] mx-auto flex flex-col gap-space-xl">
<div className="text-center max-w-2xl mx-auto flex flex-col gap-space-xs">
<span className="font-label-md text-label-md text-cyan-interactive uppercase tracking-wider font-bold">Прозрачная логистика</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">
          Как это работает: от клика до посадки
        </h2>
<p className="font-body-md text-body-md text-on-surface-variant">
          Проверенная инфраструктура дронопортов, защита сделки смарт-контрактом Solana и сквозной мониторинг телеметрии.
        </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg relative">

<div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md relative">
<div className="w-10 h-10 rounded-full bg-cyan-interactive text-on-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
            1
          </div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Укажи маршрут</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
              Выбери адрес или ближайший сертифицированный дронопорт AeroRoute в Алматы или Астане. Система автоматически проверит высоту препятствий и актуальные метеоусловия.
            </p>
</div>
<div className="p-space-sm bg-surface-subtle rounded-2xl flex items-center gap-space-sm mt-auto">
<span className="material-symbols-outlined text-cyan-interactive text-[20px]">near_me</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">32 активных дронопорта в черте города</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md relative">
<div className="w-10 h-10 rounded-full bg-amber-vibrant text-on-surface font-headline-sm text-headline-sm flex items-center justify-center font-bold">
            2
          </div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Подтверди заказ (Escrow)</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
              Сумма блокируется в смарт-контракте Solana. Безопасный эскроу защищает обе стороны: оператор дрона получает выплату только после ввода одноразового PIN-кода получателем.
            </p>
</div>
<div className="p-space-sm bg-surface-subtle rounded-2xl flex items-center gap-space-sm mt-auto">
<span className="material-symbols-outlined text-tertiary text-[20px]">enhanced_encryption</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Мгновенный автовозврат при отмене полета</span>
</div>
</div>

<div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md relative">
<div className="w-10 h-10 rounded-full bg-status-delivered text-on-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
            3
          </div>
<div className="flex flex-col gap-space-xs">
<h3 className="font-headline-sm text-headline-sm text-on-surface">Следи за доставкой</h3>
<p className="font-body-md text-body-md text-on-surface-variant">
              Наблюдай за движением дрона в 3D: скорость, остаток высоты, видеоподтверждение зоны посадки перед автоматическим спуском капсулы на лебедке.
            </p>
</div>
<div className="p-space-sm bg-surface-subtle rounded-2xl flex items-center gap-space-sm mt-auto">
<span className="material-symbols-outlined text-status-delivered text-[20px]">videocam</span>
<span className="font-label-sm text-label-sm text-on-surface-variant">Лидарный контроль препятствий 360°</span>
</div>
</div>
</div>

<div className="p-space-md rounded-2xl bg-surface-container-low max-w-3xl mx-auto flex items-center gap-space-sm text-center justify-center">
<span className="material-symbols-outlined text-secondary text-[20px]">policy</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">
          Оплата удерживается в эскроу до подтверждения успешной выгрузки в соответствии с регламентом безопасности AeroRoute и правилами ААК РК.
        </span>
</div>
</div>
</section>

<section className="w-full px-gutter py-space-xl" id="operators">
<div className="max-w-[1360px] mx-auto">
<div className="bg-slate-900 rounded-lg p-space-xl md:p-12 text-white relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-space-xl">

<div className="absolute -right-16 -bottom-16 w-96 h-96 opacity-10 pointer-events-none">
<svg className="w-full h-full stroke-cyan-interactive" fill="none" strokeWidth="2" viewBox="0 0 200 200">
<circle cx="100" cy="100" r="80" strokeDasharray="6 4"></circle>
<circle cx="100" cy="100" r="40"></circle>
<line x1="20" x2="180" y1="20" y2="180"></line>
<line x1="20" x2="180" y1="180" y2="20"></line>
<circle cx="35" cy="35" r="15"></circle>
<circle cx="165" cy="35" r="15"></circle>
<circle cx="35" cy="165" r="15"></circle>
<circle cx="165" cy="165" r="15"></circle>
</svg>
</div>

<div className="flex flex-col gap-space-md max-w-xl z-10">
<div className="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-cyan-interactive/20 text-cyan-interactive self-start font-label-sm text-label-sm">
<span className="material-symbols-outlined text-[16px]">military_tech</span>
<span>Для операторов и владельцев БПЛА</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-white">
            Твой дрон может доставлять.<br />
            Подключайся к AeroRoute.
          </h2>
<p className="font-body-md text-body-md text-slate-300">
            Открытая логистическая сеть для сертифицированных пилотов дронов в Казахстане. Автоматическое получение полетных коридоров, диспетчеризация заказов и мгновенные выплаты в Solana сразу после подтверждения доставки получателем.
          </p>

<div className="grid grid-cols-2 gap-space-sm pt-space-xs font-label-md text-label-md text-slate-200">
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-status-delivered text-[18px]">check_circle</span>
<span>Авторазрешение полета за 10 сек</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-status-delivered text-[18px]">check_circle</span>
<span>Выплаты без банковских задержек</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-status-delivered text-[18px]">check_circle</span>
<span>Страхование каждого рейса</span>
</div>
<div className="flex items-center gap-2">
<span className="material-symbols-outlined text-status-delivered text-[18px]">check_circle</span>
<span>Совместимость с DJI Enterprise &amp; PX4</span>
</div>
</div>
</div>

<div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-space-lg flex flex-col gap-space-md w-full lg:w-96 z-10 border border-slate-700/60 shadow-xl">
<div className="flex items-center justify-between">
<span className="font-label-md text-label-md text-slate-300">Тариф оператора</span>
<span className="px-space-sm py-0.5 rounded-full bg-status-delivered/20 text-status-delivered font-label-sm text-label-sm font-bold">
              85% с заказа
            </span>
</div>
<div className="flex flex-col">
<span className="font-label-sm text-label-sm text-slate-400">Средний доход активного борта</span>
<span className="font-headline-md text-headline-md text-white">от 45 000 ₸ / день</span>
</div>
<button onClick={() => window.location.assign("/operator")} className="w-full py-space-md rounded-full bg-amber-vibrant text-slate-900 font-headline-sm text-headline-sm hover:bg-yellow-400 transition-all shadow-md active:scale-[0.98] text-center" type="button">
            Стать оператором
          </button>
<span className="text-center font-label-sm text-label-sm text-slate-400">
            Требуется сертификат внешнего пилота ААК РК
          </span>
</div>
</div>
</div>
</section>

<section className="w-full px-gutter py-space-xl bg-surface" id="faq">
<div className="max-w-[1360px] mx-auto flex flex-col gap-space-xl">
<div className="flex flex-col gap-1 max-w-xl">
<span className="font-label-md text-label-md text-cyan-interactive uppercase tracking-wider font-bold">Частые вопросы</span>
<h2 className="font-headline-lg text-headline-lg text-on-surface">Безопасность и регламенты</h2>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">

<div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-cyan-interactive">verified_user</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Как обеспечивается безопасность над городом?</h3>
</div>
<p className="font-body-md text-body-md text-on-surface-variant pt-space-xs">
            Все маршруты прокладываются строго по выделенным воздушным коридорам над дорогами и руслами рек (Есиль, Весновка). Каждый борт оборудован резервным GPS-модулем, автономной парашютной системой выброса BRS и датчиками ADS-B для исключения коллизий.
          </p>
</div>

<div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-tertiary">lock_reset</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Что происходит при отмене рейса или непогоде?</h3>
</div>
<p className="font-body-md text-body-md text-on-surface-variant pt-space-xs">
            При внезапном усилении ветра свыше 12 м/с или запрете диспетчера полет отменяется. Смарт-контракт эскроу мгновенно и без комиссии возвращает средства заказчику на кошелек или карту в течение 30 секунд.
          </p>
</div>

<div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-secondary">alt_route</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Как происходит посадка и передача посылки?</h3>
</div>
<p className="font-body-md text-body-md text-on-surface-variant pt-space-xs">
            Дрон не садится на землю: он зависает на безопасной высоте 5 метров и опускает защищенный контейнер на кевларовом тросе. После того как получатель введет PIN-код в приложении, замок контейнера разблокируется.
          </p>
</div>

<div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-status-delivered">account_balance_wallet</span>
<h3 className="font-headline-sm text-headline-sm text-on-surface">Почему используется смарт-контракт Solana?</h3>
</div>
<p className="font-body-md text-body-md text-on-surface-variant pt-space-xs">
            Solana обеспечивает микроплатежи со скоростью транзакции менее 400 миллисекунд и комиссией доли тенге. Это позволяет программировать пошаговую оплату каждого километра полета без посредников.
          </p>
</div>
</div>

<div className="rounded-2xl bg-surface-container-low p-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm border-dashed">
<div className="flex items-center gap-space-sm">
<span className="material-symbols-outlined text-outline">terminal</span>
<span className="font-body-sm text-body-sm text-on-surface-variant">
            AeroRoute KZ · Демонстрационная витрина доставки
          </span>
</div>
<span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
          Все полетные данные и тарифы приведены исключительно в ознакомительных целях
        </span>
</div>
</div>
</section>


</div></main><footer className="w-full bg-surface-container-lowest border-t border-surface-container mt-space-xl"><div className="w-full px-gutter py-space-xl"><div className="grid grid-cols-1 md:grid-cols-4 gap-space-lg mb-space-xl"><div><div className="flex items-center gap-space-xs mb-space-sm"><span className="material-symbols-outlined text-primary">flight_takeoff</span><span className="font-headline-sm text-headline-sm text-on-surface">AeroRoute</span></div><p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">Национальная сеть автономных логистических коридоров РК. Доставка грузов до 5 кг за 15 минут в Алматы и Астане.</p><div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-low"><span className="w-2 h-2 rounded-full bg-status-delivered animate-pulse"></span><span className="font-label-sm text-label-sm text-on-surface-variant">Воздушные коридоры: Штатный режим</span></div></div><div><h4 className="font-label-lg text-label-lg text-on-surface mb-space-sm">Зоны обслуживания</h4><ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant"><li><span className="font-label-md text-label-md text-on-surface">г. Алматы:</span> Медеу, Бостандык, Турксиб, Алмалы</li><li><span className="font-label-md text-label-md text-on-surface">г. Астана:</span> Есиль, Алматы, Нура, Байконыр</li><li className="pt-space-xs"><span className="inline-flex items-center gap-space-xs text-primary font-label-sm text-label-sm"><span className="material-symbols-outlined text-[16px]">verified</span>Лицензия ААК РК № 042-KZ</span></li></ul></div><div><h4 className="font-label-lg text-label-lg text-on-surface mb-space-sm">Безопасность и гарантии</h4><p className="font-body-sm text-body-sm text-on-surface-variant mb-space-xs">Каждое отправление защищено протоколом Sol Escrow и подтверждается цифровой подписью при получении.</p><p className="font-body-sm text-body-sm text-on-surface-variant">Партнерство с почтово-логистической инфраструктурой Qazpost.</p></div><div><h4 className="font-label-lg text-label-lg text-on-surface mb-space-sm">Язык / Тіл</h4><div className="inline-flex rounded-full bg-surface-container p-space-xs mb-space-md"><button className="px-space-md py-space-xs rounded-full bg-surface-container-lowest font-label-sm text-label-sm text-on-surface shadow-xs" type="button">RU</button><button className="px-space-md py-space-xs rounded-full font-label-sm text-label-sm text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-colors" type="button">KZ</button></div><div className="flex flex-col gap-space-xs"><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="bezopasnost-i-reglamenty" href="#faq">Регламент полетов и БЗ</a><a className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors" data-path="usloviya-servisa" href="#faq">Условия сервиса и оферта</a></div></div></div><div className="pt-space-md border-t border-surface-container flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant"><span>© 2025 AeroRoute Казахстан. Все права защищены. Инфраструктура беспилотной авиации.</span><span>Разработано в соответствии с нормативами Комитета гражданской авиации РК</span></div></div></footer>
    </>
  );
}
