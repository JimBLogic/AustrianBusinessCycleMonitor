"use client";

import { useState } from "react";
import Link from "next/link";

type Lang = "es" | "en";
type Module = {
  title: [string, string];
  eyebrow: [string, string];
  summary: [string, string];
  bullets: Array<[string, string]>;
  terminal: [string, string];
  question: [string, string];
  options: Array<[string, string]>;
  answer: number;
  source: { name: string; url: string };
};

const courses: Record<"austrian" | "bitcoin", { title: [string,string]; subtitle:[string,string]; modules: Module[] }> = {
  austrian: {
    title: ["Economía austriaca", "Austrian Economics"],
    subtitle: ["De la acción humana al ciclo económico, sin convertir una escuela de pensamiento en dogma.", "From human action to the business cycle, without turning a school of thought into dogma."],
    modules: [
      {
        eyebrow:["MÓDULO 01 · MÉTODO","MODULE 01 · METHOD"], title:["Acción humana y subjetividad","Human action & subjectivity"],
        summary:["La economía parte de personas que eligen medios escasos para alcanzar fines. El valor no está dentro del objeto: depende de la utilidad marginal que cada individuo espera.","Economics begins with people choosing scarce means to pursue ends. Value is not inside the object; it depends on expected marginal utility."],
        bullets:[["Praxeología: estudiar la lógica de la acción intencional.","Praxeology: studying the logic of purposeful action."],["Valor subjetivo y utilidad marginal.","Subjective value and marginal utility."],["Los agregados macro resumen; no actúan.","Macro aggregates summarize; they do not act."]],
        terminal:["En el monitor: una subida del oro no «significa» una sola cosa. Hay que preguntar qué preferencias, restricciones y expectativas cambiaron.","In the monitor: a rising gold price does not mean one thing. Ask which preferences, constraints and expectations changed."],
        question:["¿Qué determina el valor según el enfoque austriaco?","What determines value in the Austrian approach?"], options:[["El coste histórico de producción","Historical production cost"],["La utilidad marginal subjetiva","Subjective marginal utility"],["La decisión del banco central","The central bank decision"]], answer:1,
        source:{name:"Ludwig von Mises · Human Action",url:"https://mises.org/library/book/human-action"}
      },
      {
        eyebrow:["MÓDULO 02 · DINERO","MODULE 02 · MONEY"], title:["Cómo emerge el dinero","How money emerges"],
        summary:["El dinero reduce el problema de la doble coincidencia de deseos. Su calidad monetaria depende de vendibilidad, divisibilidad, durabilidad, verificabilidad y resistencia a la dilución.","Money reduces the double-coincidence problem. Monetary quality depends on salability, divisibility, durability, verifiability and resistance to dilution."],
        bullets:[["Origen de mercado frente a imposición legal.","Market origin versus legal imposition."],["Stock, flujo y prima monetaria.","Stock, flow and monetary premium."],["Dinero, crédito y sustitutos monetarios.","Money, credit and money substitutes."]],
        terminal:["En el monitor: compara M2, oro y Bitcoin. Stock-to-flow describe escasez, pero no sustituye el análisis de demanda ni es un modelo de precio.","In the monitor: compare M2, gold and Bitcoin. Stock-to-flow describes scarcity, but does not replace demand analysis or become a price model."],
        question:["¿Qué problema básico ayuda a resolver el dinero?","Which basic problem does money help solve?"], options:[["La doble coincidencia de deseos","The double coincidence of wants"],["La volatilidad bursátil","Stock-market volatility"],["El desempleo tecnológico","Technological unemployment"]], answer:0,
        source:{name:"Carl Menger · On the Origins of Money",url:"https://mises.org/library/book/origins-money"}
      },
      {
        eyebrow:["MÓDULO 03 · TIEMPO","MODULE 03 · TIME"], title:["Interés, ahorro y preferencia temporal","Interest, saving & time preference"],
        summary:["El tipo de interés coordina consumo presente, ahorro y proyectos productivos a diferentes plazos. No es simplemente el «precio del dinero».","The interest rate coordinates present consumption, saving and productive projects across time. It is not merely the price of money."],
        bullets:[["Preferencia temporal: presente frente a futuro.","Time preference: present versus future."],["Ahorro real como base de inversión sostenible.","Real saving as the basis of sustainable investment."],["Tipo natural frente a tipo administrado.","Natural versus administered rate."]],
        terminal:["En el monitor: observa fondos federales, IPC y tipo real aproximado. Un tipo bajo no siempre es expansivo si la demanda de liquidez se dispara.","In the monitor: watch fed funds, CPI and the approximate real rate. A low rate is not always expansionary if liquidity demand surges."],
        question:["¿Qué coordina el tipo de interés?","What does the interest rate coordinate?"], options:[["Solo el precio de las acciones","Only stock prices"],["Consumo, ahorro e inversión a través del tiempo","Consumption, saving and investment through time"],["El número de empresas","The number of firms"]], answer:1,
        source:{name:"Mises · Theory of Money and Credit",url:"https://mises.org/library/book/theory-money-and-credit"}
      },
      {
        eyebrow:["MÓDULO 04 · CAPITAL","MODULE 04 · CAPITAL"], title:["La estructura de producción","The structure of production"],
        summary:["El capital es heterogéneo: máquinas, conocimientos y procesos ocupan etapas distintas. Alargar la estructura sin ahorro suficiente vuelve frágiles ciertos proyectos.","Capital is heterogeneous: machines, knowledge and processes occupy different stages. Lengthening the structure without enough saving makes projects fragile."],
        bullets:[["Bienes de orden superior e inferior.","Higher- and lower-order goods."],["Complementariedad y especificidad del capital.","Capital complementarity and specificity."],["Costes de reconversión cuando cambia la señal.","Conversion costs when the signal changes."]],
        terminal:["En el monitor: producción industrial y utilización de capacidad ayudan a comprobar si el auge financiero tiene confirmación productiva.","In the monitor: industrial production and capacity utilization help test whether a financial boom has productive confirmation."],
        question:["¿Por qué el capital no es una masa homogénea?","Why is capital not a homogeneous lump?"], options:[["Porque cada bien ocupa funciones y etapas distintas","Because each good has different functions and stages"],["Porque solo existe capital financiero","Because only financial capital exists"],["Porque no puede depreciarse","Because it cannot depreciate"]], answer:0,
        source:{name:"F. A. Hayek · Monetary Theory and the Trade Cycle",url:"https://mises.org/library/book/monetary-theory-and-trade-cycle"}
      },
      {
        eyebrow:["MÓDULO 05 · CICLO","MODULE 05 · CYCLE"], title:["Auge, mala inversión y reajuste","Boom, malinvestment & readjustment"],
        summary:["La ABCT sostiene que una expansión crediticia no respaldada por ahorro puede falsear señales, financiar proyectos incompatibles y exigir después una reasignación dolorosa.","ABCT argues that credit expansion not backed by saving can falsify signals, fund incompatible projects and later require painful reallocation."],
        bullets:[["Crédito nuevo y señales de precio alteradas.","New credit and altered price signals."],["Malinvestment no significa «toda inversión mala».","Malinvestment does not mean all investment is bad."],["La recesión revela incompatibilidades previas.","Recession reveals earlier incompatibilities."]],
        terminal:["En el monitor: cruza liquidez, spreads, curva, VIX y economía real. Un único indicador jamás demuestra el ciclo austriaco.","In the monitor: cross liquidity, spreads, curve, VIX and the real economy. One indicator never proves an Austrian cycle."],
        question:["¿Qué es malinvestment?","What is malinvestment?"], options:[["Cualquier inversión que pierde dinero","Any investment that loses money"],["Inversión inducida por señales intertemporales distorsionadas","Investment induced by distorted intertemporal signals"],["Comprar bonos públicos","Buying government bonds"]], answer:1,
        source:{name:"Austrian Theory of the Trade Cycle",url:"https://mises.org/library/book/austrian-theory-trade-cycle-and-other-essays"}
      },
      {
        eyebrow:["MÓDULO 06 · CRÍTICA","MODULE 06 · CRITIQUE"], title:["Usar la lente sin convertirla en religión","Use the lens without making it a religion"],
        summary:["Una teoría útil debe declarar supuestos, buscar evidencia contraria y aceptar que los datos agregados son imperfectos. La ABCT aporta preguntas potentes, no fechas exactas de crash.","A useful theory states assumptions, seeks contrary evidence and accepts imperfect aggregates. ABCT offers powerful questions, not exact crash dates."],
        bullets:[["Correlación no implica causalidad.","Correlation does not imply causation."],["Distinguir predicción condicional de profecía.","Distinguish conditional prediction from prophecy."],["Definir qué evidencia cambiaría tu opinión.","Define what evidence would change your view."]],
        terminal:["En el monitor: el régimen se presenta con componentes y fuentes. Puedes discrepar con los pesos; precisamente por eso están visibles.","In the monitor: regimes expose components and sources. You may disagree with the weights; that is why they are visible."],
        question:["¿Qué hace más sólido un análisis?","What makes analysis stronger?"], options:[["Ocultar los supuestos","Hiding assumptions"],["Usar solo citas de autoridad","Using only authority quotes"],["Definir condiciones que podrían refutarlo","Defining conditions that could falsify it"]], answer:2,
        source:{name:"ABCM · Open methodology",url:"/"}
      },
    ]
  },
  bitcoin: {
    title:["Bitcoin y soberanía financiera","Bitcoin & Financial Sovereignty"],
    subtitle:["De entender el protocolo a construir un modelo de seguridad personal realista.","From understanding the protocol to building a realistic personal security model."],
    modules:[
      {
        eyebrow:["MÓDULO 01 · PROBLEMA","MODULE 01 · PROBLEM"],title:["Qué intenta resolver Bitcoin","What Bitcoin tries to solve"],
        summary:["Bitcoin coordina un registro escaso sin autoridad central y permite liquidación digital resistente a censura. No elimina la confianza: la redistribuye hacia reglas verificables.","Bitcoin coordinates a scarce ledger without central authority and enables censorship-resistant digital settlement. It does not remove trust; it shifts it toward verifiable rules."],
        bullets:[["Doble gasto y consenso distribuido.","Double spending and distributed consensus."],["Prueba de trabajo como coste verificable.","Proof of work as verifiable cost."],["21 millones como regla, no promesa corporativa.","21 million as a rule, not a corporate promise."]],
        terminal:["En el monitor: precio y market cap miden mercado; altura, dificultad y hashrate hablan de la red. No confundas ambos planos.","In the monitor: price and market cap measure markets; height, difficulty and hashrate describe the network. Do not confuse them."],
        question:["¿Dónde vive el límite de 21 millones?","Where does the 21-million limit live?"],options:[["En una promesa del CEO","In a CEO promise"],["En reglas validadas por los nodos","In rules validated by nodes"],["En una cuenta bancaria","In a bank account"]],answer:1,
        source:{name:"Bitcoin whitepaper",url:"https://bitcoin.org/bitcoin.pdf"}
      },
      {
        eyebrow:["MÓDULO 02 · UTXO","MODULE 02 · UTXO"],title:["Propiedad, claves y UTXOs","Ownership, keys & UTXOs"],
        summary:["La wallet no guarda monedas: administra claves que autorizan el gasto de salidas no gastadas. Quien controla las claves puede firmar; quien las pierde no tiene soporte técnico mágico.","A wallet does not hold coins: it manages keys authorizing unspent outputs. Whoever controls the keys can sign; whoever loses them has no magical help desk."],
        bullets:[["Seed, claves privadas y direcciones.","Seed, private keys and addresses."],["UTXO frente a saldo de cuenta.","UTXO versus account balance."],["Firma, difusión y confirmación.","Signing, broadcasting and confirmation."]],
        terminal:["El precio no cambia la propiedad criptográfica. Una posición en un exchange y un UTXO autocustodiado tienen riesgos diferentes.","Price does not change cryptographic ownership. An exchange balance and a self-custodied UTXO carry different risks."],
        question:["¿Qué controla realmente una wallet?","What does a wallet actually control?"],options:[["Las claves para autorizar gasto","Keys authorizing spending"],["El precio de Bitcoin","Bitcoin's price"],["Los mineros","Miners"]],answer:0,
        source:{name:"Bitcoin Developer Guide",url:"https://developer.bitcoin.org/devguide/"}
      },
      {
        eyebrow:["MÓDULO 03 · VERIFICACIÓN","MODULE 03 · VERIFICATION"],title:["Nodo propio y no confiar","Your own node & verification"],
        summary:["Un nodo verifica bloques y transacciones conforme a las reglas que eliges. Mejora independencia y privacidad, pero exige mantenimiento, conectividad y copias de configuración.","A node validates blocks and transactions against rules you choose. It improves independence and privacy, but requires maintenance, connectivity and configuration backups."],
        bullets:[["Verificar oferta y reglas localmente.","Verify supply and rules locally."],["Evitar depender del nodo de un tercero.","Avoid relying on a third party's node."],["Tor, ancho de banda y exposición de red.","Tor, bandwidth and network exposure."]],
        terminal:["Hashrate alto no sustituye tu verificación. Mineros proponen bloques; nodos aceptan solo los válidos.","High hashrate does not replace your verification. Miners propose blocks; nodes accept only valid ones."],
        question:["¿Qué decide tu nodo?","What does your node decide?"],options:[["Qué bloques cumplen sus reglas","Which blocks satisfy its rules"],["El precio futuro","The future price"],["La política monetaria del dólar","Dollar monetary policy"]],answer:0,
        source:{name:"Bitcoin Core · source repository",url:"https://github.com/bitcoin/bitcoin"}
      },
      {
        eyebrow:["MÓDULO 04 · CUSTODIA","MODULE 04 · CUSTODY"],title:["Autocustodia y modelo de amenazas","Self-custody & threat model"],
        summary:["La mejor configuración depende de cantidad, capacidades y amenazas. Más complejidad no siempre significa más seguridad: puede multiplicar tus formas de equivocarte.","The best setup depends on amount, skills and threats. More complexity does not always mean more security; it can multiply failure modes."],
        bullets:[["Hot wallet, hardware wallet y multisig.","Hot wallet, hardware wallet and multisig."],["Backups resistentes y recuperación ensayada.","Resilient backups and tested recovery."],["Herencia, coerción y riesgo físico.","Inheritance, coercion and physical risk."]],
        terminal:["La soberanía empieza con cantidades pequeñas y pruebas de recuperación. Nunca ensayes por primera vez con todo tu patrimonio.","Sovereignty starts with small amounts and recovery drills. Never rehearse for the first time with your whole net worth."],
        question:["¿Cuál es la primera pregunta antes de elegir custodia?","What is the first question before choosing custody?"],options:[["Qué hardware está de moda","Which hardware is trendy"],["Cuál es mi modelo de amenazas","What is my threat model"],["Cuánto subirá el precio","How much price will rise"]],answer:1,
        source:{name:"Bitcoin.org · Secure your wallet",url:"https://bitcoin.org/en/secure-your-wallet"}
      },
      {
        eyebrow:["MÓDULO 05 · PRIVACIDAD","MODULE 05 · PRIVACY"],title:["Privacidad, trazabilidad y disciplina","Privacy, traceability & discipline"],
        summary:["Bitcoin es seudónimo, no anónimo. Direcciones, UTXOs, KYC, red y comportamiento pueden vincularse. La privacidad es un proceso acumulativo y se rompe con errores pequeños.","Bitcoin is pseudonymous, not anonymous. Addresses, UTXOs, KYC, network data and behavior can be linked. Privacy is cumulative and can break through small mistakes."],
        bullets:[["No reutilizar direcciones.","Do not reuse addresses."],["Control de monedas y etiquetado de UTXOs.","Coin control and UTXO labeling."],["Evitar compartir xpubs y datos de balances.","Avoid sharing xpubs and balance data."]],
        terminal:["La privacidad protege seguridad y fungibilidad; no es una invitación a incumplir obligaciones legales aplicables.","Privacy supports safety and fungibility; it is not an invitation to ignore applicable legal obligations."],
        question:["¿Bitcoin es anónimo por defecto?","Is Bitcoin anonymous by default?"],options:[["Sí, totalmente","Yes, completely"],["No, es un registro público seudónimo","No, it is a public pseudonymous ledger"],["Solo cuando sube de precio","Only when price rises"]],answer:1,
        source:{name:"Bitcoin.org · Protect your privacy",url:"https://bitcoin.org/en/protect-your-privacy"}
      },
      {
        eyebrow:["MÓDULO 06 · SOBERANÍA","MODULE 06 · SOVEREIGNTY"],title:["Plan personal en capas","A layered personal plan"],
        summary:["Soberanía no es abandonar toda institución mañana. Es reducir puntos únicos de fallo: ahorro líquido, buenas copias, deuda prudente, privacidad, conocimientos y alternativas de pago.","Sovereignty is not abandoning every institution tomorrow. It is reducing single points of failure: liquidity, backups, prudent debt, privacy, knowledge and payment alternatives."],
        bullets:[["Fondo de emergencia antes de asumir volatilidad.","Emergency fund before taking volatility."],["Separar ahorro, gasto y experimentación.","Separate saving, spending and experimentation."],["Documentar un plan de recuperación y herencia.","Document recovery and inheritance."]],
        terminal:["Bitcoin puede ser una herramienta de soberanía, no una excusa para concentrar riesgos que no comprendes.","Bitcoin can be a sovereignty tool, not an excuse to concentrate risks you do not understand."],
        question:["¿Qué describe mejor la soberanía financiera?","What best describes financial sovereignty?"],options:[["No usar jamás servicios de terceros","Never using third-party services"],["Reducir dependencias y comprender los riesgos que conservas","Reducing dependencies and understanding retained risks"],["Invertir todo en un único activo","Putting everything into one asset"]],answer:1,
        source:{name:"ABCM · Sovereignty framework",url:"/"}
      },
    ]
  }
};

