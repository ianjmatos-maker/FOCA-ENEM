const fs=require('fs'),path=require('path');
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','enem-microitems-v59.json'),'utf8')).items;
function getItem(id){return bank.find(x=>x.id===id)||null}
function diagnose(itemId,choice){
 const item=getItem(itemId); if(!item)return{ok:false,error:'item_not_found'};
 const c=String(choice||'').toUpperCase(); if(!item.options[c])return{ok:false,error:'invalid_choice',itemId};
 const correct=c===item.answer,code=item.diagnostic?.[c]||(correct?'correct':'generic_error');
 const moves={percent_as_absolute:'contrast_percent_and_absolute_value',question_reading:'separate_requested_quantity_from_final_price',partial_pattern_carbonyl:'rebuild_full_COOH_pattern',partial_pattern_hydroxyl:'rebuild_full_COOH_pattern',mitosis_meiosis_confusion:'contrast_mitosis_meiosis',mass_weight_confusion:'contrast_mass_weight',intervention_elements_confusion:'map_agent_action_means_purpose'};
 return{ok:true,itemId,skillId:item.skillId,correct,choice:c,answer:item.answer,errorCode:code,misconception:correct?null:(item.distractors?.[c]||'erro não classificado'),tutorMove:correct?'ask_for_reasoning':(moves[code]||`reteach_${item.skillId}`)};
}
module.exports={bank,getItem,diagnose};