"use client";

import { validTimestamp } from "@/lib/timestamp.mjs";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  hasAcceptedEducationalNotice,
  readLanguagePreference,
  readManualRefreshPreference,
  readWatchlistPreference,
  saveEducationalNoticeAcceptance,
  saveLanguagePreference,
  saveManualRefreshPreference,
  saveWatchlistPreference,
  type VisitBaselinePreference,
  type WatchPreference,
} from "@/lib/local-preferences";
import { ClearLocalPreferencesButton } from "./privacidad/ClearLocalPreferencesButton";
import { CONTEXT_MODEL_VERSION, DATA_SCHEMA_VERSION, ENGINE_VERSION, SITE_RELEASE, SOURCE_MIRROR } from "./version";

type Lang = "en" | "es";
type SignalKey = "money" | "monetaryStance" | "creditRisk" | "termStructure" | "production" | "labour" | "consumerPrices" | "resourcesFx" | "debtBurden" | "fiscalImpulse";
type WatchKey = WatchPreference;
type Point = { date: string; value: number };
type SixForceKey = "treasury" | "debt" | "oil" | "manufacturing" | "dollar" | "bitcoin";
type SixForceReading = { state: string; value: number | null; change: number | null; secondaryValue: number | null; observedAt: string | null; sourceKey: string; available: boolean };
type SixForceContext = { modelVersion: string; status: "complete" | "partial" | "withheld"; available: number; total: 6; synthesis: string; activePatterns: string[]; divergences: string[]; forces: Record<SixForceKey, SixForceReading> };
type CorrelationEvidence = { observations: number; startMonth: string | null; endMonth: string | null };
type RatioEvidence = {
  status: "available" | "stale" | "insufficient";
  observationMonth: string | null;
  numerator: number | null;
  denominator: number | null;
  numeratorObservations: number;
  denominatorObservations: number;
};
type Detail = {
  eyebrow: string;
  title: string;
  value: string;
  fact: string;
  factLabel?: string;
  interpretation: string;
  interpretationLabel?: string;
  watch: string;
  watchLabel?: string;
  sourceLabel: string;
  sourceUrl: string;
};
type VisitBaseline = VisitBaselinePreference;
type Data = {
  observedAt: string;
  requestedAt: string;
  refreshMode: string;
  cache?: { generatedAt: string; validUntil: string; nextManualAt?: string; nextDailyAt?: string; ttlSeconds: number; editionTtlSeconds?: number; mode: string };
  series: Record<string, Point[]>;
  latest: Record<string, Point | null>;
  bitcoin: {
    price: number | null; change24h: number | null; marketCap: number | null;
    priceObservedAt?: string;
    priceConsensus?: "confirmed" | "divergent" | "single-source" | "unavailable";
    priceSpreadPercent?: number | null;
    priceSources?: string[];
    supply: number; stockToFlow: number; blockHeight: number | null;
    hashRate: number | null; difficulty: number | null; feeFast: number | null; feeHour: number | null;
  };
  derived: {
    changes: Record<string, number | null>;
    scores: { liquidity: number; credit: number; realEconomy: number; inflation: number; fiscal: number; composite: number } & Record<SignalKey, number>;
    regime: string;
    correlations: Record<string, number | null>;
    correlationEvidence?: Record<string, CorrelationEvidence>;
    ratios: { bitcoinGoldOunces: number | null; sp500Gold: number | null; debtToM2: number | null; realRate: number | null };
    ratioEvidence?: Record<string, RatioEvidence>;
    sixForce: SixForceContext;
  };
  freshness: Array<{ key: string; id: string; observedAt: string | null; status: string; error: string | null; source?: string | null }>;
  upstreams?: Array<{ id: string; status: "ready" | "recovering" | "cooldown"; coolingUntil?: string | null }>;
  provenance: {
    fred: string; bitcoinPrice: string; bitcoinNetwork: string; bitcoinHistory?: string; federalDebt?: string;
    fredAvailable?: number; fredTotal?: number; modelReady?: boolean;
    modelStatus?: "complete" | "provisional" | "withheld";
    modelInputsAvailable?: number; modelInputsTotal?: number; availableWeight?: number;
    engineReady?: Record<string, boolean>; signalReady?: Record<string, boolean>; mode: string;
  };
};

const fallback: Data = {
  observedAt: "",
  requestedAt: "",
  refreshMode: "awaiting-source",
  cache: { generatedAt: "", validUntil: "", ttlSeconds: 900, mode: "shared-snapshot" },
  series: {},
  latest: {},
  bitcoin: { price: null, change24h: null, marketCap: null, priceConsensus: "unavailable", priceSpreadPercent: null, priceSources: [], supply: 0, stockToFlow: 0, blockHeight: null, hashRate: null, difficulty: null, feeFast: null, feeHour: null },
  derived: {
    changes: {},
    scores: { liquidity: 0, credit: 0, realEconomy: 0, inflation: 0, fiscal: 0, money: 0, monetaryStance: 0, creditRisk: 0, termStructure: 0, production: 0, labour: 0, consumerPrices: 0, resourcesFx: 0, debtBurden: 0, fiscalImpulse: 0, composite: 0 },
    regime: "mixed-transition",
    correlations: {},
    correlationEvidence: {},
    ratios: { bitcoinGoldOunces: null, sp500Gold: null, debtToM2: null, realRate: null },
    ratioEvidence: {},
    sixForce: {
      modelVersion: CONTEXT_MODEL_VERSION,
      status: "withheld",
      available: 0,
      total: 6,
      synthesis: "insufficient-evidence",
      activePatterns: [],
      divergences: [],
      forces: Object.fromEntries(["treasury", "debt", "oil", "manufacturing", "dollar", "bitcoin"].map((key) => [key, { state: "unavailable", value: null, change: null, secondaryValue: null, observedAt: null, sourceKey: key, available: false }])) as Record<SixForceKey, SixForceReading>,
    },
  },
  freshness: [],
  provenance: { fred: "unavailable", bitcoinPrice: "unavailable", bitcoinNetwork: "unavailable", fredAvailable: 0, fredTotal: 18, modelReady: false, modelStatus: "withheld", modelInputsAvailable: 0, modelInputsTotal: 14, mode: "fallback" },
};

const text = {
  en: {
    nav: ["Dashboard", "Liquidity", "Six forces", "Hard assets", "Theory", "Sources"],
    live: "VERIFIABLE MACRO MONITOR", title: "The cycle, decoded.", subtitle: "Official data. Austrian interpretation. Cypherpunk skepticism.",
    intro: "Track money, credit, production and hard assets in a verifiable economic-cycle monitor. Data and interpretation remain separate.",
    refresh: "Refresh data", updated: "Observed", regime: "CURRENT REGIME", regimeName: "Late expansion / liquidity return",
    regimeBody: "Money growth is returning while credit stress remains contained and hard assets reprice monetary risk.",
    risk: "Cycle distortion index", confidence: "Data coverage", objective: "Observed signal", austrian: "Austrian lens",
    terminal: "Macro terminal", terminalSub: "Choose a series, change the horizon and inspect any point.",
    indicators: "Signal board", indicatorsSub: "Select an indicator for definition, provenance and interpretation.",
    scarcity: "Scarcity & monetary competition", scarcitySub: "Compare monetary stocks, annual flows and purchasing-power ratios.",
    pillars: "Three pillars of the cycle", quote: "Ideas behind the lens", method: "From data to interpretation",
    sources: "Sources & verification", disclaimer: "Educational macro analysis—not financial advice. Scores are transparent analytical opinions, not official statistics.",
    read: "Read the explanation", close: "Close", value: "Latest value", source: "Primary source",
    facts: "What the data says", thesis: "Austrian interpretation", watch: "What to watch next",
    s2f: "Stock-to-flow", supply: "Circulating supply", block: "Block height", fees: "Priority fee",
  },
  es: {
    nav: ["Panel", "Liquidez", "Seis fuerzas", "Activos duros", "Teoría", "Fuentes"],
    live: "MONITOR MACRO VERIFICABLE", title: "El ciclo, descifrado.", subtitle: "Datos oficiales. Interpretación austriaca. Escepticismo cypherpunk.",
    intro: "Dinero, crédito, producción y activos duros en un monitor verificable del ciclo económico. Los datos y la interpretación permanecen separados.",
    refresh: "Actualizar datos", updated: "Observado", regime: "RÉGIMEN ACTUAL", regimeName: "Expansión tardía / regreso de liquidez",
    regimeBody: "El crecimiento monetario regresa mientras el estrés crediticio sigue contenido y los activos duros revalorizan el riesgo monetario.",
    risk: "Índice de distorsión cíclica", confidence: "Cobertura de datos", objective: "Señal observada", austrian: "Lente austriaca",
    terminal: "Terminal macro", terminalSub: "Elige una serie, cambia el horizonte e inspecciona cualquier punto.",
    indicators: "Panel de señales", indicatorsSub: "Selecciona un indicador para ver definición, procedencia e interpretación.",
    scarcity: "Escasez y competencia monetaria", scarcitySub: "Compara stocks monetarios, flujos anuales y ratios de poder adquisitivo.",
    pillars: "Los tres pilares del ciclo", quote: "Las ideas detrás de la lente", method: "Del dato a la interpretación",
    sources: "Fuentes y verificación", disclaimer: "Análisis macro educativo; no es asesoramiento financiero. Las puntuaciones son opiniones analíticas transparentes, no estadísticas oficiales.",
    read: "Leer explicación", close: "Cerrar", value: "Último valor", source: "Fuente primaria",
    facts: "Qué dicen los datos", thesis: "Interpretación austriaca", watch: "Qué vigilar ahora",
    s2f: "Stock-to-flow", supply: "Oferta circulante", block: "Altura de bloque", fees: "Comisión prioritaria",
  },
};

const seriesMeta = {
  m2: { en: "M2 money stock", es: "Masa monetaria M2", unit: { en: "USD bn", es: "miles de millones USD" }, source: "M2SL", color: "#c7ff18" },
  treasury10y: { en: "10-year Treasury yield", es: "Rendimiento Treasury 10A", unit: { en: "percent", es: "porcentaje" }, source: "DGS10", color: "#72b7ff" },
  federalDebt: { en: "Federal debt", es: "Deuda federal", unit: { en: "USD bn", es: "miles de millones USD" }, source: "GFDEBTN", color: "#ff6b1a" },
  cpi: { en: "Consumer prices", es: "Precios al consumidor", unit: { en: "index points", es: "puntos de índice" }, source: "CPIAUCSL", color: "#bba4ff" },
  oil: { en: "WTI crude oil", es: "Petróleo WTI", unit: { en: "USD / barrel", es: "USD por barril" }, source: "DCOILWTICO", color: "#f0c85a" },
  gold: { en: "Gold", es: "Oro", unit: { en: "USD / troy oz", es: "USD por onza troy" }, source: "GOLDAMGBD228NLBM", color: "#ffd15c" },
  sp500: { en: "S&P 500", es: "S&P 500", unit: { en: "index points", es: "puntos de índice" }, source: "SP500", color: "#63d9c7" },
  vix: { en: "VIX stress", es: "Estrés VIX", unit: { en: "index points", es: "puntos de índice" }, source: "VIXCLS", color: "#ff8c70" },
  industrialProduction: { en: "Industrial production", es: "Producción industrial", unit: { en: "index points", es: "puntos de índice" }, source: "INDPRO", color: "#8ec5ff" },
  manufacturingSurvey: { en: "Manufacturing survey proxy", es: "Proxy de encuesta manufacturera", unit: { en: "diffusion index", es: "índice de difusión" }, source: "CFSBCACTIVITYMFG", color: "#c49cff" },
  bitcoin: { en: "Bitcoin", es: "Bitcoin", unit: { en: "USD", es: "USD" }, source: "BLOCKCHAIN", color: "#ff6417" },
};

const metrics = [
  { key: "m2", label: ["M2 money stock", "Masa monetaria M2"], source: "M2SL", signal: "money", unit: ["USD bn", "miles de millones USD"], digits: 1, fact: ["Broad money and near-money held by the public.", "Dinero amplio y activos casi monetarios en manos del público."], thesis: ["Fast money growth can distort relative prices before CPI reacts.", "Un crecimiento rápido puede distorsionar precios relativos antes de aparecer en el IPC."], watch: ["YoY growth and its gap with real output.", "Crecimiento interanual y su brecha frente al producto real."] },
  { key: "fedFunds", label: ["Federal funds rate", "Tipo de los fondos federales"], source: "FEDFUNDS", signal: "monetaryStance", unit: ["percent", "porcentaje"], digits: 2, fact: ["The overnight policy rate anchoring dollar credit.", "El tipo oficial nocturno que ancla el crédito en dólares."], thesis: ["The issue is whether the administered rate diverges from genuine time preferences.", "La cuestión es si el tipo administrado diverge de las preferencias temporales reales."], watch: ["Cuts arriving while liquidity and asset prices accelerate.", "Recortes mientras la liquidez y los activos se aceleran."] },
  { key: "yieldCurve", label: ["10Y–2Y yield curve", "Curva 10A–2A"], source: "T10Y2Y", signal: "termStructure", unit: ["percentage points", "puntos porcentuales"], digits: 2, fact: ["The spread between long and short Treasury yields.", "Diferencia entre rendimientos del Tesoro largos y cortos."], thesis: ["Re-steepening after inversion can reveal the transition from boom to correction.", "La positivización tras invertirse puede revelar la transición del auge a la corrección."], watch: ["A rapid steepening driven by falling short rates.", "Un empinamiento rápido por caída de tipos cortos."] },
  { key: "creditSpread", label: ["Credit stress / BAA", "Estrés de crédito / BAA"], source: "BAA10Y", signal: "creditRisk", unit: ["percentage points", "puntos porcentuales"], digits: 2, fact: ["Moody's BAA corporate yield minus the 10-year Treasury yield; unavailable observations stay unavailable.", "Rendimiento corporativo BAA de Moody's menos el Treasury a 10 años; si falta el dato se mantiene como no disponible."], thesis: ["Tight spreads can conceal malinvestment until refinancing conditions change.", "Diferenciales bajos pueden ocultar malas inversiones hasta que cambia la refinanciación."], watch: ["Stress acceleration, not merely its absolute level.", "La aceleración del estrés, no solo su nivel."] },
  { key: "cpi", label: ["Consumer price index", "Índice de precios al consumo"], source: "CPIAUCSL", signal: "consumerPrices", unit: ["index points", "puntos de índice"], digits: 2, fact: ["A basket-based measure of consumer prices.", "Medida de precios de una cesta de consumo."], thesis: ["CPI is a late and partial record of monetary effects.", "El IPC es un registro tardío y parcial de los efectos monetarios."], watch: ["Services, shelter and the distribution of new money.", "Servicios, vivienda y distribución del dinero nuevo."] },
  { key: "unemployment", label: ["Unemployment", "Desempleo"], source: "UNRATE", signal: "labour", unit: ["percent", "porcentaje"], digits: 1, fact: ["Share of the labour force actively seeking work.", "Parte de la población activa que busca empleo."], thesis: ["Labour is usually a lagging confirmation, not an early cycle signal.", "El empleo suele confirmar tarde, no anticipar el ciclo."], watch: ["Rate of change and permanent job losses.", "Velocidad del cambio y pérdidas permanentes de empleo."] },
  { key: "federalDebt", label: ["US federal debt", "Deuda federal de EE. UU."], source: "GFDEBTN", signal: "debtBurden", unit: ["USD trillion", "billones USD"], digits: 1, fact: ["Gross federal debt outstanding.", "Deuda federal bruta en circulación."], thesis: ["Persistent fiscal dominance increases pressure for financial repression or monetary accommodation.", "El dominio fiscal persistente aumenta la presión hacia represión financiera o acomodo monetario."], watch: ["Interest expense, maturity wall and debt-to-GDP.", "Intereses, vencimientos y deuda sobre PIB."] },
  { key: "dollar", label: ["Broad dollar index", "Índice amplio del dólar"], source: "DTWEXBGS", signal: "resourcesFx", unit: ["index points", "puntos de índice"], digits: 2, fact: ["Trade-weighted value of the dollar.", "Valor del dólar ponderado por comercio."], thesis: ["Reserve demand can mask domestic dilution for long periods.", "La demanda de reserva puede ocultar la dilución interna durante mucho tiempo."], watch: ["Dollar weakness alongside commodity strength.", "Debilidad del dólar junto a fortaleza de materias primas."] },
  { key: "oil", label: ["WTI crude oil", "Petróleo WTI"], source: "DCOILWTICO", signal: "resourcesFx", unit: ["USD per barrel", "USD por barril"], digits: 2, fact: ["Benchmark price for US crude oil.", "Precio de referencia del crudo estadounidense."], thesis: ["Energy prices expose real resource constraints that credit cannot print away.", "La energía revela restricciones reales que el crédito no puede imprimir."], watch: ["Oil rising while growth indicators weaken.", "Petróleo al alza mientras el crecimiento se debilita."] },
  { key: "manufacturingSurvey", label: ["Manufacturing survey proxy", "Proxy de encuesta manufacturera"], source: "CFSBCACTIVITYMFG", signal: "production", contextOnly: true, unit: ["diffusion index · not ISM PMI", "índice de difusión · no es ISM PMI"], digits: 1, fact: ["Chicago Fed District 7 respondents report activity relative to their own long-run average; zero means trend growth.", "Los encuestados del Distrito 7 de la Fed de Chicago comparan la actividad con su propia media histórica; cero significa crecimiento tendencial."], thesis: ["Survey evidence can lead hard production data, but a regional diffusion index cannot stand in for the national economy.", "La encuesta puede adelantarse a la producción observada, pero un índice regional no representa por sí solo a toda la economía nacional."], watch: ["Confirmation or contradiction from industrial production and capacity utilization.", "Confirmación o contradicción de la producción industrial y la utilización de capacidad."] },
] as const;

const quotes = [
  { quote: "Inflation is a policy.", author: "Ludwig von Mises", work: "Economic Policy", url: "https://mises.org/library/book/economic-policy-thoughts-today-and-tomorrow" },
  { quote: "The more the state plans, the more difficult planning becomes for the individual.", author: "F. A. Hayek", work: "The Road to Serfdom", url: "https://press.uchicago.edu/ucp/books/book/chicago/R/bo4138549.html" },
  { quote: "Money is a commodity whose economic function is to facilitate the interchange of goods and services.", author: "Carl Menger", work: "On the Origins of Money", url: "https://mises.org/library/book/origins-money" },
  { quote: "The State is the organization of robbery systematized and writ large.", author: "Murray N. Rothbard", work: "The Ethics of Liberty", url: "https://mises.org/library/book/ethics-liberty" },
  { quote: "Only Bitcoin can credibly serve as long term store of value.", author: "Saifedean Ammous", work: "Can cryptocurrencies fulfil the functions of money?", url: "https://www.sciencedirect.com/science/article/pii/S1062976917300777" },
];

const discriminationScenarios = [
  { key:"ppi", short:"PPI", title:["Producer inflation shock","Shock de inflación al productor"], layer:["Upstream prices","Precios aguas arriba"], input:["PPI +1.2 pp · CPI stable · employment stable · policy unchanged","PPI +1,2 pp · IPC estable · empleo estable · política sin cambios"], classification:["Upstream cost pressure","Presión de costes aguas arriba"], mechanism:["Input and intermediate-goods costs rise first. Consumer pass-through depends on margins, demand and persistence.","Suben primero los costes de insumos y bienes intermedios. El traslado al consumidor depende de márgenes, demanda y persistencia."], lag:["Potential CPI pass-through: months, not automatic","Traslado potencial al IPC: meses, no automático"], falsifier:["PPI reverses while CPI and margins remain unchanged.","El PPI revierte mientras IPC y márgenes siguen sin cambios."], notThis:["Not consumer inflation; not a monetary-policy move","No es inflación al consumidor ni un movimiento de política monetaria"] },
  { key:"cpi", short:"CPI", title:["Consumer inflation shock","Shock de inflación al consumidor"], layer:["Household prices","Precios de los hogares"], input:["Core CPI +0.6 pp · PPI stable · employment stable · policy unchanged","IPC subyacente +0,6 pp · PPI estable · empleo estable · política sin cambios"], classification:["Consumer-price persistence","Persistencia de precios al consumidor"], mechanism:["The household basket is repricing, eroding realized purchasing power. It may alter policy expectations without being a policy action itself.","La cesta de los hogares se encarece y erosiona poder adquisitivo realizado. Puede alterar expectativas de tipos sin ser una acción de política."], lag:["Observed at the consumer layer now; policy response is conditional","Ya observado en la capa de consumo; la respuesta monetaria es condicional"], falsifier:["Broad components decelerate and inflation expectations remain anchored.","Los componentes amplios desaceleran y las expectativas siguen ancladas."], notThis:["Not producer inflation; not proof of labour strength","No es inflación al productor ni prueba de fortaleza laboral"] },
  { key:"employment", short:"JOBS", title:["Labour-market deterioration","Deterioro del mercado laboral"], layer:["Real economy","Economía real"], input:["Unemployment +0.5 pp · payroll growth slows · prices stable · policy unchanged","Desempleo +0,5 pp · se frena la creación de empleo · precios estables · política sin cambios"], classification:["Real-economy weakening","Debilitamiento de la economía real"], mechanism:["Hiring and income formation weaken. Labour usually confirms a turn after financial and production signals rather than causing consumer inflation.","Se debilitan la contratación y la formación de renta. El empleo suele confirmar el giro después de crédito y producción, no causar por sí solo el IPC."], lag:["Lagging confirmation; recession risk rises conditionally","Confirmación rezagada; aumenta de forma condicional el riesgo de recesión"], falsifier:["Participation explains the move and payrolls, hours and claims reaccelerate.","La participación explica el movimiento y nóminas, horas y solicitudes se reaceleran."], notThis:["Not inflation; not an automatic rate-cut signal","No es inflación ni una señal automática de recorte de tipos"] },
  { key:"policy", short:"FED", title:["Monetary accommodation","Acomodación monetaria"], layer:["Money and credit","Dinero y crédito"], input:["Policy rate −100 bp · M2 accelerates · PPI/CPI stable initially · employment stable","Tipo oficial −100 pb · M2 acelera · PPI/IPC inicialmente estables · empleo estable"], classification:["Policy and liquidity impulse","Impulso de política y liquidez"], mechanism:["Administered funding conditions loosen first. Credit, asset prices and capital allocation can react before producer or consumer prices.","Primero se relajan las condiciones administradas de financiación. Crédito, activos y asignación de capital pueden reaccionar antes que PPI o IPC."], lag:["Financial transmission first; price effects are delayed and uncertain","Transmisión financiera primero; precios después y con incertidumbre"], falsifier:["Money and credit keep contracting despite the rate cut.","Dinero y crédito siguen contrayéndose pese al recorte."], notThis:["Not CPI or PPI inflation; not proof of stronger employment","No es inflación IPC/PPI ni prueba de mejora del empleo"] },
] as const;

function format(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function marketFormat(value: number | null | undefined, lang: Lang, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", { maximumFractionDigits: digits }).format(value);
}

function sixForceStateLabel(state: string, lang: Lang) {
  const labels: Record<string, [string, string]> = {
    "yields-rising": ["YIELDS RISING", "RENDIMIENTOS AL ALZA"],
    "yields-falling": ["YIELDS FALLING", "RENDIMIENTOS A LA BAJA"],
    "yields-range-bound": ["YIELDS RANGE-BOUND", "RENDIMIENTOS LATERALES"],
    "debt-accelerating": ["DEBT ACCELERATING", "DEUDA ACELERANDO"],
    "debt-decelerating": ["DEBT DECELERATING", "DEUDA DESACELERANDO"],
    "debt-steady-growth": ["STEADY DEBT GROWTH", "CRECIMIENTO ESTABLE DE DEUDA"],
    "oil-rising": ["OIL RISING", "PETRÓLEO AL ALZA"],
    "oil-falling": ["OIL FALLING", "PETRÓLEO A LA BAJA"],
    "oil-range-bound": ["OIL RANGE-BOUND", "PETRÓLEO LATERAL"],
    "above-trend": ["ABOVE-TREND GROWTH", "CRECIMIENTO SOBRE TENDENCIA"],
    "below-trend": ["BELOW-TREND GROWTH", "CRECIMIENTO BAJO TENDENCIA"],
    "near-trend": ["NEAR-TREND GROWTH", "CRECIMIENTO CERCA DE TENDENCIA"],
    "dollar-strengthening": ["DOLLAR STRENGTHENING", "DÓLAR FORTALECIÉNDOSE"],
    "dollar-weakening": ["DOLLAR WEAKENING", "DÓLAR DEBILITÁNDOSE"],
    "dollar-range-bound": ["DOLLAR RANGE-BOUND", "DÓLAR LATERAL"],
    "bitcoin-rising": ["BITCOIN RISING", "BITCOIN AL ALZA"],
    "bitcoin-falling": ["BITCOIN FALLING", "BITCOIN A LA BAJA"],
    "bitcoin-range-bound": ["BITCOIN RANGE-BOUND", "BITCOIN LATERAL"],
    "limited-history": ["LIMITED HISTORY", "HISTÓRICO LIMITADO"],
    unavailable: ["UNAVAILABLE", "NO DISPONIBLE"],
  };
  return (labels[state] ?? labels.unavailable)[lang === "en" ? 0 : 1];
}

function sixForceSynthesis(key: string, lang: Lang) {
  const copy: Record<string, { title: [string, string]; body: [string, string]; falsifier: [string, string] }> = {
    "energy-pressure-below-trend-manufacturing": {
      title: ["Energy pressure meets softer manufacturing", "Presión energética con manufactura más débil"],
      body: ["Oil is rising while the survey sits below its historical growth trend. That combination can squeeze margins without proving general inflation or recession.", "El petróleo sube mientras la encuesta queda bajo su tendencia histórica de crecimiento. La combinación puede comprimir márgenes sin demostrar inflación general ni recesión."],
      falsifier: ["Oil reverses or manufacturing returns above trend.", "El petróleo revierte o la manufactura vuelve sobre tendencia."],
    },
    "rising-yields-with-fiscal-refinancing-pressure": {
      title: ["Yields and debt reinforce refinancing pressure", "Rendimientos y deuda refuerzan la presión de refinanciación"],
      body: ["The 10-year yield is repricing upward while federal debt grows faster than 5% year over year. This raises a financing question; it does not predict a policy response.", "El Treasury a 10 años se repricia al alza mientras la deuda federal crece más de un 5% interanual. Plantea una cuestión de financiación; no predice la respuesta política."],
      falsifier: ["Yields fall materially or debt growth slows below the declared threshold.", "Los rendimientos caen de forma material o la deuda se frena bajo el umbral declarado."],
    },
    "dollar-liquidity-tightening": {
      title: ["Dollar strength coincides with Bitcoin weakness", "Fortaleza del dólar junto a debilidad de Bitcoin"],
      body: ["The cross-market pair is consistent with tighter dollar liquidity, but it remains a co-movement—not proof of one-way causality.", "El par entre mercados es compatible con liquidez en dólares más restrictiva, pero sigue siendo un comovimiento, no prueba de causalidad unidireccional."],
      falsifier: ["The dollar loses momentum or Bitcoin recovers despite persistent dollar strength.", "El dólar pierde impulso o Bitcoin se recupera pese a que persista su fortaleza."],
    },
    "monetary-repricing": {
      title: ["A weaker dollar coincides with Bitcoin repricing", "Un dólar más débil coincide con la revalorización de Bitcoin"],
      body: ["This pair is consistent with monetary-risk repricing. Debt, yields and manufacturing still determine whether the move is broad or asset-specific.", "El par es compatible con una repricing del riesgo monetario. Deuda, rendimientos y manufactura determinan si el movimiento es amplio o específico de activos."],
      falsifier: ["The dollar rebounds or Bitcoin loses momentum without confirmation from the other forces.", "El dólar rebota o Bitcoin pierde impulso sin confirmación de las otras fuerzas."],
    },
    "compound-pressure": {
      title: ["Several conditional patterns are active", "Hay varios patrones condicionales activos"],
      body: ["More than one declared relationship is present. Read each force separately: overlap raises relevance, not certainty.", "Hay más de una relación declarada. Conviene leer cada fuerza por separado: la coincidencia eleva la relevancia, no la certeza."],
      falsifier: ["One or more component thresholds stop being met.", "Uno o más umbrales componentes dejan de cumplirse."],
    },
    "cross-market-divergence": {
      title: ["The forces contradict one another", "Las fuerzas se contradicen"],
      body: ["Cross-market directions do not fit a single narrative. The dashboard preserves that disagreement instead of averaging it into a color.", "Las direcciones entre mercados no encajan en una sola narrativa. El panel conserva el desacuerdo en vez de promediarlo en un color."],
      falsifier: ["The conflicting pairs converge over the next observations.", "Los pares en conflicto convergen en las próximas observaciones."],
    },
    "mixed-signals": {
      title: ["No single force dominates", "Ninguna fuerza domina"],
      body: ["The six observations do not activate a declared joint pattern. Mixed is an analytical result, not a neutral score.", "Las seis observaciones no activan un patrón conjunto declarado. Mixto es un resultado analítico, no una puntuación neutral."],
      falsifier: ["A declared pair crosses its published thresholds.", "Un par declarado cruza sus umbrales publicados."],
    },
    "insufficient-evidence": {
      title: ["Synthesis withheld", "Síntesis retenida"],
      body: ["Fewer than four forces have verifiable observations. Missing evidence is not converted to zero or neutral.", "Menos de cuatro fuerzas tienen observaciones verificables. La evidencia ausente no se convierte en cero ni neutral."],
      falsifier: ["At least four current forces become available.", "Pasan a estar disponibles al menos cuatro fuerzas actuales."],
    },
  };
  const item = copy[key] ?? copy["mixed-signals"];
  return { title: item.title[lang === "en" ? 0 : 1], body: item.body[lang === "en" ? 0 : 1], falsifier: item.falsifier[lang === "en" ? 0 : 1] };
}

function snapshotBaseline(snapshot: Data): VisitBaseline {
  return {
    capturedAt: new Date().toISOString(),
    requestedAt: snapshot.requestedAt,
    regime: snapshot.derived.regime,
    composite: snapshot.derived.scores.composite,
    modelReady: snapshot.provenance.mode !== "fallback" && (snapshot.provenance.modelStatus ?? (snapshot.provenance.modelReady ? "complete" : "withheld")) !== "withheld",
    bitcoinPrice: snapshot.bitcoin.price,
    latestDates: Object.fromEntries(Object.entries(snapshot.latest).map(([key, point]) => [key, point?.date ?? null])),
  };
}

function latestValue(data: Data, key: string) {
  return data.latest[key]?.value ?? null;
}

function seriesSource(data: Data, key: string) {
  const source = data.freshness.find((item) => item.key === key)?.source;
  return ({
    api: "FRED REST",
    csv: "FRED",
    dbnomics: "DBNOMICS",
    bls: "BLS",
    cboe: "CBOE",
    worldbank: "WORLD BANK",
    coinbase: "COINBASE",
  } as Record<string, string>)[source ?? ""] ?? "FRED";
}

const dbnomicsLinks: Record<string, string> = {
  m2: "https://db.nomics.world/FED/H6_H6_M2/M2.M?tab=table",
  fedFunds: "https://db.nomics.world/FED/H15/RIFSPFF_N.M?tab=table",
  dollar: "https://db.nomics.world/FED/H10/JRXWTFB_N.M?tab=table",
  industrialProduction: "https://db.nomics.world/FED/G17_IP_MAJOR_INDUSTRY_GROUPS/IP.B50001.S?tab=table",
  capacityUtilization: "https://db.nomics.world/FED/G17_CAPUTL/CAPUTL.B50001.S?tab=table",
  oil: "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm",
};

const worldBankLinks: Record<string, string> = {
  gold: "https://www.worldbank.org/en/research/commodity-markets",
  federalDebt: "https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS?locations=US",
  debtToGdp: "https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS?locations=US",
  realGdpGrowth: "https://data.worldbank.org/indicator/NY.GDP.MKTP.KD.ZG?locations=US",
};

const fredSeriesIds: Record<string, string> = {
  m2: "M2SL",
  treasury10y: "DGS10",
  federalDebt: "GFDEBTN",
  oil: "DCOILWTICO",
  gold: "GOLDAMGBD228NLBM",
  dollar: "DTWEXBGS",
  sp500: "SP500",
  vix: "VIXCLS",
  manufacturingSurvey: "CFSBCACTIVITYMFG",
};

function seriesSourceUrl(data: Data, key: string) {
  const item = data.freshness.find((entry) => entry.key === key);
  if (item?.source === "dbnomics" && key === "yieldCurve") return "/api/data-manifest";
  if (item?.source === "dbnomics") return dbnomicsLinks[key] ?? "https://db.nomics.world/";
  if (item?.source === "bls") return key === "unemployment"
    ? "https://data.bls.gov/timeseries/LNS14000000"
    : "https://data.bls.gov/timeseries/CUSR0000SA0";
  if (item?.source === "cboe") return key === "vix"
    ? "https://www.cboe.com/tradable_products/vix/vix_historical_data/"
    : "https://www.cboe.com/us/indices/dashboard/spx/";
  if (item?.source === "worldbank") return worldBankLinks[key] ?? "https://data.worldbank.org/country/united-states";
  if (item?.source === "coinbase") return "https://www.coinbase.com/price/pax-gold";
  return `https://fred.stlouisfed.org/series/${item?.id ?? metrics.find((metric) => metric.key === key)?.source ?? fredSeriesIds[key] ?? key}`;
}

function bitcoinSourceUrl(data: Data) {
  if (data.provenance.bitcoinPrice === "Coinbase + Kraken") return "/api/bitcoin";
  if (data.provenance.bitcoinPrice === "Kraken") return "https://docs.kraken.com/api-reference/market-data/get-ticker-information";
  if (data.provenance.bitcoinPrice === "Coinbase Exchange") return "https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker";
  if (data.provenance.bitcoinPrice === "CoinGecko") return "https://www.blockchain.com/explorer/charts/market-price";
  return "https://www.blockchain.com/explorer/charts/market-price";
}

function debtSourceUrl(data: Data) {
  if (data.provenance.federalDebt === "U.S. Treasury Fiscal Data") return "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/";
  return seriesSourceUrl(data, "federalDebt");
}

function observedDate(data: Data, key: string) {
  return data.latest[key]?.date ?? data.freshness.find((item) => item.key === key)?.observedAt ?? "—";
}

function marketState(data: Data, key: string) {
  const status = data.freshness.find((item) => item.key === key)?.status;
  if (status === "live") return "live";
  if (status === "last-known-good") return "backup";
  if (status === "stale") return "stale";
  return "unavailable";
}

function marketStateLabel(state: string, lang: Lang) {
  const labels: Record<string, [string, string]> = {
    live: ["CURRENT", "AL DÍA"],
    backup: ["LAST VERIFIED", "ÚLTIMO VERIFICADO"],
    stale: ["STALE", "DESACTUALIZADO"],
    unavailable: ["UNAVAILABLE", "SIN DATO"],
    confirmed: ["TWO SOURCES", "DOS FUENTES"],
    divergent: ["DIVERGENT", "DIVERGENCIA"],
    "single-source": ["ONE SOURCE", "UNA FUENTE"],
  };
  return (labels[state] ?? labels.unavailable)[lang === "en" ? 0 : 1];
}

function sourceStatusLabel(status: string, lang: Lang) {
  const labels: Record<string, [string, string]> = {
    live: ["CURRENT", "AL DÍA"],
    "last-known-good": ["LAST VERIFIED", "ÚLTIMO VERIFICADO"],
    stale: ["STALE", "DESACTUALIZADO"],
    unavailable: ["UNAVAILABLE", "NO DISPONIBLE"],
  };
  return (labels[status] ?? labels.unavailable)[lang === "en" ? 0 : 1];
}

function prepareChartPoints(points: Point[]) {
  const byDate = new Map<string, Point>();
  for (const point of points) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(point.date) && Number.isFinite(point.value)) byDate.set(point.date, point);
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function formatChartDate(date: string | undefined, lang: Lang) {
  if (!date) return "—";
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!Number.isFinite(parsed.getTime())) return "—";
  return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(parsed);
}

