const semantic=require('./tutor-semantic-router');
function norm(s=''){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function terms(item){return [...new Set([item?.topic,...(item?.aliases||[])].filter(Boolean).flatMap(x=>norm(x).split(/\W+/)).filter(x=>x.length>3))]}
function evaluate({userText,response,topicId,previousResponses=[],difficultySignals=0}){
 const text=String(response?.text||''),n=norm(text),item=semantic.byId(topicId);
 const conceptualTerms=terms(item),hits=conceptualTerms.filter(t=>n.includes(t)).length;
 const correctness=item?Math.min(1,hits/Math.max(1,Math.min(2,conceptualTerms.length))):0.75;
 const clarity=(text.length>=45&&text.length<=900)?1:(text.length>=25?0.6:0.2);
 const levelFit=difficultySignals>0?(/exemplo|passo|pense|antes|simples|parte/.test(n)?1:0.5):1;
 const utility=response?.question||/exemplo|passo|agora|observe|identifique/.test(n)?1:0.6;
 const prev=previousResponses.map(x=>norm(x?.text||x||''));
 const contradiction=prev.some(x=>x&&n&&((x.includes('sempre')&&n.includes('nunca'))||(x.includes('nunca')&&n.includes('sempre'))));
 const consistency=contradiction?0:1;
 const scores={conceptualCorrectness:correctness,clarity,levelFit,nextStepUtility:utility,consistency};
 const total=Object.values(scores).reduce((a,b)=>a+b,0);
 return{scores,total:Number(total.toFixed(2)),max:5,pass:total>=3.6,flags:[...(correctness<.5?['low_conceptual_grounding']:[]),...(clarity<.6?['low_clarity']:[]),...(levelFit<.6?['poor_level_fit']:[]),...(contradiction?['possible_contradiction']:[])]};
}
module.exports={evaluate};