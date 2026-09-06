/** @template T @param {T[]} values @param {()=>number} rng @returns {T[]} */
export function shuffle(values, rng = Math.random) {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
/** @template {{options: unknown[]}} T @param {T[]} bank @param {()=>number} rng */
export function createSession(bank, rng = Math.random) {
  return shuffle(bank, rng).map(q => ({...q, options: shuffle(q.options, rng)}));
}
/** @param {{id:string,answerId:string,options:{id:string}[]}[]} questions @param {Record<string,string>} answers */
export function scoreSession(questions, answers) {
  const answered = questions.filter(q => q.options.some(o => o.id === answers[q.id])).length;
  const correct = questions.filter(q => answers[q.id] === q.answerId).length;
  return {answered, correct, total: questions.length, percent: questions.length ? Math.round(correct / questions.length * 100) : 0};
}