const answerEvidence: Record<"austrian" | "bitcoin", Array<[string, string]>> = {
  austrian: [
    ["La teoría del valor subjetivo explica que el valor económico depende de la importancia que una persona atribuye a la siguiente unidad disponible para satisfacer un fin. Por eso la utilidad marginal subjetiva, no el coste histórico ni una decisión monetaria, responde a la pregunta.", "Subjective value theory holds that economic value depends on the importance a person assigns to the next available unit in pursuing an end. Therefore subjective marginal utility—not historical cost or a monetary-policy decision—answers the question."],
    ["Menger explica la emergencia del dinero a partir de bienes más vendibles que facilitan intercambios indirectos. Esa función evita exigir que ambas partes quieran exactamente lo que la otra ofrece al mismo tiempo: la doble coincidencia de deseos.", "Menger explains money emerging from more saleable goods that enable indirect exchange. This avoids requiring both parties to want exactly what the other offers at the same time: the double coincidence of wants."],
    ["En la teoría monetaria y del capital, el interés relaciona bienes presentes y futuros. Coordina cuánto consumir, ahorrar e invertir a través del tiempo; no determina únicamente acciones ni el número de empresas.", "In monetary and capital theory, interest relates present and future goods. It coordinates consumption, saving and investment through time; it does not determine only stock prices or the number of firms."],
    ["Hayek describe una estructura productiva compuesta por bienes de capital heterogéneos, específicos y complementarios que actúan en etapas distintas. No existe un bloque uniforme de «capital» que pueda reasignarse sin costes.", "Hayek describes a production structure made of heterogeneous, specific and complementary capital goods serving different stages. There is no uniform lump of “capital” that can be reassigned without cost."],
    ["En la ABCT, malinvestment designa proyectos inducidos por señales intertemporales distorsionadas y no toda inversión que termina perdiendo dinero. La clasificación depende del proceso de coordinación entre crédito, ahorro y estructura productiva.", "In ABCT, malinvestment means projects induced by distorted intertemporal signals—not every investment that later loses money. The classification concerns coordination among credit, saving and the production structure."],
    ["Un análisis contrastable declara qué observación lo debilitaría o refutaría. Ocultar supuestos o apelar solo a una autoridad impide comprobarlo; formular condiciones de falsación permite someter la tesis a evidencia.", "A testable analysis states which observations would weaken or falsify it. Hiding assumptions or relying only on authority prevents testing; defining falsification conditions exposes the thesis to evidence."],
  ],
  bitcoin: [
    ["El límite de emisión forma parte de las reglas de consenso que cada nodo completo aplica al validar bloques. No depende de una empresa, un director ejecutivo ni una cuenta bancaria.", "The issuance limit is part of the consensus rules each full node enforces while validating blocks. It does not depend on a company, chief executive or bank account."],
    ["La guía técnica describe una wallet como software que administra claves y construye firmas para gastar salidas no gastadas. Las monedas no están «dentro» de la aplicación y la wallet no controla el precio ni a los mineros.", "The technical guide describes a wallet as software that manages keys and creates signatures to spend unspent outputs. Coins are not “inside” the app, and the wallet controls neither price nor miners."],
    ["Bitcoin Core valida de forma independiente que bloques y transacciones respeten sus reglas de consenso. Los mineros pueden proponer bloques, pero un nodo rechaza aquellos que incumplen las reglas que ejecuta.", "Bitcoin Core independently validates that blocks and transactions follow its consensus rules. Miners may propose blocks, but a node rejects blocks that violate the rules it runs."],
    ["La documentación de seguridad recomienda evaluar riesgos, capacidades y recuperación antes de elegir herramientas. El modelo de amenazas determina qué se protege, de quién y con qué costes; la moda o una predicción de precio no responden a esas preguntas.", "Security guidance recommends assessing risks, capabilities and recovery before choosing tools. A threat model defines what is protected, from whom and at what cost; trends or price predictions do not answer those questions."],
    ["La cadena de bloques es pública y las direcciones son seudónimos, no identidades secretas garantizadas. El análisis de transacciones, la reutilización de direcciones, KYC y metadatos de red pueden vincular actividad.", "The blockchain is public and addresses are pseudonyms, not guaranteed secret identities. Transaction analysis, address reuse, KYC and network metadata can link activity."],
    ["El marco del curso define soberanía como reducción consciente de puntos únicos de fallo y comprensión de las dependencias que permanecen. No exige eliminar todo tercero ni concentrar el patrimonio en un solo activo.", "The course framework defines sovereignty as consciously reducing single points of failure and understanding the dependencies that remain. It requires neither eliminating every third party nor concentrating wealth in one asset."],
  ],
};

