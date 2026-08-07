"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type Lang = "en" | "es";
type Point = { date: string; value: number };
type Detail = {
  eyebrow: string;
  title: string;
  value: string;
  fact: string;
  interpretation: string;
  watch: string;
  sourceLabel: string;
  sourceUrl: string;
};
type VisitBaseline = {
  capturedAt: string;
  requestedAt: string;
  regime: string;
  composite: number;
  modelReady: boolean;
  bitcoinPrice: number | null;
  latestDates: Record<string, string | null>;
};
type Data = {
  observedAt: string;
  requestedAt: string;
  refreshMode: string;
  cache?: { generatedAt: string; validUntil: string; ttlSeconds: number; mode: string };
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
    scores: { liquidity: number; credit: number; realEconomy: number; inflation: number; fiscal: number; composite: number };
    regime: string;
    correlations: Record<string, number | null>;
    ratios: { bitcoinGoldOunces: number | null; sp500Gold: number | null; debtToM2: number | null; realRate: number | null };
  };
  freshness: Array<{ key: string; id: string; observedAt: string | null; status: string; error: string | null; source?: string | null }>;
  upstreams?: Array<{ id: string; status: "ready" | "recovering" | "cooldown"; coolingUntil?: string | null }>;
  provenance: {
    fred: string; bitcoinPrice: string; bitcoinNetwork: string; bitcoinHistory?: string; federalDebt?: string;
    fredAvailable?: number; fredTotal?: number; modelReady?: boolean;
    modelStatus?: "complete" | "provisional" | "withheld";
    modelInputsAvailable?: number; modelInputsTotal?: number; availableWeight?: number;
    engineReady?: Record<string, boolean>; mode: string;
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
    scores: { liquidity: 0, credit: 0, realEconomy: 0, inflation: 0, fiscal: 0, composite: 0 },
    regime: "mixed-transition",
    correlations: {},
    ratios: { bitcoinGoldOunces: null, sp500Gold: null, debtToM2: null, realRate: null },
  },
  freshness: [],
  provenance: { fred: "unavailable", bitcoinPrice: "unavailable", bitcoinNetwork: "unavailable", fredAvailable: 0, fredTotal: 16, modelReady: false, modelStatus: "withheld", modelInputsAvailable: 0, modelInputsTotal: 14, mode: "fallback" },
};