function compactChartValue(value: number, lang: Lang) {
  return new Intl.NumberFormat(lang === "es" ? "es-ES" : "en-US", {
    notation: "compact", maximumFractionDigits: 1,
  }).format(value);
}

function LineChart({ points, color, unit, horizon, lang, status, state }: { points: Point[]; color: string; unit: string; horizon: number; lang: Lang; status: string; state: string }) {
  const [cursor, setCursor] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const safePoints = prepareChartPoints(points);
  const latestDate = safePoints.at(-1)?.date;
  const cutoff = latestDate && horizon > 0 ? new Date(`${latestDate}T00:00:00Z`) : null;
  if (cutoff) cutoff.setUTCFullYear(cutoff.getUTCFullYear() - horizon);
  const shown = cutoff ? safePoints.filter((point) => point.date >= cutoff.toISOString().slice(0, 10)) : safePoints;
  const values = shown.map((p) => p.value);
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 0;
  const rawRange = max - min || Math.max(Math.abs(max) * 0.1, 1);
  const plotMin = min - rawRange * 0.08;
  const plotMax = max + rawRange * 0.08;
  const range = plotMax - plotMin || 1;
  const coords = shown.map((p, i) => ({
    ...p, x: shown.length === 1 ? 50 : 5 + (i / (shown.length - 1)) * 90,
    y: 88 - ((p.value - plotMin) / range) * 74,
  }));
  const path = coords.map((p) => `${p.x},${p.y}`).join(" ");
  const selectedIndex = coords.length ? Math.min(cursor ?? coords.length - 1, coords.length - 1) : 0;
  const selected = coords[selectedIndex];
  const start = coords[0];
  const end = coords.at(-1);
  const summary = coords.length
    ? (lang === "es"
        ? `${coords.length} observaciones entre ${formatChartDate(start?.date, lang)} y ${formatChartDate(end?.date, lang)}. Punto seleccionado: ${formatChartDate(selected?.date, lang)}, ${marketFormat(selected?.value, lang)} ${unit}.`
        : `${coords.length} observations from ${formatChartDate(start?.date, lang)} to ${formatChartDate(end?.date, lang)}. Selected point: ${formatChartDate(selected?.date, lang)}, ${marketFormat(selected?.value, lang)} ${unit}.`)
    : (lang === "es" ? "No hay observaciones verificadas para esta serie." : "There are no verified observations for this series.");
  function move(event: React.PointerEvent<SVGSVGElement>) {
    if (!svgRef.current || !coords.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const percent = ((event.clientX - rect.left) / rect.width - 0.05) / 0.9;
    setCursor(Math.max(0, Math.min(coords.length - 1, Math.round(percent * (coords.length - 1)))));
  }
  function inspectWithKeyboard(event: React.KeyboardEvent<SVGSVGElement>) {
    if (!coords.length) return;
    let next: number | null = null;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(0, selectedIndex - 1);
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(coords.length - 1, selectedIndex + 1);
    if (event.key === "Home") next = 0;
    if (event.key === "End") next = coords.length - 1;
    if (next == null) return;
    event.preventDefault();
    setCursor(next);
  }
  return (
    <div className="line-chart" aria-describedby="macro-chart-summary">
      <p className="sr-only" id="macro-chart-summary" aria-live="polite">{summary}</p>
      <div className="chart-readout" aria-live="polite">
        <div><span>{lang === "es" ? "PUNTO SELECCIONADO" : "SELECTED POINT"}</span><strong>{marketFormat(selected?.value, lang)} <small>{unit}</small></strong><time dateTime={selected?.date}>{formatChartDate(selected?.date, lang)}</time></div>
        <div className="chart-window"><span>{lang === "es" ? "VENTANA VISIBLE" : "VISIBLE WINDOW"}</span><b>{coords.length} {lang === "es" ? "OBSERVACIONES" : "OBSERVATIONS"}</b><small className={`chart-state ${state}`}>{status}</small></div>
      </div>
      {coords.length > 1 ? <>
        <div className="chart-plot">
          <div className="chart-y-axis" aria-hidden="true"><span>{compactChartValue(plotMax, lang)}</span><span>{compactChartValue((plotMax + plotMin) / 2, lang)}</span><span>{compactChartValue(plotMin, lang)}</span></div>
          <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" onPointerMove={move} onKeyDown={inspectWithKeyboard} tabIndex={0} role="img" aria-labelledby="macro-chart-title macro-chart-description">
            <title id="macro-chart-title">{lang === "es" ? "Serie temporal interactiva" : "Interactive time series"}</title>
            <desc id="macro-chart-description">{summary} {lang === "es" ? "Usa las flechas, Inicio y Fin para inspeccionar puntos." : "Use the arrow, Home and End keys to inspect points."}</desc>
            {[14, 32.5, 51, 69.5, 88].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} className="grid-line" />)}
            <defs><linearGradient id="macro-chart-area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".32"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient><clipPath id="macro-chart-clip"><rect x="5" y="14" width="90" height="74" /></clipPath></defs>
            <g clipPath="url(#macro-chart-clip)"><polygon points={`5,88 ${path} 95,88`} fill="url(#macro-chart-area)" /><polyline points={path} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" /></g>
            {selected && <><line x1={selected.x} x2={selected.x} y1="10" y2="90" className="hover-line"/><circle cx={selected.x} cy={selected.y} r="1.5" fill={color}/></>}
          </svg>
        </div>
        <div className="chart-x-axis"><time dateTime={start?.date}>{formatChartDate(start?.date, lang)}</time><b>{lang === "es" ? "DESLIZA PARA INSPECCIONAR" : "SLIDE TO INSPECT"}</b><time dateTime={end?.date}>{formatChartDate(end?.date, lang)}</time></div>
        <div className="chart-scrubber"><input type="range" min="0" max={Math.max(0, coords.length - 1)} value={selectedIndex} onChange={(event) => setCursor(Number(event.currentTarget.value))} aria-label={lang === "es" ? "Seleccionar una observación de la serie" : "Select a series observation"} aria-valuetext={`${formatChartDate(selected?.date, lang)} · ${marketFormat(selected?.value, lang)} ${unit}`} /><button type="button" onClick={() => setCursor(null)} disabled={selectedIndex === coords.length - 1}>{lang === "es" ? "ÚLTIMO DATO" : "LATEST"} →</button></div>
      </>
        : <div className="chart-empty" role="status"><b>{lang === "es" ? "Histórico no disponible" : "History unavailable"}</b><span>{lang === "es" ? "Se muestra la última observación verificada, sin inventar una tendencia." : "The latest verified observation is shown without inventing a trend."}</span></div>}
    </div>
  );
}

const mixMeta: Record<string, { en: string; es: string; color: string }> = {
  m2: { en: "M2", es: "M2", color: "#c7ff18" },
  sp500: { en: "S&P 500", es: "S&P 500", color: "#62dbc7" },
  gold: { en: "Gold", es: "Oro", color: "#ffd15c" },
  bitcoin: { en: "Bitcoin", es: "Bitcoin", color: "#ff6417" },
  oil: { en: "Oil", es: "Petróleo", color: "#b9a1ff" },
  dollar: { en: "Dollar", es: "Dólar", color: "#f3f0e5" },
};

function comparatorMonth(date: string) {
  const match = date.match(/^(\d{4})-(\d{2})/);
  return match ? `${match[1]}-${match[2]}` : null;
}

function formatComparatorMonth(month: string, lang: Lang) {
  const [year, index] = month.split("-").map(Number);
  return new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(year, index - 1, 1)));
}

const MIN_CORRELATION_OBSERVATIONS = 24;

function correlationStrengthLabel(value: number | null, lang: Lang) {
  if (value == null || !Number.isFinite(value)) return lang === "es" ? "Muestra insuficiente" : "Insufficient sample";
  const magnitude = Math.abs(value);
  if (magnitude < 0.2) return lang === "es" ? "Muy débil" : "Very weak";
  if (magnitude < 0.4) return lang === "es" ? "Débil" : "Weak";
  if (magnitude < 0.6) return lang === "es" ? "Moderada" : "Moderate";
  if (magnitude < 0.8) return lang === "es" ? "Fuerte" : "Strong";
  return lang === "es" ? "Muy fuerte" : "Very strong";
}

function correlationDirectionLabel(value: number, lang: Lang) {
  if (value > 0) return lang === "es" ? "positiva" : "positive";
  if (value < 0) return lang === "es" ? "negativa" : "negative";
  return lang === "es" ? "sin dirección" : "no direction";
}

function NormalizedChart({ data, selected, lang }: { data: Data; selected: string[]; lang: Lang }) {
  const monthly = selected.map((key) => {
    const observations = new Map<string, Point>();
    for (const point of data.series[key] ?? []) {
      const month = comparatorMonth(point.date);
      if (month && Number.isFinite(point.value) && point.value > 0) observations.set(month, point);
    }
    return { key, observations };
  });
  const available = monthly.filter((series) => series.observations.size > 1);
  const unavailable = monthly.filter((series) => series.observations.size <= 1).map((series) => series.key);
  const commonMonths = available.length
    ? [...available[0].observations.keys()]
        .filter((month) => available.every((series) => series.observations.has(month)))
        .sort()
        .slice(-60)
    : [];
  const lines = commonMonths.length > 1 ? available.map((series) => {
    const base = series.observations.get(commonMonths[0])!.value;
    return {
      key: series.key,
      normalized: commonMonths.map((month, index) => ({
        month,
        x: 5 + (index / (commonMonths.length - 1)) * 90,
        normalized: (series.observations.get(month)!.value / base) * 100,
      })),
    };
  }) : [];
  const all = lines.flatMap((line) => line.normalized.map((point) => point.normalized));
  const rawMin = Math.min(...all, 100);
  const rawMax = Math.max(...all, 100);
  const padding = Math.max(5, (rawMax - rawMin) * 0.08);
  const min = Math.floor((rawMin - padding) / 5) * 5;
  const max = Math.ceil((rawMax + padding) / 5) * 5;
  const range = Math.max(1, max - min);
  const y = (value: number) => Math.max(15, Math.min(87, 87 - ((value - min) / range) * 72));
  const start = commonMonths[0];
  const end = commonMonths.at(-1);
  const ready = lines.length > 0 && Boolean(start && end);
  const summary = ready
    ? (lang === "es"
        ? `${lines.length} series comparadas durante ${commonMonths.length} meses comunes, desde ${formatComparatorMonth(start!, lang)} hasta ${formatComparatorMonth(end!, lang)}.`
        : `${lines.length} series compared across ${commonMonths.length} common months, from ${formatComparatorMonth(start!, lang)} to ${formatComparatorMonth(end!, lang)}.`)
    : (lang === "es"
        ? "No hay al menos dos meses comunes para construir una comparación normalizada verificable."
        : "There are not at least two common months for a verifiable normalized comparison.");
  const dash = [undefined, "5 2.5", "1.5 2", "7 2 1.5 2", "3 2", "8 3"];

  return (
    <div className="normalized-chart">
      <p className="sr-only" aria-live="polite">{summary}</p>
      <div className="normal-legend" aria-label={lang === "es" ? "Estado de las series seleccionadas" : "Selected-series status"}>
        {selected.map((key) => {
          const isUnavailable = unavailable.includes(key) || !ready;
          return <span key={key} className={isUnavailable ? "unavailable" : ""}>
            <i style={{ background: mixMeta[key].color }} aria-hidden="true" />
            <b>{mixMeta[key][lang]}</b>
            <small>{isUnavailable ? (lang === "es" ? "sin comparación" : "no comparison") : `${commonMonths.length} ${lang === "es" ? "meses" : "months"}`}</small>
          </span>;
        })}
      </div>
      {ready ? <>
        <div className="normal-plot">
          <div className="normal-y-scale" aria-hidden="true"><span>{Math.round(max)}</span><b>100</b><span>{Math.round(min)}</span></div>
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-labelledby="normalized-chart-title normalized-chart-description">
            <title id="normalized-chart-title">{lang === "es" ? "Comparación mensual con base 100" : "Monthly base-100 comparison"}</title>
            <desc id="normalized-chart-description">{summary}</desc>
            <defs><clipPath id="normalized-plot-clip" clipPathUnits="userSpaceOnUse"><rect x="5" y="15" width="90" height="72" /></clipPath></defs>
            {[15, 33, 51, 69, 87].map((gridY) => <line key={gridY} x1="5" x2="95" y1={gridY} y2={gridY} className="grid-line" />)}
            <g clipPath="url(#normalized-plot-clip)">
              <line x1="5" x2="95" y1={y(100)} y2={y(100)} className="normal-base-line" />
              {lines.map((line, index) => {
                const path = line.normalized.map((point) => `${point.x},${y(point.normalized)}`).join(" ");
                return <polyline key={line.key} points={path} fill="none" stroke={mixMeta[line.key].color} strokeDasharray={dash[index]} strokeLinecap="round" strokeWidth="1.45" vectorEffect="non-scaling-stroke" />;
              })}
            </g>
          </svg>
        </div>
        <div className="normal-axis"><span>{formatComparatorMonth(start!, lang)}</span><b>{lang === "es" ? "PRIMER MES = 100" : "FIRST MONTH = 100"}</b><span>{formatComparatorMonth(end!, lang)}</span></div>
        <p className="normal-method">{lang === "es" ? "Última observación disponible de cada mes · máximo 60 meses comunes · índice comparativo, no rentabilidad." : "Latest available observation in each month · up to 60 common months · comparison index, not return."}</p>
      </> : <div className="normalized-empty" role="status">
        <b>{lang === "es" ? "Comparación no disponible" : "Comparison unavailable"}</b>
        <span>{lang === "es" ? "Faltan al menos dos meses comunes entre las series activas. No se dibuja una tendencia aparente con fechas incompatibles." : "The active series do not share at least two months. No apparent trend is drawn from incompatible dates."}</span>
      </div>}
    </div>
  );
}

function regimeText(regime: string, lang: Lang) {
  const copy: Record<string, [string, string, string, string]> = {
    "liquidity-led-expansion": ["Liquidity-led expansion", "Expansión impulsada por liquidez", "Liquidity is improving faster than stress is rising. Risk assets retain support, but malinvestment risk builds beneath calm spreads.", "La liquidez mejora más rápido que el estrés. Los activos de riesgo conservan apoyo, pero la mala inversión crece bajo diferenciales tranquilos."],
    "liquidity-led-credit-pending": ["Liquidity-led / credit pending", "Impulso de liquidez / crédito pendiente", "Liquidity inputs point to expansion, but credit confirmation is unavailable. Treat this as a provisional direction, not a complete regime call.", "Las entradas de liquidez apuntan a expansión, pero falta confirmación crediticia. Es una dirección provisional, no una lectura completa del régimen."],
    "credit-contraction": ["Credit contraction", "Contracción crediticia", "Financial stress and real-economy weakness are reinforcing each other. Refinancing and balance-sheet quality dominate.", "El estrés financiero y la debilidad real se refuerzan. Mandan la refinanciación y la calidad de los balances."],
    "stagflation-risk": ["Stagflation risk", "Riesgo de estanflación", "Price pressure is rising while productive capacity weakens. Nominal growth can hide falling real prosperity.", "La presión de precios aumenta mientras se debilita la capacidad productiva. El crecimiento nominal puede ocultar menor prosperidad real."],
    "disinflationary-reset": ["Disinflationary reset", "Reajuste desinflacionario", "Money and real activity are cooling together. Liquidation risk rises, but so does the possibility of healthier repricing.", "Dinero y actividad real se enfrían juntos. Aumenta el riesgo de liquidación, pero también la posibilidad de una reasignación más sana."],
    "mixed-transition": ["Mixed transition", "Transición mixta", "The pillars disagree. This is a regime for conditional scenarios, not one-way conviction.", "Los pilares discrepan. Es un régimen para escenarios condicionales, no para convicciones unidireccionales."],
  };
  const value = copy[regime] ?? copy["mixed-transition"];
  return { title: value[lang === "en" ? 0 : 1], body: value[lang === "en" ? 2 : 3] };
}

function cycleBand(score: number, lang: Lang) {
  const bands = [
    {
      max: 20,
      range: "0–20",
      en: ["Low distortion", "The ten signal bands show little simultaneous pressure. This does not mean “no risk”: it means the model sees few cycle distortions in the variables it measures."],
      es: ["Distorsión baja", "Las diez franjas muestran poca presión simultánea. No significa «sin riesgo»: significa que el modelo detecta pocas distorsiones cíclicas en las variables que mide."],
    },
    {
      max: 40,
      range: "21–40",
      en: ["Contained distortion", "Some imbalances are visible, but they are not broad-based. Watch whether liquidity, credit and production begin to confirm one another."],
      es: ["Distorsión contenida", "Hay desequilibrios visibles, pero todavía no son generalizados. Vigila si liquidez, crédito y producción empiezan a confirmarse entre sí."],
    },
    {
      max: 60,
      range: "41–60",
      en: ["Mixed transition", "Signals disagree or sit near their neutral zones. Scenario analysis matters more than a directional forecast."],
      es: ["Transición mixta", "Las señales discrepan o están cerca de sus zonas neutrales. Importa más analizar escenarios que emitir una previsión direccional."],
    },
    {
      max: 80,
      range: "61–80",
      en: ["Elevated distortion", "Several engines point to monetary, credit or real-economy tension. The model is flagging fragility, not timing a crash."],
      es: ["Distorsión elevada", "Varios motores apuntan a tensión monetaria, crediticia o real. El modelo señala fragilidad; no está fechando un crash."],
    },
    {
      max: 100,
      range: "81–100",
      en: ["Extreme distortion", "Broad and intense pressures overlap across the model. Expect greater sensitivity to liquidity, refinancing and policy surprises."],
      es: ["Distorsión extrema", "Se solapan presiones amplias e intensas en el modelo. Aumenta la sensibilidad a liquidez, refinanciación y sorpresas de política."],
    },
  ];
  const band = bands.find((item) => score <= item.max) ?? bands.at(-1)!;
  const copy = band[lang];
  return { range: band.range, title: copy[0], body: copy[1], bands };
}

const engineLabels = {
  liquidity: ["Liquidity", "Liquidez"],
  credit: ["Credit conditions", "Condiciones de crédito"],
  realEconomy: ["Real economy", "Economía real"],
  inflation: ["Price pressure", "Presión de precios"],
  fiscal: ["Fiscal pressure", "Presión fiscal"],
} as const;

