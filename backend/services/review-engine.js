const fs=require('fs'),path=require('path');
const graph=JSON.parse(fs.readFileSync(path.join(__dirname,'..','prerequisite-graph.json'),'utf8')).nodes;
function node(skillId){return graph.find(x=>x.skillId===skillId)||{skillId,prerequisites:[],microLesson:'Revise o conceito fundamental e tente novamente com atenção ao raciocínio.'}}
function recovery(skillId,masteryRows=[]){
 const n=node(skillId),map=new Map(masteryRows.map(x=>[x.skillId,Number(x.mastery)]));
 const weak=(n.prerequisites||[]).map(node).filter(p=>(map.get(p.skillId)??.5)<.65);
 const target=weak[0]||n;
 return {triggerSkill:skillId,recoverySkill:target.skillId,microLesson:target.microLesson,prerequisiteDetected:Boolean(weak[0])};
}
function scheduleFromAnswer(graded,mastery){
 const now=Date.now();let intervalDays,ease,repetitions;
 if(!graded.correct){intervalDays=1;ease=2.1;repetitions=0}
 else if(mastery<.65){intervalDays=2;ease=2.25;repetitions=1}
 else if(mastery<.8){intervalDays=5;ease=2.4;repetitions=2}
 else{intervalDays=10;ease=2.5;repetitions=3}
 return {skillId:graded.skillId,subject:graded.subject,topic:graded.topic,dueAt:now+intervalDays*86400000,intervalDays,ease,repetitions,reason:graded.correct?'Consolidação por revisão espaçada.':'Erro recente: revisão curta agendada.'}
}
module.exports={recovery,scheduleFromAnswer};