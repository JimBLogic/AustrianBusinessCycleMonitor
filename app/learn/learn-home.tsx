"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ClearLocalPreferencesButton } from "../privacidad/ClearLocalPreferencesButton";
import { libraryItems, type LibraryLevel, type LibraryTrack } from "./library";

type Lang = "es" | "en";

const copy = {
  es: {
    brand: "ABCM APRENDE",
    back: "Volver al monitor",
    layer: "CAPA ABIERTA DE APRENDIZAJE",
    title: "Entiende el sistema.",
    titleEm: "Después reduce tu dependencia.",
    intro: "Una ruta práctica e independiente para comprender el ciclo económico, Bitcoin y las herramientas de soberanía financiera. Sin promesas de riqueza rápida: modelos mentales, fuentes, contraste y responsabilidad personal.",
    path: "RUTA",
    modules: "MÓDULOS",
    austrian: "Economía Austriaca",
    austrianBody: "Acción humana, dinero, interés, capital, ciclo económico y cómo llevar la teoría al terminal macro.",
    bitcoin: "Bitcoin y soberanía",
    bitcoinBody: "Escasez digital, nodos, UTXOs, autocustodia, privacidad, seguridad operativa y soberanía financiera.",
    start: "Empezar la ruta",
    principles: [
      ["Fuentes primarias", "Distingue dato, modelo, teoría y opinión."],
      ["Sin culto", "Las ideas se someten a crítica, también las austriacas y Bitcoin."],
      ["Comprensión demostrable", "Cada módulo conecta la teoría con una señal del monitor."],
      ["Responsabilidad", "Soberanía significa libertad y también asumir las consecuencias."],
    ],
    libraryEyebrow: "BIBLIOTECA DOCUMENTADA · FUENTES PRIMARIAS Y CONTRASTE",
    libraryTitle: "No colecciones gurús. Construye criterio.",
    libraryIntro: "Textos originales, papers, archivos y documentación técnica. Cada ficha explica qué aporta, qué no demuestra y qué nivel exige. «Evidencia y debate» incluye resultados favorables e insuficientes para evitar una cámara de eco.",
    items: [
      ["DIVULGACIÓN MACRO", "José Luis Cava", "Contenido público de interpretación macro y de mercados que inspira especialmente la mirada editorial del proyecto.", "https://www.youtube.com/@JoseLuisCavatv"],
      ["ECONOMÍA AUSTRIACA", "Saifedean Ammous", "Dureza monetaria, preferencia temporal y Bitcoin como alternativa monetaria, examinados junto a sus límites.", "https://saifedean.com/tbs"],
      ["ANÁLISIS MONETARIO", "Lyn Alden", "Historia del dinero, redes de liquidación y análisis de Bitcoin como bien monetario.", "https://www.lynalden.com/what-is-money/"],
      ["FILOSOFÍA MONETARIA", "Robert Breedlove", "Ensayo público sobre dinero, Bitcoin y tiempo desde primeros principios.", "https://breedlove22.medium.com/money-bitcoin-and-time-part-1-of-3-b4f6bb036c04"],
      ["TEORÍA BITCOIN", "Parker Lewis", "Serie pública sobre propiedades monetarias, incentivos y competencia entre dineros.", "https://nakamotoinstitute.org/library/gradually-then-suddenly/"],
      ["CYPHERPUNK · PROOF-OF-WORK", "Adam Back", "Paper primario de Hashcash y las raíces técnicas de las pruebas de trabajo.", "https://nakamotoinstitute.org/library/hashcash/"],
      ["HISTORIA DEL DINERO DIGITAL", "Hal Finney", "Archivo del prototipo RPOW y la evolución de las pruebas de trabajo reutilizables.", "https://nakamotoinstitute.org/finney/rpow/"],
      ["SOBERANÍA TÉCNICA", "Jameson Lopp", "Recursos prácticos sobre nodos, autocustodia, privacidad y seguridad operacional.", "https://www.lopp.net/bitcoin-information.html"],
      ["CONTRASTE", "Crítica del stock-to-flow", "Una objeción austriaca: la escasez de flujo no basta para derivar causalmente un precio.", "https://mises.org/mises-wire/critique-bitcoin-stock-flow-model"],
    ],
  },
  en: {
    brand: "ABCM LEARN",
    back: "Back to monitor",
    layer: "OPEN LEARNING LAYER",
    title: "Understand the system.",
    titleEm: "Then reduce your dependence on it.",
    intro: "A practical, independent path through the business cycle, Bitcoin and financial-sovereignty tools. No get-rich-quick promises: mental models, sources, counterarguments and personal responsibility.",
    path: "PATH",
    modules: "MODULES",
    austrian: "Austrian Economics",
    austrianBody: "Human action, money, interest, capital, the business cycle and how to apply theory to the macro terminal.",
    bitcoin: "Bitcoin & Sovereignty",
    bitcoinBody: "Digital scarcity, nodes, UTXOs, self-custody, privacy, operational security and financial sovereignty.",
    start: "Start the path",
    principles: [
      ["Primary sources", "Distinguish data, model, theory and opinion."],
      ["No cults", "Every idea is open to criticism, including Austrian theory and Bitcoin."],
      ["Proof of understanding", "Every module connects theory to a monitor signal."],
      ["Responsibility", "Sovereignty means freedom and owning the consequences."],
    ],
    libraryEyebrow: "DOCUMENTED LIBRARY · PRIMARY SOURCES AND COUNTERPOINTS",
    libraryTitle: "Don’t collect gurus. Build judgment.",
    libraryIntro: "Original texts, papers, archives and technical documentation. Every card states what it contributes, what it does not prove and the level it requires. “Evidence & debate” includes supportive and insufficient findings to avoid an echo chamber.",
    items: [
      ["MACRO EDUCATION", "José Luis Cava", "Public macro and market-interpretation content that especially inspires the project’s editorial lens.", "https://www.youtube.com/@JoseLuisCavatv"],
      ["AUSTRIAN ECONOMICS", "Saifedean Ammous", "Monetary hardness, time preference and Bitcoin as a monetary alternative, examined alongside their limits.", "https://saifedean.com/tbs"],
      ["MONETARY ANALYSIS", "Lyn Alden", "Monetary history, settlement networks and analysis of Bitcoin as a monetary good.", "https://www.lynalden.com/what-is-money/"],
      ["MONETARY PHILOSOPHY", "Robert Breedlove", "A public essay on money, Bitcoin and time from first principles.", "https://breedlove22.medium.com/money-bitcoin-and-time-part-1-of-3-b4f6bb036c04"],
      ["BITCOIN THEORY", "Parker Lewis", "A public series on monetary properties, incentives and competition between monies.", "https://nakamotoinstitute.org/library/gradually-then-suddenly/"],
      ["CYPHERPUNK · PROOF-OF-WORK", "Adam Back", "The primary Hashcash paper and the technical roots of proof-of-work systems.", "https://nakamotoinstitute.org/library/hashcash/"],
      ["DIGITAL CASH HISTORY", "Hal Finney", "Archive of the RPOW prototype and the evolution of reusable proofs of work.", "https://nakamotoinstitute.org/finney/rpow/"],
      ["TECHNICAL SOVEREIGNTY", "Jameson Lopp", "Practical resources on nodes, self-custody, privacy and operational security.", "https://www.lopp.net/bitcoin-information.html"],
      ["COUNTERPOINT", "Stock-to-flow critique", "An Austrian objection: flow scarcity alone cannot causally derive a market price.", "https://mises.org/mises-wire/critique-bitcoin-stock-flow-model"],
    ],
  },
};