function engineReading(key: keyof typeof engineLabels, score: number, lang: Lang) {
  const bands = [
    { max: 20, range: "0–20" }, { max: 35, range: "21–35" }, { max: 50, range: "36–50" },
    { max: 65, range: "51–65" }, { max: 80, range: "66–80" }, { max: 100, range: "81–100" },
  ];
  const index = Math.max(0, bands.findIndex((band) => score <= band.max));
  const copy = {
    liquidity: {
      en: [
        ["Restrictive impulse", "Money and rate inputs show little modeled support for nominal expansion.", "Austrian lens: tighter intertemporal signals favour liquidation and shorter-duration projects.", "Watch for M2 acceleration or falling real rates before calling a turn."],
        ["Weak liquidity", "Liquidity remains subdued; easing is not yet broad across the measured inputs.", "The credit structure receives limited monetary support, reducing room for marginal projects.", "Watch whether lower policy rates translate into money growth."],
        ["Neutral liquidity", "Money growth, policy rates and the approximate real rate deliver a mixed impulse.", "There is no strong monetary signal of either forced expansion or decisive liquidation.", "Watch the direction of M2 growth and the real-rate trend together."],
        ["Reflationary impulse", "Liquidity inputs are leaning expansionary without reaching an extreme reading.", "Cheaper or more abundant financing can extend projects whose sustainability depends on continued accommodation.", "Watch for confirmation in credit spreads and productive output."],
        ["Strong liquidity expansion", "The measured monetary impulse is broad and materially expansionary.", "Relative prices may adjust before consumer-price indices, increasing malinvestment risk.", "Watch whether credit stress stays contained while asset prices accelerate."],
        ["Extreme monetary impulse", "Liquidity conditions are at the upper end of the model’s historical pressure scale.", "Allocation signals are highly exposed to policy reversal and refinancing assumptions.", "Watch for divergence between nominal asset strength and real production."],
      ],
      es: [
        ["Impulso restrictivo", "Dinero y tipos ofrecen poco apoyo modelizado a la expansión nominal.", "Lente austriaca: señales intertemporales más duras favorecen liquidación y proyectos de menor duración.", "Vigilar aceleración de M2 o caída del tipo real antes de declarar un giro."],
        ["Liquidez débil", "La liquidez sigue contenida; la relajación aún no es amplia en las entradas medidas.", "La estructura crediticia recibe poco apoyo monetario y deja menos margen a proyectos marginales.", "Vigilar si unos tipos oficiales menores se traducen en crecimiento monetario."],
        ["Liquidez neutral", "M2, tipos oficiales y tipo real aproximado producen un impulso mixto.", "No existe una señal monetaria fuerte de expansión forzada ni de liquidación decisiva.", "Vigilar conjuntamente la dirección de M2 y del tipo real."],
        ["Impulso reflacionario", "Las entradas de liquidez se inclinan hacia expansión sin alcanzar extremos.", "Financiación más barata o abundante puede prolongar proyectos dependientes del acomodo.", "Buscar confirmación en diferenciales de crédito y producción."],
        ["Expansión fuerte de liquidez", "El impulso monetario medido es amplio y materialmente expansivo.", "Los precios relativos pueden ajustarse antes que el IPC, aumentando el riesgo de mala inversión.", "Vigilar si el crédito permanece tranquilo mientras aceleran los activos."],
        ["Impulso monetario extremo", "La liquidez está en la zona superior de presión del modelo.", "La asignación queda muy expuesta a un giro de política y a supuestos de refinanciación.", "Vigilar divergencia entre fortaleza nominal y producción real."],
      ],
    },
    credit: {
      en: [
        ["Very easy credit", "Spreads, curve and volatility show exceptionally little measured stress.", "Calm financing can conceal accumulated duration and refinancing risk.", "Watch for the first joint rise in spreads and volatility."],
        ["Easy credit", "Credit remains available and stress indicators are contained.", "Benign conditions can prolong the boom while weakening underwriting discipline.", "Watch whether lending calm is confirmed by real output."],
        ["Balanced credit", "No dominant signal comes from spreads, curve and volatility.", "Financing is neither clearly validating expansion nor forcing liquidation.", "Watch changes, not only levels, in spreads and the curve."],
        ["Credit tension", "Stress is rising but has not become systemic in the model.", "Marginal projects face a higher hurdle as refinancing becomes more selective.", "Watch the speed of spread widening and curve changes."],
        ["High credit stress", "Refinancing pressure is broad across the measured credit inputs.", "The liquidation phase can dominate nominal growth narratives.", "Watch balance-sheet quality, defaults and labour-market confirmation."],
        ["Severe credit fracture", "Credit indicators occupy the model’s most stressed range.", "Capital reallocation may become disorderly when prior projects cannot refinance.", "Watch liquidity facilities and whether real activity contracts."],
      ],
      es: [
        ["Crédito muy fácil", "Diferenciales, curva y volatilidad muestran estrés medido excepcionalmente bajo.", "La calma financiera puede ocultar riesgo acumulado de duración y refinanciación.", "Vigilar la primera subida conjunta de diferenciales y volatilidad."],
        ["Crédito fácil", "El crédito sigue disponible y los indicadores de tensión están contenidos.", "Las condiciones benignas pueden prolongar el auge y relajar la disciplina de concesión.", "Comprobar si la calma se confirma en la producción real."],
        ["Crédito equilibrado", "Diferenciales, curva y volatilidad no ofrecen una señal dominante.", "La financiación ni valida claramente la expansión ni fuerza liquidación.", "Vigilar cambios, no solo niveles, en diferenciales y curva."],
        ["Tensión crediticia", "El estrés aumenta sin ser todavía sistémico en el modelo.", "Los proyectos marginales afrontan una barrera mayor al volverse selectiva la refinanciación.", "Vigilar la velocidad de apertura de diferenciales."],
        ["Estrés crediticio alto", "La presión de refinanciación es amplia en las entradas medidas.", "La fase de liquidación puede dominar el relato de crecimiento nominal.", "Vigilar balances, impagos y confirmación laboral."],
        ["Fractura crediticia severa", "Los indicadores ocupan la franja más tensionada del modelo.", "La reasignación puede volverse desordenada cuando proyectos previos no refinancian.", "Vigilar facilidades de liquidez y contracción real."],
      ],
    },
    realEconomy: {
      en: [
        ["Broad real strength", "Production, labour and capacity show little modeled deterioration.", "Real confirmation reduces—but never removes—the risk that asset strength is purely monetary.", "Watch whether capacity and industrial output keep confirming."],
        ["Resilient activity", "The real economy remains comparatively firm.", "Productive confirmation supports a longer expansion, subject to financing quality.", "Watch employment changes and industrial momentum."],
        ["Mixed activity", "Production, labour and capacity disagree or sit near neutral.", "The boom’s real foundation is inconclusive.", "Watch whether weakness broadens across more than one real indicator."],
        ["Real slowdown", "Productive momentum is weakening across part of the model.", "Earlier investment plans may be meeting resource or demand constraints.", "Watch permanent job losses and capacity utilization."],
        ["Material contraction risk", "Real-economy deterioration is broad.", "Reallocation and liquidation pressures are becoming visible outside financial markets.", "Watch whether credit stress amplifies the slowdown."],
        ["Deep real dislocation", "The real engine is in its most adverse range.", "The correction is no longer merely financial; productive structures are being repriced.", "Watch stabilization in output and labour before declaring repair."],
      ],
      es: [
        ["Fortaleza real amplia", "Producción, empleo y capacidad muestran poco deterioro modelizado.", "La confirmación real reduce, sin eliminar, el riesgo de que la fortaleza sea solo monetaria.", "Vigilar continuidad de capacidad y producción industrial."],
        ["Actividad resistente", "La economía real se mantiene comparativamente firme.", "La confirmación productiva permite una expansión más larga, condicionada a la calidad financiera.", "Vigilar empleo e impulso industrial."],
        ["Actividad mixta", "Producción, empleo y capacidad discrepan o están cerca de neutral.", "La base real del auge no es concluyente.", "Vigilar si la debilidad se extiende a más de un indicador."],
        ["Desaceleración real", "El impulso productivo se debilita en parte del modelo.", "Planes de inversión previos pueden encontrar restricciones de recursos o demanda.", "Vigilar empleo permanente y utilización de capacidad."],
        ["Riesgo material de contracción", "El deterioro de la economía real es amplio.", "La reasignación y liquidación ya aparecen fuera de los mercados financieros.", "Vigilar si el crédito amplifica la desaceleración."],
        ["Dislocación real profunda", "El motor real está en su franja más adversa.", "La corrección ya no es solo financiera; se reprician estructuras productivas.", "Esperar estabilización en producción y empleo antes de declarar reparación."],
      ],
    },
    inflation: {
      en: [
        ["Disinflationary pressure", "CPI, oil and dollar inputs imply weak modeled price pressure.", "Falling prices can reflect productivity or forced liquidation; the cause matters.", "Watch money growth and real activity to distinguish them."],
        ["Contained prices", "Price pressure is subdued across the measured basket.", "Contained CPI does not prove monetary neutrality because relative prices adjust unevenly.", "Watch services, energy and money growth."],
        ["Mixed price signal", "Inflation inputs do not point clearly in one direction.", "Aggregate CPI may hide redistribution across sectors and stages of production.", "Watch oil and dollar momentum alongside CPI."],
        ["Warming prices", "Price pressure is building but remains below the model’s high-stress range.", "Earlier monetary expansion may be moving through costs and final prices.", "Watch whether real output weakens at the same time."],
        ["High price pressure", "CPI, energy and currency inputs combine into a strong inflation reading.", "Nominal growth becomes a poorer guide to real prosperity.", "Watch real wages, margins and production."],
        ["Extreme price distortion", "Price pressure is broad and intense in the model.", "The monetary unit is losing information quality as a coordinating signal.", "Watch policy reaction and supply-side contraction."],
      ],
      es: [
        ["Presión desinflacionaria", "IPC, petróleo y dólar implican poca presión de precios modelizada.", "La caída puede venir de productividad o liquidación forzada; la causa importa.", "Cruzar crecimiento monetario y actividad real."],
        ["Precios contenidos", "La presión es moderada en la cesta medida.", "Un IPC contenido no demuestra neutralidad monetaria: los precios relativos cambian de forma desigual.", "Vigilar servicios, energía y M2."],
        ["Señal de precios mixta", "Las entradas de inflación no apuntan claramente en una dirección.", "El IPC agregado puede ocultar redistribución entre sectores y etapas productivas.", "Cruzar petróleo, dólar e IPC."],
        ["Precios calentándose", "La presión aumenta sin entrar en la franja alta del modelo.", "Una expansión monetaria anterior puede estar trasladándose a costes y precios finales.", "Vigilar deterioro simultáneo de producción."],
        ["Presión de precios alta", "IPC, energía y divisa forman una lectura inflacionaria fuerte.", "El crecimiento nominal se vuelve una guía peor de prosperidad real.", "Vigilar salarios reales, márgenes y producción."],
        ["Distorsión extrema de precios", "La presión es amplia e intensa en el modelo.", "La unidad monetaria pierde calidad informativa como señal coordinadora.", "Vigilar reacción de política y contracción de oferta."],
      ],
    },
    fiscal: {
      en: [
        ["Low fiscal pressure", "Debt growth and debt burden contribute little modeled pressure.", "Fiscal financing is not currently the dominant distortion in this framework.", "Watch interest expense and maturity structure."],
        ["Contained fiscal load", "The debt impulse is manageable relative to higher model bands.", "Government borrowing may still crowd out alternatives even without acute stress.", "Watch debt growth versus nominal output."],
        ["Structural fiscal drag", "Debt conditions are material but not yet dominant.", "Persistent deficits can increase future taxation or monetary-accommodation pressure.", "Watch interest expense and debt-to-GDP direction."],
        ["Elevated fiscal dominance", "Debt metrics increasingly constrain monetary and budget choices.", "Pressure grows for repression, taxation or monetary accommodation.", "Watch the interaction between yields and debt service."],
        ["High fiscal stress", "Debt dynamics occupy a high-pressure range.", "Policy flexibility narrows and monetary credibility becomes more exposed.", "Watch refinancing needs and central-bank balance-sheet response."],
        ["Extreme fiscal constraint", "Debt burden and growth are at the model’s most adverse range.", "The conflict between creditors, taxpayers and money holders is acute.", "Watch restructuring, repression or rapid monetary accommodation."],
      ],
      es: [
        ["Presión fiscal baja", "Crecimiento y carga de deuda aportan poca presión modelizada.", "La financiación fiscal no es hoy la distorsión dominante del marco.", "Vigilar intereses y vencimientos."],
        ["Carga fiscal contenida", "El impulso de deuda es manejable frente a franjas superiores.", "El endeudamiento público puede desplazar alternativas incluso sin estrés agudo.", "Comparar deuda y producto nominal."],
        ["Lastre fiscal estructural", "La deuda es material pero aún no dominante.", "Déficits persistentes elevan presión futura de impuestos o acomodo monetario.", "Vigilar intereses y deuda/PIB."],
        ["Dominancia fiscal elevada", "La deuda condiciona crecientemente las decisiones monetarias y presupuestarias.", "Aumenta la presión hacia represión, impuestos o acomodo monetario.", "Cruzar rendimientos y servicio de deuda."],
        ["Estrés fiscal alto", "La dinámica de deuda ocupa una franja de presión elevada.", "Se estrecha la flexibilidad y aumenta la exposición de la credibilidad monetaria.", "Vigilar refinanciación y balance del banco central."],
        ["Restricción fiscal extrema", "Carga y crecimiento de deuda están en la franja más adversa.", "El conflicto entre acreedores, contribuyentes y tenedores de moneda es agudo.", "Vigilar reestructuración, represión o acomodo rápido."],
      ],
    },
  } as const;
  const item = copy[key][lang][index];
  return { range: bands[index].range, title: item[0], fact: item[1], interpretation: item[2], watch: item[3] };
}

