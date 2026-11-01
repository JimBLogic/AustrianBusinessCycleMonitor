import Link from "next/link";
import { APP_VERSION } from "../version";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/releases", "Versiones y novedades", "Historial de versiones, mejoras y política de cambios de ABCM.");

export default async function ReleasesPage({ searchParams }: { searchParams: Promise<{ lang?: string }> }) {
  const { lang } = await searchParams;
  const en = lang === "en";
  return <main className="privacy-shell" lang={en ? "en" : "es"}>
    <header className="privacy-header">
      <Link href={`/?lang=${en ? "en" : "es"}`}>← ABCM</Link>
      <Link href={`/releases?lang=${en ? "es" : "en"}`} hrefLang={en ? "es" : "en"}>{en ? "Español" : "English"}</Link>
    </header>
    <section className="privacy-intro">
      <span className="eyebrow">ABCM {APP_VERSION}</span>
      <h1>{en ? "What's new" : "Versiones y novedades"}</h1>
      <p>{en ? "A clear record of what changes, with the same care for data and provenance." : "Un registro claro de lo que cambia, con el mismo cuidado por los datos y su procedencia."}</p>
    </section>
    <div className="release-history">
      <article className="release-entry">
        <span className="eyebrow">1.0.1 · <time dateTime="2026-10-30">30/10/2026</time></span>
        <h2>{en ? "A version you can follow" : "Una versión que puedes seguir"}</h2>
        <ul>
          <li>{en ? "The product now has a three-part version, separate from the hosting checkpoint." : "La aplicación estrena una versión de tres números, separada del checkpoint de alojamiento."}</li>
          <li>{en ? "Version and release notes are accessible from the monitor footer, in Spanish and English." : "La versión y las novedades se consultan desde el pie del monitor, en español e inglés."}</li>
          <li>{en ? "Health, data and the source manifest identify the same product version." : "Estado técnico, datos y manifiesto de fuentes identifican la misma versión del producto."}</li>
        </ul>
        <p>{en ? "This release preserves the economic model, source identities and data freshness rules." : "Esta entrega conserva el modelo económico, la identidad de las fuentes y las reglas de vigencia de los datos."}</p>
      </article>
      <article className="release-entry">
        <span className="eyebrow">1.0.0 · {en ? "Milestone: checkpoint 100" : "Hito: checkpoint 100"}</span>
        <h2>{en ? "The reference milestone" : "El hito de referencia"}</h2>
        <p>{en ? "Checkpoint 100 is the baseline for this versioning scheme. It includes bounded daily retries, validated source recovery, mobile interaction improvements and corrected spacing inside colored explanation panels." : "El checkpoint 100 es la base de esta nueva numeración. Incluye reintentos diarios limitados, recuperación validada de fuentes, mejoras de interacción móvil y márgenes corregidos dentro de los paneles de explicación coloreados."}</p>
      </article>
      <section className="release-entry" aria-labelledby="version-policy">
        <h2 id="version-policy">{en ? "How versions change" : "Cómo cambia la versión"}</h2>
        <dl className="release-policy">
          <div><dt>2.0.0</dt><dd>{en ? "Major changes: substantial new capabilities or changes to the model or architecture." : "Cambios mayores: nuevas capacidades sustanciales o cambios de modelo o arquitectura."}</dd></div>
          <div><dt>1.1.0</dt><dd>{en ? "Security fixes and medium-sized improvements." : "Correcciones de seguridad y mejoras de alcance medio."}</dd></div>
          <div><dt>1.0.2</dt><dd>{en ? "Small adjustments: spacing, copy and localized usability fixes." : "Ajustes pequeños: márgenes, textos y correcciones puntuales de uso."}</dd></div>
        </dl>
        <p>{en ? "These are examples of the next version in each category, not announced releases. A software version does not describe whether market data is fresh: each observation retains its own date and status." : "Son ejemplos del siguiente número en cada categoría, no anuncios de futuras entregas. La versión del programa no indica si los datos de mercado están al día: cada observación conserva su fecha y estado."}</p>
      </section>
    </div>
  </main>;
}
