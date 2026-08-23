const semantic=require('./tutor-semantic-router');

function knowledge(topicId){
  const item=semantic.byId(topicId);
  if(!item)return null;
  return item;
}
function uniqueQuestion(response,previousQuestion){
  if(!response?.question)return null;
  return response.question===previousQuestion?null:response.question;
}
function repair({userText,response,evaluation,state,previousQuestion=null}){
  const item=knowledge(state?.topicId);
  const flags=new Set(evaluation?.flags||[]);
  const signals=(state?.confusionCount||0)+(state?.dontKnowCount||0);
  let text=String(response?.text||'').trim();
  let strategy=response?.strategy||'direct_explanation';
  let action='quality_repair';
  const repairs=[];

  if(flags.has('low_conceptual_grounding') && item){
    text=`${item.core} ${item.example}`;
    repairs.push('ground_with_catalog');
  }
  if(flags.has('low_clarity') || text.length<35){
    if(item) text=`Vamos por partes. ${item.core} Exemplo: ${item.example}`;
    else text=`Vou explicar de forma mais concreta e em partes. ${text}`;
    repairs.push('increase_clarity');
  }
  if(flags.has('poor_level_fit') || signals>0){
    if(item){
      const prereq=semantic.prerequisiteChain(item.id)[0];
      if(prereq && signals>=2){
        text=`Antes de insistir em ${item.topic}, vou recuperar uma base que pode estar atrapalhando: ${prereq.topic}. ${prereq.core} Depois voltamos para ${item.topic}.`;
        strategy='prerequisite_bridge';
        repairs.push('recover_prerequisite');
      }else{
        text=`Vou simplificar. ${item.core} Pense neste exemplo: ${item.example}`;
        strategy='worked_example';
        repairs.push('simplify_with_example');
      }
    }
  }
  if(flags.has('possible_contradiction')){
    text=item?`Para manter a explicação consistente, use esta referência: ${item.core} ${item.example}`:`Vou corrigir a formulação anterior e manter uma única explicação consistente. ${text}`;
    repairs.push('resolve_contradiction');
  }

  let question=uniqueQuestion(response,previousQuestion);
  if(!question && item && signals<2)question=item.check;
  if(question===previousQuestion)question=null;

  return{
    ...response,
    text,
    question,
    strategy,
    action,
    qualityRepair:{applied:repairs.length>0,repairs,originalScore:evaluation?.total??null}
  };
}
module.exports={repair};