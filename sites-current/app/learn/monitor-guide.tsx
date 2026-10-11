export function MonitorGuide({ lang }: { lang: "es" | "en" }) {
  const es = lang === "es";
  const steps = es ? [
    ["01 · Lee la pregunta", "El monitor estudia el ciclo de EE. UU. Empieza por dinero, coste del crédito y actividad real. Una subida bursátil no describe por sí sola la situación de los hogares."],
    ["02 · Mira la unidad", "Un nivel y una variación son cosas distintas. El IPC es un índice; la inflación es su cambio durante un periodo. Ejemplo hipotético: pasar del 4% al 5% son +1 punto porcentual, o un aumento relativo del 25%."],
    ["03 · Comprueba la fecha", "La fecha del dato indica cuándo se observó el fenómeno. La fecha de consulta indica cuándo lo obtuvo el monitor. Una consulta de hoy puede contener datos mensuales anteriores; compáralos con periodos equivalentes."],
    ["04 · Separa las tres capas", "Dato: una observación publicada. Modelo: una transformación con fórmulas y pesos elegidos. Interpretación: una explicación económica que puede discutirse. El índice 0–100 no es una probabilidad de recesión y cobertura no significa certeza."],
    ["05 · Busca qué falta", "Una relación entre series no demuestra causalidad. Comprueba otras explicaciones, los datos ausentes y qué evidencia cambiaría la lectura. En el panel puedes alternar señal observada y lente austriaca."],
  ] : [
    ["01 · Start with the question", "The monitor studies the US cycle. Start with money, borrowing costs and real activity. A rising stock market alone does not describe household conditions."],
    ["02 · Check the unit", "A level and a change are different things. CPI is an index; inflation is its change over a period. Hypothetical example: moving from 4% to 5% is +1 percentage point, or a 25% relative increase."],
    ["03 · Check the date", "The observation date tells you when the phenomenon was measured. The retrieval date tells you when the monitor obtained it. Today's check may contain earlier monthly data; compare equivalent periods."],
    ["04 · Separate three layers", "Data: a published observation. Model: a transformation using chosen formulas and weights. Interpretation: an economic explanation open to debate. The 0–100 index is not a recession probability and coverage does not mean certainty."],
    ["05 · Look for what is missing", "A relationship between series does not establish causation. Check alternative explanations, missing data and what evidence would change the reading. The dashboard lets you switch between observed signals and the Austrian lens."],
  ];
  return <section className="monitor-guide" id="read-monitor" aria-labelledby="guide-title">
    <span className="academy-label">{es ? "EMPIEZA AQUÍ · 5 MINUTOS" : "START HERE · 5 MINUTES"}</span>
    <h2 id="guide-title">{es ? "Cómo leer el monitor" : "How to read the monitor"}</h2>
    <p>{es ? "No necesitas saber macroeconomía para empezar. Sigue este orden y después prueba con un gráfico." : "You do not need a macroeconomics background. Follow this sequence, then try a chart."}</p>
    <div>{steps.map(([title, body], i) => <details key={title} open={i === 0}><summary>{title}</summary><p>{body}</p></details>)}</div>
    <a href={`/?lang=${lang}#dashboard`}>{es ? "Practicar con los datos →" : "Try it with the data →"}</a>
  </section>;
}