export default function AcademyCourse({ track, initialLang }: { track: "austrian" | "bitcoin"; initialLang: Lang }) {
  const [lang,setLang]=useState<Lang>(initialLang);
  const [active,setActive]=useState(0);
  const course=courses[track];
  const [answers,setAnswers]=useState<Array<number|null>>(()=>Array(course.modules.length).fill(null));
  const lessonModule=course.modules[active];
  const answer=answers[active];
  const li=lang==="es"?0:1;
  const answeredCount=answers.filter((item)=>item!==null).length;
  const correctCount=answers.reduce((total,item,index)=>total+(item===course.modules[index].answer?1:0),0);
  const complete=answeredCount===course.modules.length;
  const percentage=Math.round((correctCount/course.modules.length)*100);
  function changeLanguage(){
    const next=lang==="es"?"en":"es";
    setLang(next);
    const url=new URL(window.location.href);
    url.searchParams.set("lang",next);
    window.history.replaceState({},"",url);
  }
  function select(index:number){setActive(index);window.scrollTo({top:0,behavior:"smooth"});}
  function choose(index:number){
    if(answer!==null)return;
    setAnswers((current)=>current.map((item,moduleIndex)=>moduleIndex===active?index:item));
  }
  function resetAssessment(){
    setAnswers(Array(course.modules.length).fill(null));
    setActive(0);
    window.scrollTo({top:0,behavior:"smooth"});
  }
  return <main className={`course-shell ${track}`}>
    <aside className="course-sidebar">
      <a href={`/learn?lang=${lang}`} className="course-brand"><span>₿</span> {lang==="es"?"ABCM APRENDE":"ABCM LEARN"}</a>
      <div className="course-track"><small>{lang==="es"?"RUTA":"PATH"} {track==="austrian"?"01":"02"}</small><h1>{course.title[li]}</h1><p>{course.subtitle[li]}</p></div>
      <div className="course-progress"><span>{lang==="es"?"EVALUACIÓN":"ASSESSMENT"}</span><b>{answeredCount}/{course.modules.length}</b><div><i style={{width:`${answeredCount/course.modules.length*100}%`}} /></div></div>
      <nav>{course.modules.map((item,index)=>{
        const response=answers[index];
        const state=response===null?"":response===item.answer?"correct":"wrong";
        return <button key={index} onClick={()=>select(index)} className={`${active===index?"active":""} ${state}`}><span>{String(index+1).padStart(2,"0")}</span>{item.title[li]}<em>{response===null?"":state==="correct"?"✓":"×"}</em></button>;
      })}</nav>
      <div className="course-side-actions"><button onClick={changeLanguage}>{lang==="es"?"Read in English":"Leer en español"}</button><Link href="/">← {lang==="es"?"Monitor macro":"Macro monitor"}</Link></div>
    </aside>
    <article className="lesson">
      <header><span>{lessonModule.eyebrow[li]}</span><h2>{lessonModule.title[li]}</h2><p>{lessonModule.summary[li]}</p></header>
      <section className="lesson-core">
        <div><span className="lesson-label">{lang==="es"?"IDEAS CENTRALES":"CORE IDEAS"}</span>{lessonModule.bullets.map((bullet,index)=><div className="lesson-point" key={index}><b>0{index+1}</b><p>{bullet[li]}</p></div>)}</div>
        <aside><span className="lesson-label">{lang==="es"?"CONEXIÓN CON EL MONITOR":"MONITOR CONNECTION"}</span><p>{lessonModule.terminal[li]}</p><Link href="/" target="_blank">{lang==="es"?"Abrir terminal macro":"Open macro terminal"} ↗</Link></aside>
      </section>
      <section className="knowledge-check">
        <span className="lesson-label">{lang==="es"?"PRUEBA DE COMPRENSIÓN":"PROOF OF UNDERSTANDING"}</span><h3>{lessonModule.question[li]}</h3>
        <div>{lessonModule.options.map((option,index)=><button key={index} onClick={()=>choose(index)} disabled={answer!==null} className={answer!==null?(index===lessonModule.answer?"correct":answer===index?"wrong":"muted"):""}>{String.fromCharCode(65+index)} · {option[li]}</button>)}</div>
        {answer!==null&&<div className={`answer-review ${answer===lessonModule.answer?"success":"retry"}`}>
          <span>{answer===lessonModule.answer?(lang==="es"?"RESPUESTA CORRECTA":"CORRECT ANSWER"):(lang==="es"?"RESPUESTA INCORRECTA":"INCORRECT ANSWER")}</span>
          <h4>{lang==="es"?"La opción documentada es":"The documented answer is"} {String.fromCharCode(65+lessonModule.answer)} · {lessonModule.options[lessonModule.answer][li]}</h4>
          <p>{answerEvidence[track][active][li]}</p>
          {answer!==lessonModule.answer&&<small>{lang==="es"?`Elegiste ${String.fromCharCode(65+answer)}. Esa alternativa no describe el concepto definido en la documentación del módulo.`:`You selected ${String.fromCharCode(65+answer)}. That alternative does not describe the concept defined in the module documentation.`}</small>}
          <a href={lessonModule.source.url} target="_blank" rel="noreferrer">{lang==="es"?"Comprobar en la fuente":"Verify in source"}: {lessonModule.source.name} ↗</a>
        </div>}
      </section>
      {complete&&<section className="course-results" aria-live="polite">
        <div><span>{lang==="es"?"RESULTADO FINAL":"FINAL RESULT"}</span><strong>{percentage}%</strong></div>
        <div><h3>{correctCount}/{course.modules.length} {lang==="es"?"respuestas correctas":"correct answers"}</h3><p>{percentage>=80?(lang==="es"?"Dominio sólido de los conceptos evaluados. Puedes volver a los módulos marcados con × para revisar la evidencia.":"Strong command of the assessed concepts. Revisit modules marked × to review the evidence."):(lang==="es"?"Conviene revisar los módulos marcados con × y contrastar sus fuentes antes de repetir la evaluación.":"Review modules marked × and check their sources before repeating the assessment.")}</p><small>{lang==="es"?"Criterio transparente: cada módulo vale un punto; porcentaje = aciertos ÷ 6 × 100. Umbral orientativo de dominio: 80%.":"Transparent rule: each module is worth one point; percentage = correct ÷ 6 × 100. Guidance mastery threshold: 80%."}</small><button onClick={resetAssessment}>{lang==="es"?"Reiniciar evaluación":"Restart assessment"}</button></div>
      </section>}
      <footer className="lesson-footer"><a href={lessonModule.source.url} target="_blank" rel="noreferrer">{lessonModule.source.name} ↗</a><div><button disabled={active===0} onClick={()=>select(active-1)}>←</button><span>{active+1} / {course.modules.length}</span><button disabled={active===course.modules.length-1} onClick={()=>select(active+1)}>→</button></div></footer>
    </article>
  </main>;
}
