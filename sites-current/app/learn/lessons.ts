export type Lang = "es" | "en";
export type Module = {
  title: [string, string];
  eyebrow: [string, string];
  summary: [string, string];
  bullets: Array<[string, string]>;
  terminal: [string, string];
  source: { name: string; url: string };
};

export const courses: Record<"austrian" | "bitcoin", { title: [string,string]; subtitle:[string,string]; modules: Module[] }> = {
  "austrian": {
    "title": [
      "Economía austriaca",
      "Austrian Economics"
    ],
    "subtitle": [
      "De la acción humana al ciclo económico, sin convertir una escuela de pensamiento en dogma.",
      "From human action to the business cycle, without turning a school of thought into dogma."
    ],
    "modules": [
      {
        "eyebrow": [
          "MÓDULO 01 · MÉTODO",
          "MODULE 01 · METHOD"
        ],
        "title": [
          "Acción humana y subjetividad",
          "Human action & subjectivity"
        ],
        "summary": [
          "La economía parte de personas que eligen medios escasos para alcanzar fines. El valor no está dentro del objeto: depende de la utilidad marginal que cada individuo espera.",
          "Economics begins with people choosing scarce means to pursue ends. Value is not inside the object; it depends on expected marginal utility."
        ],
        "bullets": [
          [
            "Praxeología: estudiar la lógica de la acción intencional.",
            "Praxeology: studying the logic of purposeful action."
          ],
          [
            "Valor subjetivo y utilidad marginal.",
            "Subjective value and marginal utility."
          ],
          [
            "Los agregados macro resumen; no actúan.",
            "Macro aggregates summarize; they do not act."
          ]
        ],
        "terminal": [
          "En el monitor: una subida del oro no «significa» una sola cosa. Hay que preguntar qué preferencias, restricciones y expectativas cambiaron.",
          "In the monitor: a rising gold price does not mean one thing. Ask which preferences, constraints and expectations changed."
        ],
        "source": {
          "name": "Ludwig von Mises · Human Action",
          "url": "https://mises.org/library/book/human-action"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 02 · DINERO",
          "MODULE 02 · MONEY"
        ],
        "title": [
          "Cómo emerge el dinero",
          "How money emerges"
        ],
        "summary": [
          "El dinero reduce el problema de la doble coincidencia de deseos. Su calidad monetaria depende de vendibilidad, divisibilidad, durabilidad, verificabilidad y resistencia a la dilución.",
          "Money reduces the double-coincidence problem. Monetary quality depends on salability, divisibility, durability, verifiability and resistance to dilution."
        ],
        "bullets": [
          [
            "Origen de mercado frente a imposición legal.",
            "Market origin versus legal imposition."
          ],
          [
            "Stock, flujo y prima monetaria.",
            "Stock, flow and monetary premium."
          ],
          [
            "Dinero, crédito y sustitutos monetarios.",
            "Money, credit and money substitutes."
          ]
        ],
        "terminal": [
          "En el monitor: compara M2, oro y Bitcoin. Stock-to-flow describe escasez, pero no sustituye el análisis de demanda ni es un modelo de precio.",
          "In the monitor: compare M2, gold and Bitcoin. Stock-to-flow describes scarcity, but does not replace demand analysis or become a price model."
        ],
        "source": {
          "name": "Carl Menger · On the Origins of Money",
          "url": "https://mises.org/library/book/origins-money"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 03 · TIEMPO",
          "MODULE 03 · TIME"
        ],
        "title": [
          "Interés, ahorro y preferencia temporal",
          "Interest, saving & time preference"
        ],
        "summary": [
          "El tipo de interés coordina consumo presente, ahorro y proyectos productivos a diferentes plazos. No es simplemente el «precio del dinero».",
          "The interest rate coordinates present consumption, saving and productive projects across time. It is not merely the price of money."
        ],
        "bullets": [
          [
            "Preferencia temporal: presente frente a futuro.",
            "Time preference: present versus future."
          ],
          [
            "Ahorro real como base de inversión sostenible.",
            "Real saving as the basis of sustainable investment."
          ],
          [
            "Tipo natural frente a tipo administrado.",
            "Natural versus administered rate."
          ]
        ],
        "terminal": [
          "En el monitor: observa fondos federales, IPC y tipo real aproximado. Un tipo bajo no siempre es expansivo si la demanda de liquidez se dispara.",
          "In the monitor: watch fed funds, CPI and the approximate real rate. A low rate is not always expansionary if liquidity demand surges."
        ],
        "source": {
          "name": "Mises · Theory of Money and Credit",
          "url": "https://mises.org/library/book/theory-money-and-credit"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 04 · CAPITAL",
          "MODULE 04 · CAPITAL"
        ],
        "title": [
          "La estructura de producción",
          "The structure of production"
        ],
        "summary": [
          "El capital es heterogéneo: máquinas, conocimientos y procesos ocupan etapas distintas. Alargar la estructura sin ahorro suficiente vuelve frágiles ciertos proyectos.",
          "Capital is heterogeneous: machines, knowledge and processes occupy different stages. Lengthening the structure without enough saving makes projects fragile."
        ],
        "bullets": [
          [
            "Bienes de orden superior e inferior.",
            "Higher- and lower-order goods."
          ],
          [
            "Complementariedad y especificidad del capital.",
            "Capital complementarity and specificity."
          ],
          [
            "Costes de reconversión cuando cambia la señal.",
            "Conversion costs when the signal changes."
          ]
        ],
        "terminal": [
          "En el monitor: producción industrial y utilización de capacidad ayudan a comprobar si el auge financiero tiene confirmación productiva.",
          "In the monitor: industrial production and capacity utilization help test whether a financial boom has productive confirmation."
        ],
        "source": {
          "name": "F. A. Hayek · Monetary Theory and the Trade Cycle",
          "url": "https://mises.org/library/book/monetary-theory-and-trade-cycle"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 05 · CICLO",
          "MODULE 05 · CYCLE"
        ],
        "title": [
          "Auge, mala inversión y reajuste",
          "Boom, malinvestment & readjustment"
        ],
        "summary": [
          "La ABCT sostiene que una expansión crediticia no respaldada por ahorro puede falsear señales, financiar proyectos incompatibles y exigir después una reasignación dolorosa.",
          "ABCT argues that credit expansion not backed by saving can falsify signals, fund incompatible projects and later require painful reallocation."
        ],
        "bullets": [
          [
            "Crédito nuevo y señales de precio alteradas.",
            "New credit and altered price signals."
          ],
          [
            "Malinvestment no significa «toda inversión mala».",
            "Malinvestment does not mean all investment is bad."
          ],
          [
            "La recesión revela incompatibilidades previas.",
            "Recession reveals earlier incompatibilities."
          ]
        ],
        "terminal": [
          "En el monitor: cruza liquidez, spreads, curva, VIX y economía real. Un único indicador jamás demuestra el ciclo austriaco.",
          "In the monitor: cross liquidity, spreads, curve, VIX and the real economy. One indicator never proves an Austrian cycle."
        ],
        "source": {
          "name": "Austrian Theory of the Trade Cycle",
          "url": "https://mises.org/library/book/austrian-theory-trade-cycle-and-other-essays"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 06 · CRÍTICA",
          "MODULE 06 · CRITIQUE"
        ],
        "title": [
          "Usar la lente sin convertirla en religión",
          "Use the lens without making it a religion"
        ],
        "summary": [
          "Una teoría útil debe declarar supuestos, buscar evidencia contraria y aceptar que los datos agregados son imperfectos. La ABCT aporta preguntas potentes, no fechas exactas de crash.",
          "A useful theory states assumptions, seeks contrary evidence and accepts imperfect aggregates. ABCT offers powerful questions, not exact crash dates."
        ],
        "bullets": [
          [
            "Correlación no implica causalidad.",
            "Correlation does not imply causation."
          ],
          [
            "Distinguir predicción condicional de profecía.",
            "Distinguish conditional prediction from prophecy."
          ],
          [
            "Definir qué evidencia cambiaría tu opinión.",
            "Define what evidence would change your view."
          ]
        ],
        "terminal": [
          "En el monitor: el régimen se presenta con componentes y fuentes. Puedes discrepar con los pesos; precisamente por eso están visibles.",
          "In the monitor: regimes expose components and sources. You may disagree with the weights; that is why they are visible."
        ],
        "source": {
          "name": "ABCM · Open methodology",
          "url": "/"
        }
      }
    ]
  },
  "bitcoin": {
    "title": [
      "Bitcoin y soberanía financiera",
      "Bitcoin & Financial Sovereignty"
    ],
    "subtitle": [
      "De entender el protocolo a construir un modelo de seguridad personal realista.",
      "From understanding the protocol to building a realistic personal security model."
    ],
    "modules": [
      {
        "eyebrow": [
          "MÓDULO 01 · PROBLEMA",
          "MODULE 01 · PROBLEM"
        ],
        "title": [
          "Qué intenta resolver Bitcoin",
          "What Bitcoin tries to solve"
        ],
        "summary": [
          "Bitcoin coordina un registro escaso sin autoridad central y permite liquidación digital resistente a censura. No elimina la confianza: la redistribuye hacia reglas verificables.",
          "Bitcoin coordinates a scarce ledger without central authority and enables censorship-resistant digital settlement. It does not remove trust; it shifts it toward verifiable rules."
        ],
        "bullets": [
          [
            "Doble gasto y consenso distribuido.",
            "Double spending and distributed consensus."
          ],
          [
            "Prueba de trabajo como coste verificable.",
            "Proof of work as verifiable cost."
          ],
          [
            "21 millones como regla, no promesa corporativa.",
            "21 million as a rule, not a corporate promise."
          ]
        ],
        "terminal": [
          "En el monitor: precio y market cap miden mercado; altura, dificultad y hashrate hablan de la red. No confundas ambos planos.",
          "In the monitor: price and market cap measure markets; height, difficulty and hashrate describe the network. Do not confuse them."
        ],
        "source": {
          "name": "Bitcoin whitepaper",
          "url": "https://bitcoin.org/bitcoin.pdf"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 02 · UTXO",
          "MODULE 02 · UTXO"
        ],
        "title": [
          "Propiedad, claves y UTXOs",
          "Ownership, keys & UTXOs"
        ],
        "summary": [
          "La wallet no guarda monedas: administra claves que autorizan el gasto de salidas no gastadas. Quien controla las claves puede firmar; quien las pierde no tiene soporte técnico mágico.",
          "A wallet does not hold coins: it manages keys authorizing unspent outputs. Whoever controls the keys can sign; whoever loses them has no magical help desk."
        ],
        "bullets": [
          [
            "Seed, claves privadas y direcciones.",
            "Seed, private keys and addresses."
          ],
          [
            "UTXO frente a saldo de cuenta.",
            "UTXO versus account balance."
          ],
          [
            "Firma, difusión y confirmación.",
            "Signing, broadcasting and confirmation."
          ]
        ],
        "terminal": [
          "El precio no cambia la propiedad criptográfica. Una posición en un exchange y un UTXO autocustodiado tienen riesgos diferentes.",
          "Price does not change cryptographic ownership. An exchange balance and a self-custodied UTXO carry different risks."
        ],
        "source": {
          "name": "Bitcoin Developer Guide",
          "url": "https://developer.bitcoin.org/devguide/"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 03 · VERIFICACIÓN",
          "MODULE 03 · VERIFICATION"
        ],
        "title": [
          "Nodo propio y no confiar",
          "Your own node & verification"
        ],
        "summary": [
          "Un nodo verifica bloques y transacciones conforme a las reglas que eliges. Mejora independencia y privacidad, pero exige mantenimiento, conectividad y copias de configuración.",
          "A node validates blocks and transactions against rules you choose. It improves independence and privacy, but requires maintenance, connectivity and configuration backups."
        ],
        "bullets": [
          [
            "Verificar oferta y reglas localmente.",
            "Verify supply and rules locally."
          ],
          [
            "Evitar depender del nodo de un tercero.",
            "Avoid relying on a third party's node."
          ],
          [
            "Tor, ancho de banda y exposición de red.",
            "Tor, bandwidth and network exposure."
          ]
        ],
        "terminal": [
          "Hashrate alto no sustituye tu verificación. Mineros proponen bloques; nodos aceptan solo los válidos.",
          "High hashrate does not replace your verification. Miners propose blocks; nodes accept only valid ones."
        ],
        "source": {
          "name": "Bitcoin Core · source repository",
          "url": "https://github.com/bitcoin/bitcoin"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 04 · CUSTODIA",
          "MODULE 04 · CUSTODY"
        ],
        "title": [
          "Autocustodia y modelo de amenazas",
          "Self-custody & threat model"
        ],
        "summary": [
          "La mejor configuración depende de cantidad, capacidades y amenazas. Más complejidad no siempre significa más seguridad: puede multiplicar tus formas de equivocarte.",
          "The best setup depends on amount, skills and threats. More complexity does not always mean more security; it can multiply failure modes."
        ],
        "bullets": [
          [
            "Hot wallet, hardware wallet y multisig.",
            "Hot wallet, hardware wallet and multisig."
          ],
          [
            "Backups resistentes y recuperación ensayada.",
            "Resilient backups and tested recovery."
          ],
          [
            "Herencia, coerción y riesgo físico.",
            "Inheritance, coercion and physical risk."
          ]
        ],
        "terminal": [
          "La soberanía empieza con cantidades pequeñas y pruebas de recuperación. Nunca ensayes por primera vez con todo tu patrimonio.",
          "Sovereignty starts with small amounts and recovery drills. Never rehearse for the first time with your whole net worth."
        ],
        "source": {
          "name": "Bitcoin.org · Secure your wallet",
          "url": "https://bitcoin.org/en/secure-your-wallet"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 05 · PRIVACIDAD",
          "MODULE 05 · PRIVACY"
        ],
        "title": [
          "Privacidad, trazabilidad y disciplina",
          "Privacy, traceability & discipline"
        ],
        "summary": [
          "Bitcoin es seudónimo, no anónimo. Direcciones, UTXOs, KYC, red y comportamiento pueden vincularse. La privacidad es un proceso acumulativo y se rompe con errores pequeños.",
          "Bitcoin is pseudonymous, not anonymous. Addresses, UTXOs, KYC, network data and behavior can be linked. Privacy is cumulative and can break through small mistakes."
        ],
        "bullets": [
          [
            "No reutilizar direcciones.",
            "Do not reuse addresses."
          ],
          [
            "Control de monedas y etiquetado de UTXOs.",
            "Coin control and UTXO labeling."
          ],
          [
            "Evitar compartir xpubs y datos de balances.",
            "Avoid sharing xpubs and balance data."
          ]
        ],
        "terminal": [
          "La privacidad protege seguridad y fungibilidad; no es una invitación a incumplir obligaciones legales aplicables.",
          "Privacy supports safety and fungibility; it is not an invitation to ignore applicable legal obligations."
        ],
        "source": {
          "name": "Bitcoin.org · Protect your privacy",
          "url": "https://bitcoin.org/en/protect-your-privacy"
        }
      },
      {
        "eyebrow": [
          "MÓDULO 06 · SOBERANÍA",
          "MODULE 06 · SOVEREIGNTY"
        ],
        "title": [
          "Plan personal en capas",
          "A layered personal plan"
        ],
        "summary": [
          "Soberanía no es abandonar toda institución mañana. Es reducir puntos únicos de fallo: ahorro líquido, buenas copias, deuda prudente, privacidad, conocimientos y alternativas de pago.",
          "Sovereignty is not abandoning every institution tomorrow. It is reducing single points of failure: liquidity, backups, prudent debt, privacy, knowledge and payment alternatives."
        ],
        "bullets": [
          [
            "Fondo de emergencia antes de asumir volatilidad.",
            "Emergency fund before taking volatility."
          ],
          [
            "Separar ahorro, gasto y experimentación.",
            "Separate saving, spending and experimentation."
          ],
          [
            "Documentar un plan de recuperación y herencia.",
            "Document recovery and inheritance."
          ]
        ],
        "terminal": [
          "Bitcoin puede ser una herramienta de soberanía, no una excusa para concentrar riesgos que no comprendes.",
          "Bitcoin can be a sovereignty tool, not an excuse to concentrate risks you do not understand."
        ],
        "source": {
          "name": "ABCM · Sovereignty framework",
          "url": "/"
        }
      }
    ]
  }
};