export default function LearnHome({ initialLang }: { initialLang: Lang }) {
  const [lang, setLang] = useState<Lang>(initialLang);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);
  const [track, setTrack] = useState<"all" | LibraryTrack>("all");
  const [level, setLevel] = useState<"all" | LibraryLevel>("all");

  function changeLanguage() {
    const next = lang === "es" ? "en" : "es";
    setLang(next);
    const url = new URL(window.location.href);
    url.searchParams.set("lang", next);
    window.history.replaceState(window.history.state, "", url);
  }

  const t = copy[lang];
  const visibleItems = libraryItems.filter((item) =>
    (track === "all" || item.track === track) && (level === "all" || item.level === level)
  );
  const trackNames: Record<"all" | LibraryTrack, [string, string]> = {
    all: ["Todo", "All"], bitcoin: ["Bitcoin", "Bitcoin"], cypherpunk: ["Cypherpunks", "Cypherpunks"],
    austrian: ["Economía austriaca", "Austrian economics"], evidence: ["Evidencia y debate", "Evidence & debate"],
  };
  const levelNames: Record<"all" | LibraryLevel, [string, string]> = {
    all: ["Todos los niveles", "All levels"], intro: ["Introducción", "Introduction"],
    intermediate: ["Intermedio", "Intermediate"], advanced: ["Avanzado", "Advanced"],
  };
  const kindNames: Record<string, [string, string]> = {
    paper: ["Artículo académico", "Academic paper"],
    archive: ["Archivo", "Archive"],
    documentation: ["Documentación", "Documentation"],
    book: ["Libro", "Book"],
    essay: ["Ensayo", "Essay"],
  };
  return (
    <main className="academy-home" lang={lang}>
      <nav className="academy-top">
        <Link href="/" className="academy-logo"><span>₿</span> {t.brand}</Link>
        <div className="learn-actions">
          <Link href="/">← {t.back}</Link>
          <button onClick={changeLanguage}>{lang === "es" ? "EN" : "ES"}</button>
        </div>
      </nav>
      <header className="academy-hero">
        <span className="academy-label">ABCM · {t.layer}</span>
        <h1>{t.title}<br/><em>{t.titleEm}</em></h1>
        <p>{t.intro}</p>
      </header>
      <section className="academy-paths">
        <Link href={`/learn/austrian-economics?lang=${lang}`} className="path-card austrian-path">
          <span>{t.path} 01 · 6 {t.modules} · 24 {lang === "es" ? "PREGUNTAS" : "QUESTIONS"}</span><b>🏛</b>
          <h2>{t.austrian}</h2>
          <p>{t.austrianBody}</p>
          <strong>{t.start} →</strong>
        </Link>
        <Link href={`/learn/bitcoin-sovereignty?lang=${lang}`} className="path-card bitcoin-path">
          <span>{t.path} 02 · 6 {t.modules} · 24 {lang === "es" ? "PREGUNTAS" : "QUESTIONS"}</span><b>₿</b>
          <h2>{t.bitcoin}</h2>
          <p>{t.bitcoinBody}</p>
          <strong>{t.start} →</strong>
        </Link>
      </section>
      <section className="academy-principles">
        {t.principles.map(([title, body], index) => <article key={title}><b>0{index + 1}</b><h3>{title}</h3><p>{body}</p></article>)}
      </section>
      <section className="learn-library">
        <div className="library-heading">
          <span className="academy-label">{t.libraryEyebrow}</span>
          <h2>{t.libraryTitle}</h2>
          <p>{t.libraryIntro}</p>
        </div>
        <div className="library-curation-note">
          <b>{lang === "es" ? "CRITERIO EDITORIAL" : "EDITORIAL STANDARD"}</b>
          <p>{lang === "es"
            ? "Preferencia por fuente original, autor identificado, fecha y acceso estable. Una cita documenta lo que alguien afirmó; no convierte esa afirmación en un hecho. La etiqueta «paper» tampoco garantiza consenso científico."
            : "Preference for original sources, identified authorship, dates and stable access. A citation documents what someone claimed; it does not turn that claim into fact. A “paper” label does not guarantee scientific consensus."}</p>
        </div>
        <div className="library-controls" aria-label={lang === "es" ? "Filtros de biblioteca" : "Library filters"}>
          <div><span>{lang === "es" ? "TEMA" : "TOPIC"}</span>{(Object.keys(trackNames) as Array<"all" | LibraryTrack>).map((key) => <button type="button" className={track === key ? "active" : ""} onClick={() => setTrack(key)} key={key}>{trackNames[key][lang === "es" ? 0 : 1]}</button>)}</div>
          <div><span>{lang === "es" ? "NIVEL" : "LEVEL"}</span>{(Object.keys(levelNames) as Array<"all" | LibraryLevel>).map((key) => <button type="button" className={level === key ? "active" : ""} onClick={() => setLevel(key)} key={key}>{levelNames[key][lang === "es" ? 0 : 1]}</button>)}</div>
          <strong>{visibleItems.length} {lang === "es" ? "FUENTES" : "SOURCES"}</strong>
        </div>
        <div className="learn-reading-grid">
          {visibleItems.map((item) => <a href={item.url} target="_blank" rel="noreferrer" key={`${item.author}-${item.title}`}>
            <span>{trackNames[item.track][lang === "es" ? 0 : 1].toUpperCase()} · {(kindNames[item.kind]?.[lang === "es" ? 0 : 1] ?? item.kind).toUpperCase()} · {levelNames[item.level][lang === "es" ? 0 : 1].toUpperCase()}</span>
            <small>{item.author} · {item.year === "Living" ? (lang === "es" ? "Actualización continua" : "Living") : item.year === "Open source" ? (lang === "es" ? "Código abierto" : "Open source") : item.year}</small>
            <h3>{lang === "es" ? item.titleEs ?? item.title : item.title}</h3>
            <p>{item.value[lang === "es" ? 1 : 0]}</p>
            <em><b>{lang === "es" ? "LÍMITE" : "LIMIT"}</b>{item.limit[lang === "es" ? 1 : 0]}</em>
            <strong>{lang === "es" ? "Abrir fuente original" : "Open original source"} ↗</strong>
          </a>)}
        </div>
      </section>
      <footer className="academy-footer">
        <span>{t.brand} · JIMBLOGIC · OPEN SOURCE LEARNING</span>
        <Link href="/privacidad">{lang === "es" ? "Privacidad" : "Privacy"}</Link>
        <ClearLocalPreferencesButton compact language={lang} />
      </footer>
    </main>
  );
}