const text = {
  en: {
    nav: ["Dashboard", "Liquidity", "Hard assets", "Theory", "Sources"],
    live: "CURRENT MACRO MONITOR", title: "The cycle, decoded.", subtitle: "Official data. Austrian interpretation. Cypherpunk skepticism.",
    intro: "Track money, credit, production and hard assets in one verifiable macro dashboard. The facts stay separate from the thesis.",
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
    nav: ["Panel", "Liquidez", "Activos duros", "Teoría", "Fuentes"],
    live: "MONITOR MACRO ACTUALIZADO", title: "El ciclo, descifrado.", subtitle: "Datos oficiales. Interpretación austriaca. Escepticismo cypherpunk.",
    intro: "Dinero, crédito, producción y activos duros en un único panel macro verificable. Los hechos permanecen separados de la tesis.",
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
  m2: { en: "M2 money stock", es: "Masa monetaria M2", unit: "USD bn", source: "M2SL", color: "#c7ff18" },
  federalDebt: { en: "Federal debt", es: "Deuda federal", unit: "USD bn", source: "GFDEBTN", color: "#ff6b1a" },
  cpi: { en: "Consumer prices", es: "Precios al consumidor", unit: "index points", source: "CPIAUCSL", color: "#bba4ff" },
  oil: { en: "WTI crude oil", es: "Petróleo WTI", unit: "USD / barrel", source: "DCOILWTICO", color: "#f0c85a" },
  gold: { en: "Gold", es: "Oro", unit: "USD / troy oz", source: "GOLDAMGBD228NLBM", color: "#ffd15c" },
  sp500: { en: "S&P 500", es: "S&P 500", unit: "index points", source: "SP500", color: "#63d9c7" },
  vix: { en: "VIX stress", es: "Estrés VIX", unit: "index points", source: "VIXCLS", color: "#ff8c70" },
  industrialProduction: { en: "Industrial production", es: "Producción industrial", unit: "index points", source: "INDPRO", color: "#8ec5ff" },
  bitcoin: { en: "Bitcoin", es: "Bitcoin", unit: "USD", source: "BLOCKCHAIN", color: "#ff6417" },
};

const metrics = [
  { key: "m2", label: ["M2 money stock", "Masa monetaria M2"], source: "M2SL", risk: 76, fact: ["Broad money and near-money held by the public.", "Dinero amplio y activos casi monetarios en manos del público."], thesis: ["Fast money growth can distort relative prices before CPI reacts.", "Un crecimiento rápido puede distorsionar precios relativos antes de aparecer en el IPC."], watch: ["YoY growth and its gap with real output.", "Crecimiento interanual y su brecha frente al producto real."] },
  { key: "fedFunds", label: ["Federal funds rate", "Tipo de los fondos federales"], source: "FEDFUNDS", risk: 58, fact: ["The overnight policy rate anchoring dollar credit.", "El tipo oficial nocturno que ancla el crédito en dólares."], thesis: ["The issue is whether the administered rate diverges from genuine time preferences.", "La cuestión es si el tipo administrado diverge de las preferencias temporales reales."], watch: ["Cuts arriving while liquidity and asset prices accelerate.", "Recortes mientras la liquidez y los activos se aceleran."] },
  { key: "yieldCurve", label: ["10Y–2Y yield curve", "Curva 10A–2A"], source: "T10Y2Y", risk: 64, fact: ["The spread between long and short Treasury yields.", "Diferencia entre rendimientos del Tesoro largos y cortos."], thesis: ["Re-steepening after inversion can reveal the transition from boom to correction.", "La positivización tras invertirse puede revelar la transición del auge a la corrección."], watch: ["A rapid steepening driven by falling short rates.", "Un empinamiento rápido por caída de tipos cortos."] },
  { key: "creditSpread", label: ["Credit stress / BAA", "Estrés de crédito / BAA"], source: "BAA10Y", risk: 34, fact: ["Moody's BAA corporate yield minus the 10-year Treasury yield; unavailable observations stay unavailable.", "Rendimiento corporativo BAA de Moody's menos el Treasury a 10 años; si falta el dato se mantiene como no disponible."], thesis: ["Tight spreads can conceal malinvestment until refinancing conditions change.", "Diferenciales bajos pueden ocultar malas inversiones hasta que cambia la refinanciación."], watch: ["Stress acceleration, not merely its absolute level.", "La aceleración del estrés, no solo su nivel."] },
  { key: "cpi", label: ["Consumer price index", "Índice de precios al consumo"], source: "CPIAUCSL", risk: 55, fact: ["A basket-based measure of consumer prices.", "Medida de precios de una cesta de consumo."], thesis: ["CPI is a late and partial record of monetary effects.", "El IPC es un registro tardío y parcial de los efectos monetarios."], watch: ["Services, shelter and the distribution of new money.", "Servicios, vivienda y distribución del dinero nuevo."] },
  { key: "unemployment", label: ["Unemployment", "Desempleo"], source: "UNRATE", risk: 28, fact: ["Share of the labour force actively seeking work.", "Parte de la población activa que busca empleo."], thesis: ["Labour is usually a lagging confirmation, not an early cycle signal.", "El empleo suele confirmar tarde, no anticipar el ciclo."], watch: ["Rate of change and permanent job losses.", "Velocidad del cambio y pérdidas permanentes de empleo."] },
  { key: "federalDebt", label: ["US federal debt", "Deuda federal de EE. UU."], source: "GFDEBTN", risk: 82, fact: ["Gross federal debt outstanding.", "Deuda federal bruta en circulación."], thesis: ["Persistent fiscal dominance increases pressure for financial repression or monetary accommodation.", "El dominio fiscal persistente aumenta la presión hacia represión financiera o acomodo monetario."], watch: ["Interest expense, maturity wall and debt-to-GDP.", "Intereses, vencimientos y deuda sobre PIB."] },
  { key: "dollar", label: ["Broad dollar index", "Índice amplio del dólar"], source: "DTWEXBGS", risk: 46, fact: ["Trade-weighted value of the dollar.", "Valor del dólar ponderado por comercio."], thesis: ["Reserve demand can mask domestic dilution for long periods.", "La demanda de reserva puede ocultar la dilución interna durante mucho tiempo."], watch: ["Dollar weakness alongside commodity strength.", "Debilidad del dólar junto a fortaleza de materias primas."] },
  { key: "oil", label: ["WTI crude oil", "Petróleo WTI"], source: "DCOILWTICO", risk: 44, fact: ["Benchmark price for US crude oil.", "Precio de referencia del crudo estadounidense."], thesis: ["Energy prices expose real resource constraints that credit cannot print away.", "La energía revela restricciones reales que el crédito no puede imprimir."], watch: ["Oil rising while growth indicators weaken.", "Petróleo al alza mientras el crecimiento se debilita."] },
];

const quotes = [
  { quote: "Inflation is a policy.", author: "Ludwig von Mises", work: "Economic Policy", url: "https://mises.org/library/book/economic-policy-thoughts-today-and-tomorrow" },
  { quote: "The more the state plans, the more difficult planning becomes for the individual.", author: "F. A. Hayek", work: "The Road to Serfdom", url: "https://press.uchicago.edu/ucp/books/book/chicago/R/bo4138549.html" },
  { quote: "Money is a commodity whose economic function is to facilitate the interchange of goods and services.", author: "Carl Menger", work: "On the Origins of Money", url: "https://mises.org/library/book/origins-money" },
  { quote: "The State is the organization of robbery systematized and writ large.", author: "Murray N. Rothbard", work: "The Ethics of Liberty", url: "https://mises.org/library/book/ethics-liberty" },
  { quote: "Only Bitcoin can credibly serve as long term store of value.", author: "Saifedean Ammous", work: "Can cryptocurrencies fulfil the functions of money?", url: "https://www.sciencedirect.com/science/article/pii/S1062976917300777" },
];

function format(value: number | null | undefined, digits = 2) {
  if (value == null || !Number.isFinite(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: digits }).format(value);
}

function validTimestamp(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) && date.getUTCFullYear() >= 2000 ? date : null;
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

const fredSeriesIds: Record<string, string> = {
  m2: "M2SL",
  federalDebt: "GFDEBTN",
  oil: "DCOILWTICO",
  gold: "GOLDAMGBD228NLBM",
  dollar: "DTWEXBGS",
  sp500: "SP500",
  vix: "VIXCLS",
};

function seriesSourceUrl(data: Data, key: string) {
  const item = data.freshness.find((entry) => entry.key === key);
  if (item?.source === "dbnomics") return dbnomicsLinks[key] ?? "https://db.nomics.world/";
  if (item?.source === "bls") return key === "unemployment"
    ? "https://data.bls.gov/timeseries/LNS14000000"
    : "https://data.bls.gov/timeseries/CUSR0000SA0";
  if (item?.source === "cboe") return key === "vix"
    ? "https://www.cboe.com/tradable_products/vix/vix_historical_data/"
    : "https://www.cboe.com/tradable_products/sp_500/spx_options/";
  if (item?.source === "worldbank") return "https://data.worldbank.org/indicator/GC.DOD.TOTL.GD.ZS?locations=US";
  if (item?.source === "coinbase") return "https://www.coinbase.com/price/pax-gold";
  return `https://fred.stlouisfed.org/series/${item?.id ?? metrics.find((metric) => metric.key === key)?.source ?? fredSeriesIds[key] ?? key}`;
}

function bitcoinSourceUrl(data: Data) {
  if (data.provenance.bitcoinPrice === "Coinbase + Kraken") return "https://docs.kraken.com/api-reference/market-data/get-ticker-information";
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

function LineChart({ points, color, unit, horizon }: { points: Point[]; color: string; unit: string; horizon: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const shown = points.slice(horizon === 0 ? 0 : -horizon);
  const values = shown.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = shown.map((p, i) => ({
    ...p, x: shown.length === 1 ? 50 : 5 + (i / (shown.length - 1)) * 90,
    y: 88 - ((p.value - min) / range) * 74,
  }));
  const path = coords.map((p) => `${p.x},${p.y}`).join(" ");
  function move(event: React.MouseEvent<SVGSVGElement>) {
    if (!svgRef.current || !coords.length) return;
    const rect = svgRef.current.getBoundingClientRect();
    const percent = (event.clientX - rect.left) / rect.width;
    setHover(Math.max(0, Math.min(coords.length - 1, Math.round(percent * (coords.length - 1)))));
  }
  const selected = hover == null ? coords.at(-1) : coords[hover];
  return (
    <div className="line-chart">
      <div className="chart-readout">
        <strong>{format(selected?.value)} <small>{unit}</small></strong>
        <span>{selected?.date ? selected.date.slice(0, 7) : "—"}</span>
      </div>
      <svg ref={svgRef} viewBox="0 0 100 100" preserveAspectRatio="none" onMouseMove={move} onMouseLeave={() => setHover(null)} role="img" aria-label="Interactive time series">
        {[14, 32.5, 51, 69.5, 88].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} className="grid-line" />)}
        <defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={color} stopOpacity=".32"/><stop offset="1" stopColor={color} stopOpacity="0"/></linearGradient></defs>
        {coords.length > 1 && <polygon points={`5,88 ${path} 95,88`} fill="url(#area)" />}
        <polyline points={path} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        {selected && <><line x1={selected.x} x2={selected.x} y1="10" y2="90" className="hover-line"/><circle cx={selected.x} cy={selected.y} r="1.5" fill={color}/></>}
      </svg>
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

function NormalizedChart({ data, selected, lang }: { data: Data; selected: string[]; lang: Lang }) {
  const lines = selected.map((key) => {
    const points = (data.series[key] ?? []).slice(-60);
    const base = points[0]?.value || 1;
    const normalized = points.map((point, index) => ({
      ...point,
      x: points.length === 1 ? 50 : 5 + (index / (points.length - 1)) * 90,
      y: 0,
      normalized: (point.value / base) * 100,
    }));
    const values = normalized.map((point) => point.normalized);
    return { key, normalized, min: Math.min(...values), max: Math.max(...values) };
  }).filter((line) => line.normalized.length > 1);
  const all = lines.flatMap((line) => line.normalized.map((point) => point.normalized));
  const min = Math.min(...all, 90);
  const max = Math.max(...all, 110);
  const range = max - min || 1;
  return (
    <div className="normalized-chart">
      <div className="normal-legend">{selected.map((key) => <span key={key}><i style={{ background: mixMeta[key].color }} />{mixMeta[key][lang]}</span>)}</div>
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Normalized multi-asset comparison">
        {[15, 33, 51, 69, 87].map((y) => <line key={y} x1="5" x2="95" y1={y} y2={y} className="grid-line" />)}
        {lines.map((line) => {
          const path = line.normalized.map((point) => `${point.x},${87 - ((point.normalized - min) / range) * 72}`).join(" ");
          return <polyline key={line.key} points={path} fill="none" stroke={mixMeta[line.key].color} strokeWidth="1.3" vectorEffect="non-scaling-stroke" />;
        })}
      </svg>
      <div className="normal-axis"><span>{lang === "es" ? "Hace 60 observaciones" : "60 observations ago"}</span><b>BASE 100</b><span>{lang === "es" ? "Último dato" : "Latest"}</span></div>
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
      en: ["Low distortion", "The five engines show little simultaneous pressure. This does not mean “no risk”: it means the model sees few cycle distortions in the variables it measures."],
      es: ["Distorsión baja", "Los cinco motores muestran poca presión simultánea. No significa «sin riesgo»: significa que el modelo detecta pocas distorsiones cíclicas en las variables que mide."],
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
  const [horizon, setHorizon] = useState(60);
  const [selectedMetric, setSelectedMetric] = useState(metrics[0]);
  const [lens, setLens] = useState<"facts" | "thesis">("facts");
  const [quote, setQuote] = useState(0);
  const [menu, setMenu] = useState(false);
  const [selectedMix, setSelectedMix] = useState(["m2", "sp500", "gold", "bitcoin"]);
  const [refreshNotice, setRefreshNotice] = useState("");
  const [detail, setDetail] = useState<Detail | null>(null);
  const [visitBaseline, setVisitBaseline] = useState<VisitBaseline | null>(null);
  const [watchlist, setWatchlist] = useState<string[]>(["m2", "creditSpread", "bitcoin"]);
  const previousData = useRef<Data>(fallback);
  const t = text[lang];

  const load = useCallback(async (manual = false) => {
    setLoading(true);
    setRefreshNotice(manual ? (lang === "es" ? "Solicitando la instantánea compartida más reciente…" : "Requesting the latest shared snapshot…") : "");
    try {
      const response = await fetch("/api/data", { cache: "no-store" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const next: Data = await response.json();
      if (next.provenance.mode === "fallback") throw new Error("No upstream source returned a usable snapshot");
      const old = previousData.current;
      const changedMacro = Object.keys(next.latest).filter((key) => next.latest[key]?.date !== old.latest[key]?.date).length;
      const btcMove = old.bitcoin.price && next.bitcoin.price ? next.bitcoin.price - old.bitcoin.price : null;
      setData(next);
      previousData.current = next;
      try {
        window.localStorage.setItem("abcm:last-valid-snapshot", JSON.stringify(next));
        window.localStorage.setItem("abcm:visit-baseline", JSON.stringify({
          capturedAt: new Date().toISOString(),
          requestedAt: next.requestedAt,
          regime: next.derived.regime,
          composite: next.derived.scores.composite,
          modelReady: next.provenance.modelReady === true,
          bitcoinPrice: next.bitcoin.price,
          latestDates: Object.fromEntries(Object.entries(next.latest).map(([key, point]) => [key, point?.date ?? null])),
        } satisfies VisitBaseline));
      } catch {
        // Storage is an optional performance enhancement; live data still works without it.
      }
      if (manual) setRefreshNotice(lang === "es"
        ? `Instantánea sincronizada · BTC ${btcMove == null ? "sin dato" : `${btcMove >= 0 ? "+" : ""}$${format(btcMove, 0)}`} · ${changedMacro} series macro con nueva fecha`
        : `Snapshot synchronized · BTC ${btcMove == null ? "unavailable" : `${btcMove >= 0 ? "+" : ""}$${format(btcMove, 0)}`} · ${changedMacro} macro series with a new date`);
    } catch {
      setRefreshNotice(lang === "es" ? "No se pudo completar la consulta. Se conserva el último snapshot válido." : "Fresh query failed. Keeping the last valid snapshot.");
    } finally { setLoading(false); }
  }, [lang]);
  const loadBitcoin = useCallback(async () => {
    try {
      const response = await fetch("/api/bitcoin", { cache: "no-store" });
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
    const initial = window.setTimeout(() => {
      try {
        const cached = window.localStorage.getItem("abcm:last-valid-snapshot");
        if (cached) {
          const snapshot = JSON.parse(cached) as Data;
          if (snapshot?.latest && snapshot?.derived && snapshot?.provenance?.mode !== "fallback") {
            setData(snapshot);
            previousData.current = snapshot;
          }
        }
        const storedConsent = window.localStorage.getItem("abcm:educational-notice:v1") === "accepted";
        const cookieConsent = document.cookie.split("; ").includes("abcm_educational_notice_v1=accepted");
        setDisclaimerOpen(!storedConsent && !cookieConsent);
        const savedBaseline = window.localStorage.getItem("abcm:visit-baseline");
        if (savedBaseline) setVisitBaseline(JSON.parse(savedBaseline) as VisitBaseline);
        const savedWatchlist = window.localStorage.getItem("abcm:watchlist");
        if (savedWatchlist) {
          const parsed = JSON.parse(savedWatchlist) as string[];
          if (Array.isArray(parsed) && parsed.length) setWatchlist(parsed);
        }
      } catch {
        setDisclaimerOpen(!document.cookie.split("; ").includes("abcm_educational_notice_v1=accepted"));
      }
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
    const validUntil = data.cache?.validUntil
      ? new Date(data.cache.validUntil).getTime()
      : new Date(data.requestedAt).getTime() + 900_000;
    if (!Number.isFinite(validUntil) || data.provenance.mode === "fallback") return;
    // A small per-device jitter prevents every open tab requesting the new
    // shared snapshot on the exact same millisecond.
    const delay = Math.max(60_000, validUntil - Date.now() + Math.floor(Math.random() * 30_000));
    const id = window.setTimeout(() => void load(false), delay);
    return () => window.clearTimeout(id);
  }, [data.cache?.validUntil, data.provenance.mode, data.requestedAt, load]);
  useEffect(() => { const id = setInterval(() => setQuote((q) => (q + 1) % quotes.length), 12_000); return () => clearInterval(id); }, []);
  useEffect(() => {
    if (!detail) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setDetail(null); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [detail]);

  const cycleScore = data.derived.scores.composite;
  const modelStatus = data.provenance.modelStatus ?? (data.provenance.modelReady ? "complete" : "withheld");
  const modelAvailable = data.provenance.mode !== "fallback" && modelStatus !== "withheld";
  const modelProvisional = modelStatus === "provisional";
  const cycle = cycleBand(cycleScore, lang);
  const scoreComponents = [
    { key: "liquidity", label: lang === "es" ? "Liquidez" : "Liquidity", score: data.derived.scores.liquidity, weight: 0.27, inputs: "M2 YoY · Δ Fed funds · tipo real" },
    { key: "credit", label: lang === "es" ? "Crédito" : "Credit", score: data.derived.scores.credit, weight: 0.23, inputs: "BAA–10Y · 10Y–2Y · VIX" },
    { key: "real", label: lang === "es" ? "Economía real" : "Real economy", score: data.derived.scores.realEconomy, weight: 0.20, inputs: "INDPRO YoY · Δ paro · Δ capacidad" },
    { key: "inflation", label: lang === "es" ? "Inflación" : "Inflation", score: data.derived.scores.inflation, weight: 0.15, inputs: "CPI YoY · WTI 90d · dólar 90d" },
    { key: "fiscal", label: lang === "es" ? "Fiscal" : "Fiscal", score: data.derived.scores.fiscal, weight: 0.15, inputs: "Deuda YoY · deuda/PIB" },
  ];
  const gold = latestValue(data, "gold");
  const debt = latestValue(data, "treasuryDebt") ?? latestValue(data, "federalDebt");
  const btc = data.bitcoin.price;
  const meta = seriesMeta[seriesKey];
  const points = data.series[seriesKey] ?? [];
  const regime = regimeText(data.derived.regime, lang);
  const goldSource = seriesSource(data, "gold");
  const engineAssessments = ([
    ["liquidity", data.derived.scores.liquidity],
    ["credit", data.derived.scores.credit],
    ["realEconomy", data.derived.scores.realEconomy],
    ["inflation", data.derived.scores.inflation],
    ["fiscal", data.derived.scores.fiscal],
  ] as Array<[keyof typeof engineLabels, number]>).map(([key, score]) => ({
    key, score, label: engineLabels[key][lang === "en" ? 0 : 1], ...engineReading(key, score, lang),
  }));
  const strongest = [...engineAssessments].sort((a, b) => b.score - a.score)[0];
  const weakest = [...engineAssessments].sort((a, b) => a.score - b.score)[0];
  const divergence = strongest && weakest ? strongest.score - weakest.score : 0;
  const snapshotDate = data.provenance.mode === "fallback" ? null : validTimestamp(data.requestedAt);
  const snapshotAgeMinutes = snapshotDate
    ? Math.max(0, Math.floor((clock - snapshotDate.getTime()) / 60_000))
    : null;
  const snapshotNeedsRefresh = snapshotAgeMinutes == null || snapshotAgeMinutes >= 15;
  const snapshotTimestamp = snapshotDate
    ? new Intl.DateTimeFormat(lang === "es" ? "es-ES" : "en-GB", {
      dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Madrid",
    }).format(snapshotDate)
    : "—";
  const nextRefreshDate = data.cache?.validUntil
    ? validTimestamp(data.cache.validUntil)
    : snapshotDate ? new Date(snapshotDate.getTime() + 900_000) : null;
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
  const upstreamReady = data.upstreams?.filter((item) => item.status === "ready").length ?? 0;
  const upstreamCooling = data.upstreams?.filter((item) => item.status === "cooldown").length ?? 0;

  function showEngine(key: keyof typeof engineLabels, score: number) {
    const reading = engineReading(key, score, lang);
    setDetail({
      eyebrow: `${reading.range} · ${lang === "es" ? "LECTURA CONDICIONAL" : "CONDITIONAL READING"}`,
      title: engineLabels[key][lang === "en" ? 0 : 1],
      value: modelAvailable ? `${score}/100` : "—",
      fact: modelAvailable ? reading.fact : (lang === "es" ? "Las entradas necesarias para este motor no tienen cobertura suficiente. No se asigna un cero ni una lectura neutral." : "The required inputs for this engine lack sufficient coverage. No zero or neutral reading is assigned."),
      interpretation: modelAvailable ? reading.interpretation : (lang === "es" ? "La lente austriaca queda suspendida hasta disponer de observaciones verificables." : "The Austrian interpretation is withheld until verifiable observations are available."),
      watch: modelAvailable ? reading.watch : (lang === "es" ? "Consultar el estado de fuentes y la fecha de cada observación." : "Check source status and each observation date."),
      sourceLabel: lang === "es" ? "Fórmula, entradas y fuentes" : "Formula, inputs and sources",
      sourceUrl: "/api/data-manifest",
    });
  }

  function acceptDisclaimer() {
    try {
      window.localStorage.setItem("abcm:educational-notice:v1", "accepted");
    } catch {
      // Cookie below provides a standards-based fallback.
    }
    document.cookie = "abcm_educational_notice_v1=accepted; Max-Age=31536000; Path=/; SameSite=Lax";
    setDisclaimerOpen(false);
  }

  function toggleWatch(key: string) {
    setWatchlist((current) => {
      const next = current.includes(key)
        ? (current.length === 1 ? current : current.filter((item) => item !== key))
        : [...current, key].slice(-4);
      try { window.localStorage.setItem("abcm:watchlist", JSON.stringify(next)); } catch { /* device-local enhancement */ }
      return next;
    });
  }

  const tape = [
    {
      name: "BTC / USD",
      value: `$${format(btc, 0)}`,
      unit: data.bitcoin.change24h == null ? "USD" : `USD · 24h ${data.bitcoin.change24h >= 0 ? "+" : ""}${format(data.bitcoin.change24h)}%`,
      source: data.provenance.bitcoinPrice.replace(" Exchange", "").toUpperCase(),
      date: data.bitcoin.priceObservedAt?.slice(0, 10) ?? "—",
      url: bitcoinSourceUrl(data),
    },
    {
      name: goldSource === "COINBASE"
        ? (lang === "es" ? "ORO · PROXY PAXG" : "GOLD · PAXG PROXY")
        : (lang === "es" ? "ORO / USD" : "GOLD / USD"),
      value: `$${format(gold)}`,
      unit: goldSource === "COINBASE"
        ? (lang === "es" ? "1 PAXG ≈ 1 onza troy · USD" : "1 PAXG ≈ 1 troy ounce · USD")
        : (lang === "es" ? "USD por onza troy" : "USD per troy ounce"),
      source: goldSource === "COINBASE" ? "COINBASE · PAXG" : goldSource,
      date: observedDate(data, "gold"),
      url: seriesSourceUrl(data, "gold"),
    },
    {
      name: lang === "es" ? "PETRÓLEO WTI" : "WTI CRUDE OIL",
      value: `$${format(latestValue(data, "oil"))}`,
      unit: lang === "es" ? "USD por barril" : "USD per barrel",
      source: seriesSource(data, "oil"),
      date: observedDate(data, "oil"),
      url: seriesSourceUrl(data, "oil"),
    },
    {
      name: "S&P 500",
      value: format(latestValue(data, "sp500")),
      unit: lang === "es" ? "Puntos de índice" : "Index points",
      source: seriesSource(data, "sp500"),
      date: observedDate(data, "sp500"),
      url: seriesSourceUrl(data, "sp500"),
    },
    {
      name: lang === "es" ? "DÓLAR · ÍNDICE AMPLIO" : "DOLLAR · BROAD INDEX",
      value: format(latestValue(data, "dollar")),
      unit: lang === "es" ? "Base 100 · enero 2006" : "Base 100 · January 2006",
      source: seriesSource(data, "dollar"),
      date: observedDate(data, "dollar"),
      url: seriesSourceUrl(data, "dollar"),
    },
    {
      name: lang === "es" ? "DEUDA FEDERAL EE. UU." : "US FEDERAL DEBT",
      value: debt == null ? "—" : `$${format(debt / 1000, 1)}T`,
      unit: lang === "es" ? "USD · billones" : "USD · trillions",
      source: data.provenance.federalDebt === "U.S. Treasury Fiscal Data" ? "TREASURY" : `${seriesSource(data, "federalDebt")}${data.provenance.federalDebt === "World Bank" ? " · EST." : ""}`,
      date: observedDate(data, latestValue(data, "treasuryDebt") ? "treasuryDebt" : "federalDebt"),
      url: debtSourceUrl(data),
    },
  ];
  const visitAgeHours = visitBaseline
    ? Math.max(0, Math.floor((clock - new Date(visitBaseline.capturedAt).getTime()) / 3_600_000))
    : null;
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
  const watchChoices = [
    { key: "m2", label: "M2", value: format(latestValue(data, "m2")), date: observedDate(data, "m2") },
    { key: "creditSpread", label: lang === "es" ? "Crédito BAA" : "BAA credit", value: format(latestValue(data, "creditSpread")), date: observedDate(data, "creditSpread") },
    { key: "cpi", label: "CPI", value: format(latestValue(data, "cpi")), date: observedDate(data, "cpi") },
    { key: "unemployment", label: lang === "es" ? "Desempleo" : "Unemployment", value: `${format(latestValue(data, "unemployment"))}%`, date: observedDate(data, "unemployment") },
    { key: "federalDebt", label: lang === "es" ? "Deuda" : "Debt", value: debt == null ? "—" : `$${format(debt / 1000, 1)}T`, date: observedDate(data, "federalDebt") },
    { key: "bitcoin", label: "Bitcoin", value: `$${format(btc, 0)}`, date: data.bitcoin.priceObservedAt?.slice(0, 10) ?? "—" },
  ];

  return (
    <main>
      <nav className="nav">
        <a className="brand" href="#top"><span className="brand-mark">₿</span><span>ABCM</span></a>
        <div className={`nav-links ${menu ? "open" : ""}`} id="primary-navigation">
          {["dashboard", "liquidity", "hard-assets", "theory", "sources"].map((id, i) => <a key={id} href={`#${id}`} onClick={() => setMenu(false)}>{t.nav[i]}</a>)}
          <a className="academy-nav" href={`/learn?lang=${lang}`} target="_blank" rel="noreferrer" onClick={() => setMenu(false)}>{lang === "es" ? "Aprende ↗" : "Learn ↗"}</a>
        </div>
        <div className="nav-controls">
          <button className="lang" onClick={() => setLang(lang === "en" ? "es" : "en")} aria-label={lang === "es" ? "Cambiar idioma a inglés" : "Switch language to Spanish"}>{lang === "en" ? "ES" : "EN"}</button>
          <button className="menu" onClick={() => setMenu(!menu)} aria-label={lang === "es" ? "Abrir navegación" : "Open navigation"} aria-expanded={menu} aria-controls="primary-navigation">☰</button>
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
            <h1>{t.title}</h1><h2>{t.subtitle}</h2>
            <p className="lede">{t.intro}</p>
            <div className="actions">
              <a className="primary" href="#dashboard">{t.nav[0]} <span>↓</span></a>
              <button className="secondary" onClick={() => load(true)} disabled={loading || !refreshUnlocked} title={!refreshUnlocked ? (lang === "es" ? `Disponible en ${refreshCountdown}` : `Available in ${refreshCountdown}`) : undefined}>{loading ? "···" : "↻"} {refreshUnlocked ? t.refresh : refreshCountdown}</button>
            </div>
            <div className={`snapshot-status ${snapshotNeedsRefresh ? "needs-refresh" : "current"}`} role="status" aria-live="polite">
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
                  ? (lang === "es" ? `Esta instantánea tiene ${snapshotAgeMinutes} min. El sistema solicitará automáticamente la siguiente versión compartida sin multiplicar consultas a las fuentes.` : `This snapshot is ${snapshotAgeMinutes} min old. The system will automatically request the next shared version without multiplying source queries.`)
                  : (lang === "es" ? `Generada hace ${snapshotAgeMinutes} min. Todos los visitantes comparten esta copia; el briefing personal se calcula únicamente en su dispositivo.` : `Generated ${snapshotAgeMinutes} min ago. Every visitor shares this copy; the personal briefing is calculated only on their device.`)}</p>
            </div>
            {refreshNotice && <div className={`refresh-notice ${refreshNotice.includes("failed") || refreshNotice.includes("No se") ? "error" : ""}`}>{refreshNotice}</div>}
          </div>
          <article className="regime-card">
            <div className="card-top"><span>{t.regime}</span><span className="status">{data.derived.regime.replaceAll("-", " ").toUpperCase()}</span></div>
            <div className="score-row">
              <button className="score-ring" type="button" onClick={() => document.getElementById("cycle-methodology")?.scrollIntoView({ behavior: "smooth", block: "start" })} style={{"--risk": `${modelAvailable ? cycleScore * 3.6 : 0}deg`} as React.CSSProperties} aria-label={lang === "es" ? "Abrir la metodología del índice" : "Open index methodology"}><strong>{modelAvailable ? cycleScore : "—"}</strong></button>
              <div><span>{t.risk}</span><b>{t.confidence}: {data.provenance.modelInputsAvailable ?? 0}/{data.provenance.modelInputsTotal ?? 14} {lang === "es" ? "ENTRADAS" : "INPUTS"}</b></div>
            </div>
            <div className="score-adaptive">
              <span>{modelAvailable ? `${cycle.range} · ${cycle.title}${modelProvisional ? " · PROVISIONAL" : ""}` : (lang === "es" ? "MODELO NO CALCULADO" : "MODEL NOT CALCULATED")}</span>
              <p>{modelAvailable
                ? modelProvisional
                  ? (lang === "es" ? `${cycle.body} Lectura reponderada con los motores completos disponibles; la ausencia no se convierte en cero ni en señal neutral.` : `${cycle.body} Reweighted from complete available engines; missing data is not converted into zero or a neutral signal.`)
                  : cycle.body
                : (lang === "es" ? "No hay cobertura suficiente para una lectura responsable. Los paneles con datos verificados siguen disponibles y los huecos quedan identificados." : "Coverage is too low for a responsible reading. Panels with verified data remain available and gaps are identified.")}</p>
              <div className="method-cta-row">
                <button type="button" onClick={() => document.getElementById("cycle-methodology")?.scrollIntoView({ behavior: "smooth", block: "start" })}>{lang === "es" ? "Ver cálculo, pesos y fuentes" : "See calculation, weights & sources"} ↓</button>
                <a href="/api/data-manifest" target="_blank" rel="noreferrer">{lang === "es" ? "Metodología directa" : "Direct methodology"} ↗</a>
              </div>
            </div>
            <small>{t.updated}: {snapshotDate ? `${snapshotDate.toISOString().replace("T"," ").slice(0,19)} UTC` : "—"} · {data.provenance.fredAvailable ?? 0}/{data.provenance.fredTotal ?? 0} {lang === "es" ? "SERIES MACRO" : "MACRO SERIES"}</small>
          </article>
        </div>
      </section>

      <section className="market-tape-wrap" aria-label={lang === "es" ? "Datos de mercado y fuentes" : "Market data and sources"}>
        <div className="market-tape">
          {tape.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={item.name} title={lang === "es" ? `Abrir fuente: ${item.source}` : `Open source: ${item.source}`}>
            <span>{item.name}</span>
            <strong>{item.value}</strong>
            <small className="tape-unit">{item.unit}</small>
            <small className="tape-source">{item.source} · {item.date} ↗</small>
          </a>)}
        </div>
        <div className="market-definitions">
          <p><b>{lang === "es" ? "DÓLAR 120,08 ≠ 120 USD." : "DOLLAR 120.08 ≠ USD 120."}</b> {lang === "es"
            ? "Es el índice amplio del dólar ponderado por comercio. El nivel 100 corresponde a enero de 2006; 120,08 indica que el índice está aproximadamente un 20,08% por encima de aquella base, no un cambio frente a una sola divisa."
            : "It is the trade-weighted broad dollar index. A level of 100 corresponds to January 2006; 120.08 means the index is roughly 20.08% above that base, not an exchange rate against one currency."}</p>
          <p><b>WTI</b> {lang === "es"
            ? "significa West Texas Intermediate: crudo ligero de referencia en Estados Unidos. Su cotización se expresa en dólares por barril."
            : "means West Texas Intermediate: a benchmark light crude oil price in the United States, quoted in dollars per barrel."}</p>
        </div>
        <div className={`bitcoin-consensus ${bitcoinConsensus}`} role="status" aria-live="polite">
          <div>
            <span>{lang === "es" ? "BITCOIN · CALIDAD DEL PRECIO" : "BITCOIN · PRICE QUALITY"}</span>
            <strong>{bitcoinConsensus === "confirmed"
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
          <div className="provider-health"><span>{lang === "es" ? "PROVEEDORES" : "PROVIDERS"}</span><b>{upstreamReady} {lang === "es" ? "ACTIVOS" : "READY"} · {upstreamCooling} {lang === "es" ? "EN PAUSA" : "COOLING"}</b><a href="/api/health" target="_blank" rel="noreferrer">{lang === "es" ? "Ver estado" : "Inspect"} ↗</a></div>
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
            <div className="visit-title"><span>{lang === "es" ? "BRIEFING DE 60 SEGUNDOS" : "60-SECOND BRIEFING"}</span><b>{visitAgeHours == null ? (lang === "es" ? "PRIMERA VISITA" : "FIRST VISIT") : visitAgeHours < 1 ? (lang === "es" ? "< 1 HORA" : "< 1 HOUR") : `${visitAgeHours}H`}</b></div>
            <div className="change-cells">
              <div><span>{lang === "es" ? "RÉGIMEN" : "REGIME"}</span><strong>{regimeChanged ? (lang === "es" ? "CAMBIÓ" : "CHANGED") : visitBaseline ? (lang === "es" ? "SIN CAMBIO" : "UNCHANGED") : "—"}</strong><small>{regime.title}</small></div>
              <div><span>{lang === "es" ? "ÍNDICE" : "INDEX"}</span><strong>{compositeDelta == null ? "—" : `${compositeDelta >= 0 ? "+" : ""}${compositeDelta}`}</strong><small>{modelAvailable ? `${cycleScore}/100` : (lang === "es" ? "No calculado" : "Withheld")}</small></div>
              <div><span>{lang === "es" ? "NUEVAS PUBLICACIONES" : "NEW RELEASES"}</span><strong>{releasedSinceVisit ?? "—"}</strong><small>{lang === "es" ? "Fechas de serie distintas" : "Changed series dates"}</small></div>
              <div><span>BITCOIN</span><strong>{bitcoinDelta == null ? "—" : `${bitcoinDelta >= 0 ? "+" : ""}${format(bitcoinDelta)}%`}</strong><small>{lang === "es" ? "Desde el punto guardado" : "Since saved checkpoint"}</small></div>
            </div>
            <div className="brief-reading">
              <b>{lang === "es" ? "LECTURA CONDICIONAL ACTUAL" : "CURRENT CONDITIONAL READING"}</b>
              <p>{modelAvailable
                ? (lang === "es"
                  ? `${regime.body} La mayor presión está en ${strongest.label.toLowerCase()} (${strongest.score}/100) y la menor en ${weakest.label.toLowerCase()} (${weakest.score}/100).`
                  : `${regime.body} Highest pressure sits in ${strongest.label.toLowerCase()} (${strongest.score}/100), lowest in ${weakest.label.toLowerCase()} (${weakest.score}/100).`)
                : (lang === "es" ? "No existe cobertura suficiente para resumir el régimen. Revisa las fuentes o solicita una actualización." : "Coverage is insufficient to summarize the regime. Check sources or request a refresh.")}</p>
            </div>
            <div className="return-actions"><button type="button" onClick={() => load(true)} disabled={loading || !refreshUnlocked}>↻ {refreshUnlocked ? t.refresh : refreshCountdown}</button><a href={`/learn?lang=${lang}`}>{lang === "es" ? "Comprender la lectura" : "Understand the reading"} →</a></div>
          </article>
          <aside className="personal-watch">
            <div><span>{lang === "es" ? "MI RADAR · EN ESTE DISPOSITIVO" : "MY RADAR · ON THIS DEVICE"}</span><b>{watchlist.length}/4</b></div>
            <p>{lang === "es" ? "Elige hasta cuatro variables para encontrarlas juntas cuando vuelvas." : "Choose up to four variables to find together when you return."}</p>
            <div className="watch-picker">{watchChoices.map((item) => <button type="button" className={watchlist.includes(item.key) ? "active" : ""} onClick={() => toggleWatch(item.key)} key={item.key} aria-pressed={watchlist.includes(item.key)}>{watchlist.includes(item.key) ? "✓ " : "+ "}{item.label}</button>)}</div>
            <div className="watch-values">{watchChoices.filter((item) => watchlist.includes(item.key)).map((item) => <div key={item.key}><span>{item.label}</span><strong>{item.value}</strong><small>{item.date}</small></div>)}</div>
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
          <a href="/api/health" target="_blank" rel="noreferrer"><span>01 · {lang === "es" ? "ESTADO DE FUENTES" : "SOURCE HEALTH"}</span><strong>{data.provenance.fredAvailable ?? 0}/{data.provenance.fredTotal ?? 0}</strong><p>{lang === "es" ? `${upstreamReady} proveedores listos · ${upstreamCooling} en enfriamiento.` : `${upstreamReady} providers ready · ${upstreamCooling} cooling down.`}</p><b>{lang === "es" ? "Comprobar" : "Inspect"} ↗</b></a>
          <a href="/api/data-manifest" target="_blank" rel="noreferrer"><span>02 · {lang === "es" ? "CONTRATO DE DATOS" : "DATA CONTRACT"}</span><strong>v1.1</strong><p>{lang === "es" ? "Entradas, fórmulas, pesos y límites." : "Inputs, formulas, weights and limits."}</p><b>{lang === "es" ? "Auditar" : "Audit"} ↗</b></a>
          <a href="/api/data" target="_blank" rel="noreferrer"><span>03 · {lang === "es" ? "SALIDA PORTABLE" : "PORTABLE OUTPUT"}</span><strong>JSON</strong><p>{lang === "es" ? "Salida reutilizable y legible por máquinas." : "Reusable machine-readable output."}</p><b>{lang === "es" ? "Abrir datos" : "Open data"} ↗</b></a>
          <a href="https://github.com/JimBLogic/AustrianBusinessCycleMonitor" target="_blank" rel="noreferrer"><span>04 · {lang === "es" ? "COMPILACIÓN REPRODUCIBLE" : "REPRODUCIBLE BUILD"}</span><strong>MIT</strong><p>{lang === "es" ? "Código, pruebas y ejecución local." : "Code, tests and local execution."}</p><b>{lang === "es" ? "Ver repositorio" : "Open repository"} ↗</b></a>
        </div>
      </section>

      <section className="engine-section" id="engine">
        <div className="section-head">
          <div>
            <span className="kicker">{lang === "es" ? "00 · MOTOR DE INTERPRETACIÓN ACTUAL" : "00 · LIVE INTERPRETATION ENGINE"}</span>
            <h2>{lang === "es" ? "Los datos hablan entre sí." : "The data talks to itself."}</h2>
            <p>{lang === "es" ? "Cada actualización recalcula el régimen, los cinco motores macro, las correlaciones y los ratios. No se limita a mostrar cotizaciones aisladas." : "Every refresh recomputes the regime, five macro engines, correlations and ratios. It does not stop at isolated quotes."}</p>
          </div>
          <div className="engine-badge"><span>{lang === "es" ? "ACTUALIZACIÓN" : "REFRESH"}</span><b>{lang === "es" ? "SNAPSHOT COMPARTIDO · 15 MIN" : "SHARED SNAPSHOT · 15 MIN"}</b></div>
        </div>
        <div className="score-strip">
          {[
            ["liquidity", lang === "es" ? "Liquidez" : "Liquidity", data.derived.scores.liquidity, "M2 + rates + real rate"],
            ["credit", lang === "es" ? "Crédito" : "Credit", data.derived.scores.credit, "Spreads + curve + VIX"],
            ["realEconomy", lang === "es" ? "Economía real" : "Real economy", data.derived.scores.realEconomy, "Industry + jobs + capacity"],
            ["inflation", lang === "es" ? "Inflación" : "Inflation", data.derived.scores.inflation, "CPI + oil + dollar"],
            ["fiscal", lang === "es" ? "Fiscal" : "Fiscal", data.derived.scores.fiscal, "Debt + debt/GDP"],
          ].map(([key, label, score, formula]) => <button type="button" key={String(key)} onClick={() => showEngine(key as keyof typeof engineLabels, Number(score))}><div><span>{label}</span><b>{modelAvailable ? score : "—"}</b></div><div className="engine-bar"><i style={{ width: `${modelAvailable ? score : 0}%` }} /></div><small>{formula}</small><em>{lang === "es" ? "Interpretar" : "Interpret"} ↗</em></button>)}
        </div>
        <article className="cycle-methodology" id="cycle-methodology">
          <div className="method-head">
            <div>
              <span className="kicker">{lang === "es" ? "METODOLOGÍA ABIERTA · V1.1" : "OPEN METHODOLOGY · V1.1"}</span>
              <h3>{modelAvailable ? (lang === "es" ? `Por qué el índice marca ${cycleScore}/100` : `Why the index reads ${cycleScore}/100`) : (lang === "es" ? "Por qué el índice no publica una cifra" : "Why the index is withholding a score")}</h3>
              <p>{modelAvailable
                ? modelProvisional
                  ? (lang === "es" ? `Estimación provisional con ${data.provenance.modelInputsAvailable ?? 0}/${data.provenance.modelInputsTotal ?? 14} entradas. Los pesos de los motores completos se normalizan al 100%; ninguna ausencia recibe valor cero.` : `Provisional estimate using ${data.provenance.modelInputsAvailable ?? 0}/${data.provenance.modelInputsTotal ?? 14} inputs. Complete-engine weights are normalized to 100%; no missing value is assigned zero.`)
                  : cycle.body
                : (lang === "es" ? "No hay suficientes motores completos para publicar ni siquiera una estimación provisional." : "Too few complete engines are available even for a provisional estimate.")}</p>
            </div>
            <div className="method-warning">
              <b>{lang === "es" ? "QUÉ NO ES" : "WHAT IT IS NOT"}</b>
              <span>{lang === "es" ? "No es una probabilidad de recesión, una señal de compra/venta ni una fecha de crash. Es una puntuación experimental de presión cíclica." : "It is not a recession probability, a buy/sell signal or a crash timer. It is an experimental cycle-pressure score."}</span>
            </div>
          </div>
          <div className="score-equation">
            {scoreComponents.map((item) => <div key={item.key}>
              <div><span>{item.label}</span><b>{modelAvailable ? item.score : "—"} × {Math.round(item.weight * 100)}%</b></div>
              <small>{item.inputs}</small>
              <div className="contribution"><i style={{ width: `${modelAvailable ? item.score : 0}%` }} /><em>{modelAvailable ? `+${format(item.score * item.weight, 1)} pt` : "—"}</em></div>
            </div>)}
          </div>
          <div className="formula-total">
            <code>IDC = LIQ×0.27 + CREDIT×0.23 + REAL×0.20 + INFL×0.15 + FISCAL×0.15</code>
            <strong>= {modelAvailable ? `${cycleScore}/100` : "—"}</strong>
          </div>
          <div className="pillar-lineage">
            <b>{lang === "es" ? "MARCO OPERATIVO DE ABCM" : "ABCM OPERATIONAL FRAMEWORK"}</b>
            <p>{lang === "es"
              ? "Política monetaria → Mercados de crédito → Economía real. ABCM usa esta agrupación como estructura analítica propia e incorpora inflación y fiscalidad como capas transversales. No atribuimos su autoría, la fórmula ni el índice a José Luis Cava ni a ninguna de las influencias citadas."
              : "Monetary policy → Credit markets → Real economy. ABCM uses this grouping as its own analytical structure and adds inflation and fiscal conditions as cross-cutting layers. We do not attribute its authorship, formula or index to José Luis Cava or any cited influence."}</p>
            <a href="https://github.com/JimBLogic/AustrianBusinessCycleMonitor/commit/0acc1a2deb695d167e302c81966344056fb75189" target="_blank" rel="noreferrer">{lang === "es" ? "Ver historial de la metodología ABCM" : "See ABCM methodology history"} ↗</a>
          </div>
          <div className="band-scale">
            {cycle.bands.map((band) => {
              const copy = band[lang];
              const active = band.range === cycle.range;
              return <div className={active ? "active" : ""} key={band.range}><b>{band.range}</b><span>{copy[0]}</span></div>;
            })}
          </div>
          <div className="method-links">
            <a href="/api/data-manifest" target="_blank" rel="noreferrer">{lang === "es" ? "Manifiesto técnico" : "Technical manifest"} ↗</a>
            <a href="#sources">{lang === "es" ? "Fuentes de cada variable" : "Sources for every input"} ↓</a>
          </div>
        </article>
        <div className="engine-grid">
          <article className="mix-panel">
            <div className="panel-title"><div><span className="kicker">{lang === "es" ? "COMPARADOR NORMALIZADO" : "NORMALIZED COMPARATOR"}</span><h3>{lang === "es" ? "Liquidez, activos y dinero duro" : "Liquidity, assets & hard money"}</h3></div><b>BASE 100</b></div>
            <div className="mix-controls">{Object.keys(mixMeta).map((key) => <button key={key} className={selectedMix.includes(key) ? "active" : ""} onClick={() => setSelectedMix((current) => current.includes(key) ? (current.length > 1 ? current.filter((item) => item !== key) : current) : [...current, key])}><i style={{ background: mixMeta[key].color }} />{mixMeta[key][lang]}</button>)}</div>
            <NormalizedChart data={data} selected={selectedMix} lang={lang} />
          </article>
          <aside className="transmission">
            <span className="kicker">{lang === "es" ? "CADENA DE TRANSMISIÓN" : "TRANSMISSION CHAIN"}</span>
            <h3>{regime.title}</h3>
            <div className="chain">
              <div><b>01</b><span>M2 {format(data.derived.changes.m2Growth)}% YoY</span></div>
              <em>→</em>
              <div><b>02</b><span>{lang === "es" ? "Tipo real" : "Real rate"} {format(data.derived.ratios.realRate)}%</span></div>
              <em>→</em>
              <div><b>03</b><span>{lang === "es" ? "Oro / BTC / S&P" : "Gold / BTC / S&P"}</span></div>
              <em>→</em>
              <div><b>04</b><span>CPI + {lang === "es" ? "economía real" : "real economy"}</span></div>
            </div>
            <p>{regime.body}</p>
            <div className="engine-watch"><b>{lang === "es" ? "Confirmación necesaria" : "Confirmation needed"}</b><span>{lang === "es" ? "Que liquidez, crédito y producción giren en la misma dirección. Si divergen, el régimen sigue siendo frágil." : "Liquidity, credit and production must turn in the same direction. If they diverge, the regime remains fragile."}</span></div>
          </aside>
        </div>
        <div className="correlation-block">
          <div className="correlation-intro"><span className="kicker">{lang === "es" ? "CORRELACIONES MÓVILES" : "ROLLING CORRELATIONS"}</span><h3>{lang === "es" ? "Relación, no causalidad." : "Relationship, not causation."}</h3><p>{lang === "es" ? "Pearson sobre variaciones mensuales compartidas, hasta 60 observaciones. +1 se mueve junto; −1, en dirección contraria." : "Pearson on shared monthly returns, up to 60 observations. +1 moves together; −1 moves opposite."}</p></div>
          <div className="correlation-grid">
            {[
              ["m2_sp500", "M2 ↔ S&P 500"],
              ["dollar_gold", lang === "es" ? "Dólar ↔ Oro" : "Dollar ↔ Gold"],
              ["oil_cpi", "WTI ↔ CPI"],
              ["bitcoin_m2", "Bitcoin ↔ M2"],
              ["bitcoin_gold", lang === "es" ? "Bitcoin ↔ Oro" : "Bitcoin ↔ Gold"],
              ["sp500_gold", lang === "es" ? "S&P 500 ↔ Oro" : "S&P 500 ↔ Gold"],
            ].map(([key, label]) => {
              const value = data.derived.correlations[key];
              const strength = value == null ? 0 : Math.abs(value) * 100;
              const strengthLabel = value == null ? (lang === "es" ? "Datos insuficientes" : "Insufficient overlap") : strength >= 60 ? (lang === "es" ? "Fuerte" : "Strong") : strength >= 30 ? (lang === "es" ? "Moderada" : "Moderate") : (lang === "es" ? "Débil" : "Weak");
              return <button type="button" className="correlation-cell" key={key} onClick={() => setDetail({
                eyebrow: lang === "es" ? "CORRELACIÓN MÓVIL · NO CAUSALIDAD" : "ROLLING CORRELATION · NOT CAUSATION",
                title: String(label),
                value: value == null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)} · ${strengthLabel}`,
                fact: lang === "es" ? "Coeficiente de Pearson calculado sobre variaciones mensuales coincidentes, con un máximo de 60 observaciones." : "Pearson coefficient on overlapping monthly percentage changes, using up to 60 observations.",
                interpretation: value == null ? (lang === "es" ? "No existe solapamiento suficiente para una lectura responsable." : "There is not enough overlap for a responsible reading.") : (lang === "es" ? `${value > 0 ? "Las series tendieron a moverse en la misma dirección" : "Las series tendieron a moverse en direcciones opuestas"}, pero esta relación no identifica causa, mecanismo ni estabilidad futura.` : `${value > 0 ? "The series tended to move in the same direction" : "The series tended to move in opposite directions"}, but this relationship identifies neither cause, mechanism nor future stability.`),
                watch: lang === "es" ? "Vigilar si el signo y la intensidad persisten al cambiar el horizonte; una correlación inestable no debe sostener una tesis causal." : "Watch whether sign and strength persist across horizons; an unstable correlation should not support a causal thesis.",
                sourceLabel: lang === "es" ? "Metodología de correlaciones" : "Correlation methodology",
                sourceUrl: "/api/data-manifest",
              })}><span>{label}</span><strong>{value == null ? "—" : `${value >= 0 ? "+" : ""}${value.toFixed(2)}`}</strong><div><i className={value != null && value < 0 ? "negative" : ""} style={{ width: `${strength}%` }} /></div><small>{strengthLabel} · {lang === "es" ? "ABRIR" : "OPEN"} ↗</small></button>;
            })}
          </div>
        </div>
        <div className="ratio-strip">
          {[
            ["BTC / GOLD", `${format(data.derived.ratios.bitcoinGoldOunces, 1)} oz`, lang === "es" ? "Onzas de oro equivalentes al precio de un bitcoin. Es una comparación de poder adquisitivo relativo, no una valoración fundamental." : "Gold ounces equivalent to one bitcoin’s price. It is a relative purchasing-power comparison, not fundamental valuation.", bitcoinSourceUrl(data)],
            ["S&P 500 / GOLD", `${format(data.derived.ratios.sp500Gold, 2)}×`, lang === "es" ? "Nivel del índice dividido por el precio de una onza de oro. Muestra rendimiento relativo entre activos nominales y dinero duro." : "Index level divided by the price of one ounce of gold. It shows relative performance between nominal assets and hard money.", seriesSourceUrl(data, "sp500")],
            ["DEBT / M2", `${format(data.derived.ratios.debtToM2, 2)}×`, lang === "es" ? "Deuda federal bruta dividida por M2. Es una relación de escalas monetarias, no una medida de solvencia por sí sola." : "Gross federal debt divided by M2. It compares monetary scales; it is not a standalone solvency measure.", debtSourceUrl(data)],
            [lang === "es" ? "TIPO REAL APROX." : "APPROX. REAL RATE", `${format(data.derived.ratios.realRate, 2)}%`, lang === "es" ? "Fondos federales menos inflación interanual del IPC. Es una aproximación retrospectiva, no el tipo natural ni una expectativa real ex ante." : "Federal funds rate minus year-over-year CPI inflation. It is a backward-looking approximation, not the natural rate or an ex-ante real expectation.", seriesSourceUrl(data, "fedFunds")],
            [lang === "es" ? "RIESGO COMPUESTO" : "COMPOSITE RISK", modelAvailable ? `${data.derived.scores.composite}/100` : "—", lang === "es" ? "Media ponderada transparente de cinco motores. Mide presión cíclica modelizada, no probabilidad de caída ni señal operativa." : "Transparent weighted average of five engines. It measures modeled cyclical pressure, not crash probability or a trading signal.", "/api/data-manifest"],
          ].map(([label, value, explanation, url]) => <button type="button" key={label} onClick={() => setDetail({
            eyebrow: lang === "es" ? "RATIO · DEFINICIÓN Y LÍMITES" : "RATIO · DEFINITION AND LIMITS",
            title: String(label), value: String(value), fact: String(explanation),
            interpretation: lang === "es" ? "La lectura útil procede de su dirección, persistencia y relación con los demás motores; un nivel aislado no demuestra causalidad." : "Useful interpretation comes from direction, persistence and relation to other engines; an isolated level does not prove causality.",
            watch: lang === "es" ? "Comparar siempre fechas de observación y frecuencia de las series antes de extraer conclusiones." : "Always compare observation dates and series frequencies before drawing conclusions.",
            sourceLabel: lang === "es" ? "Abrir fuente o metodología" : "Open source or methodology", sourceUrl: String(url),
          })}><span>{label}</span><b>{value}</b><em>{lang === "es" ? "Explicar" : "Explain"} ↗</em></button>)}
        </div>
        <div className="backend-grid">
          <article className="scenario-panel">
            <div className="backend-title">
              <div><span className="kicker">{lang === "es" ? "DIAGNÓSTICO MULTIDIMENSIONAL" : "MULTIDIMENSIONAL DIAGNOSIS"}</span><h3>{lang === "es" ? "Lectura actual del ciclo" : "Current cycle reading"}</h3></div>
              <span>{modelProvisional ? (lang === "es" ? "PROVISIONAL" : "PROVISIONAL") : (lang === "es" ? "NO ES ASESORÍA" : "NOT ADVICE")}</span>
            </div>
            <p>{modelAvailable
              ? (lang === "es"
                ? `${regime.body} El motor dominante es ${strongest.label.toLowerCase()} (${strongest.score}/100); la menor presión aparece en ${weakest.label.toLowerCase()} (${weakest.score}/100). La dispersión entre motores es de ${divergence} puntos.`
                : `${regime.body} The dominant engine is ${strongest.label.toLowerCase()} (${strongest.score}/100); the lowest pressure is ${weakest.label.toLowerCase()} (${weakest.score}/100). Cross-engine dispersion is ${divergence} points.`)
              : (lang === "es" ? "No existe cobertura suficiente para un diagnóstico compuesto. Las lecturas parciales se mantienen visibles sin rellenar huecos." : "Coverage is insufficient for a composite diagnosis. Partial readings remain visible without filling gaps.")}</p>
            <div className="assessment-disclaimer"><b>{lang === "es" ? "LECTURA, NO RECOMENDACIÓN" : "READING, NOT A RECOMMENDATION"}</b><span>{lang === "es" ? "Describe condiciones observadas y una interpretación teórica condicionada. No recomienda comprar, vender, mantener ni asignar capital." : "Describes observed conditions and a conditional theoretical interpretation. It does not recommend buying, selling, holding or allocating capital."}</span></div>
            <div className="scenario-grid assessment-grid">
              {engineAssessments.map((assessment) => <button type="button" className="scenario active" key={assessment.key} onClick={() => showEngine(assessment.key, assessment.score)}>
                <div><b>{modelAvailable ? assessment.score : "—"}</b><span>{modelAvailable ? assessment.range : (lang === "es" ? "SIN COBERTURA" : "NO COVERAGE")}</span></div>
                <h4>{modelAvailable ? assessment.title : (lang === "es" ? "Lectura suspendida" : "Reading withheld")}</h4><code>{assessment.label.toUpperCase()}</code><p>{modelAvailable ? assessment.fact : (lang === "es" ? "Faltan entradas verificables; el motor no convierte ausencia en una señal neutral." : "Verifiable inputs are missing; the engine does not convert absence into a neutral signal.")}</p><em>{lang === "es" ? "Abrir evidencia, lente y señales" : "Open evidence, lens and signals"} ↗</em>
              </button>)}
            </div>
          </article>
          <article className="freshness-panel">
            <div className="backend-title">
              <div><span className="kicker">{lang === "es" ? "MOTOR DE DATOS · SITES V27" : "DATA ENGINE · SITES V27"}</span><h3>{lang === "es" ? "Estado de las fuentes" : "Source status"}</h3></div>
              <span className="backend-live">● {lang === "es" ? "ACTIVO" : "LIVE"}</span>
            </div>
            <p>{lang === "es"
              ? "Todos los visitantes comparten una instantánea de 15 minutos. El servidor reintenta fallos transitorios, conserva el último dato válido y marca cada serie como actual, desactualizada o no disponible."
              : "All visitors share one 15-minute snapshot. The server retries transient failures, preserves the last valid observation, and marks every series as live, stale, or unavailable."}</p>
            <div className="backend-meta">
              <div><span>{lang === "es" ? "SALIDA DE DATOS" : "DATA ENDPOINT"}</span><code>/api/data</code></div>
              <div><span>{lang === "es" ? "SOLICITUD" : "REQUEST"}</span><b>{data.provenance.mode === "fallback" ? "—" : `${data.requestedAt.slice(0, 19).replace("T", " ")} UTC`}</b></div>
              <div><span>BITCOIN</span><b>{data.bitcoin.priceObservedAt?.slice(0, 19).replace("T", " ") ?? "—"} UTC</b></div>
              <div><span>{lang === "es" ? "PROVEEDORES" : "PROVIDERS"}</span><b>{data.provenance.bitcoinPrice} · {data.provenance.federalDebt ?? "FRED"}</b></div>
              <div><span>{lang === "es" ? "MODELO" : "MODEL"}</span><b>{modelStatus.toUpperCase()} · {data.provenance.modelInputsAvailable ?? 0}/{data.provenance.modelInputsTotal ?? 14}</b></div>
            </div>
            <div className="backend-links"><a href="/api/health" target="_blank" rel="noreferrer">{lang === "es" ? "Estado técnico" : "Health"} ↗</a><a href="/api/data-manifest" target="_blank" rel="noreferrer">{lang === "es" ? "Manifiesto de datos" : "Data manifest"} ↗</a></div>
            <div className="freshness-list">
              {data.freshness.length ? data.freshness.map((source) => <a href={`https://fred.stlouisfed.org/series/${source.id}`} target="_blank" rel="noreferrer" key={source.id}>
                <span><i className={source.status === "live" ? "ok" : source.status === "last-known-good" || source.status === "stale" ? "backup" : "fail"} />{source.id} · {seriesSource(data, source.key)}{source.status === "last-known-good" ? " · BACKUP" : source.status === "stale" ? ` · ${lang === "es" ? "DESACTUALIZADO" : "STALE"}` : ""}</span>
                <b>{source.observedAt ?? (lang === "es" ? "NO DISPONIBLE" : "UNAVAILABLE")}</b>
              </a>) : <p>{lang === "es" ? "El snapshot de respaldo no incluye fechas por serie. Pulsa Actualizar para consultar el backend." : "The fallback snapshot has no per-series dates. Press Refresh to query the backend."}</p>}
            </div>
          </article>
        </div>
      </section>

      <section className="dashboard-section" id="dashboard">
        <div className="section-head"><div><span className="kicker">01 · {t.terminal.toUpperCase()}</span><h2>{t.terminal}</h2><p>{t.terminalSub}</p></div><a className="source-link" href={meta.source === "BLOCKCHAIN" ? "https://www.blockchain.com/explorer/charts/market-price" : `https://fred.stlouisfed.org/series/${meta.source}`} target="_blank" rel="noreferrer">{meta.source} ↗</a></div>
        <div className="terminal">
          <div className="series-tabs">{(Object.keys(seriesMeta) as (keyof typeof seriesMeta)[]).map((key) => <button key={key} className={seriesKey === key ? "active" : ""} onClick={() => setSeriesKey(key)}><i style={{background: seriesMeta[key].color}} />{seriesMeta[key][lang]}</button>)}</div>
          <div className="chart-toolbar"><div><span>{meta[lang]}</span><b>{meta.source}</b></div><div className="range">{[[12,"1Y"],[60,"5Y"],[0,"MAX"]].map(([value,label]) => <button key={label} className={horizon === value ? "active" : ""} onClick={() => setHorizon(Number(value))}>{label}</button>)}</div></div>
          <LineChart points={points.length ? points : fallback.series[seriesKey] ?? []} color={meta.color} unit={meta.unit} horizon={horizon}/>
        </div>
      </section>

      <section className="signal-section" id="liquidity">
        <div className="section-head"><div><span className="kicker">{lang === "es" ? "02 · SEÑALES MACRO" : "02 · MACRO SIGNALS"}</span><h2>{t.indicators}</h2><p>{t.indicatorsSub}</p></div><div className="lens-toggle"><button className={lens === "facts" ? "active" : ""} onClick={() => setLens("facts")}>{t.objective}</button><button className={lens === "thesis" ? "active" : ""} onClick={() => setLens("thesis")}>{t.austrian}</button></div></div>
        <div className="signal-layout">
          <div className="metric-grid">
            {metrics.map((metric) => <button key={metric.key} className={`metric-card ${selectedMetric.key === metric.key ? "selected" : ""}`} onClick={() => setSelectedMetric(metric)}>
              <span><i className={metric.risk > 70 ? "red" : metric.risk > 45 ? "amber" : "green"} />{metric.label[lang === "en" ? 0 : 1]}</span>
              <strong>{metric.key === "federalDebt" ? (latestValue(data, metric.key) == null ? "—" : `$${format(latestValue(data, metric.key)!/1000,1)}T`) : format(latestValue(data, metric.key))}</strong>
              <small>{seriesSource(data, metric.key)} · {metric.source}</small><div className="risk-bar"><i style={{width:`${metric.risk}%`}} /></div>
            </button>)}
          </div>
          <aside className="inspector">
            <span className="kicker">{lens === "facts" ? t.facts : t.thesis}</span>
            <h3>{selectedMetric.label[lang === "en" ? 0 : 1]}</h3>
            <div className="inspector-value"><span>{t.value}</span><strong>{format(latestValue(data, selectedMetric.key))}</strong></div>
            <p>{(lens === "facts" ? selectedMetric.fact : selectedMetric.thesis)[lang === "en" ? 0 : 1]}</p>
            <div className="watch"><span>{t.watch}</span><p>{selectedMetric.watch[lang === "en" ? 0 : 1]}</p></div>
            <a href={`https://fred.stlouisfed.org/series/${selectedMetric.source}`} target="_blank" rel="noreferrer">{t.source}: {selectedMetric.source} ↗</a>
          </aside>
        </div>
      </section>

      <section className="hard-assets" id="hard-assets">
        <div className="section-head light"><div><span className="kicker">{lang === "es" ? "03 · LABORATORIO DE DINERO DURO" : "03 · SOUND MONEY LAB"}</span><h2>{t.scarcity}</h2><p>{t.scarcitySub}</p></div></div>
        <div className="asset-grid">
          <article className="btc-card">
            <div className="asset-title"><span className="coin">₿</span><div><span>BITCOIN</span><strong>${format(btc, 0)}</strong></div></div>
            <div className="asset-stats"><div><span>{t.s2f}</span><b>{data.bitcoin.supply ? `${format(data.bitcoin.stockToFlow, 1)}×` : "—"}</b></div><div><span>{t.supply}</span><b>{data.bitcoin.supply ? `${format(data.bitcoin.supply/1e6, 2)}M` : "—"}</b></div><div><span>{t.block}</span><b>{format(data.bitcoin.blockHeight, 0)}</b></div><div><span>{t.fees}</span><b>{data.bitcoin.feeFast == null ? "—" : `${format(data.bitcoin.feeFast, 0)} sat/vB`}</b></div></div>
            <p>{lang === "en" ? "Stock-to-flow describes programmed scarcity; it is not a reliable standalone price model. Bitcoin’s supply schedule is auditable, its custody can be sovereign, and its settlement resists permission." : "El stock-to-flow describe la escasez programada; no es un modelo de precio fiable por sí solo. La oferta de Bitcoin es auditable, su custodia puede ser soberana y su liquidación resiste permisos."}</p>
          </article>
          <article className="ratio-card">
            <span className="kicker">{lang === "es" ? "VALORACIÓN RELATIVA" : "RELATIVE VALUATION"}</span>
            <h3>{lang === "en" ? "What does one bitcoin buy?" : "¿Qué compra un bitcoin?"}</h3>
            <div className="ratio"><span><b>{format(btc && gold ? btc/gold : null, 1)}</b> {lang === "en" ? "oz gold" : "oz de oro"}</span><i style={{width:"72%"}} /></div>
            <div className="ratio"><span><b>{format(btc ? 1e6/btc : null, 1)}</b> BTC / $1M</span><i style={{width:"48%"}} /></div>
            <div className="ratio"><span><b>~60×</b> Gold S2F</span><i style={{width:"35%"}} /></div>
            <div className="ratio"><span><b>{data.bitcoin.supply ? `${format(data.bitcoin.stockToFlow,0)}×` : "—"}</b> Bitcoin S2F</span><i style={{width:data.bitcoin.supply ? "78%" : "0%"}} /></div>
            <small>{lang === "en" ? "Gold S2F is an industry estimate; Bitcoin S2F uses current supply ÷ annual subsidy flow." : "El S2F del oro es una estimación sectorial; el de Bitcoin usa oferta actual ÷ flujo anual del subsidio."}</small>
          </article>
          <article className="monetary-map">
            <span className="kicker">{lang === "es" ? "COMPETENCIA MONETARIA" : "MONETARY COMPETITION"}</span><h3>{lang === "en" ? "Trust spectrum" : "Espectro de confianza"}</h3>
            {[["Bitcoin","Rules / self-custody",92],["Gold","Physical scarcity",78],["Dollar","Issuer credibility",48],["Sovereign debt","Future taxation",31]].map(([name,desc,width]) => <div className="trust" key={name}><span><b>{name}</b><small>{desc}</small></span><i><em style={{width:`${width}%`}} /></i></div>)}
          </article>
        </div>
      </section>

      <section className="pillars" id="theory">
        <div className="section-head"><div><span className="kicker">{lang === "es" ? "04 · MARCO DE LA TEORÍA AUSTRIACA DEL CICLO" : "04 · ABCT FRAMEWORK"}</span><h2>{t.pillars}</h2></div></div>
        <div className="pillar-grid">
          {[
            ["MONETARY POLICY", lang === "en" ? "Monetary policy" : "Política monetaria", data.derived.scores.liquidity, lang === "en" ? "Central-bank rates, money growth and the gap between administered conditions and real saving." : "Tipos del banco central, crecimiento monetario y distancia entre condiciones administradas y ahorro real."],
            ["CREDIT MARKETS", lang === "en" ? "Credit markets" : "Mercados de crédito", data.derived.scores.credit, lang === "en" ? "Spreads, the yield curve and stress reveal where financing is becoming fragile." : "Diferenciales, curva de tipos y estrés revelan dónde se vuelve frágil la financiación."],
            ["REAL ECONOMY", lang === "en" ? "Real economy" : "Economía real", data.derived.scores.realEconomy, lang === "en" ? "Production, employment and capacity test whether the financial boom has real confirmation." : "Producción, empleo y capacidad comprueban si el auge financiero tiene confirmación real."],
          ].map(([code,title,score,body], i) => {
            const key = (["liquidity", "credit", "realEconomy"] as const)[i];
            return <button type="button" key={String(code)} onClick={() => showEngine(key, Number(score))}><span>0{i+1} · {code}</span><div className="pillar-score"><strong>{modelAvailable ? score : "—"}</strong><small>/100</small></div><h3>{title}</h3><p>{body}</p><div className="pillar-bar"><i style={{width:`${modelAvailable ? score : 0}%`}} /></div><em>{lang === "es" ? "Interpretar pilar" : "Interpret pillar"} ↗</em></button>;
          })}
        </div>
        <div className="process">
          {[["01",lang === "en" ? "Observe" : "Observar",lang === "en" ? "Primary data and release dates." : "Datos primarios y fechas."],["02",lang === "en" ? "Connect" : "Conectar",lang === "en" ? "Money → credit → capital structure." : "Dinero → crédito → estructura."],["03",lang === "en" ? "Interpret" : "Interpretar",lang === "en" ? "Apply ABCT, label assumptions." : "Aplicar ABCT y declarar supuestos."],["04",lang === "en" ? "Falsify" : "Refutar",lang === "en" ? "Define what would change the view." : "Definir qué cambiaría la tesis."]].map(([n,h,p]) => <div key={n}><b>{n}</b><h4>{h}</h4><p>{p}</p></div>)}
        </div>
      </section>

      <section className="cava-credit">
        <div className="cava-index">JLC<br/>→</div>
        <div className="cava-copy">
          <span className="kicker">{lang === "en" ? "FEATURED EDUCATIONAL INFLUENCE" : "INFLUENCIA DIVULGATIVA DESTACADA"}</span>
          <h2>José Luis Cava</h2>
          <p>{lang === "en"
            ? "ABCM is especially inspired by José Luis Cava’s ability to explain macroeconomics and market interpretation through his publicly available content. This mention recognizes his educational work and its editorial influence on the project."
            : "ABCM se inspira especialmente en la capacidad de José Luis Cava para divulgar macroeconomía e interpretación de mercados mediante su contenido público. Esta mención reconoce su labor educativa y su influencia editorial en el proyecto."}</p>
          <p>{lang === "en"
            ? "We do not attribute the dashboard, its index, formulas or three-pillar operating structure to him. ABCM is an independent open-source prototype—not an official José Luis Cava or HOPLA product, collaboration or endorsement."
            : "No le atribuimos la autoría del dashboard, del índice, de sus fórmulas ni de la estructura operativa de tres pilares. ABCM es un prototipo open source independiente; no es un producto oficial, una colaboración ni un respaldo de José Luis Cava o HOPLA."}</p>
          <div className="cava-links">
            <a href="https://hopla.finance/home" target="_blank" rel="noreferrer">HOPLA Finance ↗</a>
            <a href="https://www.youtube.com/@JoseLuisCavatv" target="_blank" rel="noreferrer">{lang === "en" ? "José Luis Cava on YouTube" : "José Luis Cava en YouTube"} ↗</a>
            <a href="https://github.com/JimBLogic/AustrianBusinessCycleMonitor/commit/0acc1a2deb695d167e302c81966344056fb75189" target="_blank" rel="noreferrer">{lang === "en" ? "ABCM methodology history" : "Historial de metodología ABCM"} ↗</a>
          </div>
        </div>
        <aside className="cava-pitch">
          <span>{lang === "en" ? "WHY THIS EXISTS" : "POR QUÉ EXISTE"}</span>
          <strong>{lang === "en" ? "Inspiration is not authorship." : "Inspiración no es autoría."}</strong>
          <p>{lang === "en"
            ? "Public market education inspired the editorial lens. ABCM’s code, formulas, pillar grouping and conclusions remain independently documented and open to criticism."
            : "La divulgación pública de mercados inspira la mirada editorial. El código, las fórmulas, la agrupación de pilares y las conclusiones de ABCM se documentan de forma independiente y están abiertas a crítica."}</p>
        </aside>
      </section>

      <section className="influence-library">
        <div className="influence-heading">
          <div>
            <span className="kicker">{lang === "es" ? "BIBLIOGRAFÍA ABIERTA · VOCES DIVERSAS" : "OPEN BIBLIOGRAPHY · DIVERSE VOICES"}</span>
            <h2>{lang === "es" ? "Mapa de influencias" : "Influence map"}</h2>
          </div>
          <p>{lang === "es"
            ? "Autores y constructores reconocidos que ayudan a contrastar economía austriaca, historia monetaria, Bitcoin y soberanía. Sus ideas no equivalen a hechos de protocolo ni los convierten en autores o avalistas de ABCM."
            : "Recognized authors and builders used to contrast Austrian economics, monetary history, Bitcoin and sovereignty. Their ideas are not protocol facts and do not make them authors or endorsers of ABCM."}</p>
        </div>
        <div className="influence-grid">
          {[
            ["Saifedean Ammous", lang === "es" ? "ECONOMÍA AUSTRIACA" : "AUSTRIAN ECONOMICS", lang === "es" ? "Dinero duro, preferencia temporal y la tesis monetaria de Bitcoin." : "Hard money, time preference and Bitcoin’s monetary thesis.", "https://saifedean.com/tbs"],
            ["Lyn Alden", lang === "es" ? "ANÁLISIS MONETARIO" : "MONETARY ANALYSIS", lang === "es" ? "Historia del dinero, sistemas de liquidación y Bitcoin como bien monetario." : "Monetary history, settlement systems and Bitcoin as a monetary good.", "https://www.lynalden.com/what-is-money/"],
            ["Robert Breedlove", lang === "es" ? "FILOSOFÍA MONETARIA" : "MONETARY PHILOSOPHY", lang === "es" ? "Dinero, Bitcoin y tiempo examinados desde primeros principios." : "Money, Bitcoin and time examined from first principles.", "https://breedlove22.medium.com/money-bitcoin-and-time-part-1-of-3-b4f6bb036c04"],
            ["Parker Lewis", lang === "es" ? "TEORÍA BITCOIN" : "BITCOIN THEORY", lang === "es" ? "Propiedades monetarias, incentivos y el proceso por el que Bitcoin compite como dinero." : "Monetary properties, incentives and the process by which Bitcoin competes as money.", "https://nakamotoinstitute.org/library/gradually-then-suddenly/"],
            ["Adam Back", "CYPHERPUNK · PROOF-OF-WORK", lang === "es" ? "Hashcash como antecedente técnico público de las pruebas de trabajo." : "Hashcash as a public technical precursor to proof-of-work systems.", "https://nakamotoinstitute.org/library/hashcash/"],
            ["Hal Finney", lang === "es" ? "DINERO DIGITAL" : "DIGITAL CASH", lang === "es" ? "RPOW y la evolución temprana de pruebas de trabajo reutilizables." : "RPOW and the early evolution of reusable proofs of work.", "https://nakamotoinstitute.org/finney/rpow/"],
            ["Jameson Lopp", lang === "es" ? "SOBERANÍA TÉCNICA" : "TECHNICAL SOVEREIGNTY", lang === "es" ? "Recursos prácticos sobre nodos, autocustodia, privacidad y seguridad." : "Practical resources on nodes, self-custody, privacy and security.", "https://www.lopp.net/bitcoin-information.html"],
            ["Ludwig von Mises", lang === "es" ? "DINERO Y CICLO ECONÓMICO" : "MONEY & BUSINESS CYCLES", lang === "es" ? "Teoría monetaria, medios fiduciarios y fundamentos del mecanismo austriaco del ciclo." : "Monetary theory, fiduciary media and foundations of the Austrian cycle mechanism.", "https://mises.org/library/book/theory-money-and-credit"],
          ].map(([name, category, body, url]) => <a href={url} target="_blank" rel="noreferrer" key={name}>
            <span>{category}</span>
            <h3>{name}</h3>
            <p>{body}</p>
            <b>{lang === "es" ? "Leer fuente pública" : "Read public source"} ↗</b>
          </a>)}
        </div>
      </section>

      <section className="ammous-lens">
        <div className="ammous-intro">
          <span className="kicker">{lang === "es" ? "LECTURA CONTRASTADA · DINERO DURO" : "CONTRASTED READING · HARD MONEY"}</span>
          <h2>Saifedean Ammous</h2>
          <p>{lang === "es"
            ? "Su trabajo aporta una tesis potente sobre dureza monetaria, preferencia temporal y Bitcoin. ABCM lo usa como marco argumental, no como autoridad incuestionable: protocolo, teoría y evidencia de mercado se muestran por separado."
            : "His work offers a powerful thesis on monetary hardness, time preference and Bitcoin. ABCM uses it as an argumentative framework, not unquestionable authority: protocol, theory and market evidence remain separate."}</p>
          <div className="ammous-links">
            <a href="https://saifedean.com/tbs" target="_blank" rel="noreferrer">The Bitcoin Standard ↗</a>
            <a href="https://saifedean.com/poe" target="_blank" rel="noreferrer">Principles of Economics ↗</a>
            <a href="https://www.sciencedirect.com/science/article/pii/S1062976917300777" target="_blank" rel="noreferrer">{lang === "es" ? "Artículo académico" : "Academic paper"} ↗</a>
          </div>
        </div>
        <div className="ammous-grid">
          <article>
            <span>01 · {lang === "es" ? "HECHO VERIFICABLE" : "VERIFIABLE FACT"}</span>
            <h3>{lang === "es" ? "La emisión es auditable" : "Issuance is auditable"}</h3>
            <p>{lang === "es" ? "La oferta y el subsidio de bloque se derivan de reglas que valida la red. El S2F mostrado es stock actual dividido por nueva emisión anualizada." : "Supply and block subsidy follow rules validated by the network. The displayed S2F is current stock divided by annualized new issuance."}</p>
            <a href="https://developer.bitcoin.org/devguide/block_chain.html" target="_blank" rel="noreferrer">Bitcoin Developer Guide ↗</a>
          </article>
          <article>
            <span>02 · {lang === "es" ? "TESIS DE AMMOUS" : "AMMOUS THESIS"}</span>
            <h3>{lang === "es" ? "Dureza y vendibilidad temporal" : "Hardness & salability across time"}</h3>
            <p>{lang === "es" ? "Una oferta difícil de ampliar puede proteger mejor el ahorro a largo plazo y favorecer una menor preferencia temporal. Es una explicación económica, no una identidad contable." : "A supply that is difficult to expand may better protect long-term saving and encourage lower time preference. This is an economic explanation, not an accounting identity."}</p>
            <a href="https://saifedean.com/tbs" target="_blank" rel="noreferrer">{lang === "es" ? "Fuente del autor" : "Author source"} ↗</a>
          </article>
          <article>
            <span>03 · {lang === "es" ? "LÍMITE Y CONTRASTE" : "LIMIT & COUNTERPOINT"}</span>
            <h3>{lang === "es" ? "Escasez no equivale a precio" : "Scarcity is not price"}</h3>
            <p>{lang === "es" ? "El S2F mide escasez de flujo; no demuestra causalidad ni predice por sí solo la demanda, la liquidez o el precio. Por eso ABCM lo cruza con M2, dólar, oro, crédito y condiciones reales." : "S2F measures flow scarcity; it does not prove causality or independently predict demand, liquidity or price. ABCM therefore crosses it with M2, the dollar, gold, credit and real conditions."}</p>
            <a href="https://mises.org/mises-wire/critique-bitcoin-stock-flow-model" target="_blank" rel="noreferrer">{lang === "es" ? "Crítica desde la Escuela Austriaca" : "Austrian-school critique"} ↗</a>
          </article>
        </div>
      </section>

      <section className="quotes">
        <div className="quote-number">{String(quote+1).padStart(2,"0")} / {String(quotes.length).padStart(2,"0")}</div>
        <blockquote>“{quotes[quote].quote}”</blockquote>
        <div className="quote-meta"><strong>{quotes[quote].author}</strong><a href={quotes[quote].url} target="_blank" rel="noreferrer">{quotes[quote].work} ↗</a></div>
        <div className="quote-controls"><button onClick={() => setQuote((quote - 1 + quotes.length) % quotes.length)} aria-label={lang === "es" ? "Cita anterior" : "Previous quote"}>←</button><div>{quotes.map((_,i)=><button key={i} className={i===quote?"active":""} onClick={()=>setQuote(i)} aria-label={`${lang === "es" ? "Cita" : "Quote"} ${i+1}`}/>)}</div><button onClick={() => setQuote((quote + 1) % quotes.length)} aria-label={lang === "es" ? "Cita siguiente" : "Next quote"}>→</button></div>
      </section>

      <section className="sources" id="sources">
        <div><span className="kicker">{lang === "es" ? "05 · PROCEDENCIA" : "05 · PROVENANCE"}</span><h2>{t.sources}</h2><p>{t.disclaimer}</p></div>
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
      <footer><span>{lang === "es" ? "ABCM · CONTEXTO HOY. MEJORES DECISIONES MAÑANA." : "ABCM · CONTEXT TODAY. BETTER DECISIONS TOMORROW."}</span><span>SITES V29 · DATA 1.2 · <a href={`/learn?lang=${lang}`} target="_blank" rel="noreferrer">{lang === "es" ? "Aprende ↗" : "Learn ↗"}</a> · JimBLogic · 2026 · <a href="https://github.com/JimBLogic/AustrianBusinessCycleMonitor">GitHub ↗</a></span></footer>
      {detail&&<div className="detail-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setDetail(null); }}>
        <article className="detail-dialog" role="dialog" aria-modal="true" aria-labelledby="detail-title">
          <button className="detail-close" type="button" onClick={() => setDetail(null)} aria-label={lang === "es" ? "Cerrar explicación" : "Close explanation"}>×</button>
          <span className="kicker">{detail.eyebrow}</span>
          <div className="detail-head"><h2 id="detail-title">{detail.title}</h2><strong>{detail.value}</strong></div>
          <div className="detail-layer fact"><b>{lang === "es" ? "QUÉ DICE EL DATO" : "WHAT THE DATA SAYS"}</b><p>{detail.fact}</p></div>
          <div className="detail-layer lens"><b>{lang === "es" ? "INTERPRETACIÓN AUSTRIACA CONDICIONAL" : "CONDITIONAL AUSTRIAN INTERPRETATION"}</b><p>{detail.interpretation}</p></div>
          <div className="detail-layer watch"><b>{lang === "es" ? "QUÉ PODRÍA CONFIRMAR O INVALIDAR LA LECTURA" : "WHAT COULD CONFIRM OR INVALIDATE THE READING"}</b><p>{detail.watch}</p></div>
          <div className="detail-disclaimer">{lang === "es" ? "Información educativa y análisis macroeconómico experimental. No constituye asesoramiento financiero, recomendación de inversión ni señal de compraventa." : "Educational information and experimental macro analysis. This is not financial advice, an investment recommendation or a trading signal."}</div>
          <a className="detail-source" href={detail.sourceUrl} target="_blank" rel="noreferrer">{detail.sourceLabel} ↗</a>
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
