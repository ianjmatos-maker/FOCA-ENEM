const semantic=require('./tutor-semantic-router');
function retrieve(query,{currentTopicId=null,learnerMemory=null,masteryRows=[]}={}){
 const routed=semantic.route(query,currentTopicId);
 const candidates=[];
 if(routed.match)candidates.push({...routed.match,reason:'semantic_match'});
 for(const alt of routed.alternatives||[])if(!candidates.some(x=>x.id===alt.id))candidates.push({...alt,reason:'semantic_alternative'});
 const current=semantic.byId(currentTopicId);
 if(current&&!candidates.some(x=>x.id===current.id))candidates.push({...current,reason:'conversation_continuity'});
 const weak=new Map((masteryRows||[]).filter(x=>Number(x.mastery)<50).map(x=>[x.skillId,Number(x.mastery)]));
 for(const item of [...candidates]){
   for(const pre of semantic.prerequisiteChain(item.id)){
     if(!candidates.some(x=>x.id===pre.id))candidates.push({...pre,reason:weak.has(pre.id)?'weak_prerequisite':'prerequisite',mastery:weak.get(pre.id)??null});
   }
 }
 const remembered=learnerMemory?.recentTopics||[];
 for(const id of remembered.slice(0,3)){
   const x=semantic.byId(id);
   if(x&&!candidates.some(c=>c.id===id))candidates.push({...x,reason:'learner_memory'});
 }
 return{primary:routed.match||current||null,confidence:routed.confidence||0,candidates:candidates.slice(0,6)};
}
module.exports={retrieve};