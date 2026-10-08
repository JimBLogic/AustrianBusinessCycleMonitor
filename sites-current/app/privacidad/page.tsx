import { pageMetadata } from "@/lib/seo";
import { IS_SITES_HOST } from "@/lib/site-config";
export const metadata = pageMetadata("/privacidad", "Privacidad y almacenamiento local", "Preferencias locales, fuentes externas y analítica del alojamiento explicadas con transparencia.");
import Link from "next/link";
import { ClearLocalPreferencesButton } from "./ClearLocalPreferencesButton";

const OPENAI_SITES_GUIDE =
  "https://help.openai.com/en/articles/20001339-creating-and-managing-chatgpt-sites";
const OPENAI_PRIVACY_POLICY = "https://openai.com/policies/eu-privacy-policy/";
const OPENAI_COOKIE_POLICY = "https://openai.com/policies/cookie-policy/";
const OPENAI_PRIVACY_PORTAL = "https://privacy.openai.com/";

export default function PrivacyPage() {
  return (
    <main className="privacy-shell">
      <header className="privacy-header">
        <Link href="/" aria-label="Volver al monitor">← ABCM</Link>
        <span>Última revisión · 28 septiembre 2026</span>
      </header>

      <section className="privacy-intro" lang="es">
        <span className="eyebrow">Privacidad por diseño</span>
        <h1>Privacidad y almacenamiento local</h1>
        <p>
          ABCM no añade analítica publicitaria, publicidad ni seguimiento propio.
          ChatGPT Sites, como proveedor de alojamiento, puede tratar datos técnicos
          para prestar, medir y proteger el servicio. Esta página separa ambas capas.
        </p>
      </section>

      <p lang="es">Las respuestas y el progreso de aprendizaje permanecen solo en memoria; se pierden al recargar y no se envían a un servidor.</p>
      <p lang="en">Learning answers and progress stay in memory, reset on reload and are not sent to a server.</p>
      {!IS_SITES_HOST && <p>Este es un alojamiento independiente. Las referencias a analítica de Sites describen la web oficial, no analítica incluida en este código. El operador debe identificar aquí su alojamiento y tratamiento real de datos. / This is an independent host: Sites analytics described below applies to the official Site, not analytics bundled with this code. The operator must identify their actual hosting and data practices.</p>}
      <div className="privacy-grid">
        <article className="privacy-language" lang="es">
          <h2>Información en español</h2>

          <section>
            <h3>Responsable del Site y contacto</h3>
            <p>
              Austrian Business Cycle Monitor está editado por <strong>Jaime Ramsden de Frutos</strong>.
              Para cuestiones de privacidad relacionadas con el contenido o las funciones de esta web:
              {" "}<a href="mailto:jrf91@pm.me">jrf91@pm.me</a>.
            </p>
          </section>

          <section>
            <h3>Preferencias en este dispositivo</h3>
            <ul>
              <li><code>abcm:language</code>: idioma elegido.</li>
              <li><code>abcm:watchlist</code>: hasta cuatro indicadores públicos elegidos para “Mi radar”.</li>
              <li><code>abcm:educational-notice:v1</code>: recuerda que aceptaste el aviso educativo.</li>
              <li><code>abcm:manual-refresh-state:v1</code>: instantánea comparativa y fin del intervalo local tras solicitar una actualización manual.</li>
            </ul>
            <p>
              Solo se escriben después de pulsar el control correspondiente. Permanecen en
              <code> localStorage</code> hasta que las borres; no incluyen un identificador del visitante
              y el código no las envía a las APIs, las fuentes ni un servidor propio.
            </p>
            <p>
              El código de ABCM no crea ni lee cookies. Vinext usa
              <code> __vinext_rsc_initial_reload__ </code> en <code>sessionStorage</code> como guarda
              técnica de la pestaña frente a bucles de recarga; no identifica al visitante ni se
              envía a las APIs de ABCM.
            </p>
          </section>

          <section>
            <h3>Métricas automáticas de Sites</h3>
            <p>
              El alojamiento puede generar métricas de uso y registros técnicos aunque ABCM no instale un SDK de analítica. ABCM no añade esa medición y su código no
              recibe una copia individualizada de esos datos.
            </p>
            <p>
              Esta revisión del código no permite verificar las tecnologías ni los plazos de conservación de la medición del alojamiento. Por eso no aparece un
              banner que prometa “rechazar” una medición que esta web no puede controlar.
            </p>
          </section>

          <section>
            <h3>Datos macro, red y almacenamiento del servidor</h3>
            <p>
              El navegador consulta únicamente APIs del mismo origen. El servidor obtiene series públicas
              de fuentes macroeconómicas y de Bitcoin mediante HTTPS y una lista explícita de hosts permitidos.
              No reenvía preferencias locales, cookies ni identificadores creados por ABCM.
            </p>
            <p>
              D1 conserva ediciones macro compartidas —fechas, series, cálculos y procedencia— para servir
              a todos los visitantes la misma edición diaria y reducir llamadas a las fuentes. No almacena
              perfiles, cuentas ni una relación entre una visita y los datos macro. La versión pública ya no
              ofrece área personal, subida de archivos ni autenticación de la aplicación; R2 no está vinculado.
            </p>
            <p>
              OpenAI y sus proveedores pueden tratar registros técnicos, como IP, navegador, fecha, hora e
              interacción con el servicio, para alojar, mantener, medir, depurar y proteger Sites. Las
              navegaciones internas pueden incluir cookies técnicas del proveedor; ABCM no las crea, lee ni modifica.
            </p>
          </section>

          <section>
            <h3>Finalidades, base jurídica y conservación</h3>
            <p>El editor trata los datos necesarios para atender consultas y mantener la disponibilidad y seguridad del Site sobre la base de su interés legítimo en responder y operar este recurso informativo (art. 6.1.f RGPD). Las solicitudes de derechos se atienden para cumplir obligaciones legales (art. 6.1.c). No se elaboran perfiles de visitantes ni decisiones automatizadas con efectos jurídicos. Reconocer el aviso educativo no autoriza publicidad ni seguimiento.</p>
            <p>Si escribes al contacto, se reciben tu dirección y el contenido del mensaje. Se utilizan para responder y se conservan mientras se tramita la consulta y, cuando corresponda, durante los plazos legales aplicables a la defensa de reclamaciones. No envíes datos de salud, tarjetas, contraseñas o claves privadas.</p>
            <p>OpenAI y los subencargados que correspondan prestan el alojamiento conforme a los términos y al acuerdo de tratamiento aplicables. No se promete alojamiento exclusivo en la UE: Sites no ofrece residencia de datos. Los países, mecanismos de transferencia y plazos de los registros del proveedor deben consultarse en la documentación contractual aplicable; no se ha verificado un plazo específico para esta cuenta.</p>
            <p>Puedes ejercer acceso, rectificación, supresión, oposición, limitación y portabilidad cuando procedan escribiendo al contacto indicado. Puedes reclamar ante la <a href="https://www.aepd.es/" target="_blank" rel="noreferrer">AEPD</a> u otra autoridad competente. Las solicitudes se atienden, por regla general, en un mes; cualquier ampliación legal se comunica.</p>
          </section>

          <section>
            <h3>Tecnologías no esenciales y derechos</h3>
            <p>
              No hay anuncios, píxeles, fingerprinting, iframes, embeds, IndexedDB, service workers,
              formularios ni cuentas de visitante. Puedes solicitar información, acceso, rectificación,
              supresión, limitación u oposición cuando proceda mediante el contacto editorial. El editor atiende las solicitudes sobre datos de visitantes tratados para operar este Site; no es necesario acudir primero al proveedor. El portal de OpenAI también está disponible para los tratamientos de los que OpenAI sea responsable independiente.
            </p>
          </section>
        </article>

        <article className="privacy-language" lang="en">
          <h2>Information in English</h2>

          <section>
            <h3>Site controller and contact</h3>
            <p>
              Austrian Business Cycle Monitor is published by <strong>Jaime Ramsden de Frutos</strong>.
              For privacy questions about this website&apos;s content or features, contact
              {" "}<a href="mailto:jrf91@pm.me">jrf91@pm.me</a>.
            </p>
          </section>

          <section>
            <h3>Preferences on this device</h3>
            <ul>
              <li><code>abcm:language</code>: the language you choose.</li>
              <li><code>abcm:watchlist</code>: up to four public indicators selected for “My radar”.</li>
              <li><code>abcm:educational-notice:v1</code>: remembers your educational-notice acknowledgement.</li>
              <li><code>abcm:manual-refresh-state:v1</code>: comparison snapshot and local cooldown after a manual refresh request.</li>
            </ul>
            <p>
              They are written only after you use the corresponding control. They remain in
              <code> localStorage</code> until deleted, contain no visitor identifier, and are not sent
              to ABCM APIs, upstream sources or an app-owned server.
            </p>
            <p>
              ABCM application code creates and reads no cookies. Vinext uses
              <code> __vinext_rsc_initial_reload__ </code> in <code>sessionStorage</code> as a tab-scoped
              reload-loop safeguard; it does not identify visitors or travel to ABCM APIs.
            </p>
          </section>

          <section>
            <h3>Automatic Sites metrics</h3>
            <p>
              The hosting service may generate usage metrics and technical logs even without an analytics SDK installed by ABCM. ABCM does not add that measurement and its code receives no visitor-level copy.
            </p>
            <p>
              This code review cannot verify the technologies or retention periods used by hosting measurement. No control therefore pretends to reject provider measurement that this
              website cannot control.
            </p>
          </section>

          <section>
            <h3>Macro data, network and server storage</h3>
            <p>
              The browser calls same-origin APIs only. The server obtains public macroeconomic and Bitcoin
              series over HTTPS through an explicit allowlist. It forwards no local preference, cookie or
              ABCM-created visitor identifier.
            </p>
            <p>
              D1 retains shared macro editions —dates, series, calculations and provenance— so every visitor
              receives the same daily edition while upstream requests stay limited. It stores no visitor
              profile or link between a visit and macro data. The public version no longer offers a personal
              workspace, file uploads or app authentication, and R2 is not bound.
            </p>
            <p>
              OpenAI and its infrastructure providers may process technical logs such as IP address, browser,
              request time and service interaction to host, maintain, measure, debug and protect Sites.
              Internal navigation may include provider technical cookies; ABCM does not create, read or alter them.
            </p>
          </section>

          <section>
            <h3>Purposes, legal basis and retention</h3>
            <p>The publisher processes necessary data to answer enquiries and operate and secure this informational Site based on legitimate interests (GDPR Article 6(1)(f)); rights requests are handled to meet legal obligations (Article 6(1)(c)). There is no visitor profiling or automated decision-making with legal effects. Acknowledging the educational notice does not authorise advertising or tracking.</p>
            <p>If you email the contact, your address and message are used to respond and retained while handling the enquiry and, where relevant, for legally applicable claims periods. Do not send health data, card details, passwords or private keys.</p>
            <p>OpenAI and applicable subprocessors provide hosting under the applicable terms and data processing agreement. EU-only hosting is not promised: Sites does not offer data residency. Countries, transfer mechanisms and hosting-log retention depend on the applicable contractual documentation; an account-specific retention period has not been verified.</p>
            <p>Contact the publisher to request access, correction, erasure, objection, restriction or portability where applicable. You may complain to the <a href="https://www.aepd.es/" target="_blank" rel="noreferrer">Spanish AEPD</a> or another competent authority. Requests are normally handled within one month; any lawful extension will be communicated.</p>
          </section>

          <section>
            <h3>Non-essential technology and rights</h3>
            <p>
              There are no ads, pixels, fingerprinting, iframes, embeds, IndexedDB, service workers, visitor
              forms or accounts. You may request information, access, correction, deletion, restriction or
              objection where applicable through the publisher contact. The publisher handles requests about visitor data processed to operate this Site; you do not need to contact the host first. OpenAI’s portal is also available for processing for which OpenAI is an independent controller.
            </p>
          </section>
        </article>
      </div>

      <p>Los enlaces externos solo se abren al pulsarlos; el destino recibe los datos técnicos necesarios para esa visita y aplica su propia política. / External destinations receive the technical data needed for your visit when you follow a link and apply their own policies.</p>
      <ClearLocalPreferencesButton />

      <nav className="privacy-provider-links" aria-label="Políticas del proveedor">
        <a href={OPENAI_SITES_GUIDE} target="_blank" rel="noreferrer">Guía oficial de ChatGPT Sites</a>
        <a href={OPENAI_PRIVACY_POLICY} target="_blank" rel="noreferrer">Política de privacidad de OpenAI (Europa)</a>
        <a href={OPENAI_COOKIE_POLICY} target="_blank" rel="noreferrer">Política de cookies de OpenAI</a>
        <a href="https://help.openai.com/en/articles/20001340" target="_blank" rel="noreferrer">Protección de datos en Sites</a>
        <a href={OPENAI_PRIVACY_PORTAL} target="_blank" rel="noreferrer">Portal de privacidad de OpenAI</a>
      </nav>
    </main>
  );
}
