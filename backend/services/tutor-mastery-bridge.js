const fs=require('fs'),path=require('path');
const domain=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','enem-domain-map-v55.json'),'utf8'));
function skillIndex(){
  const out={};
  for(const [area,a] of Object.entries(domain.areas))
    for(const c of a.competencies)
      for(const s of c.skills)out[s.id]={...s,area,competencyId:c.id,competency:c.name};
  return out;
}
const INDEX=skillIndex();
function extractMastery(raw,skillId){
  if(!raw)return null;
  if(Array.isArray(raw)){
    const x=raw.find(v=>v.id===skillId||v.skillId===skillId);
    return x?Number(x.mastery??x.score??x.value):null;
  }
  if(raw[skillId]!=null){
    const x=raw[skillId]; return Number(typeof x==='object'?(x.mastery??x.score??x.value):x);
  }
  return null;
}
function context(skillId,skillMap,learnerMemory){
  const skill=INDEX[skillId]||null;
  const mastery=extractMastery(skillMap,skillId);
  const memory=learnerMemory?.concepts?.[skillId]||null;
  const weakPrerequisites=(skill?.prerequisites||[]).map(id=>({
    id,name:INDEX[id]?.name||id,mastery:extractMastery(skillMap,id)
  })).filter(x=>x.mastery!=null&&x.mastery<60);
  return{skill,mastery,memory,weakPrerequisites};
}
function directive(ctx){
  if(!ctx?.skill)return'Use a dúvida atual como principal evidência.';
  if(ctx.weakPrerequisites?.length)return`Há pré-requisito fraco: ${ctx.weakPrerequisites.map(x=>`${x.name} (${x.mastery}%)`).join(', ')}. Se a dificuldade persistir, recupere essa base antes de avançar.`;
  if(ctx.mastery!=null&&ctx.mastery>=80)return'O domínio registrado é alto. Evite explicação excessivamente básica; priorize aplicação, nuance e checagem curta.';
  if(ctx.mastery!=null&&ctx.mastery<45)return'O domínio registrado é baixo. Explique em passos pequenos, com exemplo concreto, e reduza a carga da checagem.';
  return'Adapte profundidade usando a conversa e as evidências registradas.';
}
module.exports={domain,INDEX,context,directive};