export default function Monitor() {
  const [lang, setLang] = useState<Lang>("es");
  const [data, setData] = useState<Data>(fallback);
  const [loading, setLoading] = useState(true);
  const [disclaimerOpen, setDisclaimerOpen] = useState(false);
  const [clock, setClock] = useState(0);
  const [seriesKey, setSeriesKey] = useState<keyof typeof seriesMeta>("m2");
  const [horizon, setHorizon] = useState(5);
  const [selectedMetric, setSelectedMetric] = useState<(typeof metrics)[number]>(metrics[0]);
  const [lens, setLens] = useState<"facts" | "thesis">("facts");
  const [quote, setQuote] = useState(0);
  const [menu, setMenu] = useState(false);
  const [activeSection, setActiveSection] = useState("top");
  const [selectedMix, setSelectedMix] = useState(["m2", "sp500", "gold", "bitcoin"]);
  const [refreshNotice, setRefreshNotice] = useState("");
  const [manualRefreshNext, setManualRefreshNext] = useState<number | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [visitBaseline, setVisitBaseline] = useState<VisitBaseline | null>(null);
  const [baselineSavedThisVisit, setBaselineSavedThisVisit] = useState(false);
  const [watchlist, setWatchlist] = useState<WatchKey[]>(["m2", "creditSpread", "bitcoin"]);
  const [diagnosticScenario, setDiagnosticScenario] = useState(0);
  const previousData = useRef<Data>(fallback);
  const navRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const firstNavLinkRef = useRef<HTMLAnchorElement>(null);
  const detailCloseRef = useRef<HTMLButtonElement>(null);
  const detailReturnFocusRef = useRef<HTMLElement | null>(null);
  const diagnosticTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const seriesTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const metricTabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const t = text[lang];

  const changeLanguage = useCallback((next: Lang) => {
    setLang(next);
    setMenu(false);
    document.documentElement.lang = next;
    saveLanguagePreference(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const requestState = useRef({lang, manualRefreshNext});
  const dataRequestPending = useRef(false);
  useEffect(() => { requestState.current = {lang, manualRefreshNext}; }, [lang, manualRefreshNext]);
  useEffect(() => {
    const clear = () => { setWatchlist([]); setVisitBaseline(null); setManualRefreshNext(null); setBaselineSavedThisVisit(false); setDisclaimerOpen(true); };
    window.addEventListener("abcm:preferences-cleared", clear);
    return () => window.removeEventListener("abcm:preferences-cleared", clear);
  }, []);
  const load = useCallback(async (manual = false, userInitiated = false) => {
    const {lang, manualRefreshNext} = requestState.current;
    if (dataRequestPending.current) return;
    if (manual && manualRefreshNext && Date.now() < manualRefreshNext) return;
    dataRequestPending.current = true;
    setLoading(true);
    setRefreshNotice(manual ? (lang === "es" ? "Consultando fuentes y comparando con tu instantánea anterior…" : "Checking sources and comparing with your previous snapshot…") : "");
    try {
      const response = await fetch("/api/data", {
        method: manual ? "POST" : "GET",
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next: Data = await response.json();
      if (next.provenance.mode === "fallback") throw new Error("No upstream source returned a usable snapshot");
      const old = previousData.current;
      const changedMacro = Object.keys(next.latest).filter((key) => next.latest[key]?.date !== old.latest[key]?.date).length;
      const btcMove = old.bitcoin.price && next.bitcoin.price ? next.bitcoin.price - old.bitcoin.price : null;
      setData(next);
      previousData.current = next;
      if (manual && userInitiated) {
        const previousSnapshot = snapshotBaseline(old);
        const nextAllowedAt = Date.now() + 30 * 60_000;
        saveManualRefreshPreference(previousSnapshot, nextAllowedAt);
        setBaselineSavedThisVisit(true);
        setManualRefreshNext(nextAllowedAt);
        setVisitBaseline(previousSnapshot);
      }
      if (manual) setRefreshNotice(lang === "es"
        ? `Instantánea sincronizada · BTC ${btcMove == null ? "sin dato" : `${btcMove >= 0 ? "+" : ""}$${format(btcMove, 0)}`} · ${changedMacro} series macro con nueva fecha`
        : `Snapshot synchronized · BTC ${btcMove == null ? "unavailable" : `${btcMove >= 0 ? "+" : ""}$${format(btcMove, 0)}`} · ${changedMacro} macro series with a new date`);
    } catch {
      setRefreshNotice(lang === "es" ? "No se pudo completar la consulta. Se conserva el último snapshot válido." : "Fresh query failed. Keeping the last valid snapshot.");
    } finally { dataRequestPending.current = false; setLoading(false); }
  }, []);
  const loadBitcoin = useCallback(async () => {
    try {
      const response = await fetch("/api/bitcoin", {
        cache: "no-store",
        credentials: "omit",
        referrerPolicy: "no-referrer",
      });
      if (!response.ok) return;
      const pulse = await response.json() as {
        price: number | null; priceObservedAt: string | null; provider: string;
        priceConsensus: Data["bitcoin"]["priceConsensus"];
        priceSpreadPercent: number | null; priceSources: string[];
        upstreams?: Data["upstreams"];
      };
      if (!Number.isFinite(pulse.price)) return;
      setData((current) => {
        const next = {
          ...current,
          bitcoin: {
            ...current.bitcoin,
            price: pulse.price,
            priceObservedAt: pulse.priceObservedAt ?? undefined,
            priceConsensus: pulse.priceConsensus,
            priceSpreadPercent: pulse.priceSpreadPercent,
            priceSources: pulse.priceSources,
          },
          upstreams: pulse.upstreams ?? current.upstreams,
          provenance: { ...current.provenance, bitcoinPrice: pulse.provider },
        };
        previousData.current = next;
        return next;
      });
    } catch {
      // The slower macro snapshot and the last valid BTC quote remain visible.
    }
  }, []);
  useEffect(() => {
    const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
    const storedLanguage = readLanguagePreference();
    const initialLanguage: Lang = requestedLanguage === "en" || requestedLanguage === "es"
      ? requestedLanguage
      : storedLanguage === "en" || storedLanguage === "es" ? storedLanguage : "es";
    document.documentElement.lang = initialLanguage;
    const languageFrame = window.requestAnimationFrame(() => setLang(initialLanguage));
    return () => window.cancelAnimationFrame(languageFrame);
  }, []);
  useEffect(() => {
    const initial = window.setTimeout(() => {
      setDisclaimerOpen(!hasAcceptedEducationalNotice());
      const refreshPreference = readManualRefreshPreference();
      if (refreshPreference) {
        setVisitBaseline(refreshPreference.previousSnapshot);
        if (refreshPreference.nextAllowedAt > Date.now()) setManualRefreshNext(refreshPreference.nextAllowedAt);
      }
      const savedWatchlist = readWatchlistPreference();
      if (savedWatchlist.length) setWatchlist(savedWatchlist);
      setClock(Date.now());
      void load(false);
    }, 0);
    const id = window.setInterval(() => setClock(Date.now()), 1_000);
    return () => { window.clearTimeout(initial); window.clearInterval(id); };
  }, [load]);
  useEffect(() => {
    void loadBitcoin();
    const id = window.setInterval(() => void loadBitcoin(), 60_000);
    return () => window.clearInterval(id);
  }, [loadBitcoin]);
  useEffect(() => {
    const validUntil = data.cache?.nextDailyAt
      ? new Date(data.cache.nextDailyAt).getTime()
      : new Date(data.requestedAt).getTime() + 86_400_000;
    if (!Number.isFinite(validUntil) || data.provenance.mode === "fallback") return;
    // A small per-device jitter prevents every open tab requesting the new
    // shared snapshot on the exact same millisecond.
    const expired = validUntil <= Date.now();
    const delay = expired
      ? 2_000 + Math.floor(Math.random() * 8_000)
      : Math.max(60_000, validUntil - Date.now() + Math.floor(Math.random() * 30_000));
    // Render the durable edition first. If its daily window has elapsed, a
    // single gated POST refreshes it without holding the page hostage.
    const id = window.setTimeout(() => void load(expired, false), delay);
    return () => window.clearTimeout(id);
  }, [data.cache?.nextDailyAt, data.cache?.validUntil, data.provenance.mode, data.requestedAt, load]);
  useEffect(() => { const id = setInterval(() => setQuote((q) => (q + 1) % quotes.length), 12_000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (!detail) return;
    const opener = detailReturnFocusRef.current;
    const focusFrame = window.requestAnimationFrame(() => detailCloseRef.current?.focus());
    const handleDialogKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setDetail(null);
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = document.getElementById("detail-dialog");
      if (!dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])',
      )).filter((element) => !element.hasAttribute("disabled") && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", handleDialogKey);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", handleDialogKey);
      if (opener?.isConnected) window.requestAnimationFrame(() => opener.focus());
      detailReturnFocusRef.current = null;
    };
  }, [detail]);
  useEffect(() => {
    const sectionIds = ["top", "dashboard", "liquidity", "six-forces", "hard-assets", "theory", "sources"];
    let frame = 0;
    const updateActiveSection = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => {
        const marker = 96;
        let current = "top";
        sectionIds.forEach((id) => {
          const section = document.getElementById(id);
          if (section && section.getBoundingClientRect().top <= marker) current = id;
        });
        setActiveSection(current);
      });
    };
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection, { passive: true });
    window.addEventListener("hashchange", updateActiveSection);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateActiveSection);
      window.removeEventListener("hashchange", updateActiveSection);
    };
  }, []);
  useEffect(() => {
    if (!menu) return;
    const focusFrame = window.requestAnimationFrame(() => firstNavLinkRef.current?.focus());
    const closeMenu = (restoreFocus = false) => {
      setMenu(false);
      if (restoreFocus) window.requestAnimationFrame(() => menuButtonRef.current?.focus());
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeMenu(true);
    };
    const onPointerDown = (event: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) closeMenu();
    };
    const onResize = () => { if (window.innerWidth > 760) closeMenu(); };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", onResize);
    };
  }, [menu]);

  const cycleScore = data.derived.scores.composite;
  const modelStatus = data.provenance.modelStatus ?? (data.provenance.modelReady ? "complete" : "withheld");
  const modelAvailable = data.provenance.mode !== "fallback" && modelStatus !== "withheld";
  const modelProvisional = modelStatus === "provisional";
  const cycle = cycleBand(cycleScore, lang);
  const baseScoreComponents: Array<{ key: SignalKey; parent: keyof typeof engineLabels; label: string; score: number; weight: number; inputs: string; observed: string }> = [
    { key: "money", parent: "liquidity", label: lang === "es" ? "Oferta monetaria" : "Money supply", score: data.derived.scores.money, weight: 0.14, inputs: "M2 YoY", observed: `M2 ${format(data.derived.changes.m2Growth)}% YoY` },
    { key: "monetaryStance", parent: "liquidity", label: lang === "es" ? "Postura monetaria" : "Monetary stance", score: data.derived.scores.monetaryStance, weight: 0.13, inputs: lang === "es" ? "Δ Fed funds · tipo real" : "Fed funds Δ · real rate", observed: lang === "es" ? `Δ tipos ${format(data.derived.changes.rateChange)} pp · real ${format(data.derived.ratios.realRate)}%` : `Rate Δ ${format(data.derived.changes.rateChange)} pp · real ${format(data.derived.ratios.realRate)}%` },
    { key: "creditRisk", parent: "credit", label: lang === "es" ? "Riesgo crediticio" : "Credit risk", score: data.derived.scores.creditRisk, weight: 0.13, inputs: "BAA–10Y · VIX", observed: `BAA–10Y ${format(latestValue(data, "creditSpread"))} · VIX ${format(latestValue(data, "vix"))}` },
    { key: "termStructure", parent: "credit", label: lang === "es" ? "Estructura temporal" : "Term structure", score: data.derived.scores.termStructure, weight: 0.10, inputs: "10Y–2Y", observed: `10Y–2Y ${format(latestValue(data, "yieldCurve"))} pp` },
    { key: "production", parent: "realEconomy", label: lang === "es" ? "Estructura productiva" : "Productive structure", score: data.derived.scores.production, weight: 0.12, inputs: lang === "es" ? "INDPRO YoY · Δ capacidad" : "INDPRO YoY · capacity Δ", observed: lang === "es" ? `INDPRO ${format(data.derived.changes.industrialGrowth)}% · Δ capacidad ${format(data.derived.changes.capacityChange)} pp` : `INDPRO ${format(data.derived.changes.industrialGrowth)}% · capacity Δ ${format(data.derived.changes.capacityChange)} pp` },
    { key: "labour", parent: "realEconomy", label: lang === "es" ? "Ajuste laboral" : "Labour adjustment", score: data.derived.scores.labour, weight: 0.08, inputs: lang === "es" ? "Δ desempleo 1A" : "1Y unemployment Δ", observed: lang === "es" ? `Δ desempleo ${format(data.derived.changes.unemploymentChange)} pp` : `Unemployment Δ ${format(data.derived.changes.unemploymentChange)} pp` },
    { key: "consumerPrices", parent: "inflation", label: lang === "es" ? "Precios de consumo" : "Consumer prices", score: data.derived.scores.consumerPrices, weight: 0.09, inputs: "CPI YoY", observed: `CPI ${format(data.derived.changes.cpiGrowth)}% YoY` },
    { key: "resourcesFx", parent: "inflation", label: lang === "es" ? "Recursos y divisa" : "Resources & FX", score: data.derived.scores.resourcesFx, weight: 0.06, inputs: lang === "es" ? "WTI 90d · dólar 90d" : "WTI 90d · broad dollar 90d", observed: lang === "es" ? `WTI ${format(data.derived.changes.oilMomentum)}% · dólar ${format(data.derived.changes.dollarMomentum)}%` : `WTI ${format(data.derived.changes.oilMomentum)}% · dollar ${format(data.derived.changes.dollarMomentum)}%` },
    { key: "debtBurden", parent: "fiscal", label: lang === "es" ? "Carga de deuda" : "Debt burden", score: data.derived.scores.debtBurden, weight: 0.09, inputs: lang === "es" ? "Deuda / PIB" : "Debt / GDP", observed: lang === "es" ? `Deuda/PIB ${format(latestValue(data, "debtToGdp"))}%` : `Debt/GDP ${format(latestValue(data, "debtToGdp"))}%` },
    { key: "fiscalImpulse", parent: "fiscal", label: lang === "es" ? "Impulso fiscal" : "Fiscal impulse", score: data.derived.scores.fiscalImpulse, weight: 0.06, inputs: lang === "es" ? "Deuda YoY" : "Debt YoY", observed: lang === "es" ? `Deuda ${format(data.derived.changes.debtGrowth)}% YoY` : `Debt ${format(data.derived.changes.debtGrowth)}% YoY` },
  ];
  const signalHasData = (item: (typeof baseScoreComponents)[number]) => data.provenance.mode !== "fallback" && data.provenance.signalReady?.[item.key] !== false && Number.isFinite(item.score);
  const readyWeight = baseScoreComponents.reduce((sum, item) => (
    signalHasData(item) ? sum + item.weight : sum
  ), 0);
  const scoreComponents = baseScoreComponents.map((item) => {
    const ready = signalHasData(item);
    const effectiveWeight = modelProvisional && ready && readyWeight > 0 ? item.weight / readyWeight : item.weight;
    return { ...item, ready, effectiveWeight };
  });
  const readySignalCount = scoreComponents.filter((item) => item.ready).length;
  const engineCoverageState = !modelAvailable ? "withheld" : modelProvisional || readySignalCount < scoreComponents.length ? "provisional" : "complete";
  const engineCoverageLabel = engineCoverageState === "complete"
    ? (lang === "es" ? "COMPLETO" : "COMPLETE")
    : engineCoverageState === "provisional"
      ? (lang === "es" ? "PROVISIONAL" : "PROVISIONAL")
      : (lang === "es" ? "RETENIDO" : "WITHHELD");
  const availableWeightPercent = Math.round(Math.max(0, Math.min(1, data.provenance.availableWeight ?? readyWeight)) * 100);
  const modelInputsAvailable = data.provenance.modelInputsAvailable ?? 0;
  const modelInputsTotal = data.provenance.modelInputsTotal ?? 14;
  const gold = latestValue(data, "gold");
  const debt = latestValue(data, "treasuryDebt") ?? latestValue(data, "federalDebt");
  const debtSeriesKey = latestValue(data, "treasuryDebt") != null ? "treasuryDebt" : "federalDebt";
  const btc = data.bitcoin.price;
  const meta = seriesMeta[seriesKey];
  const points = data.series[seriesKey] ?? [];
  const chartSeriesKeys = Object.keys(seriesMeta) as (keyof typeof seriesMeta)[];
  const chartProvider = seriesKey === "bitcoin" ? (data.provenance.bitcoinHistory ?? "BLOCKCHAIN.COM") : seriesSource(data, seriesKey);
  const regime = regimeText(data.derived.regime, lang);
  const goldSource = seriesSource(data, "gold");
  const chartSource = seriesKey === "gold" && goldSource === "WORLD BANK"
    ? "WORLD BANK · PINK SHEET"
    : seriesKey === "gold" && goldSource === "COINBASE"
      ? "COINBASE · PAXG PROXY"
      : `${chartProvider} · ${meta.source}`;
  const chartSourceUrl = seriesKey === "bitcoin"
    ? "https://www.blockchain.com/explorer/charts/market-price"
    : seriesKey === "federalDebt" ? debtSourceUrl(data) : seriesSourceUrl(data, seriesKey);
  const chartState = seriesKey === "bitcoin" ? (points.length > 1 ? "live" : "unavailable") : marketState(data, seriesKey);
  const chartStatus = seriesKey === "bitcoin" && points.length > 1
    ? (lang === "es" ? "HISTÓRICO DISPONIBLE" : "HISTORY AVAILABLE")
    : marketStateLabel(chartState, lang);
  const sixForce = data.derived.sixForce ?? fallback.derived.sixForce;
  const sixForceReading = sixForceSynthesis(sixForce.synthesis, lang);
  const signed = (value: number | null, suffix: string, digits = 1) => value == null ? "—" : `${value > 0 ? "+" : ""}${marketFormat(value, lang, digits)}${suffix}`;
  const sixForceCards: Array<{ key: SixForceKey; title: string; eyebrow: string; evidence: string; note: string; source: string; sourceUrl: string }> = [
    {
      key: "treasury",
      title: lang === "es" ? "Rendimientos del Tesoro" : "Treasury yields",
      eyebrow: "DGS10 + T10Y2Y",
      evidence: `10Y ${marketFormat(sixForce.forces.treasury.value, lang, 2)}% · Δ90D ${signed(sixForce.forces.treasury.change, " pp", 2)} · 10Y–2Y ${signed(sixForce.forces.treasury.secondaryValue, " pp", 2)}`,
      note: lang === "es" ? "Nivel, dirección a 90 días y forma de la curva; ninguno es bueno o malo por sí solo." : "Level, 90-day direction and curve shape; none is inherently good or bad.",
      source: "FRED · U.S. Treasury",
      sourceUrl: seriesSourceUrl(data, "treasury10y"),
    },
    {
      key: "debt",
      title: lang === "es" ? "Deuda federal" : "Federal debt",
      eyebrow: "GFDEBTN / TREASURY",
      evidence: `$${marketFormat(sixForce.forces.debt.value == null ? null : sixForce.forces.debt.value / 1000, lang, 2)} T · YoY ${signed(sixForce.forces.debt.change, "%")}`,
      note: lang === "es" ? "El crecimiento de la deuda plantea presión de financiación; no determina por sí solo inflación ni impago." : "Debt growth raises a financing question; it does not by itself determine inflation or default.",
      source: lang === "es" ? "Tesoro / FRED" : "Treasury / FRED",
      sourceUrl: debtSourceUrl(data),
    },
    {
      key: "oil",
      title: lang === "es" ? "Petróleo WTI" : "WTI oil",
      eyebrow: "DCOILWTICO",
      evidence: `$${marketFormat(sixForce.forces.oil.value, lang, 2)} · 90D ${signed(sixForce.forces.oil.change, "%")}`,
      note: lang === "es" ? "Señala restricciones energéticas y costes reales; la demanda y la oferta pueden moverlo en direcciones distintas." : "It reflects energy constraints and real costs; demand and supply can move it for different reasons.",
      source: "FRED · EIA",
      sourceUrl: seriesSourceUrl(data, "oil"),
    },
    {
      key: "manufacturing",
      title: lang === "es" ? "Pulso manufacturero" : "Manufacturing pulse",
      eyebrow: "CFSEC · NOT ISM PMI",
      evidence: `${marketFormat(sixForce.forces.manufacturing.value, lang, 1)} · Δ1M ${signed(sixForce.forces.manufacturing.change, " pt", 1)}`,
      note: lang === "es" ? "Proxy regional: cero significa crecimiento medio histórico. No es el PMI nacional ni usa su umbral de 50." : "Regional proxy: zero means historical average growth. It is not the national PMI and does not use its 50 threshold.",
      source: lang === "es" ? "Fed de Chicago vía FRED" : "Chicago Fed via FRED",
      sourceUrl: seriesSourceUrl(data, "manufacturingSurvey"),
    },
    {
      key: "dollar",
      title: lang === "es" ? "Dólar amplio" : "Broad dollar",
      eyebrow: "DTWEXBGS",
      evidence: `${marketFormat(sixForce.forces.dollar.value, lang, 2)} · 90D ${signed(sixForce.forces.dollar.change, "%")}`,
      note: lang === "es" ? "La dirección del dólar ayuda a leer las condiciones financieras globales sin asumir una relación mecánica." : "Dollar direction helps frame global financial conditions without assuming a mechanical relationship.",
      source: "Federal Reserve · FRED",
      sourceUrl: seriesSourceUrl(data, "dollar"),
    },
    {
      key: "bitcoin",
      title: "Bitcoin",
      eyebrow: "BTC · TWO-VENUE SPOT",
      evidence: `$${marketFormat(sixForce.forces.bitcoin.value, lang, 0)} · 90D ${signed(sixForce.forces.bitcoin.change, "%")}`,
      note: lang === "es" ? "Activo monetario y de liquidez con alta volatilidad; una divergencia frente al dólar o los tipos se conserva como evidencia." : "A volatile monetary and liquidity asset; divergence from the dollar or yields remains visible as evidence.",
      source: data.provenance.bitcoinPrice,
      sourceUrl: bitcoinSourceUrl(data),
    },
  ];
  const engineAssessments = ([
    ["liquidity", data.derived.scores.liquidity],
    ["credit", data.derived.scores.credit],
    ["realEconomy", data.derived.scores.realEconomy],
    ["inflation", data.derived.scores.inflation],
    ["fiscal", data.derived.scores.fiscal],
  ] as Array<[keyof typeof engineLabels, number]>).map(([key, score]) => ({
    key,
    score,
    available: modelAvailable && data.provenance.engineReady?.[key] !== false && Number.isFinite(score),
    label: engineLabels[key][lang === "en" ? 0 : 1],
    ...engineReading(key, score, lang),
  }));
  const pillarCards = [
    {
      key: "liquidity" as const,
      code: lang === "es" ? "POLÍTICA MONETARIA" : "MONETARY POLICY",
      title: lang === "es" ? "Política monetaria" : "Monetary policy",
      score: data.derived.scores.liquidity,
      body: lang === "es"
        ? "Las decisiones de la Reserva Federal, su balance, las reservas bancarias y la liquidez del sistema definen el impulso inicial. Terminar el QT detiene el drenaje; no equivale automáticamente a un nuevo QE."
        : "Federal Reserve decisions, its balance sheet, bank reserves and system liquidity define the starting impulse. Ending QT stops the drain; it is not automatically a new QE.",
    },
    {
      key: "credit" as const,
      code: lang === "es" ? "MERCADOS DE CRÉDITO" : "CREDIT MARKETS",
      title: lang === "es" ? "Mercados de crédito" : "Credit markets",
      score: data.derived.scores.credit,
      body: lang === "es"
        ? "Las condiciones financieras, los repos, la emisión de deuda y la refinanciación muestran cómo se transmite —o se bloquea— la liquidez antes de llegar a empresas y hogares."
        : "Financial conditions, repo markets, debt issuance and refinancing show how liquidity is transmitted—or blocked—before reaching companies and households.",
    },
    {
      key: "realEconomy" as const,
      code: lang === "es" ? "ECONOMÍA REAL" : "REAL ECONOMY",
      title: lang === "es" ? "Economía real" : "Real economy",
      score: data.derived.scores.realEconomy,
      body: lang === "es"
        ? "El empleo, el poder adquisitivo, el acceso a la vivienda, la pobreza y la situación de Main Street revelan quién se beneficia del ciclo y quién soporta realmente su coste."
        : "Employment, purchasing power, housing affordability, poverty and Main Street reveal who benefits from the cycle and who actually bears its cost.",
    },
  ].map((pillar) => {
    const available = modelAvailable && data.provenance.engineReady?.[pillar.key] !== false && Number.isFinite(pillar.score);
    const state = available ? (modelProvisional ? "provisional" : "complete") : "withheld";
    const status = state === "complete"
      ? (lang === "es" ? "COBERTURA COMPLETA" : "COMPLETE COVERAGE")
      : state === "provisional"
        ? (lang === "es" ? "LECTURA PROVISIONAL" : "PROVISIONAL READING")
        : (lang === "es" ? "LECTURA RETENIDA" : "READING WITHHELD");
    return { ...pillar, available, state, status };
  });
  const availableEngineAssessments = engineAssessments.filter((assessment) => assessment.available);
  const strongest = [...availableEngineAssessments].sort((a, b) => b.score - a.score)[0];
  const weakest = [...availableEngineAssessments].sort((a, b) => a.score - b.score)[0];
  const divergence = strongest && weakest ? strongest.score - weakest.score : 0;
  const freshnessCounts = data.freshness.reduce((counts, source) => {
    if (source.status === "live") counts.live += 1;
    else if (source.status === "last-known-good") counts.lastKnownGood += 1;
    else if (source.status === "stale") counts.stale += 1;
    else counts.unavailable += 1;
    return counts;
  }, { live: 0, lastKnownGood: 0, stale: 0, unavailable: 0 });
  const snapshotDate = data.provenance.mode === "fallback" ? null : validTimestamp(data.requestedAt);
  const snapshotAgeMinutes = snapshotDate
    ? Math.max(0, Math.floor((clock - snapshotDate.getTime()) / 60_000))
    : null;
  const snapshotNeedsRefresh = snapshotAgeMinutes == null || (data.cache?.nextDailyAt ? Date.parse(data.cache.nextDailyAt) <= clock : snapshotAgeMinutes >= 1_440);
  const snapshotTimestamp = snapshotDate
    ? new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid",
    }).format(snapshotDate)
    : "—";
  const nextRefreshDate = manualRefreshNext && manualRefreshNext > clock ? new Date(manualRefreshNext) : null;
  const nextRefreshTimestamp = nextRefreshDate
    ? new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
      dateStyle: "medium", timeStyle: "medium", timeZone: "Europe/Madrid",
    }).format(nextRefreshDate)
    : "—";
  const secondsToRefresh = nextRefreshDate
    ? Math.max(0, Math.ceil((nextRefreshDate.getTime() - clock) / 1000))
    : null;
  const refreshUnlocked = secondsToRefresh == null || secondsToRefresh === 0;
  const refreshCountdown = secondsToRefresh == null
    ? "—"
    : `${String(Math.floor(secondsToRefresh / 60)).padStart(2, "0")}:${String(secondsToRefresh % 60).padStart(2, "0")}`;
  const bitcoinConsensus = data.bitcoin.priceConsensus ?? "unavailable";
  const bitcoinPriceAvailable = data.provenance.mode !== "fallback" && btc != null && Number.isFinite(btc) && btc > 0;
  const bitcoinNetworkAvailable = data.provenance.mode !== "fallback" && data.provenance.bitcoinNetwork !== "unavailable";
  const bitcoinSupplyAvailable = bitcoinNetworkAvailable && Number.isFinite(data.bitcoin.supply) && data.bitcoin.supply > 0;
  const bitcoinPriceStatus = marketStateLabel(bitcoinConsensus, lang);
  const upstreamReady = data.upstreams?.filter((item) => item.status === "ready").length ?? 0;
  const upstreamCooling = data.upstreams?.filter((item) => item.status === "cooldown").length ?? 0;
  const upstreamRecovering = data.upstreams?.filter((item) => item.status === "recovering").length ?? 0;
  const upstreamTotal = data.upstreams?.length ?? 0;
  const macroAvailable = data.provenance.fredAvailable ?? 0;
  const macroTotal = data.provenance.fredTotal ?? 0;
  const sourceHealthState = macroAvailable === 0 ? "offline" : macroTotal > 0 && macroAvailable === macroTotal ? "ok" : "partial";
  const portableOutputState = data.provenance.mode === "fallback" ? "offline" : "ok";
  const regimeStatus = modelAvailable
    ? cycle.title.toUpperCase()
    : (lang === "es" ? "SIN COBERTURA" : "NO COVERAGE");

  function openCycleMethodology() {
    const methodology = document.getElementById("cycle-methodology");
    if (!methodology) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    methodology.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    methodology.focus({ preventScroll: true });
  }

  function showEngine(key: keyof typeof engineLabels, score: number, trigger?: HTMLButtonElement) {
    if (trigger) detailReturnFocusRef.current = trigger;
    const reading = engineReading(key, score, lang);
    const engineAvailable = modelAvailable && data.provenance.engineReady?.[key] !== false;
    setDetail({
      eyebrow: `${reading.range} · ${lang === "es" ? "LECTURA CONDICIONAL" : "CONDITIONAL READING"}`,
      title: engineLabels[key][lang === "en" ? 0 : 1],
      value: engineAvailable ? `${score}/100` : "—",
      fact: engineAvailable ? reading.fact : (lang === "es" ? "Las entradas necesarias para este motor no tienen cobertura suficiente. No se asigna un cero ni una lectura neutral." : "The required inputs for this engine lack sufficient coverage. No zero or neutral reading is assigned."),
      interpretation: engineAvailable ? reading.interpretation : (lang === "es" ? "La lente austriaca queda suspendida hasta disponer de observaciones verificables." : "The Austrian interpretation is withheld until verifiable observations are available."),
      watch: engineAvailable ? reading.watch : (lang === "es" ? "Consultar el estado de fuentes y la fecha de cada observación." : "Check source status and each observation date."),
      sourceLabel: lang === "es" ? "Fórmula, entradas y fuentes" : "Formula, inputs and sources",
      sourceUrl: "/api/data-manifest",
    });
  }

  function showCavaContext(trigger?: HTMLButtonElement) {
    if (trigger) detailReturnFocusRef.current = trigger;
    setDetail({
      eyebrow: lang === "es" ? "VÍDEO INSPIRADOR · RECONSTRUCCIÓN CONTEXTUAL" : "INSPIRING VIDEO · CONTEXTUAL RECONSTRUCTION",
      title: lang === "es" ? "Los tres pilares" : "The three pillars",
      value: "01 → 02 → 03",
      fact: lang === "es"
        ? "01 · Política monetaria: Reserva Federal, balance, reservas bancarias y liquidez. 02 · Mercados de crédito: condiciones financieras, repos, emisión de deuda y transmisión de la liquidez. 03 · Economía real: empleo, poder adquisitivo, vivienda, pobreza y situación de Main Street."
        : "01 · Monetary policy: Federal Reserve, balance sheet, bank reserves and liquidity. 02 · Credit markets: financial conditions, repo, debt issuance and liquidity transmission. 03 · Real economy: employment, purchasing power, housing, poverty and Main Street.",
      factLabel: lang === "es" ? "LOS TRES PILARES" : "THE THREE PILLARS",
      interpretation: lang === "es"
        ? "El vídeo que inspiró ABCM planteaba una divergencia: Wall Street y la economía tecnológica podían prosperar mientras parte de Main Street perdía poder adquisitivo. La idea útil fue seguir la cadena completa —marco monetario, transmisión crediticia y resultado material— antes de interpretar los máximos bursátiles como prosperidad general."
        : "The video that inspired ABCM described a divergence: Wall Street and the technology economy could prosper while part of Main Street lost purchasing power. The useful idea was to follow the full chain—monetary framework, credit transmission and material outcome—before treating equity highs as general prosperity.",
      interpretationLabel: lang === "es" ? "POR QUÉ INSPIRÓ EL MODELO" : "WHY IT INSPIRED THE MODEL",
      watch: lang === "es"
        ? "No confundir el final del QT con un nuevo QE. Conviene vigilar reservas, repos, TGA y la composición por vencimientos de la deuda: una emisión larga intensa podría elevar rentabilidades y endurecer las condiciones financieras. Es un escenario condicional, no una predicción. Esta síntesis reconstruye el argumento del vídeo; no es una transcripción literal ni atribuye a Cava las fórmulas de ABCM."
        : "Do not confuse the end of QT with a new QE. Watch reserves, repo, the TGA and debt maturity composition: heavy long-duration issuance could lift yields and tighten financial conditions. This is a conditional scenario, not a forecast. This summary reconstructs the video’s argument; it is not a verbatim transcript and does not attribute ABCM formulas to Cava.",
      watchLabel: lang === "es" ? "ESCENARIO Y MATICES A VIGILAR" : "SCENARIO AND CAVEATS TO WATCH",
      sourceLabel: lang === "es" ? "Canal público de José Luis Cava" : "José Luis Cava’s public channel",
      sourceUrl: "https://www.youtube.com/@JoseLuisCavatv",
    });
  }

  function showSignal(item: (typeof scoreComponents)[number], trigger?: HTMLButtonElement) {
    if (trigger) detailReturnFocusRef.current = trigger;
    const reading = engineReading(item.parent, item.score, lang);
    const available = item.ready;
    setDetail({
      eyebrow: `${available ? reading.range : (lang === "es" ? "SIN COBERTURA" : "NO COVERAGE")} · ${format(item.weight * 100, 0)}% ${lang === "es" ? "PESO BASE" : "BASE WEIGHT"}`,
      title: item.label,
      value: available ? `${item.score}/100` : "—",
      fact: available
        ? `${item.observed}. ${reading.fact}`
        : (lang === "es" ? "Las entradas requeridas no tienen cobertura suficiente; esta señal queda excluida del cálculo. Una ausencia no se convierte en cero." : "The required inputs lack sufficient coverage, so this signal is excluded from the calculation. Missing data is never converted into zero."),
      interpretation: available ? reading.interpretation : (lang === "es" ? "No se publica una interpretación austriaca sin observaciones verificables." : "No Austrian interpretation is published without verifiable observations."),
      watch: available ? reading.watch : (lang === "es" ? "Revisar fechas, procedencia y estado de cada variable." : "Review each variable's date, provenance and status."),
      sourceLabel: lang === "es" ? "Auditar fórmula y fuentes" : "Audit formula and sources",
      sourceUrl: "/api/data-manifest",
    });
  }

  function handleDiagnosticTabKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % discriminationScenarios.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + discriminationScenarios.length) % discriminationScenarios.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = discriminationScenarios.length - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    setDiagnosticScenario(nextIndex);
    window.requestAnimationFrame(() => diagnosticTabRefs.current[nextIndex]?.focus());
  }

  function handleSeriesTabKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % chartSeriesKeys.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + chartSeriesKeys.length) % chartSeriesKeys.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = chartSeriesKeys.length - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    setSeriesKey(chartSeriesKeys[nextIndex]);
    window.requestAnimationFrame(() => seriesTabRefs.current[nextIndex]?.focus());
  }

  function handleMetricTabKey(event: React.KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex: number | null = null;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % metrics.length;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + metrics.length) % metrics.length;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = metrics.length - 1;
    if (nextIndex == null) return;
    event.preventDefault();
    setSelectedMetric(metrics[nextIndex]);
    window.requestAnimationFrame(() => metricTabRefs.current[nextIndex]?.focus());
  }

  function acceptDisclaimer() {
    saveEducationalNoticeAcceptance();
    setDisclaimerOpen(false);
  }

  function toggleWatch(key: WatchKey) {
    setWatchlist((current) => {
      const next = current.includes(key)
        ? (current.length === 1 ? current : current.filter((item) => item !== key))
        : current.length >= 4 ? current : [...current, key];
      saveWatchlistPreference(next);
      return next;
    });
  }

  const tape = [
    {
      name: "BTC / USD",
      value: `$${marketFormat(btc, lang, 0)}`,
      unit: data.bitcoin.change24h == null ? "USD · spot" : `USD · 24h ${data.bitcoin.change24h >= 0 ? "+" : ""}${marketFormat(data.bitcoin.change24h, lang)}%`,
      source: data.provenance.bitcoinPrice.replace(" Exchange", "").toUpperCase(),
      date: data.bitcoin.priceObservedAt?.slice(0, 10) ?? "—",
      state: bitcoinConsensus,
      status: marketStateLabel(bitcoinConsensus, lang),
      url: bitcoinSourceUrl(data),
    },
    {
      name: goldSource === "COINBASE"
        ? (lang === "es" ? "ORO · PROXY PAXG" : "GOLD · PAXG PROXY")
        : goldSource === "WORLD BANK"
          ? (lang === "es" ? "ORO / USD · MEDIA MENSUAL" : "GOLD / USD · MONTHLY AVG")
          : (lang === "es" ? "ORO / USD" : "GOLD / USD"),
      value: `$${marketFormat(gold, lang)}`,
      unit: goldSource === "COINBASE"
        ? (lang === "es" ? "1 PAXG ≈ 1 onza troy · USD" : "1 PAXG ≈ 1 troy ounce · USD")
        : goldSource === "WORLD BANK"
          ? (lang === "es" ? "USD por onza troy · promedio mensual" : "USD per troy ounce · monthly average")
          : (lang === "es" ? "USD por onza troy" : "USD per troy ounce"),
      source: goldSource === "COINBASE" ? "COINBASE · PAXG" : goldSource,
      date: observedDate(data, "gold"),
      state: marketState(data, "gold"),
      status: marketStateLabel(marketState(data, "gold"), lang),
      url: seriesSourceUrl(data, "gold"),
    },
    {
      name: lang === "es" ? "PETRÓLEO WTI" : "WTI CRUDE OIL",
      value: `$${marketFormat(latestValue(data, "oil"), lang)}`,
      unit: lang === "es" ? "USD por barril" : "USD per barrel",
      source: seriesSource(data, "oil"),
      date: observedDate(data, "oil"),
      state: marketState(data, "oil"),
      status: marketStateLabel(marketState(data, "oil"), lang),
      url: seriesSourceUrl(data, "oil"),
    },
    {
      name: "S&P 500",
      value: marketFormat(latestValue(data, "sp500"), lang),
      unit: lang === "es" ? "Puntos de índice" : "Index points",
      source: seriesSource(data, "sp500"),
      date: observedDate(data, "sp500"),
      state: marketState(data, "sp500"),
      status: marketStateLabel(marketState(data, "sp500"), lang),
      url: seriesSourceUrl(data, "sp500"),
    },
    {
      name: lang === "es" ? "DÓLAR · ÍNDICE AMPLIO" : "DOLLAR · BROAD INDEX",
      value: marketFormat(latestValue(data, "dollar"), lang),
      unit: lang === "es" ? "Base 100 · enero 2006" : "Base 100 · January 2006",
      source: seriesSource(data, "dollar"),
      date: observedDate(data, "dollar"),
      state: marketState(data, "dollar"),
      status: marketStateLabel(marketState(data, "dollar"), lang),
      url: seriesSourceUrl(data, "dollar"),
    },
    {
      name: lang === "es" ? "DEUDA FEDERAL EE. UU." : "US FEDERAL DEBT",
      value: debt == null ? "—" : lang === "es" ? `$${marketFormat(debt / 1000, lang, 1)}` : `$${marketFormat(debt / 1000, lang, 1)}T`,
      unit: data.provenance.federalDebt === "U.S. Treasury Fiscal Data"
        ? (lang === "es" ? "billones USD · dato diario" : "USD trillions · daily")
        : data.provenance.federalDebt === "World Bank"
          ? (lang === "es" ? "billones USD · estimación anual" : "USD trillions · annual estimate")
          : (lang === "es" ? "billones USD · dato trimestral" : "USD trillions · quarterly"),
      source: data.provenance.federalDebt === "U.S. Treasury Fiscal Data" ? "TREASURY" : `${seriesSource(data, "federalDebt")}${data.provenance.federalDebt === "World Bank" ? " · EST." : ""}`,
      date: observedDate(data, debtSeriesKey),
      state: marketState(data, debtSeriesKey),
      status: marketStateLabel(marketState(data, debtSeriesKey), lang),
      url: debtSourceUrl(data),
    },
  ];
  const visitAgeHours = visitBaseline
    ? Math.max(0, Math.floor((clock - new Date(visitBaseline.capturedAt).getTime()) / 3_600_000))
    : null;
  const visitAgeLabel = visitAgeHours == null
    ? null
    : visitAgeHours < 1
      ? (lang === "es" ? "< 1 HORA" : "< 1 HOUR")
      : visitAgeHours < 48
        ? `${visitAgeHours}H`
        : `${Math.floor(visitAgeHours / 24)}D`;
  const baselineDateLabel = visitBaseline
    ? new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid",
    }).format(new Date(visitBaseline.capturedAt))
    : null;
  const visitStatusLabel = visitBaseline
    ? visitAgeLabel
    : loading
      ? (lang === "es" ? "PREPARANDO BASE" : "PREPARING BASELINE")
      : baselineSavedThisVisit
        ? (lang === "es" ? "BASE GUARDADA" : "BASELINE SAVED")
        : (lang === "es" ? "MEMORIA NO DISPONIBLE" : "MEMORY UNAVAILABLE");
  const releasedSinceVisit = visitBaseline
    ? Object.entries(data.latest).filter(([key, point]) => point?.date && point.date !== visitBaseline.latestDates[key]).length
    : null;
  const compositeDelta = visitBaseline && modelAvailable && visitBaseline.modelReady
    ? cycleScore - visitBaseline.composite
    : null;
  const bitcoinDelta = visitBaseline?.bitcoinPrice && btc
    ? ((btc / visitBaseline.bitcoinPrice) - 1) * 100
    : null;
  const regimeChanged = Boolean(visitBaseline && visitBaseline.regime !== data.derived.regime);
  const m2Watch = latestValue(data, "m2");
  const creditWatch = latestValue(data, "creditSpread");
  const cpiWatch = latestValue(data, "cpi");
  const unemploymentWatch = latestValue(data, "unemployment");
  const watchChoices: Array<{ key: WatchKey; label: string; value: string; unit: string; date: string; state: string; status: string }> = [
    { key: "m2", label: "M2", value: m2Watch == null ? "—" : `$${marketFormat(m2Watch / 1000, lang, 2)}`, unit: lang === "es" ? "billones USD" : "USD trillions", date: observedDate(data, "m2"), state: marketState(data, "m2"), status: marketStateLabel(marketState(data, "m2"), lang) },
    { key: "creditSpread", label: lang === "es" ? "Crédito BAA" : "BAA credit", value: creditWatch == null ? "—" : `${marketFormat(creditWatch, lang)} pp`, unit: lang === "es" ? "diferencial BAA–10Y" : "BAA–10Y spread", date: observedDate(data, "creditSpread"), state: marketState(data, "creditSpread"), status: marketStateLabel(marketState(data, "creditSpread"), lang) },
    { key: "cpi", label: lang === "es" ? "IPC · índice" : "CPI · index", value: marketFormat(cpiWatch, lang), unit: "1982–84 = 100", date: observedDate(data, "cpi"), state: marketState(data, "cpi"), status: marketStateLabel(marketState(data, "cpi"), lang) },
    { key: "unemployment", label: lang === "es" ? "Desempleo" : "Unemployment", value: unemploymentWatch == null ? "—" : `${marketFormat(unemploymentWatch, lang)}%`, unit: lang === "es" ? "población activa" : "labour force", date: observedDate(data, "unemployment"), state: marketState(data, "unemployment"), status: marketStateLabel(marketState(data, "unemployment"), lang) },
    { key: "federalDebt", label: lang === "es" ? "Deuda" : "Debt", value: debt == null ? "—" : `$${marketFormat(debt / 1000, lang, 1)}`, unit: lang === "es" ? "billones USD" : "USD trillions", date: observedDate(data, debtSeriesKey), state: marketState(data, debtSeriesKey), status: marketStateLabel(marketState(data, debtSeriesKey), lang) },
    { key: "bitcoin", label: "Bitcoin", value: btc == null ? "—" : `$${marketFormat(btc, lang, 0)}`, unit: "USD · spot", date: data.bitcoin.priceObservedAt?.slice(0, 10) ?? "—", state: bitcoinConsensus, status: marketStateLabel(bitcoinConsensus, lang) },
  ];
  const transmissionSteps = [
    {
      key: "monetary",
      number: "01",
      title: lang === "es" ? "Política monetaria" : "Monetary policy",
      note: lang === "es"
        ? "M2 y tipo real son el punto de partida. Fin del QT no equivale a un nuevo QE."
        : "M2 and the real rate are the starting point. Ending QT does not equal a new QE.",
      ready: Boolean(data.provenance.engineReady?.liquidity),
      metrics: [
        { label: "M2 · YoY", value: data.derived.changes.m2Growth, unit: "%", date: observedDate(data, "m2") },
        { label: lang === "es" ? "Tipo real aprox." : "Approx. real rate", value: data.derived.ratios.realRate, unit: "%", date: data.derived.ratioEvidence?.realRate?.observationMonth ?? observedDate(data, "cpi") },
      ],
    },
    {
      key: "credit",
      number: "02",
      title: lang === "es" ? "Mercados de crédito" : "Credit markets",
      note: lang === "es"
        ? "Curva y diferenciales revelan la transmisión. Tipos bajos no garantizan crédito accesible."
        : "The curve and spreads reveal transmission. Lower rates do not guarantee accessible credit.",
      ready: Boolean(data.provenance.engineReady?.credit),
      metrics: [
        { label: "BAA–10Y", value: latestValue(data, "creditSpread"), unit: " pp", date: observedDate(data, "creditSpread") },
        { label: "10Y–2Y", value: latestValue(data, "yieldCurve"), unit: " pp", date: observedDate(data, "yieldCurve") },
      ],
    },
    {
      key: "real-economy",
      number: "03",
      title: lang === "es" ? "Economía real" : "Real economy",
      note: lang === "es"
        ? "Producción y empleo comprueban si llega a Main Street; suelen confirmar con retraso."
        : "Production and employment test whether it reaches Main Street; they often confirm with a lag.",
      ready: Boolean(data.provenance.engineReady?.realEconomy),
      metrics: [
        { label: "INDPRO · YoY", value: data.derived.changes.industrialGrowth, unit: "%", date: observedDate(data, "industrialProduction") },
        { label: lang === "es" ? "Δ desempleo · 1A" : "Unemployment Δ · 1Y", value: data.derived.changes.unemploymentChange, unit: " pp", date: observedDate(data, "unemployment") },
      ],
    },
  ].map((step) => {
    const availableMetrics = step.metrics.filter((metric) => Number.isFinite(metric.value)).length;
    const state = step.ready ? "verified" : availableMetrics > 0 ? "partial" : "unavailable";
    const status = state === "verified"
      ? (lang === "es" ? "PILAR VERIFICADO" : "PILLAR VERIFIED")
      : state === "partial"
        ? (lang === "es" ? "COBERTURA PARCIAL" : "PARTIAL COVERAGE")
        : (lang === "es" ? "SIN DATOS" : "NO DATA");
    return { ...step, availableMetrics, state, status };
  });
  const verifiedTransmissionSteps = transmissionSteps.filter((step) => step.state === "verified").length;
  const evidenceFor = (key: string): RatioEvidence => data.derived.ratioEvidence?.[key] ?? {
    status: "insufficient", observationMonth: null, numerator: null, denominator: null,
    numeratorObservations: 0, denominatorObservations: 0,
  };
  const ratioStatus = (evidence: RatioEvidence) => evidence.status === "available"
    ? `${lang === "es" ? "MES COMÚN" : "COMMON MONTH"} · ${evidence.observationMonth ? formatComparatorMonth(evidence.observationMonth, lang) : "—"}`
    : evidence.status === "stale"
      ? `${lang === "es" ? "RETENIDO" : "WITHHELD"} · ${evidence.observationMonth ? formatComparatorMonth(evidence.observationMonth, lang) : "—"}`
      : (lang === "es" ? "SIN PERIODO COMÚN" : "NO COMMON PERIOD");
  const btcGoldEvidence = evidenceFor("bitcoinGoldOunces");
  const alignedBitcoinGold = btcGoldEvidence.status === "available" && Number.isFinite(data.derived.ratios.bitcoinGoldOunces)
    ? data.derived.ratios.bitcoinGoldOunces
    : null;
  const alignedBitcoinGoldMonth = btcGoldEvidence.observationMonth
    ? formatComparatorMonth(btcGoldEvidence.observationMonth, lang)
    : "—";
  const goldStockToFlow2025 = 219_891 / 3_671.6;
  const spGoldEvidence = evidenceFor("sp500Gold");
  const debtM2Evidence = evidenceFor("debtToM2");
  const realRateEvidence = evidenceFor("realRate");
  const ratioCards = [
    {
      key: "bitcoin-gold", label: lang === "es" ? "BTC / ORO" : "BTC / GOLD",
      value: btcGoldEvidence.status === "available" ? `${marketFormat(data.derived.ratios.bitcoinGoldOunces, lang, 1)} oz` : "—",
      state: btcGoldEvidence.status, status: ratioStatus(btcGoldEvidence),
      fact: btcGoldEvidence.status === "available"
        ? (lang === "es" ? `Media mensual de BTC (${marketFormat(btcGoldEvidence.numerator, lang, 0)} USD) dividida por la media mensual del oro (${marketFormat(btcGoldEvidence.denominator, lang, 0)} USD/oz) en ${formatComparatorMonth(btcGoldEvidence.observationMonth!, lang)}.` : `Monthly average BTC price (${marketFormat(btcGoldEvidence.numerator, lang, 0)} USD) divided by monthly average gold (${marketFormat(btcGoldEvidence.denominator, lang, 0)} USD/oz) in ${formatComparatorMonth(btcGoldEvidence.observationMonth!, lang)}.`)
        : (lang === "es" ? "No existe un mes común reciente con datos verificables de ambos activos; el ratio se retiene." : "There is no recent shared month with verifiable data for both assets; the ratio is withheld."),
      interpretation: lang === "es" ? "Expresa cuántas onzas de oro equivalen al precio medio de un bitcoin durante el mismo mes. No es una valoración fundamental." : "It expresses how many gold ounces equal the average price of one bitcoin in the same month. It is not fundamental valuation.",
      watch: lang === "es" ? "Comparar su evolución mensual, no el nivel aislado, y recordar que volatilidad y horarios de mercado difieren." : "Compare its monthly path, not an isolated level, and remember that volatility and market hours differ.",
    },
    {
      key: "sp500-gold", label: lang === "es" ? "S&P 500 / ORO" : "S&P 500 / GOLD",
      value: spGoldEvidence.status === "available" ? marketFormat(data.derived.ratios.sp500Gold, lang, 2) : "—",
      state: spGoldEvidence.status, status: ratioStatus(spGoldEvidence),
      fact: spGoldEvidence.status === "available"
        ? (lang === "es" ? `Nivel medio mensual del S&P 500 (${marketFormat(spGoldEvidence.numerator, lang, 0)} puntos) dividido por el precio medio mensual del oro (${marketFormat(spGoldEvidence.denominator, lang, 0)} USD/oz) en ${formatComparatorMonth(spGoldEvidence.observationMonth!, lang)}.` : `Average monthly S&P 500 level (${marketFormat(spGoldEvidence.numerator, lang, 0)} points) divided by average monthly gold (${marketFormat(spGoldEvidence.denominator, lang, 0)} USD/oz) in ${formatComparatorMonth(spGoldEvidence.observationMonth!, lang)}.`)
        : (lang === "es" ? "No existe un mes común reciente para calcular la relación sin mezclar fechas." : "There is no recent common month for calculating the relationship without mixing dates."),
      interpretation: lang === "es" ? "Sirve como indicador de rendimiento relativo entre un índice nominal y el oro. No representa una cantidad directamente comprable ni un múltiplo monetario homogéneo." : "It tracks relative performance between a nominal index and gold. It is neither a directly purchasable quantity nor a homogeneous monetary multiple.",
      watch: lang === "es" ? "Una subida puede proceder de acciones más fuertes, oro más débil o ambos; hay que inspeccionar los componentes." : "A rise can come from stronger equities, weaker gold or both; inspect the components.",
    },
    {
      key: "debt-m2", label: lang === "es" ? "DEUDA / M2" : "DEBT / M2",
      value: debtM2Evidence.status === "available" ? `${marketFormat(data.derived.ratios.debtToM2, lang, 2)}×` : "—",
      state: debtM2Evidence.status, status: ratioStatus(debtM2Evidence),
      fact: debtM2Evidence.status === "available"
        ? (lang === "es" ? `Deuda federal y M2, ambas en miles de millones de USD, alineadas en ${formatComparatorMonth(debtM2Evidence.observationMonth!, lang)}.` : `Federal debt and M2, both in USD billions, aligned in ${formatComparatorMonth(debtM2Evidence.observationMonth!, lang)}.`)
        : debtM2Evidence.status === "stale"
          ? (lang === "es" ? `El último mes común es ${formatComparatorMonth(debtM2Evidence.observationMonth!, lang)}. La fuente fiscal está demasiado desactualizada para combinarla con el M2 actual, por lo que no se publica el cociente.` : `The latest shared month is ${formatComparatorMonth(debtM2Evidence.observationMonth!, lang)}. The fiscal source is too stale to combine with current M2, so the ratio is not published.`)
          : (lang === "es" ? "No hay observaciones contemporáneas suficientes de deuda y M2." : "There are not enough contemporaneous debt and M2 observations."),
      interpretation: lang === "es" ? "Compara dos stocks monetarios en la misma unidad; no mide por sí solo solvencia, sostenibilidad fiscal ni capacidad de servicio de la deuda." : "It compares two monetary stocks in the same unit; it does not by itself measure solvency, fiscal sustainability or debt-service capacity.",
      watch: lang === "es" ? "Esperar una publicación fiscal reciente antes de reactivar la lectura." : "Wait for a recent fiscal release before restoring the reading.",
    },
    {
      key: "real-rate", label: lang === "es" ? "TIPO REAL APROX." : "APPROX. REAL RATE",
      value: realRateEvidence.status === "available" ? `${marketFormat(data.derived.ratios.realRate, lang, 2)}%` : "—",
      state: realRateEvidence.status, status: ratioStatus(realRateEvidence),
      fact: realRateEvidence.status === "available"
        ? (lang === "es" ? `Fondos federales medios (${marketFormat(realRateEvidence.numerator, lang, 2)}%) menos inflación interanual del IPC (${marketFormat(realRateEvidence.denominator, lang, 2)}%) para ${formatComparatorMonth(realRateEvidence.observationMonth!, lang)}.` : `Average federal funds rate (${marketFormat(realRateEvidence.numerator, lang, 2)}%) minus year-over-year CPI inflation (${marketFormat(realRateEvidence.denominator, lang, 2)}%) for ${formatComparatorMonth(realRateEvidence.observationMonth!, lang)}.`)
        : (lang === "es" ? "No hay un mes común reciente con tipo oficial e IPC interanual verificables." : "There is no recent common month with a verifiable policy rate and year-over-year CPI."),
      interpretation: lang === "es" ? "Es una aproximación retrospectiva de la postura monetaria. No equivale al tipo natural ni a una expectativa real ex ante." : "It is a backward-looking approximation of monetary stance. It is not the natural rate or an ex-ante real expectation.",
      watch: lang === "es" ? "Revisar por separado cambios en el tipo nominal y en el IPC: el mismo resultado puede esconder mecanismos opuestos." : "Review nominal-rate and CPI changes separately: the same result can hide opposite mechanisms.",
    },
    {
      key: "composite", label: lang === "es" ? "PRESIÓN COMPUESTA" : "COMPOSITE PRESSURE",
      value: modelAvailable ? `${data.derived.scores.composite}/100` : "—",
      state: engineCoverageState, status: `${engineCoverageLabel} · ${readySignalCount}/10 ${lang === "es" ? "SEÑALES" : "SIGNALS"}`,
      fact: modelAvailable
        ? (lang === "es" ? `Media ponderada de ${readySignalCount}/10 señales verificadas, con ${availableWeightPercent}% del peso base disponible. La redistribución provisional queda documentada en la metodología.` : `Weighted average of ${readySignalCount}/10 verified signals, with ${availableWeightPercent}% of base weight available. Provisional redistribution is documented in the methodology.`)
        : (lang === "es" ? "La cobertura ponderada no alcanza el umbral de publicación; no se sustituye la ausencia por cero." : "Weighted coverage does not reach the publication threshold; missing inputs are not replaced with zero."),
      interpretation: lang === "es" ? "Mide presión cíclica modelizada, no probabilidad de caída, riesgo de cartera ni señal operativa." : "It measures modeled cycle pressure, not crash probability, portfolio risk or a trading signal.",
      watch: lang === "es" ? "Comprobar qué señal falta y si el resultado cambia cuando la cobertura vuelve a ser completa." : "Check which signal is missing and whether the result changes when coverage becomes complete.",
    },
  ];

  return (
    <main>
      <a className="skip-link" href="#dashboard">{lang === "es" ? "Saltar al panel" : "Skip to dashboard"}</a>
      <nav className="nav" ref={navRef} aria-label={lang === "es" ? "Navegación principal" : "Primary navigation"}>
        <a className="brand" href="#top" aria-label={lang === "es" ? "ABCM · volver al inicio" : "ABCM · back to top"} aria-current={activeSection === "top" ? "location" : undefined}><span className="brand-mark">₿</span><span>ABCM</span></a>
        <div className={`nav-links ${menu ? "open" : ""}`} id="primary-navigation">
          {["dashboard", "liquidity", "six-forces", "hard-assets", "theory", "sources"].map((id, i) => <a key={id} ref={i === 0 ? firstNavLinkRef : undefined} className={activeSection === id ? "active" : undefined} href={`#${id}`} aria-current={activeSection === id ? "location" : undefined} onClick={() => { setActiveSection(id); setMenu(false); }}>{t.nav[i]}</a>)}
          <a className="academy-nav" href={`/learn?lang=${lang}`} target="_blank" rel="noreferrer" onClick={() => setMenu(false)}>{lang === "es" ? "Aprende ↗" : "Learn ↗"}</a>
        </div>
        <div className="nav-controls">
          <button className="lang" onClick={() => changeLanguage(lang === "en" ? "es" : "en")} aria-label={lang === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish"}>{lang === "en" ? "ES" : "EN"}</button>
          <button className="menu" ref={menuButtonRef} onClick={() => setMenu(!menu)} aria-label={menu ? (lang === "es" ? "Cerrar navegación" : "Close navigation") : (lang === "es" ? "Abrir navegación" : "Open navigation")} aria-expanded={menu} aria-controls="primary-navigation">{menu ? "×" : "☰"}</button>
        </div>
      </nav>

      {loading && data.provenance.mode !== "fallback" && (
        <div className="background-refresh" role="status" aria-live="polite">
          <span />
          {lang === "es" ? "Actualizando fuentes en segundo plano" : "Refreshing sources in the background"}
        </div>
      )}

      <section className="hero" id="top">
        <div className="eyebrow"><span className={`live-dot ${loading ? "pulse" : ""}`} /> {t.live} · {data.provenance.mode === "live" ? (lang === "es" ? "AL DÍA" : "CURRENT") : data.provenance.mode === "stale-persisted" ? (lang === "es" ? "ÚLTIMO DATO VÁLIDO" : "LAST VALID DATA") : (lang === "es" ? "ESPERANDO FUENTES" : "AWAITING SOURCES")}</div>
        <div className="hero-grid">
          <div>
            <h1>{t.title}</h1><p className="hero-thesis">{t.subtitle}</p>
            <p className="lede">{t.intro}</p>
            <div className="actions">
              <a className="primary" href="#dashboard">{lang === "es" ? "Explorar el panel" : "Explore dashboard"} <span>↓</span></a>
              <button className="secondary" onClick={() => load(true, true)} disabled={loading || !refreshUnlocked} aria-busy={loading} aria-describedby="snapshot-status" title={!refreshUnlocked ? (lang === "es" ? `Disponible en ${refreshCountdown}` : `Available in ${refreshCountdown}`) : undefined}>{loading ? (lang === "es" ? "Cargando datos" : "Loading data") : refreshUnlocked ? `↻ ${t.refresh}` : refreshCountdown}</button>
            </div>
            <div className={`snapshot-status ${snapshotNeedsRefresh ? "needs-refresh" : "current"}`} id="snapshot-status" aria-label={lang === "es" ? "Estado de la edición de datos" : "Data edition status"}>
              <div>
                <span>{lang === "es" ? "INSTANTÁNEA COMPARTIDA ACTUAL" : "CURRENT SHARED SNAPSHOT"}</span>
                <strong>{snapshotTimestamp} · {lang === "es" ? "hora de Madrid" : "Madrid time"}</strong>
              </div>
              <div className="next-refresh">
                <span>{lang === "es" ? "PRÓXIMA ACTUALIZACIÓN SEGURA" : "NEXT SAFE REFRESH"}</span>
                <strong>{nextRefreshTimestamp}</strong>
                <b>{refreshUnlocked ? (lang === "es" ? "DISPONIBLE AHORA" : "AVAILABLE NOW") : `${lang === "es" ? "EN" : "IN"} ${refreshCountdown}`}</b>
              </div>
              <p>{snapshotAgeMinutes == null
                ? (lang === "es" ? "PENDIENTE DE LA PRIMERA CARGA. Las fechas aparecerán cuando exista una instantánea válida." : "AWAITING THE FIRST LOAD. Dates will appear when a valid snapshot exists.")
                : snapshotNeedsRefresh
                  ? (lang === "es" ? `La edición diaria tiene ${Math.floor(snapshotAgeMinutes / 60)} h. La próxima lectura solicitará una edición nueva; mientras tanto se conserva esta copia verificada.` : `The daily edition is ${Math.floor(snapshotAgeMinutes / 60)} h old. The next read will request a new edition; this verified copy remains available meanwhile.`)
                  : (lang === "es" ? `Edición principal de las 12:00 (hora española). Cada navegador puede pedir una comparación con su estado anterior cada 30 minutos.` : `Main edition at 12:00 Spain time. Each browser can request a comparison with its previous state every 30 minutes.`)}</p>
            </div>
            {refreshNotice && <div className={`refresh-notice ${refreshNotice.includes("failed") || refreshNotice.includes("No se") ? "error" : ""}`} role="status" aria-live="polite">{refreshNotice}</div>}
          </div>
          <article className="regime-card">
            <div className="card-top"><span>{t.regime}</span><span className="status">{regimeStatus}</span></div>
            <div className="score-row">
              <button className="score-ring" type="button" onClick={openCycleMethodology} style={{"--risk": `${modelAvailable ? cycleScore * 3.6 : 0}deg`} as React.CSSProperties} aria-label={lang === "es" ? "Abrir la metodología del índice" : "Open index methodology"} aria-describedby="regime-summary"><strong>{modelAvailable ? cycleScore : "—"}</strong></button>
              <div><span>{t.risk}</span><b>{t.confidence}: {data.provenance.modelInputsAvailable ?? 0}/{data.provenance.modelInputsTotal ?? 14} {lang === "es" ? "ENTRADAS" : "INPUTS"}</b></div>
            </div>
            <div className="score-adaptive" id="regime-summary">
              <span>{modelAvailable ? `${cycle.range} · ${cycle.title}${modelProvisional ? " · PROVISIONAL" : ""}` : (lang === "es" ? "MODELO NO CALCULADO" : "MODEL NOT CALCULATED")}</span>
              <p>{modelAvailable
                ? modelProvisional
                  ? (lang === "es" ? `${cycle.body} Lectura reponderada con los motores completos disponibles; la ausencia no se convierte en cero ni en señal neutral.` : `${cycle.body} Reweighted from complete available engines; missing data is not converted into zero or a neutral signal.`)
                  : cycle.body
                : (lang === "es" ? "No hay cobertura suficiente para una lectura responsable. Los paneles con datos verificados siguen disponibles y los huecos quedan identificados." : "Coverage is too low for a responsible reading. Panels with verified data remain available and gaps are identified.")}</p>
              <div className="method-cta-row">
                <button type="button" onClick={openCycleMethodology}>{lang === "es" ? "Ver cálculo, pesos y fuentes" : "See calculation, weights & sources"} ↓</button>
                <a href="/api/data-manifest" target="_blank" rel="noreferrer" aria-label={lang === "es" ? "Abrir metodología directa en una pestaña nueva" : "Open direct methodology in a new tab"}>{lang === "es" ? "Metodología directa" : "Direct methodology"} ↗</a>
              </div>
            </div>
            <small>{t.updated}: {snapshotDate ? `${snapshotDate.toISOString().replace("T"," ").slice(0,19)} UTC` : "—"} · {data.provenance.fredAvailable ?? 0}/{data.provenance.fredTotal ?? 0} {lang === "es" ? "SERIES MACRO" : "MACRO SERIES"}</small>
          </article>
        </div>
      </section>

      <section className="market-tape-wrap" aria-labelledby="market-tape-title">
        <div className="market-tape-heading">
          <div><span>{lang === "es" ? "PULSO DE MERCADO · 6 SERIES" : "MARKET PULSE · 6 SERIES"}</span><h2 id="market-tape-title">{lang === "es" ? "Última observación verificada" : "Latest verified observation"}</h2></div>
          <p>{lang === "es" ? "Las fechas no están sincronizadas: cada tarjeta declara su propia vigencia, frecuencia y fuente." : "Dates are not synchronized: every card declares its own freshness, frequency and source."}</p>
        </div>
        <div className="market-tape">
          {tape.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.name} aria-label={lang === "es" ? `${item.name}: ${item.value}; ${item.status}; observado ${item.date}; fuente ${item.source}. Abrir evidencia en una pestaña nueva.` : `${item.name}: ${item.value}; ${item.status}; observed ${item.date}; source ${item.source}. Open evidence in a new tab.`}>
            <span>{item.name}</span>
            <strong>{item.value}</strong>
            <small className="tape-unit">{item.unit}</small>
            <div className="tape-meta"><small className={`tape-state ${item.state}`}>{item.status}</small><time dateTime={item.date === "—" ? undefined : item.date}>{item.date}</time></div>
            <small className="tape-source">{item.source} <i aria-hidden="true">↗</i></small>
          </a>)}
        </div>
        <div className="market-definitions">
          <p><b>{lang === "es" ? "DÓLAR 120,08 ≠ 120 USD." : "DOLLAR 120.08 ≠ USD 120."}</b> {lang === "es"
            ? "Es el índice amplio del dólar ponderado por comercio. El nivel 100 corresponde a enero de 2006; 120,08 indica que el índice está aproximadamente un 20,08% por encima de aquella base, no un cambio frente a una sola divisa."
            : "It is the trade-weighted broad dollar index. A level of 100 corresponds to January 2006; 120.08 means the index is roughly 20.08% above that base, not an exchange rate against one currency."}</p>
          <p><b>WTI</b> {lang === "es"
            ? "significa West Texas Intermediate: crudo ligero de referencia en Estados Unidos. Su cotización se expresa en dólares por barril."
            : "means West Texas Intermediate: a benchmark light crude oil price in the United States, quoted in dollars per barrel."}</p>
          <p><b>{lang === "es" ? "DEUDA: DATO Y ESTIMACIÓN NO SON LO MISMO." : "DEBT: OBSERVATION AND ESTIMATE ARE NOT THE SAME."}</b> {lang === "es"
            ? "Se prioriza la cifra diaria del Tesoro; cuando no está disponible, el respaldo del Banco Mundial estima anualmente deuda pública sobre PIB nominal y queda marcado como tal."
            : "The daily Treasury figure is preferred; when unavailable, the World Bank fallback annually estimates public debt from its debt ratio and nominal GDP, and is labelled accordingly."}</p>
        </div>
        <div className={`bitcoin-consensus ${bitcoinConsensus}`} aria-labelledby="bitcoin-quality-title">
          <div>
            <span>{lang === "es" ? "BITCOIN · CALIDAD DEL PRECIO" : "BITCOIN · PRICE QUALITY"}</span>
            <strong id="bitcoin-quality-title">{bitcoinConsensus === "confirmed"
              ? (lang === "es" ? "CONFIRMADO POR DOS MERCADOS" : "CONFIRMED BY TWO VENUES")
              : bitcoinConsensus === "divergent"
                ? (lang === "es" ? "MERCADOS DIVERGENTES" : "VENUES DIVERGE")
                : bitcoinConsensus === "single-source"
                  ? (lang === "es" ? "UNA FUENTE DISPONIBLE" : "ONE SOURCE AVAILABLE")
                  : (lang === "es" ? "PRECIO NO DISPONIBLE" : "PRICE UNAVAILABLE")}</strong>
          </div>
          <p>{bitcoinConsensus === "confirmed"
            ? (lang === "es" ? `Coinbase y Kraken coinciden; se muestra su punto medio${data.bitcoin.priceSpreadPercent == null ? "." : ` con una diferencia del ${format(data.bitcoin.priceSpreadPercent)}%.`}` : `Coinbase and Kraken agree; their midpoint is shown${data.bitcoin.priceSpreadPercent == null ? "." : ` with a ${format(data.bitcoin.priceSpreadPercent)}% spread.`}`)
            : bitcoinConsensus === "divergent"
              ? (lang === "es" ? `La diferencia es ${format(data.bitcoin.priceSpreadPercent)}%; se conserva la lectura primaria y se avisa.` : `The spread is ${format(data.bitcoin.priceSpreadPercent)}%; the primary reading is retained and flagged.`)
              : bitcoinConsensus === "single-source"
                ? (lang === "es" ? "El precio es utilizable, pero aún no tiene confirmación independiente." : "The price is usable but does not yet have independent confirmation.")
                : (lang === "es" ? "No inventamos ni reciclamos una cotización como si fuera actual." : "No quote is invented or recycled as if it were current.")}</p>
          <div className="provider-health"><span>{lang === "es" ? "PROVEEDORES" : "PROVIDERS"}</span><b>{upstreamReady} {lang === "es" ? "ACTIVOS" : "READY"} · {upstreamCooling} {lang === "es" ? "EN PAUSA" : "COOLING"}</b><div className="provider-links"><a href="https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker" target="_blank" rel="noreferrer">Coinbase ↗</a><a href="https://docs.kraken.com/api-reference/market-data/get-ticker-information" target="_blank" rel="noreferrer">Kraken ↗</a><a href="/api/health" target="_blank" rel="noreferrer">{lang === "es" ? "Estado técnico" : "Technical status"} ↗</a></div></div>
        </div>
      </section>

      <section className="return-desk" aria-labelledby="return-title">
        <div className="return-heading">
          <div>
            <span className="kicker">RETURN DESK · {lang === "es" ? "MEMORIA LOCAL" : "LOCAL MEMORY"}</span>
            <h2 id="return-title">{visitBaseline ? (lang === "es" ? "Qué cambió desde tu última visita." : "What changed since your last visit.") : (lang === "es" ? "Tu próximo regreso empieza aquí." : "Your next return starts here.")}</h2>
          </div>
          <p>{lang === "es"
            ? "ABCM guarda únicamente en este dispositivo un punto de comparación y tus indicadores elegidos. No crea una cuenta, no envía preferencias al servidor y no transforma cambios en recomendaciones."
            : "ABCM stores only on this device a comparison point and your chosen indicators. It creates no account, sends no preferences to the server and turns no change into a recommendation."}</p>
        </div>
        <div className="return-grid">
          <article className="visit-brief">
            <div className="visit-title">
              <span>{lang === "es" ? "BRIEFING DE 60 SEGUNDOS" : "60-SECOND BRIEFING"}</span>
              <div className="visit-meta"><b>{visitStatusLabel}</b>{visitBaseline && baselineDateLabel && <time dateTime={visitBaseline.capturedAt}>{lang === "es" ? "Base" : "Baseline"}: {baselineDateLabel}</time>}</div>
            </div>
            <div className="change-cells" role="list" aria-label={lang === "es" ? "Cambios desde el punto de comparación" : "Changes since the comparison baseline"}>
              <div role="listitem"><span>{lang === "es" ? "RÉGIMEN" : "REGIME"}</span><strong>{regimeChanged ? (lang === "es" ? "CAMBIÓ" : "CHANGED") : visitBaseline ? (lang === "es" ? "SIN CAMBIO" : "UNCHANGED") : "—"}</strong><small>{regime.title}</small></div>
              <div role="listitem"><span>{lang === "es" ? "ÍNDICE" : "INDEX"}</span><strong>{compositeDelta == null ? "—" : `${compositeDelta >= 0 ? "+" : ""}${compositeDelta}`}</strong><small>{modelAvailable ? `${cycleScore}/100` : (lang === "es" ? "No calculado" : "Withheld")}</small></div>
              <div role="listitem"><span>{lang === "es" ? "NUEVAS PUBLICACIONES" : "NEW RELEASES"}</span><strong>{releasedSinceVisit ?? "—"}</strong><small>{lang === "es" ? "Series con una fecha nueva" : "Series with a new date"}</small></div>
              <div role="listitem"><span>BITCOIN</span><strong>{bitcoinDelta == null ? "—" : `${bitcoinDelta >= 0 ? "+" : ""}${marketFormat(bitcoinDelta, lang)}%`}</strong><small>{lang === "es" ? "Desde el punto guardado" : "Since saved baseline"}</small></div>
            </div>
            {!visitBaseline && <p className={`baseline-note ${baselineSavedThisVisit ? "saved" : ""}`} role="status" aria-live="polite">{baselineSavedThisVisit
              ? (lang === "es" ? "Punto de comparación guardado en este dispositivo. Los cambios aparecerán aquí cuando regreses." : "Comparison baseline saved on this device. Changes will appear here when you return.")
              : loading
                ? (lang === "es" ? "Preparando el primer punto de comparación con datos verificados…" : "Preparing the first comparison baseline with verified data…")
                : (lang === "es" ? "No se pudo guardar un punto de comparación en este dispositivo; el monitor sigue funcionando sin memoria local." : "A comparison baseline could not be saved on this device; the monitor still works without local memory.")}</p>}
            <div className="brief-reading">
              <b>{lang === "es" ? "LECTURA CONDICIONAL ACTUAL" : "CURRENT CONDITIONAL READING"}</b>
              <p>{modelAvailable
                ? (lang === "es"
                  ? `${regime.body} La mayor presión está en ${strongest.label.toLowerCase()} (${strongest.score}/100) y la menor en ${weakest.label.toLowerCase()} (${weakest.score}/100).`
                  : `${regime.body} Highest pressure sits in ${strongest.label.toLowerCase()} (${strongest.score}/100), lowest in ${weakest.label.toLowerCase()} (${weakest.score}/100).`)
                : (lang === "es" ? "No existe cobertura suficiente para resumir el régimen. Revisa las fuentes o solicita una actualización." : "Coverage is insufficient to summarize the regime. Check sources or request a refresh.")}</p>
            </div>
            <div className="return-actions"><button type="button" onClick={() => load(true, true)} disabled={loading || !refreshUnlocked}>↻ {refreshUnlocked ? t.refresh : refreshCountdown}</button><a href={`/learn?lang=${lang}`}>{lang === "es" ? "Comprender la lectura" : "Understand the reading"} →</a></div>
          </article>
          <aside className="personal-watch" aria-labelledby="watch-title">
            <div><span id="watch-title">{lang === "es" ? "MI RADAR · EN ESTE DISPOSITIVO" : "MY RADAR · ON THIS DEVICE"}</span><b>{watchlist.length}/4</b></div>
            <p>{lang === "es" ? "Elige hasta cuatro variables para encontrarlas juntas cuando vuelvas." : "Choose up to four variables to find together when you return."}</p>
            <div className="watch-picker" role="group" aria-labelledby="watch-title" aria-describedby="watch-limit">{watchChoices.map((item) => {
              const selected = watchlist.includes(item.key);
              return <button type="button" className={selected ? "active" : ""} onClick={() => toggleWatch(item.key)} key={item.key} aria-pressed={selected} disabled={!selected && watchlist.length >= 4}>{selected ? "✓ " : "+ "}{item.label}</button>;
            })}</div>
            <p className={`watch-limit ${watchlist.length >= 4 ? "full" : ""}`} id="watch-limit" role="status" aria-live="polite">{watchlist.length >= 4
              ? (lang === "es" ? "Límite alcanzado: desmarca una variable para añadir otra." : "Limit reached: deselect one variable to add another.")
              : (lang === "es" ? `${4 - watchlist.length} ${4 - watchlist.length === 1 ? "hueco disponible" : "huecos disponibles"}.` : `${4 - watchlist.length} ${4 - watchlist.length === 1 ? "slot" : "slots"} available.`)}</p>
            <div className={`watch-values count-${watchlist.length}`} role="list" aria-label={lang === "es" ? "Variables seleccionadas" : "Selected variables"}>{watchChoices.filter((item) => watchlist.includes(item.key)).map((item) => <div key={item.key} role="listitem">
              <span>{item.label}</span><strong>{item.value}</strong><small>{item.unit}</small><div className="watch-observation"><span className={`watch-state ${item.state}`}>{item.status}</span><time dateTime={item.date === "—" ? undefined : item.date}>{item.date}</time></div>
            </div>)}</div>
            <small>{lang === "es" ? "Las fechas corresponden a cada fuente; no todas las series se publican diariamente." : "Dates belong to each source; not every series is released daily."}</small>
          </aside>
        </div>
      </section>

      <section className="proof-section" aria-labelledby="proof-title">
        <div className="proof-heading">
          <div><span className="kicker">{lang === "es" ? "PRUEBA DE TRABAJO · ARQUITECTURA DE CONFIANZA" : "PROOF OF WORK · TRUST ARCHITECTURE"}</span><h2 id="proof-title">{lang === "es" ? "No confíes en el dashboard. Verifícalo." : "Do not trust the dashboard. Verify it."}</h2></div>
          <p>{lang === "es" ? "ABCM enseña su cadena de suministro, los huecos de datos y cómo reproducir el resultado. Un fallo visible es preferible a una cifra convincente pero inventada." : "ABCM exposes its supply chain, data gaps and reproducibility path. A visible failure is better than a convincing invented number."}</p>
        </div>
        <div className="proof-grid">
          <a href="/api/health" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? `Estado de fuentes: ${macroAvailable} de ${macroTotal} series macro disponibles. Abrir estado técnico en una pestaña nueva.` : `Source health: ${macroAvailable} of ${macroTotal} macro series available. Open technical status in a new tab.`}>
            <div className="proof-card-head"><span>01 · {lang === "es" ? "ESTADO DE FUENTES" : "SOURCE HEALTH"}</span><i className={`proof-card-state ${sourceHealthState}`}>{sourceHealthState === "ok" ? (lang === "es" ? "COMPLETO" : "COMPLETE") : sourceHealthState === "partial" ? (lang === "es" ? "PARCIAL" : "PARTIAL") : (lang === "es" ? "SIN COBERTURA" : "NO COVERAGE")}</i></div>
            <div className="proof-value"><strong>{macroAvailable}/{macroTotal}</strong><small>{lang === "es" ? "SERIES MACRO" : "MACRO SERIES"}</small></div>
            <p>{lang === "es" ? `${upstreamReady}/${upstreamTotal} proveedores listos · ${upstreamRecovering} reintentando · ${upstreamCooling} en pausa.` : `${upstreamReady}/${upstreamTotal} providers ready · ${upstreamRecovering} retrying · ${upstreamCooling} cooling down.`}</p><b>{lang === "es" ? "Abrir estado" : "Open status"} ↗</b>
          </a>
          <a href="/api/data-manifest" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? `Contrato de datos, esquema ${DATA_SCHEMA_VERSION}. Abrir contrato técnico en una pestaña nueva.` : `Data contract, schema ${DATA_SCHEMA_VERSION}. Open the technical contract in a new tab.`}>
            <div className="proof-card-head"><span>02 · {lang === "es" ? "CONTRATO DE DATOS" : "DATA CONTRACT"}</span><i className="proof-card-state ok">{lang === "es" ? "VIGENTE" : "CURRENT"}</i></div>
            <div className="proof-value"><strong>v{DATA_SCHEMA_VERSION}</strong><small>SCHEMA</small></div>
            <p>{lang === "es" ? "Entradas, fórmulas, pesos, límites y reglas de publicación." : "Inputs, formulas, weights, limits and publication rules."}</p><b>{lang === "es" ? "Abrir contrato" : "Open contract"} ↗</b>
          </a>
          <a href="/api/data" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? `Salida pública JSON, esquema ${DATA_SCHEMA_VERSION}. Abrir datos en una pestaña nueva.` : `Public JSON output, schema ${DATA_SCHEMA_VERSION}. Open data in a new tab.`}>
            <div className="proof-card-head"><span>03 · {lang === "es" ? "SALIDA PORTABLE" : "PORTABLE OUTPUT"}</span><i className={`proof-card-state ${portableOutputState}`}>{portableOutputState === "ok" ? (lang === "es" ? "DISPONIBLE" : "AVAILABLE") : (lang === "es" ? "SIN DATOS" : "NO DATA")}</i></div>
            <div className="proof-value"><strong>JSON</strong><small>v{DATA_SCHEMA_VERSION}</small></div>
            <p>{lang === "es" ? "Instantánea reutilizable con observaciones, procedencia y cálculos." : "Reusable snapshot with observations, provenance and calculations."}</p><b>{lang === "es" ? "Abrir datos" : "Open data"} ↗</b>
          </a>
          <a href={`${SOURCE_MIRROR.repository}/tree/master/${SOURCE_MIRROR.path}`} target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Código fuente mantenido de ABCM, licencia MIT. Abrir repositorio en una pestaña nueva." : "Maintained ABCM source code, MIT licence. Open repository in a new tab."}>
            <div className="proof-card-head"><span>04 · {lang === "es" ? "COMPILACIÓN REPRODUCIBLE" : "REPRODUCIBLE BUILD"}</span><i className="proof-card-state ok">{lang === "es" ? "CÓDIGO ABIERTO" : "OPEN SOURCE"}</i></div>
            <div className="proof-value"><strong>MIT</strong><small>SITES-CURRENT</small></div>
            <p>{lang === "es" ? "Código, pruebas y guía para ejecutar el mismo monitor localmente." : "Code, tests and guidance to run the same monitor locally."}</p><b>{lang === "es" ? "Abrir código" : "Open source"} ↗</b>
          </a>
        </div>
        <p className="proof-help">{lang === "es" ? "Los tres primeros enlaces abren respuestas JSON técnicas; el cuarto lleva directamente al código mantenido de esta versión." : "The first three links open technical JSON responses; the fourth goes directly to this version’s maintained source."}</p>
      </section>

      <section className="engine-section" id="engine" aria-labelledby="engine-title">
        <div className="section-head">
          <div>
            <span className="kicker">{lang === "es" ? "00 · MOTOR DE INTERPRETACIÓN ACTUAL" : "00 · LIVE INTERPRETATION ENGINE"}</span>
            <h2 id="engine-title">{lang === "es" ? "Los datos hablan entre sí." : "The data speak to each other."}</h2>
            <p>{lang === "es" ? "Diez franjas separan dinero, tipos, crédito, curva, producción, empleo, precios, recursos y deuda. Cada cifra conduce a una lectura condicional; ninguna señal aislada pretende demostrar el ciclo." : "Ten bands separate money, rates, credit, the curve, production, labour, prices, resources and debt. Every figure leads to a conditional reading; no isolated signal claims to prove the cycle."}</p>
          </div>
          <div className={`engine-badge ${engineCoverageState}`} role="status" aria-live="polite">
            <span>{lang === "es" ? "COBERTURA DEL MOTOR" : "ENGINE COVERAGE"}</span>
            <b>{readySignalCount}/{scoreComponents.length} {lang === "es" ? "SEÑALES" : "SIGNALS"} · {engineCoverageLabel}</b>
            <small>{lang === "es" ? "EDICIÓN DIARIA · ACTUALIZACIÓN MANUAL CADA 15 MIN" : "DAILY EDITION · MANUAL UPDATE EVERY 15 MIN"}</small>
          </div>
        </div>
        <div className="score-strip" role="group" aria-label={lang === "es" ? "Diez señales clicables del motor de interpretación" : "Ten clickable interpretation-engine signals"}>
          {scoreComponents.map((item) => {
            const signalReading = engineReading(item.parent, item.score, lang);
            const weightLabel = `${format(item.weight * 100, 0)}%`;
            const accessibleState = item.ready
              ? (lang === "es" ? `Puntuación ${item.score} sobre 100. ${signalReading.range}.` : `Score ${item.score} out of 100. ${signalReading.range}.`)
              : (lang === "es" ? `Sin cobertura. Requiere ${item.inputs}.` : `No coverage. Requires ${item.inputs}.`);
            return <button
              type="button"
              key={item.key}
              className={item.ready ? "ready" : "unavailable"}
              onClick={(event) => showSignal(item, event.currentTarget)}
              aria-haspopup="dialog"
              aria-controls="detail-dialog"
              aria-expanded={detail?.title === item.label}
              aria-label={`${item.label}. ${accessibleState} ${lang === "es" ? `Peso base ${weightLabel}. Abrir explicación.` : `Base weight ${weightLabel}. Open explanation.`}`}
            >
              <div className="score-card-head"><span>{item.label}</span><b>{item.ready ? item.score : "—"}</b></div>
              <div className="score-card-meta">
                <span className={`score-card-state ${item.ready ? "ready" : "unavailable"}`}>{item.ready ? signalReading.range : (lang === "es" ? "SIN COBERTURA" : "NO COVERAGE")}</span>
                <span>{weightLabel} {lang === "es" ? "PESO BASE" : "BASE WEIGHT"}</span>
              </div>
              <div className="engine-bar" aria-hidden="true"><i style={{ width: `${item.ready ? item.score : 0}%` }} /></div>
              <small>{item.ready ? item.observed : `${lang === "es" ? "Requiere" : "Requires"}: ${item.inputs}`}</small>
              <em>{item.ready ? (lang === "es" ? "Interpretar" : "Interpret") : (lang === "es" ? "Ver estado" : "View status")} ↗</em>
            </button>;
          })}
        </div>
        <article className="cycle-methodology" id="cycle-methodology" tabIndex={-1} aria-labelledby="cycle-methodology-title" aria-describedby="cycle-methodology-summary">
          <div className="method-head">
            <div>
              <span className="kicker">{lang === "es" ? `METODOLOGÍA ABIERTA · ESQUEMA ${DATA_SCHEMA_VERSION}` : `OPEN METHODOLOGY · SCHEMA ${DATA_SCHEMA_VERSION}`}</span>
              <h3 id="cycle-methodology-title">{modelAvailable ? (lang === "es" ? `Por qué el índice marca ${cycleScore}/100` : `Why the index reads ${cycleScore}/100`) : (lang === "es" ? "Por qué el índice no publica una cifra" : "Why the index is withholding a score")}</h3>
              <p id="cycle-methodology-summary">{modelAvailable
                ? modelProvisional
                  ? (lang === "es" ? `Estimación provisional: ${readySignalCount}/10 señales verificadas suman el ${availableWeightPercent}% del peso base. Solo esas señales se normalizan al 100%; ninguna ausencia recibe valor cero.` : `Provisional estimate: ${readySignalCount}/10 verified signals provide ${availableWeightPercent}% of base weight. Only those signals are normalized to 100%; no missing value is assigned zero.`)
                  : cycle.body
                : (lang === "es" ? `El cálculo se retiene: ${readySignalCount}/10 señales verificadas suman el ${availableWeightPercent}% del peso base y se exige al menos un 70%. Las señales disponibles siguen siendo auditables.` : `The calculation is withheld: ${readySignalCount}/10 verified signals provide ${availableWeightPercent}% of base weight, below the required 70%. Available signals remain auditable.`)}</p>
            </div>
            <div className="method-aside">
              <div className={`method-status ${engineCoverageState}`} role="status">
                <span>{lang === "es" ? "REGLA DE PUBLICACIÓN" : "PUBLICATION RULE"}</span>
                <strong>{engineCoverageState === "complete"
                  ? (lang === "es" ? "100% · COMPLETO" : "100% · COMPLETE")
                  : engineCoverageState === "provisional"
                    ? `${availableWeightPercent}% · ${lang === "es" ? "PROVISIONAL" : "PROVISIONAL"}`
                    : `${availableWeightPercent}% < 70% · ${lang === "es" ? "RETENIDO" : "WITHHELD"}`}</strong>
                <small>{readySignalCount}/10 {lang === "es" ? "señales" : "signals"} · {modelInputsAvailable}/{modelInputsTotal} {lang === "es" ? "entradas" : "inputs"}</small>
              </div>
              <div className="method-warning">
                <b>{lang === "es" ? "QUÉ NO ES" : "WHAT IT IS NOT"}</b>
                <span>{lang === "es" ? "No es una probabilidad de recesión, una señal de compra/venta ni una fecha de crash. Es una puntuación experimental de presión cíclica." : "It is not a recession probability, a buy/sell signal or a crash timer. It is an experimental cycle-pressure score."}</span>
              </div>
            </div>
          </div>
          <div className="score-equation" role="list" aria-label={lang === "es" ? "Cálculo de las diez señales y sus pesos" : "Ten-signal calculation and weights"}>
            {scoreComponents.map((item) => {
              const appliedWeight = modelAvailable && modelProvisional && item.ready ? item.effectiveWeight : item.weight;
              const included = modelAvailable && item.ready;
              const componentState = !item.ready
                ? (lang === "es" ? "SIN COBERTURA" : "NO COVERAGE")
                : included
                  ? (lang === "es" ? "INCLUIDA" : "INCLUDED")
                  : (lang === "es" ? "VERIFICADA · ÍNDICE RETENIDO" : "VERIFIED · INDEX WITHHELD");
              return <div className={item.ready ? "available" : "unavailable"} key={item.key} role="listitem">
                <div className="equation-head"><span>{item.label}</span><b>{format(item.weight * 100, 0)}% {lang === "es" ? "BASE" : "BASE"}</b></div>
                <small>{lang === "es" ? "Entradas" : "Inputs"}: {item.inputs}</small>
                <div className="equation-math"><strong>{item.ready ? item.score : "—"}</strong><span>× {format(appliedWeight * 100, 1)}%</span></div>
                <div className="contribution" aria-hidden="true"><i style={{ width: `${item.ready ? item.score : 0}%` }} /></div>
                <div className="equation-state"><em>{componentState}</em><span>{included ? `+${format(item.score * appliedWeight, 1)} pt` : "—"}</span></div>
              </div>;
            })}
          </div>
          <div className={`formula-total ${engineCoverageState}`} role="status" aria-label={lang === "es" ? "Resultado del índice compuesto" : "Composite index result"}>
            <div><span>{lang === "es" ? "RESULTADO COMPUESTO" : "COMPOSITE RESULT"}</span><code>{!modelAvailable
              ? (lang === "es" ? `IDC retenido · ${availableWeightPercent}% de peso verificable < 70% requerido` : `CDI withheld · ${availableWeightPercent}% verified weight < 70% required`)
              : modelProvisional
                ? (lang === "es" ? "IDC provisional = Σ(señal disponible × peso reponderado)" : "Provisional CDI = Σ(available signal × reweighted share)")
                : lang === "es"
                  ? "IDC = MONEY×.14 + STANCE×.13 + RISK×.13 + CURVE×.10 + PROD×.12 + LAB×.08 + CPI×.09 + RES×.06 + BURDEN×.09 + FISC×.06"
                  : "CDI = MONEY×.14 + STANCE×.13 + RISK×.13 + CURVE×.10 + PROD×.12 + LAB×.08 + CPI×.09 + RES×.06 + BURDEN×.09 + FISC×.06"}</code></div>
            <strong>{modelAvailable ? `= ${cycleScore}/100` : (lang === "es" ? "NO PUBLICADO" : "NOT PUBLISHED")}</strong>
          </div>
          <div className="pillar-lineage">
            <b>{lang === "es" ? "MARCO OPERATIVO DE ABCM" : "ABCM OPERATIONAL FRAMEWORK"}</b>
            <p>{lang === "es"
              ? "Política monetaria → Mercados de crédito → Economía real. ABCM usa esta agrupación como estructura analítica propia e incorpora inflación y fiscalidad como capas transversales. No atribuimos su autoría, la fórmula ni el índice a José Luis Cava ni a ninguna de las influencias citadas."
              : "Monetary policy → Credit markets → Real economy. ABCM uses this grouping as its own analytical structure and adds inflation and fiscal conditions as cross-cutting layers. We do not attribute its authorship, formula or index to José Luis Cava or any cited influence."}</p>
            <a href="https://github.com/JimBLogic/AustrianBusinessCycleMonitor/commit/0acc1a2deb695d167e302c81966344056fb75189" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir la versión original del marco ABCM en una pestaña nueva" : "Open the original ABCM framework version in a new tab"}>{lang === "es" ? "Ver versión original del marco" : "See original framework version"} ↗</a>
          </div>
          <div className="band-scale" role="list" aria-label={lang === "es" ? "Bandas de interpretación del índice" : "Index interpretation bands"}>
            {cycle.bands.map((band) => {
              const copy = band[lang];
              const active = modelAvailable && band.range === cycle.range;
              return <div className={active ? "active" : ""} key={band.range} role="listitem" aria-current={active ? "true" : undefined}><b>{band.range}</b><span>{copy[0]}</span></div>;
            })}
          </div>
          <p className={`band-caption ${modelAvailable ? "published" : "withheld"}`}>{modelAvailable
            ? (lang === "es" ? `${modelProvisional ? "Banda provisional" : "Banda activa"}: ${cycle.range} · ${cycle.title}.` : `${modelProvisional ? "Provisional band" : "Active band"}: ${cycle.range} · ${cycle.title}.`)
            : (lang === "es" ? "Ninguna banda se activa hasta que el índice cumple la regla de publicación." : "No band becomes active until the index meets the publication rule.")}</p>
          <div className="method-links">
            <a href="/api/data-manifest" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir el manifiesto técnico en una pestaña nueva" : "Open the technical manifest in a new tab"}>{lang === "es" ? "Manifiesto técnico" : "Technical manifest"} ↗</a>
            <a href={`${SOURCE_MIRROR.repository}/commits/master/${SOURCE_MIRROR.path}`} target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir el historial mantenido de la metodología en una pestaña nueva" : "Open the maintained methodology history in a new tab"}>{lang === "es" ? "Historial mantenido" : "Maintained history"} ↗</a>
            <a href="#sources">{lang === "es" ? "Fuentes de cada variable" : "Sources for every input"} ↓</a>
          </div>
        </article>
        <article className="discrimination-test" aria-labelledby="discrimination-title" aria-describedby="discrimination-summary discrimination-scope">
          <div className="test-heading">
            <div><span className="kicker">{lang === "es" ? "MATRIZ CONTRAFACTUAL · 4 CASOS" : "COUNTERFACTUAL MATRIX · 4 CASES"}</span><h3 id="discrimination-title">{lang === "es" ? "Cuatro shocks. Cuatro respuestas esperadas." : "Four shocks. Four expected responses."}</h3><p id="discrimination-summary">{lang === "es" ? "La matriz mantiene constantes las demás familias y cambia una cada vez. Comprueba si la metodología declarada distingue la capa afectada, explica la transmisión y define qué evidencia refutaría cada lectura." : "The matrix holds other families constant and changes one at a time. It checks whether the documented methodology distinguishes the affected layer, explains transmission and defines what evidence would falsify each reading."}</p></div>
            <div className="test-verdict"><span>{lang === "es" ? "ESTADO" : "STATUS"}</span><strong>{lang === "es" ? "MATRIZ DOCUMENTADA" : "DOCUMENTED MATRIX"}</strong><small>{lang === "es" ? "4 escenarios · sin ejecución automática" : "4 scenarios · no automated execution"}</small></div>
          </div>
          <div className="test-scope" id="discrimination-scope"><b>{lang === "es" ? "ALCANCE" : "SCOPE"}</b><span>{lang === "es" ? "Es una prueba conceptual de consistencia, no evidencia causal ni un backtest estadístico. El PPI se usa como contraste aguas arriba, pero todavía no forma parte de las diez señales calculadas por el índice." : "This is a conceptual consistency test, not causal evidence or a statistical backtest. PPI is used as an upstream contrast, but it is not currently one of the index’s ten calculated signals."}</span></div>
          <div className="test-tabs" role="tablist" aria-label={lang === "es" ? "Escenarios de prueba" : "Test scenarios"}>
            {discriminationScenarios.map((scenario, index) => <button
              ref={(element) => { diagnosticTabRefs.current[index] = element; }}
              id={`diagnostic-tab-${scenario.key}`}
              key={scenario.key}
              type="button"
              role="tab"
              aria-selected={diagnosticScenario === index}
              aria-controls="diagnostic-panel"
              tabIndex={diagnosticScenario === index ? 0 : -1}
              className={diagnosticScenario === index ? "active" : ""}
              onClick={() => setDiagnosticScenario(index)}
              onKeyDown={(event) => handleDiagnosticTabKey(event, index)}
            ><span>0{index + 1}</span><b>{scenario.short}</b><small>{scenario.title[lang === "en" ? 0 : 1]}</small></button>)}
          </div>
          {(() => { const scenario = discriminationScenarios[diagnosticScenario]; const i = lang === "en" ? 0 : 1; return <div className="test-output" id="diagnostic-panel" role="tabpanel" aria-labelledby={`diagnostic-tab-${scenario.key}`} aria-live="polite" tabIndex={0}>
            <div className="test-case-meta"><span>{lang === "es" ? `CASO 0${diagnosticScenario + 1} DE 04` : `CASE 0${diagnosticScenario + 1} OF 04`}</span><b>{scenario.layer[i]}</b><em>{lang === "es" ? "CRITERIO DOCUMENTADO" : "DOCUMENTED EXPECTATION"}</em></div>
            <div className="test-input"><span>{lang === "es" ? "ENTRADA CONTROLADA" : "CONTROLLED INPUT"}</span><strong>{scenario.input[i]}</strong><small>{lang === "es" ? "Las demás familias permanecen constantes para aislar el mecanismo." : "Other families remain constant to isolate the mechanism."}</small></div>
            <div className="test-diagnosis"><div><span>{lang === "es" ? "CLASIFICACIÓN ESPERADA" : "EXPECTED CLASSIFICATION"}</span><strong>{scenario.classification[i]}</strong><b>{lang === "es" ? "ESPERADO" : "EXPECTED"}</b></div><p>{scenario.mechanism[i]}</p></div>
            <div className="test-checks"><div><span>{lang === "es" ? "SECUENCIA / RETARDO" : "SEQUENCE / LAG"}</span><p>{scenario.lag[i]}</p></div><div><span>{lang === "es" ? "QUÉ LO REFUTARÍA" : "WHAT WOULD FALSIFY IT"}</span><p>{scenario.falsifier[i]}</p></div><div><span>{lang === "es" ? "NO CONFUNDIR CON" : "DO NOT CONFUSE WITH"}</span><p>{scenario.notThis[i]}</p></div></div>
          </div>; })()}
          <div className="test-rule"><b>{lang === "es" ? "REGLA DE EVALUACIÓN" : "EVALUATION RULE"}</b><span>{lang === "es" ? "La metodología no supera este criterio si dos escenarios desembocan en la misma narración o en una simple dirección de mercado, aunque la puntuación compuesta coincida." : "The methodology does not meet this criterion if two scenarios collapse into the same narrative or a simple market direction, even when the composite score matches."}</span></div>
        </article>
        <div className="engine-grid">
          <article className="mix-panel" aria-labelledby="normalized-title">
            <div className="panel-title"><div><span className="kicker">{lang === "es" ? "COMPARADOR NORMALIZADO" : "NORMALIZED COMPARATOR"}</span><h3 id="normalized-title">{lang === "es" ? "Liquidez, activos y dinero duro" : "Liquidity, assets & hard money"}</h3></div><b>{lang === "es" ? "MES COMÚN · BASE 100" : "COMMON MONTH · BASE 100"}</b></div>
            <p className="mix-intro" id="mix-controls-help">{lang === "es" ? "Activa las series que quieras contrastar. La última serie activa se mantiene para evitar un gráfico sin referencia." : "Choose the series to compare. The final active series stays selected so the chart always retains a reference."}</p>
            <div className="mix-controls" role="group" aria-label={lang === "es" ? "Series del comparador" : "Comparator series"} aria-describedby="mix-controls-help">{Object.keys(mixMeta).map((key) => {
              const active = selectedMix.includes(key);
              const isLast = active && selectedMix.length === 1;
              return <button key={key} type="button" className={active ? "active" : ""} aria-pressed={active} disabled={isLast} onClick={() => setSelectedMix((current) => current.includes(key) ? current.filter((item) => item !== key) : [...current, key])}><i style={{ background: mixMeta[key].color }} aria-hidden="true" />{mixMeta[key][lang]}</button>;
            })}</div>
            <NormalizedChart data={data} selected={selectedMix} lang={lang} />
          </article>
          <aside className="transmission" aria-labelledby="transmission-title" aria-describedby="transmission-summary">
            <header className="transmission-head">
              <div><span className="kicker">{lang === "es" ? "CADENA DE TRANSMISIÓN" : "TRANSMISSION CHAIN"}</span><b>{verifiedTransmissionSteps}/3 {lang === "es" ? "PILARES" : "PILLARS"}</b></div>
              <h3 id="transmission-title">{lang === "es" ? "Dinero → Main Street." : "Money → Main Street."}</h3>
              <p id="transmission-summary">{lang === "es" ? "Secuencia diagnóstica condicional: organiza qué observar primero, después y al final; no demuestra por sí sola una relación causal." : "A conditional diagnostic sequence: it organizes what to observe first, next and last; it does not prove causation by itself."}</p>
            </header>
            <ol className="chain" aria-label={lang === "es" ? "Tres pilares de la transmisión" : "Three transmission pillars"}>
              {transmissionSteps.map((step) => <li className={`transmission-step ${step.state}`} key={step.key}>
                <div className="transmission-step-head">
                  <b aria-hidden="true">{step.number}</b>
                  <h4>{step.title}</h4>
                  <em>{step.status}</em>
                </div>
                <p>{step.note}</p>
                <dl>{step.metrics.map((metric) => {
                  const available = Number.isFinite(metric.value);
                  return <div key={metric.label} className={available ? "available" : "unavailable"}>
                    <dt>{metric.label}</dt>
                    <dd><strong>{available ? `${marketFormat(metric.value, lang)}${metric.unit}` : "—"}</strong><small>{metric.date === "—" ? (lang === "es" ? "sin fecha" : "no date") : `${lang === "es" ? "observado" : "observed"} ${metric.date}`}</small></dd>
                  </div>;
                })}</dl>
              </li>)}
            </ol>
            <div className="transmission-response"><b>{lang === "es" ? "CAPA DE RESPUESTA · NO ES UN CUARTO PILAR" : "RESPONSE LAYER · NOT A FOURTH PILLAR"}</b><span>{lang === "es" ? "Activos e IPC reaccionan con retardos distintos; no prueban que la liquidez haya llegado a los hogares." : "Assets and CPI react with different lags; they do not prove that liquidity reached households."}</span></div>
            <div className={`transmission-reading ${engineCoverageState}`}>
              <b>{lang === "es" ? "LECTURA CONDICIONAL ACTUAL" : "CURRENT CONDITIONAL READING"}</b>
              <strong>{modelAvailable ? regime.title : (lang === "es" ? "Lectura retenida" : "Reading withheld")}</strong>
              <p>{modelAvailable ? regime.body : (lang === "es" ? "No se publica un régimen hasta alcanzar la cobertura mínima del modelo; los pilares disponibles siguen visibles." : "No regime is published until the model reaches minimum coverage; available pillars remain visible.")}</p>
              <span className="transmission-confirmation"><b>{lang === "es" ? "CONFIRMACIÓN" : "CONFIRMATION"}</b>{lang === "es" ? "Liquidez, crédito y producción deben coincidir; si divergen, la lectura se retiene." : "Liquidity, credit and production must agree; divergence withholds the reading."}</span>
              <a href="#theory">{lang === "es" ? "Ver el marco de los tres pilares" : "See the three-pillar framework"} ↓</a>
            </div>
          </aside>
        </div>
        <section className="correlation-block" aria-labelledby="correlation-title" aria-describedby="correlation-summary">
          <div className="correlation-intro"><span className="kicker">{lang === "es" ? "CORRELACIONES MÓVILES" : "ROLLING CORRELATIONS"}</span><h3 id="correlation-title">{lang === "es" ? "Relación, no causalidad." : "Relationship, not causation."}</h3><p id="correlation-summary">{lang === "es" ? "Pearson sobre variaciones intermensuales de meses consecutivos compartidos: mínimo 24 y máximo 60 pares. −1 indica dirección opuesta; +1, dirección conjunta." : "Pearson on month-over-month changes over shared consecutive months: minimum 24 and maximum 60 pairs. −1 indicates opposite direction; +1, joint direction."}</p></div>
          <ul className="correlation-grid" aria-label={lang === "es" ? "Pares de correlación disponibles" : "Available correlation pairs"}>
            {[
              ["m2_sp500", "M2 ↔ S&P 500"],
              ["dollar_gold", lang === "es" ? "Dólar ↔ Oro" : "Dollar ↔ Gold"],
              ["oil_cpi", "WTI ↔ CPI"],
              ["bitcoin_m2", "Bitcoin ↔ M2"],
              ["bitcoin_gold", lang === "es" ? "Bitcoin ↔ Oro" : "Bitcoin ↔ Gold"],
              ["sp500_gold", lang === "es" ? "S&P 500 ↔ Oro" : "S&P 500 ↔ Gold"],
            ].map(([key, label]) => {
              const value = data.derived.correlations[key];
              const evidence = data.derived.correlationEvidence?.[key] ?? { observations: 0, startMonth: null, endMonth: null };
              const available = Number.isFinite(value) && evidence.observations >= MIN_CORRELATION_OBSERVATIONS;
              const numericValue = available ? Number(value) : null;
              const magnitude = numericValue == null ? 0 : Math.min(1, Math.abs(numericValue));
              const meterWidth = magnitude * 50;
              const meterLeft = numericValue != null && numericValue < 0 ? 50 - meterWidth : 50;
              const strengthLabel = correlationStrengthLabel(numericValue, lang);
              const directionLabel = numericValue == null ? "" : correlationDirectionLabel(numericValue, lang);
              const period = evidence.startMonth && evidence.endMonth
                ? `${formatComparatorMonth(evidence.startMonth, lang)}–${formatComparatorMonth(evidence.endMonth, lang)}`
                : "—";
              const sampleLabel = available
                ? `${evidence.observations}/60 · ${period}`
                : `${evidence.observations}/${MIN_CORRELATION_OBSERVATIONS} ${lang === "es" ? "mín." : "min."}`;
              return <li key={key}><button type="button" className={`correlation-cell ${available ? "available" : "unavailable"}`} aria-haspopup="dialog" aria-controls="detail-dialog" aria-label={available
                ? `${lang === "es" ? "Abrir detalle" : "Open details"}: ${label}, ${numericValue! >= 0 ? "+" : ""}${numericValue!.toFixed(2)}, ${strengthLabel.toLowerCase()} ${directionLabel}`
                : `${lang === "es" ? "Abrir detalle" : "Open details"}: ${label}, ${strengthLabel.toLowerCase()}`
              } onClick={(event) => {
                detailReturnFocusRef.current = event.currentTarget;
                setDetail({
                eyebrow: lang === "es" ? "CORRELACIÓN MÓVIL · NO CAUSALIDAD" : "ROLLING CORRELATION · NOT CAUSATION",
                title: String(label),
                value: numericValue == null ? "—" : `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(2)}`,
                fact: available
                  ? (lang === "es" ? `${evidence.observations} variaciones intermensuales emparejadas entre ${period}. Solo se comparan meses consecutivos presentes en ambas series.` : `${evidence.observations} paired month-over-month changes from ${period}. Only consecutive months present in both series are compared.`)
                  : (lang === "es" ? `Hay ${evidence.observations} pares válidos; se exigen al menos ${MIN_CORRELATION_OBSERVATIONS}. El coeficiente se retiene en lugar de publicar una muestra frágil.` : `There are ${evidence.observations} valid pairs; at least ${MIN_CORRELATION_OBSERVATIONS} are required. The coefficient is withheld rather than publishing a fragile sample.`),
                interpretation: numericValue == null
                  ? (lang === "es" ? "No hay evidencia temporal suficiente para clasificar la relación lineal." : "There is not enough time evidence to classify the linear relationship.")
                  : (lang === "es" ? `La relación lineal observada es ${strengthLabel.toLowerCase()} y ${directionLabel}. Describe co-movimiento en esta ventana; no identifica causa, mecanismo ni estabilidad futura.` : `The observed linear relationship is ${strengthLabel.toLowerCase()} and ${directionLabel}. It describes co-movement in this window; it identifies neither cause, mechanism nor future stability.`),
                watch: lang === "es" ? "Comprobar si el signo y la intensidad persisten cuando entra un nuevo mes. Cambios de régimen, valores extremos o revisiones pueden alterar el coeficiente." : "Check whether sign and strength persist when a new month enters. Regime changes, outliers or revisions can alter the coefficient.",
                sourceLabel: lang === "es" ? "Metodología de correlaciones" : "Correlation methodology",
                sourceUrl: "/api/data-manifest",
              });
              }}><span className="correlation-label">{label}</span><strong>{numericValue == null ? "—" : `${numericValue >= 0 ? "+" : ""}${numericValue.toFixed(2)}`}</strong><div className="correlation-meter" aria-hidden="true"><span /><i className={numericValue != null && numericValue < 0 ? "negative" : "positive"} style={{ left: `${meterLeft}%`, width: `${meterWidth}%` }} /></div><div className="correlation-card-meta"><small>{numericValue == null ? strengthLabel : `${strengthLabel} · ${directionLabel}`}</small><small>{sampleLabel}</small></div><em>{lang === "es" ? "VER DETALLE" : "VIEW DETAILS"} →</em></button></li>;
            })}
          </ul>
        </section>
        <section className="ratio-panel" aria-labelledby="ratio-title" aria-describedby="ratio-summary">
          <div className="ratio-heading"><div><span className="kicker">{lang === "es" ? "RELACIONES ALINEADAS · ESTADO DEL MODELO" : "ALIGNED RATIOS · MODEL STATUS"}</span><h3 id="ratio-title">{lang === "es" ? "Mismo periodo, lectura honesta." : "Same period, honest reading."}</h3></div><p id="ratio-summary">{lang === "es" ? "Cada cociente exige un mes común. Si una fuente está atrasada, se retiene el valor en lugar de mezclar fechas." : "Every ratio requires a shared month. If a source is stale, the value is withheld instead of mixing dates."}</p></div>
          <ul className="ratio-strip">
            {ratioCards.map((card) => <li key={card.key}><button type="button" className={`ratio-card ${card.state}`} aria-haspopup="dialog" aria-controls="detail-dialog" aria-label={`${lang === "es" ? "Abrir detalle" : "Open details"}: ${card.label}, ${card.value}, ${card.status}`} onClick={(event) => {
              detailReturnFocusRef.current = event.currentTarget;
              setDetail({
                eyebrow: card.key === "composite" ? (lang === "es" ? "MODELO · COBERTURA Y LÍMITES" : "MODEL · COVERAGE AND LIMITS") : (lang === "es" ? "RELACIÓN · CÁLCULO Y LÍMITES" : "RATIO · CALCULATION AND LIMITS"),
                title: card.label, value: card.value, fact: card.fact,
                interpretation: card.interpretation, watch: card.watch,
                sourceLabel: lang === "es" ? "Auditar cálculo y fuentes" : "Audit calculation and sources", sourceUrl: "/api/data-manifest",
              });
            }}><span>{card.label}</span><b>{card.value}</b><small>{card.status}</small><em>{lang === "es" ? "VER DETALLE" : "VIEW DETAILS"} →</em></button></li>)}
          </ul>
        </section>
        <div className="backend-grid">
          <article className="scenario-panel" aria-labelledby="cycle-reading-title">
            <div className="backend-title">
              <div><span className="kicker">{lang === "es" ? "DIAGNÓSTICO MULTIDIMENSIONAL" : "MULTIDIMENSIONAL DIAGNOSIS"}</span><h3 id="cycle-reading-title">{lang === "es" ? "Lectura actual del ciclo" : "Current cycle reading"}</h3></div>
              <span>{modelProvisional ? (lang === "es" ? "PROVISIONAL" : "PROVISIONAL") : (lang === "es" ? "NO ES ASESORÍA" : "NOT ADVICE")}</span>
            </div>
            <p>{modelAvailable && strongest && weakest
              ? (lang === "es"
                ? `${regime.body} Lectura basada en ${availableEngineAssessments.length}/${engineAssessments.length} motores con cobertura. Entre ellos, domina ${strongest.label.toLowerCase()} (${strongest.score}/100) y la menor presión aparece en ${weakest.label.toLowerCase()} (${weakest.score}/100); la dispersión es de ${divergence} puntos.`
                : `${regime.body} Reading based on ${availableEngineAssessments.length}/${engineAssessments.length} engines with coverage. Among them, ${strongest.label.toLowerCase()} dominates (${strongest.score}/100), while the lowest pressure is in ${weakest.label.toLowerCase()} (${weakest.score}/100); dispersion is ${divergence} points.`)
              : (lang === "es" ? "No existe cobertura suficiente para un diagnóstico compuesto. Las lecturas parciales se mantienen visibles sin rellenar huecos." : "Coverage is insufficient for a composite diagnosis. Partial readings remain visible without filling gaps.")}</p>
            <div className="assessment-disclaimer"><b>{lang === "es" ? "LECTURA, NO RECOMENDACIÓN" : "READING, NOT A RECOMMENDATION"}</b><span>{lang === "es" ? "Describe condiciones observadas y una interpretación teórica condicionada. No recomienda comprar, vender, mantener ni asignar capital." : "Describes observed conditions and a conditional theoretical interpretation. It does not recommend buying, selling, holding or allocating capital."}</span></div>
            <div className="scenario-grid assessment-grid">
              {engineAssessments.map((assessment) => <button type="button" className={`scenario ${assessment.available ? "active" : "withheld"}`} key={assessment.key} aria-haspopup="dialog" aria-controls="detail-dialog" aria-label={`${lang === "es" ? "Abrir evidencia" : "Open evidence"}: ${assessment.label}, ${assessment.available ? `${assessment.score}/100, ${assessment.range}` : (lang === "es" ? "sin cobertura" : "no coverage")}`} onClick={(event) => showEngine(assessment.key, assessment.score, event.currentTarget)}>
                <div><b>{assessment.available ? assessment.score : "—"}</b><span>{assessment.available ? assessment.range : (lang === "es" ? "SIN COBERTURA" : "NO COVERAGE")}</span></div>
                <h4>{assessment.available ? assessment.title : (lang === "es" ? "Lectura suspendida" : "Reading withheld")}</h4><code>{assessment.label.toUpperCase()}</code><p>{assessment.available ? assessment.fact : (lang === "es" ? "Faltan entradas verificables; el motor no convierte ausencia en una señal neutral." : "Verifiable inputs are missing; the engine does not convert absence into a neutral signal.")}</p><em>{lang === "es" ? "Abrir evidencia, lente y señales" : "Open evidence, lens and signals"} ↗</em>
              </button>)}
            </div>
          </article>
          <article className="freshness-panel" aria-labelledby="source-status-title">
            <div className="backend-title">
              <div><span className="kicker">{lang === "es" ? `MOTOR ${ENGINE_VERSION} · SITES V${SITE_RELEASE}` : `ENGINE ${ENGINE_VERSION} · SITES V${SITE_RELEASE}`}</span><h3 id="source-status-title">{lang === "es" ? "Estado de las fuentes" : "Source status"}</h3></div>
              <span className={`backend-live ${sourceHealthState}`}><i aria-hidden="true" />{sourceHealthState === "ok" ? (lang === "es" ? "AL DÍA" : "CURRENT") : sourceHealthState === "partial" ? (lang === "es" ? "COBERTURA PARCIAL" : "PARTIAL COVERAGE") : (lang === "es" ? "SIN DATOS ACTUALES" : "NO CURRENT DATA")}</span>
            </div>
            <p>{lang === "es"
              ? "Todos los visitantes comparten una instantánea de 15 minutos. El servidor reintenta fallos transitorios, conserva el último dato válido y marca cada serie como actual, desactualizada o no disponible."
              : "All visitors share one 15-minute snapshot. The server retries transient failures, preserves the last valid observation, and marks every series as live, stale, or unavailable."}</p>
            <div className="backend-meta">
              <div><span>{lang === "es" ? "SALIDA DE DATOS" : "DATA ENDPOINT"}</span><code>/api/data</code></div>
              <div><span>{lang === "es" ? "SOLICITUD" : "REQUEST"}</span><b>{data.provenance.mode === "fallback" ? "—" : `${data.requestedAt.slice(0, 19).replace("T", " ")} UTC`}</b></div>
              <div><span>BITCOIN</span><b>{data.bitcoin.priceObservedAt?.slice(0, 19).replace("T", " ") ?? "—"} UTC</b></div>
              <div><span>{lang === "es" ? "SERIES MACRO ACTUALES" : "CURRENT MACRO SERIES"}</span><b>{macroAvailable}/{macroTotal}</b></div>
              <div><span>{lang === "es" ? "MODELO" : "MODEL"}</span><b>{modelStatus.toUpperCase()} · {modelInputsAvailable}/{modelInputsTotal} · {availableWeightPercent}% {lang === "es" ? "PESO" : "WEIGHT"}</b></div>
            </div>
            <div className="freshness-legend" aria-label={lang === "es" ? "Resumen de vigencia de las fuentes" : "Source freshness summary"}>
              <span className="live">{lang === "es" ? "AL DÍA" : "CURRENT"} <b>{freshnessCounts.live}</b></span>
              <span className="backup">{lang === "es" ? "VERIFICADO" : "VERIFIED"} <b>{freshnessCounts.lastKnownGood}</b></span>
              <span className="stale">{lang === "es" ? "DESACTUALIZADO" : "STALE"} <b>{freshnessCounts.stale}</b></span>
              <span className="unavailable">{lang === "es" ? "SIN DATO" : "NO DATA"} <b>{freshnessCounts.unavailable}</b></span>
            </div>
            <div className="backend-links"><a href="/api/health" target="_blank" rel="noreferrer">{lang === "es" ? "Estado técnico" : "Health"} ↗</a><a href="/api/data-manifest" target="_blank" rel="noreferrer">{lang === "es" ? "Manifiesto de datos" : "Data manifest"} ↗</a></div>
            <ul className="freshness-list">
              {data.freshness.length ? data.freshness.map((source) => {
                const statusLabel = sourceStatusLabel(source.status, lang);
                const observedLabel = source.observedAt ?? (lang === "es" ? "SIN FECHA" : "NO DATE");
                return <li key={source.id}><a href={seriesSourceUrl(data, source.key)} target="_blank" rel="noreferrer" aria-label={`${source.id}: ${statusLabel.toLowerCase()}; ${lang === "es" ? "observado" : "observed"} ${observedLabel}; ${lang === "es" ? "fuente" : "source"} ${seriesSource(data, source.key)}. ${lang === "es" ? "Abrir evidencia en una pestaña nueva" : "Open evidence in a new tab"}.`}>
                  <span className="freshness-source"><span><i className={source.status === "live" ? "ok" : source.status === "last-known-good" ? "backup" : source.status === "stale" ? "stale" : "fail"} />{source.id} · {seriesSource(data, source.key)}</span><small className={source.status}>{statusLabel}</small></span>
                  <time dateTime={source.observedAt ?? undefined}>{observedLabel}</time>
                </a></li>;
              }) : <li className="freshness-empty">{lang === "es" ? "El snapshot de respaldo no incluye fechas por serie. Pulsa Actualizar para consultar el backend." : "The fallback snapshot has no per-series dates. Press Refresh to query the backend."}</li>}
            </ul>
          </article>
        </div>
      </section>

      <section className="dashboard-section" id="dashboard">
        <div className="section-head"><div><span className="kicker">01 · {t.terminal.toUpperCase()}</span><h2>{t.terminal}</h2><p>{t.terminalSub}</p></div><a className="source-link" href={chartSourceUrl} target="_blank" rel="noreferrer" aria-label={`${lang === "es" ? "Abrir fuente de la serie" : "Open series source"}: ${chartSource}`}>{chartSource} ↗</a></div>
        <div className="terminal">
          <div className="series-tabs" role="tablist" aria-label={lang === "es" ? "Series del gráfico" : "Chart series"}>{chartSeriesKeys.map((key, index) => <button ref={(element) => { seriesTabRefs.current[index] = element; }} id={`series-tab-${key}`} role="tab" aria-selected={seriesKey === key} aria-controls="macro-chart-panel" tabIndex={seriesKey === key ? 0 : -1} key={key} className={seriesKey === key ? "active" : ""} onClick={() => setSeriesKey(key)} onKeyDown={(event) => handleSeriesTabKey(event, index)}><i style={{background: seriesMeta[key].color}} aria-hidden="true" />{seriesMeta[key][lang]}</button>)}</div>
          <div className="chart-toolbar"><div><span>{meta[lang]}</span><b>{meta.source} · {chartStatus} · {formatChartDate(points.at(-1)?.date, lang)}</b></div><div className="range" role="group" aria-label={lang === "es" ? "Horizonte temporal" : "Time horizon"}>{[[1,lang === "es" ? "1A" : "1Y"],[5,lang === "es" ? "5A" : "5Y"],[0,lang === "es" ? "MÁX" : "MAX"]].map(([value,label]) => <button type="button" key={label} className={horizon === value ? "active" : ""} aria-pressed={horizon === value} onClick={() => setHorizon(Number(value))}>{label}</button>)}</div></div>
          <div id="macro-chart-panel" role="tabpanel" aria-labelledby={`series-tab-${seriesKey}`}><LineChart key={`${seriesKey}:${horizon}`} points={points} color={meta.color} unit={meta.unit[lang]} horizon={horizon} lang={lang} status={chartStatus} state={chartState}/></div>
        </div>
      </section>

      <section className="signal-section" id="liquidity" aria-labelledby="signal-board-title">
        <div className="section-head"><div><span className="kicker">{lang === "es" ? "02 · SEÑALES MACRO" : "02 · MACRO SIGNALS"}</span><h2 id="signal-board-title">{t.indicators}</h2><p>{t.indicatorsSub}</p></div><div className="lens-toggle" role="group" aria-label={lang === "es" ? "Tipo de lectura del indicador" : "Indicator reading type"}><button type="button" className={lens === "facts" ? "active" : ""} aria-pressed={lens === "facts"} onClick={() => setLens("facts")}>{t.objective}</button><button type="button" className={lens === "thesis" ? "active" : ""} aria-pressed={lens === "thesis"} onClick={() => setLens("thesis")}>{t.austrian}</button></div></div>
        <div className="signal-layout">
          <div className="metric-grid" role="tablist" aria-label={lang === "es" ? "Indicadores macroeconómicos" : "Macroeconomic indicators"}>
            {metrics.map((metric, index) => {
              const value = latestValue(data, metric.key);
              const available = value != null && data.provenance.mode !== "fallback";
              const state = marketState(data, metric.key);
              const status = marketStateLabel(state, lang);
              const contextOnly = "contextOnly" in metric && metric.contextOnly;
              const signalReady = !contextOnly && data.provenance.mode !== "fallback" && data.provenance.signalReady?.[metric.signal] !== false && Number.isFinite(data.derived.scores[metric.signal]);
              const pressure = signalReady ? data.derived.scores[metric.signal] : null;
              const shownValue = metric.key === "federalDebt" && value != null ? `$${marketFormat(value / 1000, lang, metric.digits)} T` : marketFormat(value, lang, metric.digits);
              return <button ref={(element) => { metricTabRefs.current[index] = element; }} id={`metric-tab-${metric.key}`} role="tab" aria-selected={selectedMetric.key === metric.key} aria-controls="signal-inspector" tabIndex={selectedMetric.key === metric.key ? 0 : -1} type="button" key={metric.key} className={`metric-card ${selectedMetric.key === metric.key ? "selected" : ""} ${available ? "has-data" : "no-data"}`} onClick={() => setSelectedMetric(metric)} onKeyDown={(event) => handleMetricTabKey(event, index)}>
                <span className="metric-title"><i className={`metric-source-dot ${state}`} aria-hidden="true" />{metric.label[lang === "en" ? 0 : 1]}</span>
                <span className="metric-reading"><strong>{shownValue}</strong><small>{available ? metric.unit[lang === "en" ? 0 : 1] : (lang === "es" ? "sin observación verificable" : "no verifiable observation")}</small></span>
                <span className="metric-provenance"><span className={`metric-status ${state}`}>{status}</span><time dateTime={available ? observedDate(data, metric.key) : undefined}>{available ? formatChartDate(observedDate(data, metric.key), lang) : "—"}</time></span>
                <small className="metric-source">{seriesSource(data, metric.key)} · {metric.source}</small>
                <span className="metric-pressure"><span>{contextOnly ? (lang === "es" ? "CAPA DE CONTEXTO" : "CONTEXT LAYER") : (lang === "es" ? "PRESIÓN DEL MODELO" : "MODEL PRESSURE")}</span><b>{contextOnly ? (lang === "es" ? "NO PUNTÚA" : "NOT SCORED") : pressure == null ? (lang === "es" ? "RETENIDA" : "WITHHELD") : `${pressure}/100`}</b></span>
                <span className={`risk-bar ${contextOnly || pressure == null ? "withheld" : ""}`} aria-hidden="true"><i style={{width:`${pressure ?? 0}%`}} /></span>
              </button>;
            })}
          </div>
          {(() => {
            const value = latestValue(data, selectedMetric.key);
            const available = value != null && data.provenance.mode !== "fallback";
            const state = marketState(data, selectedMetric.key);
            const status = marketStateLabel(state, lang);
            const contextOnly = "contextOnly" in selectedMetric && selectedMetric.contextOnly;
            const signalReady = !contextOnly && data.provenance.mode !== "fallback" && data.provenance.signalReady?.[selectedMetric.signal] !== false && Number.isFinite(data.derived.scores[selectedMetric.signal]);
            const pressure = signalReady ? data.derived.scores[selectedMetric.signal] : null;
            const shownValue = selectedMetric.key === "federalDebt" && value != null ? `$${marketFormat(value / 1000, lang, selectedMetric.digits)} T` : marketFormat(value, lang, selectedMetric.digits);
            const sourceUrl = selectedMetric.key === "federalDebt" ? debtSourceUrl(data) : seriesSourceUrl(data, selectedMetric.key);
            return <aside className="inspector" id="signal-inspector" role="tabpanel" aria-labelledby={`metric-tab-${selectedMetric.key}`} tabIndex={0}>
              <div className="inspector-heading"><span className="kicker">{lens === "facts" ? t.facts : t.thesis}</span><span className={`inspector-state ${state}`}>{status}</span></div>
              <h3>{selectedMetric.label[lang === "en" ? 0 : 1]}</h3>
              <div className="inspector-value"><span>{t.value}<small>{available ? formatChartDate(observedDate(data, selectedMetric.key), lang) : (lang === "es" ? "SIN FECHA" : "NO DATE")}</small></span><strong>{shownValue}<small>{selectedMetric.unit[lang === "en" ? 0 : 1]}</small></strong></div>
              <div className={`inspector-pressure ${contextOnly || pressure == null ? "withheld" : ""}`}><span>{contextOnly ? (lang === "es" ? "CAPA DE CONTEXTO" : "CONTEXT LAYER") : (lang === "es" ? "PRESIÓN MODELIZADA" : "MODELED PRESSURE")}</span><b>{contextOnly ? (lang === "es" ? "FUERA DEL ÍNDICE" : "OUTSIDE THE INDEX") : pressure == null ? (lang === "es" ? "RETENIDA POR COBERTURA" : "WITHHELD FOR COVERAGE") : `${pressure}/100`}</b></div>
              <p>{available
                ? (lens === "facts" ? selectedMetric.fact : selectedMetric.thesis)[lang === "en" ? 0 : 1]
                : (lang === "es" ? "No existe una observación verificable para interpretar este indicador. Se conserva su definición, pero no se asigna un cero ni una lectura neutral." : "There is no verifiable observation to interpret for this indicator. Its definition remains available, but no zero or neutral reading is assigned.")}</p>
              <div className="watch"><span>{t.watch}</span><p>{available ? selectedMetric.watch[lang === "en" ? 0 : 1] : (lang === "es" ? "Revisar la fuente y esperar una observación válida antes de extraer conclusiones." : "Check the source and wait for a valid observation before drawing conclusions.")}</p></div>
              <a href={sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${t.source}: ${seriesSource(data, selectedMetric.key)} · ${selectedMetric.source}. ${lang === "es" ? "Abrir evidencia en una pestaña nueva" : "Open evidence in a new tab"}.`}>{t.source}: {seriesSource(data, selectedMetric.key)} · {selectedMetric.source} ↗</a>
            </aside>;
          })()}
        </div>
      </section>

      <section className="six-force-section" id="six-forces" aria-labelledby="six-force-title" aria-describedby="six-force-summary">
        <div className="section-head light">
          <div>
            <span className="kicker">{lang === "es" ? "03 · PRUEBA DE SEIS FUERZAS" : "03 · SIX-FORCE TEST"}</span>
            <h2 id="six-force-title">{lang === "es" ? "Seis fuerzas. Una lectura condicional." : "Six forces. One conditional reading."}</h2>
            <p id="six-force-summary">{lang === "es" ? "Rendimientos del Tesoro, deuda, petróleo, pulso manufacturero, dólar y Bitcoin pueden reforzarse o contradecirse. La contradicción reduce la confianza; no se promedia en un color." : "Treasury yields, debt, oil, the manufacturing pulse, the dollar and Bitcoin can reinforce or contradict one another. Contradiction lowers confidence; it is not averaged into a color."}</p>
          </div>
          <div className={`six-force-coverage ${sixForce.status}`}><span>{lang === "es" ? "COBERTURA" : "COVERAGE"}</span><strong>{sixForce.available}/{sixForce.total}</strong><small>{sixForce.status === "complete" ? (lang === "es" ? "LECTURA COMPLETA" : "COMPLETE READING") : sixForce.status === "partial" ? (lang === "es" ? "LECTURA PARCIAL" : "PARTIAL READING") : (lang === "es" ? "SÍNTESIS RETENIDA" : "SYNTHESIS WITHHELD")}</small></div>
        </div>
        <div className="six-force-layout">
          <div className="six-force-grid">
            {sixForceCards.map((item, index) => {
              const reading = sixForce.forces[item.key];
              return <article className={`six-force-card force-${item.key} ${reading.available ? "available" : "unavailable"}`} key={item.key} aria-labelledby={`six-force-${item.key}`}>
                <header><span>{String(index + 1).padStart(2, "0")} · {item.eyebrow}</span><b>{sixForceStateLabel(reading.state, lang)}</b></header>
                <h3 id={`six-force-${item.key}`}>{item.title}</h3>
                <p className="six-force-value">{reading.available ? item.evidence : "—"}</p>
                <time dateTime={reading.observedAt ?? undefined}>{reading.observedAt ? formatChartDate(reading.observedAt, lang) : (lang === "es" ? "SIN OBSERVACIÓN" : "NO OBSERVATION")}</time>
                <p className="six-force-note">{item.note}</p>
                <a href={item.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`${item.title}: ${item.source}. ${lang === "es" ? "Abrir evidencia en una pestaña nueva" : "Open evidence in a new tab"}.`}>{item.source} ↗</a>
              </article>;
            })}
          </div>
          <aside className={`six-force-synthesis ${sixForce.status}`} aria-labelledby="six-force-synthesis-title">
            <span>{lang === "es" ? `SÍNTESIS · ${CONTEXT_MODEL_VERSION}` : `SYNTHESIS · ${CONTEXT_MODEL_VERSION}`}</span>
            <h3 id="six-force-synthesis-title">{sixForceReading.title}</h3>
            <p>{sixForceReading.body}</p>
            <dl>
              <div><dt>{lang === "es" ? "PATRONES ACTIVOS" : "ACTIVE PATTERNS"}</dt><dd>{sixForce.activePatterns.length}</dd></div>
              <div><dt>{lang === "es" ? "DIVERGENCIAS" : "DIVERGENCES"}</dt><dd>{sixForce.divergences.length}</dd></div>
            </dl>
            <div className="six-force-falsifier"><b>{lang === "es" ? "QUÉ CAMBIARÍA LA LECTURA" : "WHAT WOULD CHANGE THE READING"}</b><p>{sixForceReading.falsifier}</p></div>
            <p className="six-force-boundary">{lang === "es" ? "La versión pública usa el CFSEC manufacturero de la Fed de Chicago como proxy regional y no reproduce el ISM PMI. El proxy queda fuera del índice puntuado." : "The public build uses the Chicago Fed manufacturing CFSEC as a regional proxy and does not reproduce ISM PMI. The proxy stays outside the scored index."}</p>
            <div className="six-force-links"><a href="https://fred.stlouisfed.org/series/CFSBCACTIVITYMFG" target="_blank" rel="noopener noreferrer">CFSEC / FRED ↗</a><a href="/api/data-manifest" target="_blank" rel="noopener noreferrer">{lang === "es" ? "Umbrales y método" : "Thresholds and method"} ↗</a></div>
          </aside>
        </div>
      </section>

      <section className="hard-assets" id="hard-assets" aria-labelledby="hard-assets-title">
        <div className="section-head light"><div><span className="kicker">{lang === "es" ? "04 · LABORATORIO DE DINERO DURO" : "04 · SOUND MONEY LAB"}</span><h2 id="hard-assets-title">{t.scarcity}</h2><p>{t.scarcitySub}</p></div></div>
        <div className="asset-grid">
          <article className="btc-card" aria-labelledby="bitcoin-asset-title">
            <div className="asset-title"><span className="coin" aria-hidden="true">₿</span><div><span>BITCOIN · USD</span><h3 id="bitcoin-asset-title"><span className="sr-only">Bitcoin: </span>{bitcoinPriceAvailable ? `$${marketFormat(btc, lang, 0)}` : "—"}</h3><small className={`asset-state ${bitcoinConsensus}`}>{bitcoinPriceStatus} · {data.bitcoin.priceObservedAt ? formatChartDate(data.bitcoin.priceObservedAt.slice(0, 10), lang) : (lang === "es" ? "SIN FECHA" : "NO DATE")}</small></div></div>
            <dl className="asset-stats"><div><dt>{t.s2f}</dt><dd>{bitcoinSupplyAvailable ? `${marketFormat(data.bitcoin.stockToFlow, lang, 1)}×` : "—"}</dd></div><div><dt>{t.supply}</dt><dd>{bitcoinSupplyAvailable ? `${marketFormat(data.bitcoin.supply / 1e6, lang, 2)} M BTC` : "—"}</dd></div><div><dt>{t.block}</dt><dd>{bitcoinNetworkAvailable ? marketFormat(data.bitcoin.blockHeight, lang, 0) : "—"}</dd></div><div><dt>{t.fees}</dt><dd>{bitcoinNetworkAvailable && data.bitcoin.feeFast != null ? `${marketFormat(data.bitcoin.feeFast, lang, 0)} sat/vB` : "—"}</dd></div></dl>
            <p>{lang === "en" ? "Stock-to-flow describes programmed scarcity; it is not a reliable standalone price model. Bitcoin’s supply schedule is auditable, its custody can be sovereign, and its settlement resists permission." : "El stock-to-flow describe la escasez programada; no es un modelo de precio fiable por sí solo. La oferta de Bitcoin es auditable, su custodia puede ser soberana y su liquidación resiste permisos."}</p>
            <div className="asset-evidence"><a href={bitcoinSourceUrl(data)} target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? `Abrir precio de Bitcoin: ${bitcoinPriceStatus}, en una pestaña nueva` : `Open Bitcoin price: ${bitcoinPriceStatus}, in a new tab`}>{lang === "es" ? "Precio · dos mercados" : "Price · two venues"} ↗</a><a href="https://mempool.space/" target="_blank" rel="noopener noreferrer">Mempool.space ↗</a><a href="https://www.blockchain.com/explorer/charts/total-bitcoins" target="_blank" rel="noopener noreferrer">Blockchain.com ↗</a></div>
          </article>
          <article className="hard-ratio-card" aria-labelledby="scarcity-ratios-title">
            <span className="kicker">{lang === "es" ? "VALORACIÓN RELATIVA" : "RELATIVE VALUATION"}</span>
            <h3 id="scarcity-ratios-title">{lang === "en" ? "Scarcity and purchasing-power ratios" : "Ratios de escasez y poder adquisitivo"}</h3>
            <dl className="hard-ratio-list">
              <div><dt>BTC / {lang === "es" ? "ORO" : "GOLD"}</dt><dd>{alignedBitcoinGold == null ? "—" : `${marketFormat(alignedBitcoinGold, lang, 1)} oz`}</dd><small>{alignedBitcoinGold == null ? (lang === "es" ? "RETENIDO · SIN MES COMÚN" : "WITHHELD · NO COMMON MONTH") : `${alignedBitcoinGoldMonth} · ${btcGoldEvidence.numeratorObservations} BTC / ${btcGoldEvidence.denominatorObservations} ${lang === "es" ? "ORO" : "GOLD"}`}</small></div>
              <div><dt>BTC / 1 M USD</dt><dd>{bitcoinPriceAvailable ? marketFormat(1_000_000 / btc!, lang, 1) : "—"}</dd><small>{bitcoinPriceAvailable ? `${bitcoinPriceStatus} · SPOT` : (lang === "es" ? "SIN PRECIO VERIFICADO" : "NO VERIFIED PRICE")}</small></div>
              <div><dt>{lang === "es" ? "ORO S2F" : "GOLD S2F"}</dt><dd>{marketFormat(goldStockToFlow2025, lang, 1)}×</dd><small>{lang === "es" ? "ESTIMACIÓN 2025 · STOCK / PRODUCCIÓN MINERA" : "2025 ESTIMATE · STOCK / MINE OUTPUT"}</small></div>
              <div><dt>BITCOIN S2F</dt><dd>{bitcoinSupplyAvailable ? `${marketFormat(data.bitcoin.stockToFlow, lang, 1)}×` : "—"}</dd><small>{bitcoinSupplyAvailable ? (lang === "es" ? "OFERTA / SUBSIDIO ANUAL ACTUAL" : "SUPPLY / CURRENT ANNUAL SUBSIDY") : (lang === "es" ? "SIN DATOS DE RED" : "NO NETWORK DATA")}</small></div>
            </dl>
            <p className="ratio-caveat">{lang === "en" ? "Ratios describe quantities; they do not establish fair value, expected return or portfolio suitability." : "Los ratios describen cantidades; no establecen valor razonable, rentabilidad esperada ni idoneidad para una cartera."}</p>
            <div className="asset-evidence"><a href="/api/data-manifest" target="_blank" rel="noopener noreferrer">{lang === "es" ? "Cálculo BTC/oro" : "BTC/gold calculation"} ↗</a><a href="https://www.gold.org/goldhub/data/how-much-gold" target="_blank" rel="noopener noreferrer">World Gold Council ↗</a></div>
          </article>
          <article className="monetary-map" aria-labelledby="dependency-map-title">
            <span className="kicker">{lang === "es" ? "COMPETENCIA MONETARIA" : "MONETARY COMPETITION"}</span><h3 id="dependency-map-title">{lang === "en" ? "Dependency map" : "Mapa de dependencias"}</h3>
            <p className="dependency-intro">{lang === "es" ? "Qué debe verificar o confiar el usuario para poseer y transferir cada activo." : "What a user must verify or trust to own and transfer each asset."}</p>
            <ul className="dependency-list">
              {[
                ["Bitcoin", lang === "es" ? "Reglas del protocolo · consenso de red · custodia" : "Protocol rules · network consensus · custody"],
                [lang === "es" ? "Oro" : "Gold", lang === "es" ? "Autenticidad física · custodia · transporte" : "Physical authenticity · custody · transport"],
                [lang === "es" ? "Dólar" : "Dollar", lang === "es" ? "Emisor · red bancaria · marco legal" : "Issuer · banking rails · legal framework"],
                [lang === "es" ? "Deuda soberana" : "Sovereign debt", lang === "es" ? "Emisor · fiscalidad futura · régimen monetario" : "Issuer · future taxation · monetary regime"],
              ].map(([name, dependencies], index) => <li key={name}><span>0{index + 1}</span><div><b>{name}</b><small>{dependencies}</small></div></li>)}
            </ul>
            <p className="dependency-note">{lang === "es" ? "Mapa cualitativo, no puntuación de seguridad, rentabilidad ni riesgo. Hace visibles dependencias distintas; no declara un ganador." : "Qualitative map, not a security, return or risk score. It exposes different dependencies; it does not declare a winner."}</p>
            <a className="dependency-link" href={`/learn/bitcoin-sovereignty?lang=${lang}`}>{lang === "es" ? "Explorar verificación y custodia" : "Explore verification and custody"} →</a>
          </article>
        </div>
      </section>

      <section className="pillars" id="theory" aria-labelledby="pillars-title" aria-describedby="pillars-summary">
        <div className="section-head">
          <div>
            <span className="kicker">{lang === "es" ? "05 · MARCO DE LA TEORÍA AUSTRIACA DEL CICLO" : "05 · ABCT FRAMEWORK"}</span>
            <h2 id="pillars-title">{t.pillars}</h2>
            <p id="pillars-summary">{lang === "es"
              ? "La Fed crea el marco monetario; los mercados de crédito determinan cómo circula el dinero; la economía real comprueba si llega a la población. Es una cadena de transmisión condicional: la coincidencia entre capas refuerza la lectura, pero no demuestra causalidad por sí sola."
              : "The Fed creates the monetary framework; credit markets determine how money circulates; the real economy tests whether it reaches the population. This is a conditional transmission chain: agreement across layers strengthens the reading but does not prove causality by itself."}</p>
          </div>
        </div>
        <ol className="pillar-grid">
          {pillarCards.map((pillar, index) => <li key={pillar.key}><article className={`pillar-card ${pillar.state}`} aria-labelledby={`pillar-${pillar.key}-title`}>
            <div className="pillar-card-head"><span>0{index + 1} · {pillar.code}</span><small className={`pillar-state ${pillar.state}`}>{pillar.status}</small></div>
            <div className={`pillar-score ${pillar.available ? "available" : "withheld"}`}><strong>{pillar.available ? pillar.score : "—"}</strong><small>{pillar.available ? "/100" : (lang === "es" ? "SIN PUNTUACIÓN" : "NO SCORE")}</small></div>
            <h3 id={`pillar-${pillar.key}-title`}>{pillar.title}</h3>
            <p>{pillar.body}</p>
            <div className={`pillar-bar ${pillar.available ? "available" : "withheld"}`} aria-hidden="true">{pillar.available && <i style={{width:`${pillar.score}%`}} />}</div>
            <button type="button" aria-haspopup="dialog" aria-controls="detail-dialog" onClick={(event) => showEngine(pillar.key, pillar.score, event.currentTarget)}>{lang === "es" ? "Interpretar pilar" : "Interpret pillar"} ↗</button>
          </article></li>)}
        </ol>
        <p className="pillar-scale-note">{lang === "es"
          ? "El valor /100 expresa presión dentro del modelo experimental ABCM; no mide la salud, la rentabilidad ni la importancia del pilar. Sin cobertura suficiente, la lectura se retiene y nunca se sustituye por cero."
          : "The /100 value expresses pressure inside ABCM’s experimental model; it does not measure the pillar’s health, return or importance. Without sufficient coverage, the reading is withheld and never replaced by zero."}</p>
        <ol className="process" aria-label={lang === "es" ? "Proceso de interpretación en cuatro pasos" : "Four-step interpretation process"}>
          {[["01",lang === "en" ? "Observe" : "Observar",lang === "en" ? "Primary data and release dates." : "Datos primarios y fechas."],["02",lang === "en" ? "Connect" : "Conectar",lang === "en" ? "Monetary framework → credit → Main Street." : "Marco monetario → crédito → Main Street."],["03",lang === "en" ? "Interpret" : "Interpretar",lang === "en" ? "Apply ABCT, label assumptions." : "Aplicar ABCT y declarar supuestos."],["04",lang === "en" ? "Falsify" : "Refutar",lang === "en" ? "Define what would change the view." : "Definir qué cambiaría la tesis."]].map(([n,h,p]) => <li key={n}><b>{n}</b><h4>{h}</h4><p>{p}</p></li>)}
        </ol>
      </section>

      <section className="cava-credit" aria-labelledby="cava-title" aria-describedby="cava-summary cava-independence">
        <div className="cava-index" aria-hidden="true">JLC<br/>→</div>
        <div className="cava-copy">
          <span className="kicker">{lang === "en" ? "FEATURED EDUCATIONAL INFLUENCE" : "INFLUENCIA DIVULGATIVA DESTACADA"}</span>
          <h2 id="cava-title">José Luis Cava</h2>
          <p id="cava-summary">{lang === "en"
            ? "ABCM is inspired by José Luis Cava’s public way of connecting monetary policy, credit transmission and Main Street: looking beyond index highs to ask whether liquidity reaches employment, housing and household purchasing power."
            : "ABCM se inspira en la forma pública de José Luis Cava de conectar política monetaria, transmisión del crédito y Main Street: mirar más allá de los máximos bursátiles para comprobar si la liquidez llega al empleo, la vivienda y el poder adquisitivo de los hogares."}</p>
          <p id="cava-independence">{lang === "en"
            ? "We do not attribute the dashboard, its index, formulas or three-pillar operating structure to him. ABCM is an independent open-source prototype—not an official José Luis Cava or HOPLA product, collaboration or endorsement."
            : "No le atribuimos la autoría del dashboard, del índice, de sus fórmulas ni de la estructura operativa de tres pilares. ABCM es un prototipo open source independiente; no es un producto oficial, una colaboración ni un respaldo de José Luis Cava o HOPLA."}</p>
          <div className="cava-links">
            <button type="button" aria-haspopup="dialog" aria-controls="detail-dialog" aria-label={lang === "es" ? "Abrir el contexto de los tres pilares y el vídeo que inspiró ABCM" : "Open the context behind ABCM’s three pillars and inspiring video"} onClick={(event) => showCavaContext(event.currentTarget)}>{lang === "es" ? "Los tres pilares y el vídeo que inspiró ABCM" : "The three pillars and the video behind ABCM"} →</button>
            <a href="https://hopla.finance/home" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir el sitio público de HOPLA Finance en una pestaña nueva" : "Open HOPLA Finance’s public website in a new tab"}>HOPLA Finance ↗</a>
            <a href="https://www.youtube.com/@JoseLuisCavatv" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir el canal público de José Luis Cava en YouTube en una pestaña nueva" : "Open José Luis Cava’s public YouTube channel in a new tab"}>{lang === "en" ? "José Luis Cava on YouTube" : "José Luis Cava en YouTube"} ↗</a>
            <a href="https://github.com/JimBLogic/AustrianBusinessCycleMonitor/commit/0acc1a2deb695d167e302c81966344056fb75189" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir el historial de metodología de ABCM en una pestaña nueva" : "Open ABCM’s methodology history in a new tab"}>{lang === "en" ? "ABCM methodology history" : "Historial de metodología ABCM"} ↗</a>
          </div>
        </div>
        <aside className="cava-pitch" aria-labelledby="cava-pitch-title">
          <span id="cava-pitch-title">{lang === "en" ? "WHY IT INSPIRES" : "POR QUÉ INSPIRA"}</span>
          <div className="cava-pitch-flow" aria-label={lang === "es" ? "Cadena de los tres pilares" : "Three-pillar chain"}>
            <div><b>01</b><em>{lang === "es" ? "Política monetaria" : "Monetary policy"}</em><i>→</i></div>
            <div><b>02</b><em>{lang === "es" ? "Mercados de crédito" : "Credit markets"}</em><i>→</i></div>
            <div><b>03</b><em>{lang === "es" ? "Economía real" : "Real economy"}</em><i>✓</i></div>
          </div>
          <strong>{lang === "en" ? "Inspiration is not authorship." : "Inspiración no es autoría."}</strong>
          <p>{lang === "en"
            ? "José Luis Cava’s public market education inspired the editorial question. ABCM answers it with independently documented code, formulas, pillar grouping and conclusions that remain open to criticism."
            : "La divulgación pública de José Luis Cava inspiró la pregunta editorial. ABCM la responde con código, fórmulas, agrupación de pilares y conclusiones propias, documentadas y abiertas a crítica."}</p>
          <small className="cava-boundary">{lang === "es" ? "Referencia editorial · sin afiliación · sin autoría" : "Editorial reference · no affiliation · no authorship"}</small>
        </aside>
      </section>

      <section className="influence-library" aria-labelledby="influence-title" aria-describedby="influence-summary">
        <div className="influence-heading">
          <div>
            <span className="kicker">{lang === "es" ? "BIBLIOGRAFÍA ABIERTA · VOCES DIVERSAS" : "OPEN BIBLIOGRAPHY · DIVERSE VOICES"}</span>
            <h2 id="influence-title">{lang === "es" ? "Mapa de influencias" : "Influence map"}</h2>
          </div>
          <p id="influence-summary">{lang === "es"
            ? "Autores y constructores reconocidos que ayudan a contrastar economía austriaca, historia monetaria, Bitcoin y soberanía. Sus ideas no equivalen a hechos de protocolo ni los convierten en autores o avalistas de ABCM."
            : "Recognized authors and builders used to contrast Austrian economics, monetary history, Bitcoin and sovereignty. Their ideas are not protocol facts and do not make them authors or endorsers of ABCM."}</p>
        </div>
        <ul className="influence-grid" aria-label={lang === "es" ? "Fuentes públicas del mapa de influencias" : "Public sources in the influence map"}>
          {[
            ["Saifedean Ammous", lang === "es" ? "ECONOMÍA AUSTRIACA" : "AUSTRIAN ECONOMICS", lang === "es" ? "Dinero duro, preferencia temporal y la tesis monetaria de Bitcoin." : "Hard money, time preference and Bitcoin’s monetary thesis.", "https://saifedean.com/tbs"],
            ["Lyn Alden", lang === "es" ? "ANÁLISIS MONETARIO" : "MONETARY ANALYSIS", lang === "es" ? "Historia del dinero, sistemas de liquidación y Bitcoin como bien monetario." : "Monetary history, settlement systems and Bitcoin as a monetary good.", "https://www.lynalden.com/what-is-money/"],
            ["Robert Breedlove", lang === "es" ? "FILOSOFÍA MONETARIA" : "MONETARY PHILOSOPHY", lang === "es" ? "Dinero, Bitcoin y tiempo examinados desde primeros principios." : "Money, Bitcoin and time examined from first principles.", "https://breedlove22.medium.com/money-bitcoin-and-time-part-1-of-3-b4f6bb036c04"],
            ["Parker Lewis", lang === "es" ? "TEORÍA BITCOIN" : "BITCOIN THEORY", lang === "es" ? "Propiedades monetarias, incentivos y el proceso por el que Bitcoin compite como dinero." : "Monetary properties, incentives and the process by which Bitcoin competes as money.", "https://nakamotoinstitute.org/library/gradually-then-suddenly/"],
            ["Adam Back", "CYPHERPUNK · PROOF-OF-WORK", lang === "es" ? "Hashcash como antecedente técnico público de las pruebas de trabajo." : "Hashcash as a public technical precursor to proof-of-work systems.", "https://nakamotoinstitute.org/library/hashcash/"],
            ["Hal Finney", lang === "es" ? "DINERO DIGITAL" : "DIGITAL CASH", lang === "es" ? "RPOW y la evolución temprana de pruebas de trabajo reutilizables." : "RPOW and the early evolution of reusable proofs of work.", "https://nakamotoinstitute.org/finney/rpow/"],
            ["Jameson Lopp", lang === "es" ? "SOBERANÍA TÉCNICA" : "TECHNICAL SOVEREIGNTY", lang === "es" ? "Recursos prácticos sobre nodos, autocustodia, privacidad y seguridad." : "Practical resources on nodes, self-custody, privacy and security.", "https://www.lopp.net/bitcoin-information.html"],
            ["Ludwig von Mises", lang === "es" ? "DINERO Y CICLO ECONÓMICO" : "MONEY & BUSINESS CYCLES", lang === "es" ? "Teoría monetaria, medios fiduciarios y fundamentos del mecanismo austriaco del ciclo." : "Monetary theory, fiduciary media and foundations of the Austrian cycle mechanism.", "https://mises.org/library/book/theory-money-and-credit"],
          ].map(([name, category, body, url]) => <li key={name}><a href={url} target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? `Abrir la fuente pública de ${name} en una pestaña nueva` : `Open ${name}’s public source in a new tab`}>
              <span>{category}</span>
              <h3>{name}</h3>
              <p>{body}</p>
              <b>{lang === "es" ? "Leer fuente pública" : "Read public source"} ↗</b>
            </a></li>)}
        </ul>
      </section>

      <section className="ammous-lens" aria-labelledby="ammous-title" aria-describedby="ammous-summary">
        <div className="ammous-intro">
          <span className="kicker">{lang === "es" ? "LECTURA CONTRASTADA · DINERO DURO" : "CONTRASTED READING · HARD MONEY"}</span>
          <h2 id="ammous-title">Saifedean Ammous</h2>
          <p id="ammous-summary">{lang === "es"
            ? "Su trabajo aporta una tesis potente sobre dureza monetaria, preferencia temporal y Bitcoin. ABCM lo usa como marco argumental, no como autoridad incuestionable: protocolo, teoría y evidencia de mercado se muestran por separado."
            : "His work offers a powerful thesis on monetary hardness, time preference and Bitcoin. ABCM uses it as an argumentative framework, not unquestionable authority: protocol, theory and market evidence remain separate."}</p>
          <ul className="ammous-links" aria-label={lang === "es" ? "Obras y publicación académica de Saifedean Ammous" : "Works and academic publication by Saifedean Ammous"}>
            <li><a href="https://saifedean.com/tbs" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir The Bitcoin Standard en una pestaña nueva" : "Open The Bitcoin Standard in a new tab"}>The Bitcoin Standard ↗</a></li>
            <li><a href="https://saifedean.com/poe" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir Principles of Economics en una pestaña nueva" : "Open Principles of Economics in a new tab"}>Principles of Economics ↗</a></li>
            <li><a href="https://www.sciencedirect.com/science/article/pii/S1062976917300777" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir el artículo Can cryptocurrencies fulfil the functions of money en una pestaña nueva" : "Open Can cryptocurrencies fulfil the functions of money in a new tab"}>Can cryptocurrencies fulfil the functions of money? ↗</a></li>
          </ul>
        </div>
        <ol className="ammous-grid" aria-label={lang === "es" ? "Tres capas de la lectura contrastada" : "Three layers of the contrasted reading"}>
          <li><article aria-labelledby="ammous-fact-title">
            <span>01 · {lang === "es" ? "HECHO VERIFICABLE" : "VERIFIABLE FACT"}</span>
            <h3 id="ammous-fact-title">{lang === "es" ? "La emisión es auditable" : "Issuance is auditable"}</h3>
            <p>{lang === "es" ? "La oferta y el subsidio de bloque se derivan de reglas que valida la red. El S2F mostrado es stock actual dividido por nueva emisión anualizada." : "Supply and block subsidy follow rules validated by the network. The displayed S2F is current stock divided by annualized new issuance."}</p>
            <a href="https://developer.bitcoin.org/devguide/block_chain.html" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir la guía pública de Bitcoin sobre la cadena de bloques en una pestaña nueva" : "Open Bitcoin’s public block-chain guide in a new tab"}>Bitcoin Developer Guide ↗</a>
          </article></li>
          <li><article aria-labelledby="ammous-thesis-title">
            <span>02 · {lang === "es" ? "TESIS DE AMMOUS" : "AMMOUS THESIS"}</span>
            <h3 id="ammous-thesis-title">{lang === "es" ? "Dureza y vendibilidad temporal" : "Hardness & salability across time"}</h3>
            <p>{lang === "es" ? "Una oferta difícil de ampliar puede proteger mejor el ahorro a largo plazo y favorecer una menor preferencia temporal. Es una explicación económica, no una identidad contable." : "A supply that is difficult to expand may better protect long-term saving and encourage lower time preference. This is an economic explanation, not an accounting identity."}</p>
            <a href="https://saifedean.com/tbs" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir la fuente de Saifedean Ammous para esta tesis en una pestaña nueva" : "Open Saifedean Ammous’s source for this thesis in a new tab"}>{lang === "es" ? "Fuente del autor" : "Author source"} ↗</a>
          </article></li>
          <li><article aria-labelledby="ammous-limit-title">
            <span>03 · {lang === "es" ? "LÍMITE Y CONTRASTE" : "LIMIT & COUNTERPOINT"}</span>
            <h3 id="ammous-limit-title">{lang === "es" ? "Escasez no equivale a precio" : "Scarcity is not price"}</h3>
            <p>{lang === "es" ? "El S2F mide escasez de flujo; no demuestra causalidad ni predice por sí solo la demanda, la liquidez o el precio. Por eso ABCM lo cruza con M2, dólar, oro, crédito y condiciones reales." : "S2F measures flow scarcity; it does not prove causality or independently predict demand, liquidity or price. ABCM therefore crosses it with M2, the dollar, gold, credit and real conditions."}</p>
            <a href="https://mises.org/mises-wire/critique-bitcoin-stock-flow-model" target="_blank" rel="noopener noreferrer" aria-label={lang === "es" ? "Abrir la crítica austriaca del modelo stock-to-flow en una pestaña nueva" : "Open the Austrian critique of the stock-to-flow model in a new tab"}>{lang === "es" ? "Crítica desde la Escuela Austriaca" : "Austrian-school critique"} ↗</a>
          </article></li>
        </ol>
      </section>

      <section className="quotes">
        <div className="quote-number">{String(quote+1).padStart(2,"0")} / {String(quotes.length).padStart(2,"0")}</div>
        <blockquote>“{quotes[quote].quote}”</blockquote>
        <div className="quote-meta"><strong>{quotes[quote].author}</strong><a href={quotes[quote].url} target="_blank" rel="noreferrer">{quotes[quote].work} ↗</a></div>
        <div className="quote-controls"><button onClick={() => setQuote((quote - 1 + quotes.length) % quotes.length)} aria-label={lang === "es" ? "Cita anterior" : "Previous quote"}>←</button><div>{quotes.map((_,i)=><button key={i} className={i===quote?"active":""} onClick={()=>setQuote(i)} aria-label={`${lang === "es" ? "Cita" : "Quote"} ${i+1}`}/>)}</div><button onClick={() => setQuote((quote + 1) % quotes.length)} aria-label={lang === "es" ? "Cita siguiente" : "Next quote"}>→</button></div>
      </section>

      <section className="sources" id="sources">
        <div><span className="kicker">{lang === "es" ? "06 · PROCEDENCIA" : "06 · PROVENANCE"}</span><h2>{t.sources}</h2><p>{t.disclaimer}</p></div>
        <div className="source-list">
          {[
            ["FRED API", lang === "es" ? "Ruta REST primaria para series monetarias, de crédito y macro cuando está configurado el secreto del servidor" : "Primary REST route for monetary, credit and macro series when the server secret is configured", "https://fred.stlouisfed.org/docs/api/fred/"],
            ["DBnomics", lang === "es" ? "Espejo normalizado de los datasets fuente de la Reserva Federal y EIA" : "Normalized mirror of Federal Reserve and EIA source datasets", "https://docs.db.nomics.world/web-api/"],
            ["U.S. BLS", lang === "es" ? "API pública para IPC y desempleo" : "Public API for CPI and unemployment", "https://www.bls.gov/developers/"],
            ["Cboe", lang === "es" ? "Histórico oficial diario de SPX y VIX" : "Official SPX and VIX daily history", "https://www.cboe.com/tradable_products/vix/vix_historical_data/"],
            ["World Bank", lang === "es" ? "PIB y ratios de deuda pública para contexto estructural" : "GDP and public-debt ratios for structural context", "https://datahelpdesk.worldbank.org/knowledgebase/articles/889392-about-the-indicators-api-documentation"],
            ["U.S. Treasury", lang === "es" ? "Deuda federal diaria de Fiscal Data cuando el origen está disponible" : "Daily federal debt from Fiscal Data when its origin is reachable", "https://fiscaldata.treasury.gov/datasets/debt-to-the-penny/"],
            ["Coinbase Exchange", lang === "es" ? "Ticker público primario BTC-USD" : "Primary public BTC-USD market ticker", "https://docs.cdp.coinbase.com/api-reference/exchange-api/rest-api/products/get-product-ticker"],
            ["Kraken", lang === "es" ? "Ticker público XBT-USD para confirmar o respaldar el precio de Bitcoin" : "Public XBT-USD ticker used to confirm or back up the Bitcoin price", "https://docs.kraken.com/api-reference/market-data/get-ticker-information"],
            ["Mempool.space", lang === "es" ? "Altura de bloque y mercado de comisiones de Bitcoin" : "Bitcoin block height and fee market", "https://mempool.space/"],
            ["World Monitor", lang === "es" ? "Inspiración de arquitectura y experiencia para redundancia, procedencia y salud de proveedores; sin copiar código ni endpoints" : "Architecture and UX inspiration for redundancy, provenance and provider health; no code or endpoints copied", "https://github.com/koala73/worldmonitor"],
            ["Saifedean Ammous", lang === "es" ? "The Bitcoin Standard, Principles of Economics y artículo revisado por pares sobre las funciones monetarias" : "The Bitcoin Standard, Principles of Economics and peer-reviewed work on monetary functions", "https://saifedean.com/books"],
            ["Lyn Alden", lang === "es" ? "Historia monetaria, redes de liquidación y análisis del papel de Bitcoin como bien monetario" : "Monetary history, settlement networks and analysis of Bitcoin as a monetary good", "https://www.lynalden.com/what-is-money/"],
            ["Robert Breedlove", lang === "es" ? "Ensayo público sobre dinero, Bitcoin y tiempo desde primeros principios" : "Public essay on money, Bitcoin and time from first principles", "https://breedlove22.medium.com/money-bitcoin-and-time-part-1-of-3-b4f6bb036c04"],
            ["Adam Back · Hashcash", lang === "es" ? "Paper técnico primario sobre el sistema proof-of-work precursor" : "Primary technical paper on the precursor proof-of-work system", "https://nakamotoinstitute.org/library/hashcash/"],
            ["Hal Finney · RPOW", lang === "es" ? "Archivo público del prototipo de pruebas de trabajo reutilizables" : "Public archive of the reusable proofs-of-work prototype", "https://nakamotoinstitute.org/finney/rpow/"],
            ["Parker Lewis", lang === "es" ? "Serie pública sobre Bitcoin, dinero, incentivos y propiedades monetarias" : "Public series on Bitcoin, money, incentives and monetary properties", "https://nakamotoinstitute.org/library/gradually-then-suddenly/"],
            ["Jameson Lopp", lang === "es" ? "Biblioteca pública de recursos de seguridad, privacidad, nodos y autocustodia" : "Public library of security, privacy, node and self-custody resources", "https://www.lopp.net/bitcoin-information.html"],
            ["Mises Institute", lang === "es" ? "Textos primarios, material educativo y crítica austriaca del modelo S2F" : "Primary texts, educational material and an Austrian critique of the S2F price model", "https://mises.org/mises-wire/critique-bitcoin-stock-flow-model"],
            ["ABCM Aprende", lang === "es" ? "Biblioteca editorial ampliada: fuentes primarias de Bitcoin, archivos cypherpunk, obras austriacas y evidencia empírica favorable y crítica" : "Expanded editorial library: primary Bitcoin sources, cypherpunk archives, Austrian works, and supportive and critical empirical evidence", `/learn?lang=${lang}`],
          ].map(([name,desc,url])=><a key={name} href={url} target="_blank" rel="noreferrer"><span><b>{name}</b><small>{desc}</small></span><em>↗</em></a>)}
        </div>
      </section>
      <footer>
        <span>{lang === "es" ? "ABCM · CONTEXTO HOY. MEJORES DECISIONES MAÑANA." : "ABCM · CONTEXT TODAY. BETTER DECISIONS TOMORROW."}</span>
        <span>
          SITES V{SITE_RELEASE} · DATA {DATA_SCHEMA_VERSION} · <a href="/api/health" target="_blank" rel="noreferrer">{lang === "es" ? "Integridad ↗" : "Integrity ↗"}</a> · <a href={`/learn?lang=${lang}`} target="_blank" rel="noreferrer">{lang === "es" ? "Aprende ↗" : "Learn ↗"}</a> · <a href="/privacidad">{lang === "es" ? "Privacidad" : "Privacy"}</a> · JimBLogic · 2026 · <a href="https://github.com/JimBLogic/AustrianBusinessCycleMonitor">GitHub ↗</a>
        </span>
        <ClearLocalPreferencesButton compact language={lang} />
      </footer>
      {detail&&<div className="detail-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
        <article id="detail-dialog" className="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <button ref={detailCloseRef} className="detail-close" type="button" onClick={() => setDetail(null)} aria-label={lang === "es" ? "Cerrar explicación" : "Close explanation"}>×</button>
          <span className="kicker">{detail.eyebrow}</span>
          <div className="detail-head"><h2 id="detail-title">{detail.title}</h2><strong>{detail.value}</strong></div>
          <div className="detail-layer fact"><b>{detail.factLabel ?? (lang === "es" ? "QUÉ DICE EL DATO" : "WHAT THE DATA SAYS")}</b><p>{detail.fact}</p></div>
          <div className="detail-layer lens"><b>{detail.interpretationLabel ?? (lang === "es" ? "INTERPRETACIÓN AUSTRIACA CONDICIONAL" : "CONDITIONAL AUSTRIAN INTERPRETATION")}</b><p>{detail.interpretation}</p></div>
          <div className="detail-layer watch"><b>{detail.watchLabel ?? (lang === "es" ? "QUÉ PODRÍA CONFIRMAR O INVALIDAR LA LECTURA" : "WHAT COULD CONFIRM OR INVALIDATE THE READING")}</b><p>{detail.watch}</p></div>
          <div className="detail-disclaimer">{lang === "es" ? "Información educativa y análisis macroeconómico experimental. No constituye asesoramiento financiero, recomendación de inversión ni señal de compraventa." : "Educational information and experimental macro analysis. This is not financial advice, an investment recommendation or a trading signal."}</div>
          <a className="detail-source" href={detail.sourceUrl} target="_blank" rel="noopener noreferrer">{detail.sourceLabel} ↗</a>
        </article>
      </div>}
      {disclaimerOpen && <div className="consent-overlay" role="presentation">
        <article className="consent-dialog" role="dialog" aria-modal="true" aria-labelledby="consent-title" aria-describedby="consent-copy">
          <span className="consent-kicker">{lang === "es" ? "ANTES DE ENTRAR · ALCANCE DEL PROYECTO" : "BEFORE ENTERING · PROJECT SCOPE"}</span>
          <h2 id="consent-title">{lang === "es" ? "Información y aprendizaje, no asesoramiento financiero." : "Information and learning, not financial advice."}</h2>
          <p id="consent-copy">{lang === "es"
            ? "ABCM combina datos de fuentes públicas con un modelo experimental y una interpretación condicionada desde la economía austriaca. No recomienda comprar, vender, mantener activos ni asignar capital. Los datos pueden publicarse con retraso, revisarse o quedar temporalmente incompletos."
            : "ABCM combines public-source data with an experimental model and a conditional Austrian-economics interpretation. It does not recommend buying, selling, holding assets or allocating capital. Data may be delayed, revised or temporarily incomplete."}</p>
          <div className="consent-points">
            <span>01</span><p>{lang === "es" ? "Separamos observaciones, cálculo e interpretación." : "Observations, calculations and interpretation are kept separate."}</p>
            <span>02</span><p>{lang === "es" ? "Ausencia de datos nunca equivale a una señal neutral." : "Missing data never equals a neutral signal."}</p>
            <span>03</span><p>{lang === "es" ? "Contrasta las fechas y fuentes antes de extraer conclusiones." : "Check dates and sources before drawing conclusions."}</p>
          </div>
          <button type="button" onClick={acceptDisclaimer}>{lang === "es" ? "Entiendo y acceder al monitor →" : "I understand — enter the monitor →"}</button>
          <small>{loading
            ? (lang === "es" ? "Mientras lees, estamos consultando las fuentes en segundo plano." : "While you read, sources are being refreshed in the background.")
            : (lang === "es" ? "Fuentes consultadas. El monitor está listo." : "Sources checked. The monitor is ready.")}</small>
        </article>
      </div>}
    </main>
  );
}
