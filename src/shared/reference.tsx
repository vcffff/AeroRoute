'use client';

import { useState } from 'react';
import { LogoMark } from '@/components/logo-mark';

const defaultDestination = 'Almaty, Kunaev St, 12 (Dostyk Plaza pad)';
const pricing = {
  docs: { price: '0.065 SOL', eta: '~14 min in flight' },
  std: { price: '0.105 SOL', eta: '~16 min in flight' },
  express: { price: '0.145 SOL', eta: '~12 min in flight (Priority)' },
};

export default function AeroRoutePage({ username }: { username?: string }) {
  const [parcel, setParcel] = useState<keyof typeof pricing>('docs');
  const [outOfBounds, setOutOfBounds] = useState(false);
  const [destination, setDestination] = useState(defaultDestination);

  function toggleCoverage() {
    setOutOfBounds(!outOfBounds);
    setDestination(outOfBounds ? defaultDestination : 'Boraldai, Abay St 44 (out of zone)');
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/90 backdrop-blur-xl border-b border-surface-container shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
        <div className="h-20 w-full px-gutter flex items-center justify-between gap-space-md">
          <div className="flex items-center gap-space-lg">
            <a className="flex items-center gap-space-sm" data-path="glavnaya" href="#">
              <LogoMark />
              <span className="font-headline-sm text-headline-sm text-on-surface tracking-tight">
                AeroRoute
              </span>
            </a>
            <nav
              className="hidden md:flex items-center gap-space-xs p-space-xs rounded-full bg-surface-container-low"
              data-active-classes="bg-surface-subtle text-primary font-label-lg"
            >
              <a
                className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                data-path="kak-eto-rabotaet"
                href="#how-it-works"
              >
                How it works
              </a>
              <a
                className="px-space-md py-space-xs rounded-full font-label-lg text-label-lg text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high transition-all"
                data-path="dlya-operatorov"
                href="/operator"
              >
                For operators
              </a>
            </nav>
          </div>
          <div className="flex items-center gap-space-sm">
            {username ? (
              <span
                className="hidden md:block max-w-48 truncate text-body-sm text-on-surface-variant"
                title={username}
              >
                {username}
              </span>
            ) : (
              <a
                className="px-space-lg py-space-sm rounded-full font-label-lg text-label-lg text-on-surface bg-surface-container-lowest hover:bg-surface-container hover:text-on-surface shadow-sm transition-all"
                data-path="avtorizaciya"
                href="/login"
              >
                Sign in
              </a>
            )}
            <a
              className="px-space-lg py-space-sm rounded-full font-label-lg text-label-lg text-on-primary-container bg-primary-container hover:bg-cyan-interactive hover:text-on-primary shadow-sm hover:shadow transition-all"
              data-path="otpravit-posylku"
              href={username ? '/dashboard' : '/customer'}
            >
              {username ? 'My dashboard' : 'Send a parcel'}
            </a>
            <div
              className="w-8 h-8 rounded-full bg-primary flex items-center justify-center"
              aria-hidden="true"
            >
              <span className="material-symbols-outlined text-on-primary text-[18px]">person</span>
            </div>
          </div>
        </div>
      </header>
      <main className="w-full pt-20 bg-background">
        <div className="flex flex-col w-full">
          <section className="w-full px-gutter py-space-xl overflow-hidden relative" id="delivery">
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary-container/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute top-1/2 left-1/4 w-80 h-80 bg-tertiary-fixed/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="max-w-[1360px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-start relative z-10">
              <div className="lg:col-span-5 flex flex-col gap-space-lg">
                <p className="text-body-sm text-cyan-interactive rounded-2xl bg-primary-container/10 px-space-md py-space-sm">
                  The map and calculator are a demo. No real telemetry or payments here.
                </p>

                <div className="inline-flex items-center gap-space-xs self-start px-space-md py-space-xs rounded-full bg-surface-container-low shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-status-delivered animate-pulse"></span>
                  <span className="font-label-md text-label-md text-on-surface-variant">
                    Corridor KZ-AIR-04: Medeu — Samal is open
                  </span>
                  <span className="material-symbols-outlined text-[16px] text-cyan-interactive">
                    cloud_done
                  </span>
                </div>

                <div className="flex flex-col gap-space-sm">
                  <h1 className="font-headline-xl text-headline-xl text-on-surface tracking-tight">
                    Your parcel.
                    <br />
                    <span className="text-cyan-interactive">A new route.</span>
                  </h1>
                  <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md">
                    Autonomous drone delivery of small parcels across Almaty and Astana — with a
                    transparent escrow protocol and pixel-perfect 3D corridor tracking.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-xl shadow-surface-variant/40 flex flex-col gap-space-md relative">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-cyan-interactive text-[22px]">
                        flight_takeoff
                      </span>
                      <span className="font-headline-sm text-headline-sm text-on-surface">
                        Calculate delivery
                      </span>
                    </div>
                    <span className="font-label-sm text-label-sm text-cyan-interactive bg-primary-container/15 px-space-sm py-space-xs rounded-full">
                      Demo mode 2.4
                    </span>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <div className="flex items-center gap-space-sm bg-surface-container-low rounded-2xl px-space-md py-space-sm transition-all focus-within:bg-surface-container-lowest focus-within:shadow-md">
                      <div className="w-7 h-7 rounded-full bg-cyan-interactive/15 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-cyan-interactive text-[16px]">
                          trip_origin
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                          From
                        </span>
                        <input
                          className="font-body-md text-body-md text-on-surface bg-transparent outline-none truncate"
                          id="origin-input"
                          type="text"
                          defaultValue="Almaty, Al-Farabi Ave, 77 (Samal droneport)"
                          aria-label="From"
                        />
                      </div>
                      <button
                        className="text-on-surface-variant hover:text-cyan-interactive transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">my_location</span>
                      </button>
                    </div>

                    <div className="ml-7 flex flex-col gap-1 my-0.5">
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                      <span className="w-1 h-1 rounded-full bg-outline-variant"></span>
                    </div>

                    <div className="flex items-center gap-space-sm bg-surface-container-low rounded-2xl px-space-md py-space-sm transition-all focus-within:bg-surface-container-lowest focus-within:shadow-md">
                      <div className="w-7 h-7 rounded-full bg-tertiary-container/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-tertiary text-[16px]">
                          location_on
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                          To
                        </span>
                        <input
                          className="font-body-md text-body-md text-on-surface bg-transparent outline-none truncate"
                          id="dest-input"
                          type="text"
                          value={destination}
                          onChange={(event) => setDestination(event.target.value)}
                          aria-label="To"
                        />
                      </div>
                      <button
                        className="text-on-surface-variant hover:text-cyan-interactive transition-colors"
                        type="button"
                      >
                        <span className="material-symbols-outlined text-[18px]">swap_vert</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-space-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Parcel type
                    </span>
                    <div className="grid grid-cols-3 gap-space-xs" id="package-selector">
                      <button
                        data-type="docs"
                        type="button"
                        onClick={() => setParcel('docs')}
                        disabled={outOfBounds}
                        aria-pressed={parcel === 'docs'}
                        className={`parcel-pill px-space-sm py-space-xs rounded-2xl font-label-md text-label-md flex flex-col items-center gap-0.5 transition-all disabled:opacity-50 ${parcel === 'docs' ? 'bg-cyan-interactive text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}`}
                      >
                        <span>Documents</span>
                        <span className="font-label-sm text-label-sm opacity-80">up to 0.5 kg</span>
                      </button>
                      <button
                        data-type="std"
                        type="button"
                        onClick={() => setParcel('std')}
                        disabled={outOfBounds}
                        aria-pressed={parcel === 'std'}
                        className={`parcel-pill px-space-sm py-space-xs rounded-2xl font-label-md text-label-md flex flex-col items-center gap-0.5 transition-all disabled:opacity-50 ${parcel === 'std' ? 'bg-cyan-interactive text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}`}
                      >
                        <span>Standard</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          up to 2.0 kg
                        </span>
                      </button>
                      <button
                        data-type="express"
                        type="button"
                        onClick={() => setParcel('express')}
                        disabled={outOfBounds}
                        aria-pressed={parcel === 'express'}
                        className={`parcel-pill px-space-sm py-space-xs rounded-2xl font-label-md text-label-md flex flex-col items-center gap-0.5 transition-all disabled:opacity-50 ${parcel === 'express' ? 'bg-cyan-interactive text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'}`}
                      >
                        <span>Express box</span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          up to 4.5 kg
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-surface-subtle p-space-md flex items-center justify-between">
                    <div className="flex items-center gap-space-xs">
                      <span className="material-symbols-outlined text-cyan-interactive">
                        schedule
                      </span>
                      <div className="flex flex-col">
                        <span className="font-label-md text-label-md text-on-surface" id="calc-eta">
                          {outOfBounds ? 'Ground courier required' : pricing[parcel].eta}
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          Direct corridor at 120 m
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className="font-headline-sm text-headline-sm text-on-surface"
                        id="calc-price"
                      >
                        {outOfBounds ? 'Unavailable' : pricing[parcel].price}
                      </div>
                      <div className="font-label-sm text-label-sm text-cyan-interactive">
                        Solana Escrow Lock
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => window.location.assign('/customer')}
                    className="w-full py-space-md rounded-full bg-primary-container text-on-primary-container hover:bg-cyan-interactive hover:text-on-primary font-headline-sm text-headline-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-space-xs active:scale-[0.99]"
                    type="button"
                  >
                    <span>Create order</span>
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>

                  <div className="flex items-center justify-between pt-space-xs">
                    <button
                      className="font-label-sm text-label-sm text-secondary hover:text-primary transition-colors flex items-center gap-1"
                      id="toggle-oob-demo"
                      type="button"
                      onClick={toggleCoverage}
                      aria-expanded={outOfBounds}
                    >
                      <span className="material-symbols-outlined text-[15px]">info</span>
                      <span>
                        {outOfBounds
                          ? 'Restore the standard Medeu route'
                          : 'Check an address outside coverage (>18 km)'}
                      </span>
                    </button>
                    <span className="font-label-sm text-label-sm text-outline">Qazpost API v2</span>
                  </div>

                  <div
                    id="oob-notice"
                    className={`rounded-2xl bg-amber-vibrant/15 p-space-sm items-start gap-space-sm ${outOfBounds ? 'flex' : 'hidden'}`}
                    role="status"
                  >
                    <span className="material-symbols-outlined text-tertiary shrink-0 mt-0.5">
                      warning
                    </span>
                    <p className="font-body-sm text-body-sm text-on-tertiary-container">
                      <strong>Outside the autonomous droneport radius.</strong> Delivery to Boraldai
                      (&gt;22 km) requires a combined ground hand-off via a Qazpost courier.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-space-xs text-on-surface-variant font-body-sm text-body-sm">
                  <span className="material-symbols-outlined text-status-delivered text-[18px]">
                    verified_user
                  </span>
                  <span>
                    Funds are frozen in the smart contract and released only against the recipient's
                    PIN code
                  </span>
                </div>
              </div>

              <div className="lg:col-span-7 flex flex-col gap-space-sm">
                <div className="flex items-center justify-between bg-surface-container-lowest/80 backdrop-blur-md rounded-full px-space-md py-space-xs shadow-sm">
                  <div className="flex items-center gap-space-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-status-airborne animate-ping"></span>
                    <span className="font-label-md text-label-md text-on-surface">
                      Telemetry channel: ALM-SECTOR-EAST
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant bg-surface-container px-space-xs py-0.5 rounded-md">
                      43.238° N, 76.945° E
                    </span>
                  </div>
                  <div className="flex items-center gap-space-xs text-on-surface-variant font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px] text-cyan-interactive">
                      air
                    </span>
                    <span>Wind: 3.2 m/s SE · Clear</span>
                  </div>
                </div>

                <div className="relative w-full h-[580px] bg-slate-900 rounded-lg overflow-hidden shadow-2xl flex flex-col justify-between p-space-lg select-none">
                  <svg
                    className="absolute inset-0 w-full h-full object-cover opacity-60 pointer-events-none"
                    fill="none"
                    viewBox="0 0 700 580"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <pattern
                        height="40"
                        id="grid-pattern"
                        patternUnits="userSpaceOnUse"
                        width="40"
                      >
                        <path
                          d="M 40 0 L 0 0 0 40"
                          fill="none"
                          stroke="rgba(25, 185, 231, 0.08)"
                          strokeWidth="1"
                        ></path>
                      </pattern>
                      <linearGradient
                        gradientUnits="userSpaceOnUse"
                        id="flightPathGradient"
                        x1="120"
                        x2="560"
                        y1="440"
                        y2="120"
                      >
                        <stop offset="0%" stopColor="#19B9E7" stopOpacity="0.8"></stop>
                        <stop offset="50%" stopColor="#22C55E" stopOpacity="1"></stop>
                        <stop offset="100%" stopColor="#FFD028" stopOpacity="0.9"></stop>
                      </linearGradient>
                    </defs>

                    <rect fill="url(#grid-pattern)" height="580" width="700"></rect>

                    <path
                      d="M-50 520 Q 150 490 320 540 T 750 510"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.08)"
                      strokeWidth="2"
                    ></path>
                    <path
                      d="M-50 460 Q 200 420 400 480 T 750 440"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.06)"
                      strokeWidth="1.5"
                    ></path>
                    <path
                      d="M-50 400 Q 180 360 480 410 T 750 370"
                      fill="none"
                      stroke="rgba(255, 255, 255, 0.04)"
                      strokeWidth="1"
                    ></path>

                    <path
                      d="M 40 450 L 660 380"
                      stroke="rgba(25, 185, 231, 0.15)"
                      strokeLinecap="round"
                      strokeWidth="5"
                    ></path>
                    <text
                      fill="rgba(255,255,255,0.3)"
                      fontFamily="Inter"
                      fontSize="9"
                      x="50"
                      y="440"
                    >
                      Al-Farabi Ave
                    </text>
                    <path
                      d="M 280 560 L 290 40"
                      stroke="rgba(25, 185, 231, 0.15)"
                      strokeLinecap="round"
                      strokeWidth="4"
                    ></path>
                    <text
                      fill="rgba(255,255,255,0.3)"
                      fontFamily="Inter"
                      fontSize="9"
                      x="300"
                      y="520"
                    >
                      Dostyk Ave (towards Medeu)
                    </text>
                    <path
                      d="M 60 220 L 640 180"
                      stroke="rgba(255, 255, 255, 0.12)"
                      strokeLinecap="round"
                      strokeWidth="3"
                    ></path>
                    <text
                      fill="rgba(255,255,255,0.3)"
                      fontFamily="Inter"
                      fontSize="9"
                      x="80"
                      y="210"
                    >
                      Abay Ave
                    </text>

                    <polygon
                      fill="rgba(239, 68, 68, 0.15)"
                      points="510,240 600,210 630,280 540,310"
                      stroke="#EF4444"
                      strokeDasharray="4 4"
                      strokeWidth="1.5"
                    ></polygon>
                    <text
                      fill="#EF4444"
                      fontFamily="Inter"
                      fontSize="9"
                      fontWeight="600"
                      x="525"
                      y="270"
                    >
                      No-fly zone: Kok-Tobe TV tower
                    </text>

                    <path
                      d="M 140 430 Q 320 330 520 150"
                      fill="none"
                      id="drone-corridor-path"
                      stroke="url(#flightPathGradient)"
                      strokeDasharray="8 6"
                      strokeWidth="3.5"
                    ></path>

                    <circle cx="140" cy="430" fill="rgba(25, 185, 231, 0.2)" r="16"></circle>
                    <circle cx="140" cy="430" fill="#19B9E7" r="6"></circle>

                    <circle cx="520" cy="150" fill="rgba(255, 208, 40, 0.25)" r="18"></circle>
                    <circle cx="520" cy="150" fill="#FFD028" r="6"></circle>
                  </svg>

                  <div className="relative z-10 flex items-center justify-between">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-space-sm flex items-center gap-space-sm shadow-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-status-delivered animate-ping"></span>
                      <div className="flex flex-col">
                        <span className="text-white font-label-md text-label-md">
                          Corridor #4: Samal → Medeu
                        </span>
                        <span className="text-slate-400 font-label-sm text-label-sm">
                          Altitude: 140 m AGL · Cleared by the Aviation Administration of Kazakhstan
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center bg-slate-900/80 backdrop-blur-md p-1 rounded-full">
                      <button className="px-space-md py-1 rounded-full bg-cyan-interactive text-white font-label-sm text-label-sm font-semibold shadow">
                        Almaty
                      </button>
                      <button className="px-space-md py-1 rounded-full text-slate-300 hover:text-white font-label-sm text-label-sm transition-colors">
                        Astana (Yessil)
                      </button>
                    </div>
                  </div>

                  <div className="relative z-10 self-center -mt-8 flex flex-col items-center mt-24">
                    <div className="relative flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-cyan-interactive/20 animate-ping absolute"></div>
                      <div className="w-12 h-12 rounded-full bg-slate-950/90 border border-status-airborne/50 rotate-45 flex items-center justify-center shadow-lg shadow-cyan-interactive/30">
                        <span className="material-symbols-outlined text-status-airborne text-[24px]">
                          flight
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 bg-slate-900/95 backdrop-blur-md rounded-2xl p-space-sm shadow-2xl flex flex-col gap-1 w-64 border border-slate-700/50">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                        <div className="flex items-center gap-1">
                          <span className="font-label-md text-label-md text-white font-bold">
                            UAV AR-408
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[10px] bg-status-delivered/20 text-status-delivered font-semibold">
                            In flight
                          </span>
                        </div>
                        <span className="text-[11px] font-mono text-cyan-300">ETA: 08:42</span>
                      </div>
                      <div className="grid grid-cols-3 gap-1 text-center pt-1">
                        <div className="bg-slate-800/60 rounded p-1">
                          <span className="text-[9px] text-slate-400 block uppercase">Speed</span>
                          <span className="text-[11px] font-mono text-white font-semibold">
                            48 km/h
                          </span>
                        </div>
                        <div className="bg-slate-800/60 rounded p-1">
                          <span className="text-[9px] text-slate-400 block uppercase">
                            Altitude
                          </span>
                          <span className="text-[11px] font-mono text-white font-semibold">
                            140 m
                          </span>
                        </div>
                        <div className="bg-slate-800/60 rounded p-1">
                          <span className="text-[9px] text-slate-400 block uppercase">Battery</span>
                          <span className="text-[11px] font-mono text-status-delivered font-semibold">
                            89%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="relative z-10 grid grid-cols-2 gap-space-md">
                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-space-sm flex items-center gap-space-sm border border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-cyan-interactive/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-cyan-interactive text-[18px]">
                          adjust
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-label-md text-label-md truncate">
                          Station A-1: Samal
                        </span>
                        <span className="text-slate-400 font-label-sm text-label-sm">
                          Took off at 14:18
                        </span>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-space-sm flex items-center gap-space-sm border border-slate-800">
                      <div className="w-8 h-8 rounded-full bg-amber-vibrant/20 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-amber-vibrant text-[18px]">
                          flag
                        </span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-white font-label-md text-label-md truncate">
                          Point B-3: Dostyk Hub
                        </span>
                        <span className="text-amber-300 font-label-sm text-label-sm">
                          Landing pad clear
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-space-md py-1 bg-slate-950/80 backdrop-blur-sm rounded-full text-center">
                    <span className="text-[10px] font-label-sm text-slate-400">
                      Demo route: not an actual navigation chart, shown to demonstrate the protocol.
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-space-sm">
                  <div className="bg-surface-container-lowest rounded-2xl p-space-sm flex items-center gap-space-sm shadow-sm">
                    <span className="material-symbols-outlined text-cyan-interactive">radar</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Corridor radar
                      </span>
                      <span className="font-label-md text-label-md text-on-surface">
                        3 UAVs on the line
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-2xl p-space-sm flex items-center gap-space-sm shadow-sm">
                    <span className="material-symbols-outlined text-status-delivered">
                      shield_with_heart
                    </span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Redundancy
                      </span>
                      <span className="font-label-md text-label-md text-on-surface">
                        BRS parachute ready
                      </span>
                    </div>
                  </div>
                  <div className="bg-surface-container-lowest rounded-2xl p-space-sm flex items-center gap-space-sm shadow-sm">
                    <span className="material-symbols-outlined text-amber-vibrant">speed</span>
                    <div className="flex flex-col">
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        Average time
                      </span>
                      <span className="font-label-md text-label-md text-on-surface">
                        12–16 min across town
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            className="w-full px-gutter py-space-xl bg-surface-container-low"
            id="how-it-works"
          >
            <div className="max-w-[1360px] mx-auto flex flex-col gap-space-lg">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-space-sm">
                <div className="flex flex-col gap-1">
                  <span className="font-label-md text-label-md text-cyan-interactive uppercase tracking-wider font-bold">
                    Delivery scenarios
                  </span>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">
                    When every minute counts
                  </h2>
                </div>
                <p className="font-body-md text-body-md text-on-surface-variant max-w-md">
                  Air corridors bypass peak-hour congestion on Al-Farabi and Saryarka, delivering
                  your cargo stopwatch-precise.
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
                        Up to 1.0 kg
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        Documents and contracts
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Urgent transfer of original documents, powers of attorney and bank cards
                        between offices and notaries in 15–20 minutes — with zero risk of getting
                        stuck in traffic.
                      </p>
                    </div>
                  </div>
                  <div className="mt-space-lg pt-space-sm border-t border-surface-container-low flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Regular traffic: 75 min
                    </span>
                    <span className="font-label-md text-label-md text-status-delivered font-bold">
                      AeroRoute: 14 min
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                  <div className="flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-tertiary-fixed/30 flex items-center justify-center text-tertiary group-hover:bg-tertiary group-hover:text-on-tertiary transition-colors">
                        <span className="material-symbols-outlined text-[28px]">
                          medical_services
                        </span>
                      </div>
                      <span className="px-space-md py-space-xs rounded-full bg-surface-subtle font-label-sm text-label-sm text-tertiary font-bold">
                        Up to 3.0 kg
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        Small parcels and pharmacy
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Prescription medicines, contact lenses, gadgets and small purchases from
                        dark stores — carried in thermal containers.
                      </p>
                    </div>
                  </div>
                  <div className="mt-space-lg pt-space-sm border-t border-surface-container-low flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Thermal box: +4°C
                    </span>
                    <span className="font-label-md text-label-md text-status-delivered font-bold">
                      AeroRoute: 18 min
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm hover:shadow-xl transition-all flex flex-col justify-between group">
                  <div className="flex flex-col gap-space-md">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-vibrant/20 flex items-center justify-center text-amber-vibrant group-hover:bg-amber-vibrant group-hover:text-on-surface transition-colors">
                        <span className="material-symbols-outlined text-[28px]">bolt</span>
                      </div>
                      <span className="px-space-md py-space-xs rounded-full bg-surface-subtle font-label-sm text-label-sm text-amber-vibrant font-bold">
                        Priority corridor
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <h3 className="font-headline-sm text-headline-sm text-on-surface">
                        Urgent shipments
                      </h3>
                      <p className="font-body-md text-body-md text-on-surface-variant">
                        Mission-critical express delivery of spare parts, lab samples and keys, with
                        a guaranteed out-of-turn corridor.
                      </p>
                    </div>
                  </div>
                  <div className="mt-space-lg pt-space-sm border-t border-surface-container-low flex items-center justify-between">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Aircraft booking: &lt; 2 min
                    </span>
                    <span className="font-label-md text-label-md text-status-delivered font-bold">
                      AeroRoute: 12 min
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full px-gutter py-space-xl bg-surface" id="coverage">
            <div className="max-w-[1360px] mx-auto flex flex-col gap-space-xl">
              <div className="text-center max-w-2xl mx-auto flex flex-col gap-space-xs">
                <span className="font-label-md text-label-md text-cyan-interactive uppercase tracking-wider font-bold">
                  Transparent logistics
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  How it works: from click to landing
                </h2>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Proven droneport infrastructure, Solana smart-contract deal protection and
                  end-to-end telemetry monitoring.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-space-lg relative">
                <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md relative">
                  <div className="w-10 h-10 rounded-full bg-cyan-interactive text-on-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                    1
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Set the route
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Pick an address or the nearest certified AeroRoute droneport in Almaty or
                      Astana. The system automatically checks obstacle heights and current weather
                      conditions.
                    </p>
                  </div>
                  <div className="p-space-sm bg-surface-subtle rounded-2xl flex items-center gap-space-sm mt-auto">
                    <span className="material-symbols-outlined text-cyan-interactive text-[20px]">
                      near_me
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      32 active droneports within the city
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md relative">
                  <div className="w-10 h-10 rounded-full bg-amber-vibrant text-on-surface font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                    2
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Confirm the order (escrow)
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      The amount is locked in a Solana smart contract. Secure escrow protects both
                      sides: the drone operator gets paid only after the recipient enters a one-time
                      PIN.
                    </p>
                  </div>
                  <div className="p-space-sm bg-surface-subtle rounded-2xl flex items-center gap-space-sm mt-auto">
                    <span className="material-symbols-outlined text-tertiary text-[20px]">
                      enhanced_encryption
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Instant automatic refund if the flight is cancelled
                    </span>
                  </div>
                </div>

                <div className="bg-surface-container-lowest rounded-lg p-space-lg shadow-sm flex flex-col gap-space-md relative">
                  <div className="w-10 h-10 rounded-full bg-status-delivered text-on-primary font-headline-sm text-headline-sm flex items-center justify-center font-bold">
                    3
                  </div>
                  <div className="flex flex-col gap-space-xs">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Follow the delivery
                    </h3>
                    <p className="font-body-md text-body-md text-on-surface-variant">
                      Watch the drone move in 3D: speed, remaining altitude and video confirmation
                      of the landing zone before the capsule is lowered automatically on a winch.
                    </p>
                  </div>
                  <div className="p-space-sm bg-surface-subtle rounded-2xl flex items-center gap-space-sm mt-auto">
                    <span className="material-symbols-outlined text-status-delivered text-[20px]">
                      videocam
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      360° lidar obstacle avoidance
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-space-md rounded-2xl bg-surface-container-low max-w-3xl mx-auto flex items-center gap-space-sm text-center justify-center">
                <span className="material-symbols-outlined text-secondary text-[20px]">policy</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant">
                  Payment is held in escrow until successful unloading is confirmed, in accordance
                  with the AeroRoute safety regulations and the rules of the Aviation Administration
                  of Kazakhstan.
                </span>
              </div>
            </div>
          </section>

          <section className="w-full px-gutter py-space-xl" id="operators">
            <div className="max-w-[1360px] mx-auto">
              <div className="bg-slate-900 rounded-lg p-space-xl md:p-12 text-white relative overflow-hidden shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-space-xl">
                <div className="absolute -right-16 -bottom-16 w-96 h-96 opacity-10 pointer-events-none">
                  <svg
                    className="w-full h-full stroke-cyan-interactive"
                    fill="none"
                    strokeWidth="2"
                    viewBox="0 0 200 200"
                  >
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
                    <span>For drone operators and UAV owners</span>
                  </div>
                  <h2 className="font-headline-lg text-headline-lg text-white">
                    Your drone can deliver.
                    <br />
                    Join AeroRoute.
                  </h2>
                  <p className="font-body-md text-body-md text-slate-300">
                    An open logistics network for certified drone pilots in Kazakhstan. Automatic
                    flight-corridor assignment, order dispatching and instant Solana payouts the
                    moment the recipient confirms delivery.
                  </p>

                  <div className="grid grid-cols-2 gap-space-sm pt-space-xs font-label-md text-label-md text-slate-200">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-status-delivered text-[18px]">
                        check_circle
                      </span>
                      <span>Flight clearance in 10 seconds</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-status-delivered text-[18px]">
                        check_circle
                      </span>
                      <span>Payouts with no bank delays</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-status-delivered text-[18px]">
                        check_circle
                      </span>
                      <span>Insurance on every flight</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-status-delivered text-[18px]">
                        check_circle
                      </span>
                      <span>Compatible with DJI Enterprise &amp; PX4</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-800/80 backdrop-blur-xl rounded-2xl p-space-lg flex flex-col gap-space-md w-full lg:w-96 z-10 border border-slate-700/60 shadow-xl">
                  <div className="flex items-center justify-between">
                    <span className="font-label-md text-label-md text-slate-300">
                      Operator revenue share
                    </span>
                    <span className="px-space-sm py-0.5 rounded-full bg-status-delivered/20 text-status-delivered font-label-sm text-label-sm font-bold">
                      85% per order
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-slate-400">
                      Average revenue per active aircraft
                    </span>
                    <span className="font-headline-md text-headline-md text-white">
                      from 0.8 SOL / day
                    </span>
                  </div>
                  <button
                    onClick={() => window.location.assign('/operator')}
                    className="w-full py-space-md rounded-full bg-amber-vibrant text-slate-900 font-headline-sm text-headline-sm hover:bg-yellow-400 transition-all shadow-md active:scale-[0.98] text-center"
                    type="button"
                  >
                    Become an operator
                  </button>
                  <span className="text-center font-label-sm text-label-sm text-slate-400">
                    Requires an external-pilot certificate from the Aviation Administration of
                    Kazakhstan
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="w-full px-gutter py-space-xl bg-surface" id="faq">
            <div className="max-w-[1360px] mx-auto flex flex-col gap-space-xl">
              <div className="flex flex-col gap-1 max-w-xl">
                <span className="font-label-md text-label-md text-cyan-interactive uppercase tracking-wider font-bold">
                  FAQ
                </span>
                <h2 className="font-headline-lg text-headline-lg text-on-surface">
                  Safety and regulations
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-cyan-interactive">
                      verified_user
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      How is safety ensured over the city?
                    </h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant pt-space-xs">
                    All routes follow dedicated air corridors above roads and riverbeds (Yessil,
                    Vesnovka). Every aircraft carries a backup GPS module, an autonomous BRS
                    parachute system and ADS-B sensors to prevent collisions.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-tertiary">lock_reset</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      What happens if a flight is cancelled due to weather?
                    </h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant pt-space-xs">
                    If wind suddenly exceeds 12 m/s or dispatch grounds flights, the flight is
                    cancelled. The escrow smart contract instantly and fee-free returns the funds to
                    the customer's wallet or card within 30 seconds.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-secondary">alt_route</span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      How does landing and parcel hand-over work?
                    </h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant pt-space-xs">
                    The drone never touches the ground: it hovers at a safe height of 5 meters and
                    lowers a protected container on a kevlar tether. Once the recipient enters the
                    PIN in the app, the container lock releases.
                  </p>
                </div>

                <div className="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm flex flex-col gap-space-xs">
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-status-delivered">
                      account_balance_wallet
                    </span>
                    <h3 className="font-headline-sm text-headline-sm text-on-surface">
                      Why a Solana smart contract?
                    </h3>
                  </div>
                  <p className="font-body-md text-body-md text-on-surface-variant pt-space-xs">
                    Solana delivers micro-payments with sub-400-millisecond transactions and fees of
                    a fraction of a cent. That makes it possible to program per-kilometre flight
                    payments without intermediaries.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-surface-container-low p-space-md flex flex-col md:flex-row items-center justify-between gap-space-sm border-dashed">
                <div className="flex items-center gap-space-sm">
                  <span className="material-symbols-outlined text-outline">terminal</span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    AeroRoute KZ · Drone delivery showcase (demo)
                  </span>
                </div>
                <span className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  All flight data and prices are for demonstration purposes only
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
      <footer className="w-full bg-surface-container-lowest border-t border-surface-container mt-space-xl">
        <div className="w-full px-gutter py-space-xl">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-space-lg mb-space-xl">
            <div>
              <div className="flex items-center gap-space-xs mb-space-sm">
                <span className="material-symbols-outlined text-primary">flight_takeoff</span>
                <span className="font-headline-sm text-headline-sm text-on-surface">AeroRoute</span>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-md">
                The national network of autonomous logistics corridors in Kazakhstan. Delivery of up
                to 5 kg in 15 minutes across Almaty and Astana.
              </p>
              <div className="inline-flex items-center gap-space-xs px-space-sm py-space-xs rounded-full bg-surface-container-low">
                <span className="w-2 h-2 rounded-full bg-status-delivered animate-pulse"></span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">
                  Air corridors: nominal
                </span>
              </div>
            </div>
            <div>
              <h4 className="font-label-lg text-label-lg text-on-surface mb-space-sm">
                Service areas
              </h4>
              <ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant">
                <li>
                  <span className="font-label-md text-label-md text-on-surface">Almaty:</span>{' '}
                  Medeu, Bostandyk, Turksib, Almaly
                </li>
                <li>
                  <span className="font-label-md text-label-md text-on-surface">Astana:</span>{' '}
                  Yessil, Almaty, Nura, Baikonur
                </li>
                <li className="pt-space-xs">
                  <span className="inline-flex items-center gap-space-xs text-primary font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[16px]">verified</span>Aviation
                    Administration of Kazakhstan license No. 042-KZ
                  </span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-label-lg text-label-lg text-on-surface mb-space-sm">
                Safety and guarantees
              </h4>
              <p className="font-body-sm text-body-sm text-on-surface-variant mb-space-xs">
                Every shipment is protected by the Sol Escrow protocol and confirmed with a digital
                signature on receipt.
              </p>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                In partnership with the Qazpost postal and logistics infrastructure.
              </p>
            </div>
            <div>
              <div className="flex flex-col gap-space-xs">
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  data-path="bezopasnost-i-reglamenty"
                  href="#faq"
                >
                  Flight regulations and safety
                </a>
                <a
                  className="font-body-sm text-body-sm text-on-surface-variant hover:text-primary transition-colors"
                  data-path="usloviya-servisa"
                  href="#faq"
                >
                  Terms of service and offer
                </a>
              </div>
            </div>
          </div>
          <div className="pt-space-md border-t border-surface-container flex flex-col md:flex-row items-center justify-between gap-space-sm font-label-sm text-label-sm text-on-surface-variant">
            <span>
              © 2025 AeroRoute Kazakhstan. All rights reserved. Unmanned aviation infrastructure.
            </span>
            <span>
              Built in accordance with the regulations of the Civil Aviation Committee of Kazakhstan
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
