const SUBJECT_LABELS={
 MAT:'Matemática',NAT:'Ciências da Natureza',HUM:'Ciências Humanas',LIN:'Linguagens',RED:'Redação'
};
function clamp(n,min=0,max=100){return Math.max(min,Math.min(max,n))}
function scoreCandidate(c){
 const urgency=clamp(c.urgency||0),gap=clamp(c.gap||0),goal=clamp(c.goalWeight||50),courseLeverage=clamp(c.courseLeverage||0),
 retention=clamp(c.retentionRisk||0),impact=clamp(c.impact||50),confidence=clamp(c.confidence||50);
 const score=Math.round(urgency*.23+gap*.22+goal*.17+courseLeverage*.13+retention*.12+impact*.09+(100-confidence)*.04);
 return{...c,priorityScore:score};
}
function explain(c){
 const parts=[];
 if(c.urgency>=70)parts.push('há revisão/pendência urgente');
 if(c.gap>=70)parts.push('o domínio está baixo');
 if(c.goalWeight>=75)parts.push('tem peso alto para a meta de curso');
 if(c.courseLeverage>=70)parts.push('ganhar pontos nesta área altera bastante a projeção de aprovação');
 if(c.retentionRisk>=65)parts.push('há risco de esquecimento');
 if(c.type==='paragraph_lab')parts.push('é a microhabilidade de redação mais fraca');
 if(c.type==='quiz')parts.push('há erros recentes que pedem recuperação ativa');
 return parts.length?parts.join('; '):'atividade útil para manter consistência e cobertura do plano';
}
function durationFor(c){return c.type==='review'?10:c.type==='paragraph_lab'?15:c.type==='essay'?25:c.type==='quiz'?20:20}
function build({minutes=60,reviews=[],subjectMastery=[],quizErrors=[],paragraphPriority=null,essayRecommendation=null,goal={},courseBoosts={}}){
 const candidates=[];
 const weights=goal.subjectWeights||{};
 const leverageFor=(subject)=>courseBoosts[subject]||({'Matemática':'MAT','Ciências da Natureza':'NAT','Ciências Humanas':'HUM','Linguagens':'LIN','Redação':'RED'}[subject]?courseBoosts[{'Matemática':'MAT','Ciências da Natureza':'NAT','Ciências Humanas':'HUM','Linguagens':'LIN','Redação':'RED'}[subject]]:0)||0;
 for(const r of reviews.slice(0,8)){
  candidates.push(scoreCandidate({id:`review-${r.id||r.skillId||Math.random()}`,type:'review',subject:r.subject||'Revisão',topic:r.topic||r.skillId||'Conteúdo',title:`Revisão: ${r.topic||r.skillId||'conteúdo pendente'}`,urgency:95,gap:65,goalWeight:weights[r.subject]||55,courseLeverage:leverageFor(r.subject),retentionRisk:95,impact:70,confidence:45,payload:r}));
 }
 for(const m of subjectMastery.slice(0,12)){
  const mastery=Number(m.mastery??m.score??50),subject=m.subject||m.area||'Conteúdo';
  candidates.push(scoreCandidate({id:`mastery-${m.skillId||m.id||subject}`,type:'lesson',subject,topic:m.topic||m.skillId||'Fundamentos',title:`Fortalecer ${m.topic||subject}`,urgency:45,gap:100-mastery,goalWeight:weights[subject]||55,courseLeverage:leverageFor(subject),retentionRisk:50,impact:75,confidence:mastery,payload:m}));
 }
 for(const e of quizErrors.slice(0,10)){
  candidates.push(scoreCandidate({id:`quiz-${e.skillId||e.id||e.topic}`,type:'quiz',subject:e.subject||'Questões',topic:e.topic||e.skillId||'Erros recentes',title:`Recuperar erros: ${e.topic||e.skillId||'questões recentes'}`,urgency:72,gap:Math.max(65,100-(e.accuracy||40)),goalWeight:weights[e.subject]||60,courseLeverage:leverageFor(e.subject),retentionRisk:65,impact:80,confidence:e.accuracy||40,payload:e}));
 }
 for(const [subject,lev] of Object.entries(courseBoosts)){if(lev>0 && ['Matemática','Ciências da Natureza','Ciências Humanas','Linguagens'].includes(subject)){
  candidates.push(scoreCandidate({id:`course-${subject}`,type:'lesson',subject,topic:'Meta de aprovação',title:`Alavanca da vaga: ${subject}`,urgency:42,gap:55,goalWeight:weights[subject]||65,courseLeverage:lev,retentionRisk:40,impact:82,confidence:50,payload:{source:'admission-sensitivity'}}));
 }}
 if(paragraphPriority&&paragraphPriority.attempts>0&&paragraphPriority.mastery<85){
  candidates.push(scoreCandidate({id:`paragraph-${paragraphPriority.skill}`,type:'paragraph_lab',subject:'Redação',topic:paragraphPriority.label,title:`Microtreino: ${paragraphPriority.label}`,urgency:paragraphPriority.mastery<50?90:68,gap:100-paragraphPriority.mastery,goalWeight:weights['Redação']||80,courseLeverage:leverageFor('Redação'),retentionRisk:paragraphPriority.streak?45:70,impact:88,confidence:paragraphPriority.mastery,payload:{skill:paragraphPriority.skill}}));
 }
 if(essayRecommendation){
  candidates.push(scoreCandidate({id:`essay-${essayRecommendation.competency}`,type:'essay',subject:'Redação',topic:essayRecommendation.competency,title:essayRecommendation.title||'Treino de redação',urgency:62,gap:72,goalWeight:weights['Redação']||80,courseLeverage:leverageFor('Redação'),retentionRisk:45,impact:90,confidence:50,payload:{exercise:essayRecommendation.exercise}}));
 }
 if(!candidates.length)candidates.push(scoreCandidate({id:'baseline-math',type:'lesson',subject:'Matemática',topic:'Fundamentos',title:'Revisão de fundamentos',urgency:45,gap:55,goalWeight:weights['Matemática']||65,retentionRisk:45,impact:75,confidence:50}));
 const ranked=candidates.sort((a,b)=>b.priorityScore-a.priorityScore).map((c,i)=>({...c,rank:i+1,reason:explain(c),minutes:durationFor(c)}));
 let left=Math.max(20,Number(minutes)||60),missions=[];
 for(const c of ranked){if(c.minutes<=left||missions.length===0){missions.push(c);left-=c.minutes}if(left<10)break}
 return{availableMinutes:minutes,usedMinutes:missions.reduce((s,x)=>s+x.minutes,0),remainingMinutes:Math.max(0,left),missions,ranking:ranked.slice(0,12),explanation:'As missões são ordenadas por urgência, lacuna de domínio, peso para a meta, risco de esquecimento e impacto esperado.'};
}
module.exports={build,scoreCandidate};