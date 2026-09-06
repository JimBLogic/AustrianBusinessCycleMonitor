"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ClearLocalPreferencesButton } from "../privacidad/ClearLocalPreferencesButton";
import { courses, type Lang } from "./lessons";
import questionBank from "./question-bank.json";
import { createSession, scoreSession } from "./quiz-engine.mjs";

type Question = (typeof questionBank)[number];
type Session = {questions: Question[]; answers: Record<string,string>; index: number};
const kinds: Record<string,string[]> = {theory:["Teoría atribuida","Attributed theory"],definition:["Definición","Definition"],calculation:["Cálculo","Calculation"],protocol:["Protocolo","Protocol"],security:["Seguridad","Security"]};

export default function AcademyCourse({track,initialLang}:{track:"austrian"|"bitcoin";initialLang:Lang}) {
  const [lang,setLang]=useState<Lang>(initialLang);
  const [active,setActive]=useState<number|"review">(0);
  const [sessions,setSessions]=useState<Record<string,Session>>({});
  const [selected,setSelected]=useState<string|null>(null);
  const questionHeading=useRef<HTMLHeadingElement>(null);
  const lessonHeading=useRef<HTMLHeadingElement>(null);
  const course=courses[track], li=lang==="es"?0:1, key=`${track}-${active}`;
  const lesson=active==="review"?null:course.modules[active];
  const pool=questionBank.filter(q=>q.track===track&&(active==="review"||q.module===active));
  const session=sessions[key], question=session?.questions[session.index];
  const answer=question?session.answers[question.id]:undefined;
  const score=session?scoreSession(session.questions,session.answers):null;
  const complete=!!score&&score.answered===score.total;
  const missed=session?.questions.filter(q=>session.answers[q.id]!==q.answerId)??[];
  const sources=[...new Map(pool.flatMap(q=>q.sources).map(s=>[s.url,s])).values()];
  useEffect(()=>{document.documentElement.lang=lang;},[lang]);
  function changeLanguage(){const next=lang==="es"?"en":"es";setLang(next);const url=new URL(window.location.href);url.searchParams.set("lang",next);window.history.replaceState(window.history.state,"",url);}
  function focusQuestion(){requestAnimationFrame(()=>{questionHeading.current?.focus();questionHeading.current?.scrollIntoView({block:"center"});});}
  function selectModule(next:number|"review"){setActive(next);setSelected(null);requestAnimationFrame(()=>{lessonHeading.current?.focus();lessonHeading.current?.scrollIntoView({block:"start"});});}
  function start(retry=false){setSessions(previous=>({...previous,[key]:{questions:createSession(retry?missed:pool),answers:{},index:0}}));setSelected(null);focusQuestion();}
  function check(){if(!selected||!question||answer||!question.options.some(o=>o.id===selected))return;setSessions(previous=>({...previous,[key]:{...previous[key],answers:{...previous[key].answers,[question.id]:selected}}}));}
  function navigate(index:number){if(!session||index<0||index>=session.questions.length)return;setSessions(previous=>({...previous,[key]:{...previous[key],index}}));setSelected(null);focusQuestion();}
  return <main className={`course-shell ${track}`} lang={lang}>
    <a className="academy-skip" href="#lesson">{lang==="es"?"Ir a la lección":"Skip to lesson"}</a>
    <aside className="course-sidebar">
      <Link href={`/learn?lang=${lang}`} className="course-brand"><span>₿</span> {lang==="es"?"ABCM APRENDE":"ABCM LEARN"}</Link>
      <div className="course-track"><small>{lang==="es"?"RUTA":"PATH"} {track==="austrian"?"01":"02"}</small><h1>{course.title[li]}</h1><p>{course.subtitle[li]}</p></div>
      <p>6 {lang==="es"?"módulos · 24 preguntas":"modules · 24 questions"}</p>
      <nav aria-label={lang==="es"?"Módulos del curso":"Course modules"}>{course.modules.map((item,index)=>{
        const saved=sessions[`${track}-${index}`], progress=saved&&scoreSession(saved.questions,saved.answers);
        return <button type="button" key={item.title[0]} onClick={()=>selectModule(index)} className={active===index?"active":""} aria-current={active===index?"step":undefined}><span>{String(index+1).padStart(2,"0")}</span>{item.title[li]}<em>{progress?`${progress.answered}/${progress.total}`:""}</em></button>;
      })}<button type="button" onClick={()=>selectModule("review")} className={active==="review"?"active":""} aria-current={active==="review"?"step":undefined}><span>↻</span>{lang==="es"?"Repaso completo · 24 preguntas":"Full review · 24 questions"}<em/></button></nav>
      <div className="course-side-actions"><button type="button" onClick={changeLanguage}>{lang==="es"?"Read in English":"Leer en español"}</button><Link href={`/?lang=${lang}`}>← {lang==="es"?"Monitor macro":"Macro monitor"}</Link><Link href="/privacidad">{lang==="es"?"Privacidad":"Privacy"}</Link><ClearLocalPreferencesButton compact language={lang}/></div>
    </aside>
    <article className="lesson" id="lesson">
      <header><span>{lesson?lesson.eyebrow[li]:lang==="es"?"REPASO DE LA RUTA":"PATH REVIEW"}</span><h2 ref={lessonHeading} tabIndex={-1}>{lesson?lesson.title[li]:lang==="es"?"Pon a prueba lo aprendido.":"Test what you have learned."}</h2><p>{lesson?lesson.summary[li]:lang==="es"?"Las 24 preguntas de esta ruta con preguntas y opciones mezcladas. Sin reloj: razona y comprueba la evidencia.":"All 24 questions in this path with shuffled questions and choices. No timer: reason and check the evidence."}</p></header>
      <div className="learning-standard"><strong>{lang==="es"?"UNA RESPUESTA COMPROBABLE":"ONE CHECKABLE ANSWER"}</strong><p>{lang==="es"?"Las preguntas sobre autores evalúan lo que sostiene su teoría, no si debes estar de acuerdo. Los cálculos declaran sus supuestos y el protocolo se contrasta con documentación técnica.":"Questions about authors assess what their theory states, not whether you should agree. Calculations state assumptions and protocol questions use technical documentation."}</p></div>
      {lesson&&<section className="lesson-core"><div><span className="lesson-label">{lang==="es"?"IDEAS CENTRALES":"CORE IDEAS"}</span>{lesson.bullets.map((bullet,index)=><div className="lesson-point" key={bullet[0]}><b>0{index+1}</b><p>{bullet[li]}</p></div>)}</div><aside><span className="lesson-label">{lang==="es"?"CONEXIÓN CON EL MONITOR":"MONITOR CONNECTION"}</span><p>{lesson.terminal[li]}</p><Link href={`/?lang=${lang}`} target="_blank" rel="noreferrer">{lang==="es"?"Abrir monitor":"Open monitor"} ↗</Link></aside></section>}
      <section className="knowledge-check" aria-label={lang==="es"?"Práctica de comprensión":"Knowledge practice"}>
        <span className="lesson-label">{lang==="es"?"PRÁCTICA":"PRACTICE"} · {score?`${score.answered}/${score.total}`:pool.length}</span>
        {!session?<div className="quiz-start"><h3>{lang==="es"?"Comprueba tu comprensión":"Check your understanding"}</h3><p>{lang==="es"?"Elige una opción y comprueba la respuesta para ver su explicación y fuente. Cada ronda mezcla preguntas y opciones.":"Choose an option and check the answer to see its explanation and source. Each round shuffles questions and choices."}</p><button type="button" className="quiz-primary" onClick={()=>start()}>{lang==="es"?`Empezar · ${pool.length} preguntas`:`Start · ${pool.length} questions`}</button><p><small>{lang==="es"?"Progreso solo en memoria: se pierde al recargar. No se guarda ni se envía a un servidor.":"Progress stays in memory and resets on reload. It is neither saved nor sent to a server."}</small></p></div>:question&&<>
          <progress value={score!.answered} max={score!.total} aria-label={lang==="es"?"Preguntas respondidas":"Questions answered"}/>
          <div className="quiz-meta">{session.index+1} / {session.questions.length} · {kinds[question.kind]?.[li]}</div>
          <h3 id="question-title" ref={questionHeading} tabIndex={-1}>{question.prompt[li]}</h3>
          <fieldset className="quiz-options" disabled={!!answer} aria-labelledby="question-title"><legend className="sr-only">{lang==="es"?"Elige una respuesta":"Choose one answer"}</legend>{question.options.map((option,index)=><label key={option.id} className={answer?option.id===question.answerId?"correct":option.id===answer?"wrong":"muted":selected===option.id?"selected":""}><input type="radio" name={`question-${key}-${question.id}`} checked={(answer??selected)===option.id} onChange={()=>setSelected(option.id)}/><span>{String.fromCharCode(65+index)} · {option.text[li]}</span>{answer&&option.id===question.answerId&&<strong>✓ {lang==="es"?"Correcta":"Correct"}</strong>}{answer&&option.id===answer&&answer!==question.answerId&&<strong>× {lang==="es"?"Tu respuesta":"Your answer"}</strong>}</label>)}</fieldset>
          {!answer&&<button type="button" className="quiz-primary" disabled={!selected} onClick={check}>{lang==="es"?"Comprobar respuesta":"Check answer"}</button>}
          {answer&&<div className={`answer-review ${answer===question.answerId?"success":"retry"}`} role="status"><strong>{answer===question.answerId?(lang==="es"?"✓ RESPUESTA CORRECTA":"✓ CORRECT ANSWER"):(lang==="es"?"× RESPUESTA INCORRECTA":"× INCORRECT ANSWER")}</strong><p>{question.explanation[li]}</p>{question.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.name} ↗<small>{s.section}</small></a>)}</div>}
          <div className="quiz-navigation"><button type="button" disabled={session.index===0} onClick={()=>navigate(session.index-1)}>← {lang==="es"?"Anterior":"Previous"}</button><button type="button" disabled={!answer||session.index===session.questions.length-1} onClick={()=>navigate(session.index+1)}>{lang==="es"?"Siguiente":"Next"} →</button></div>
        </>}
      </section>
      {complete&&session&&score&&<section className="course-results" aria-label={lang==="es"?"Resultados":"Results"}><div><span>{lang==="es"?"RESULTADO":"RESULT"}</span><strong>{score.percent}%</strong></div><div><h3>{score.correct}/{score.total} {lang==="es"?"respuestas correctas":"correct answers"}</h3><p>{lang==="es"?"Cada pregunta vale un punto: aciertos ÷ preguntas × 100, redondeado al entero más próximo. La práctica no acredita dominio profesional.":"Each question is worth one point: correct ÷ questions × 100, rounded to the nearest integer. Practice does not certify professional mastery."}</p><div className="quiz-result-actions"><button type="button" onClick={()=>start()}>{lang==="es"?"Reiniciar evaluación":"Restart assessment"}</button>{missed.length>0&&<button type="button" onClick={()=>start(true)}>{lang==="es"?`Repetir ${missed.length} fallos`:`Retry ${missed.length} mistakes`}</button>}</div><details><summary>{lang==="es"?"Revisar soluciones y fuentes":"Review answers and sources"}</summary>{session.questions.map(q=><div className="quiz-review-item" key={q.id}><h4>{session.answers[q.id]===q.answerId?"✓":"×"} {q.prompt[li]}</h4><p><b>{q.options.find(o=>o.id===q.answerId)?.text[li]}</b> · {q.explanation[li]}</p>{q.sources.map(s=><a key={s.url} href={s.url} target="_blank" rel="noreferrer">{s.name} · {s.section} ↗</a>)}</div>)}</details></div></section>}
      <section className="lesson-sources"><h3>{lang==="es"?"Para profundizar y comprobar":"Read further and verify"}</h3><p>{lang==="es"?"Lecturas externas: solo se abren si decides visitarlas y pueden aplicar sus propias políticas de privacidad.":"External readings open only if you choose to visit and may apply their own privacy policies."}</p><ul>{sources.map(s=><li key={s.url}><a href={s.url} target="_blank" rel="noreferrer">{s.name} ↗</a><small>{s.section}</small></li>)}</ul></section>
      <footer className="lesson-footer"><span>{lang==="es"?"Banco revisado":"Bank reviewed"}: 2026-09-06 · ES / EN</span>{typeof active==="number"&&<div><button type="button" aria-label={lang==="es"?"Módulo anterior":"Previous module"} disabled={active===0} onClick={()=>selectModule(active-1)}>←</button><span>{active+1} / 6</span><button type="button" aria-label={lang==="es"?"Siguiente módulo o repaso":"Next module or review"} onClick={()=>selectModule(active===5?"review":active+1)}>→</button></div>}</footer>
    </article>
  </main>;
}
