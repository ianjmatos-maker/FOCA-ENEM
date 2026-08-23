const fs=require('fs'),path=require('path');
const bank=JSON.parse(fs.readFileSync(path.join(__dirname,'..','adaptive-questions.json'),'utf8')).questions;
function targetDifficulty(mastery){if(mastery==null)return 1;if(mastery>=.75)return 2;return 1}
function selectQuestion({masteryRows=[],subject=null,exclude=[]}){
 const map=new Map(masteryRows.map(x=>[x.skillId,Number(x.mastery)]));
 let pool=bank.filter(q=>(!subject||q.subject===subject)&&!exclude.includes(q.id));
 if(!pool.length)return null;
 pool=pool.map(q=>{const mastery=map.has(q.skillId)?map.get(q.skillId):.5;const gap=1-mastery;const desired=targetDifficulty(mastery);const difficultyFit=q.difficulty===desired?1:.4;return{q,score:gap*2+difficultyFit}}).sort((a,b)=>b.score-a.score);
 const q=pool[0].q;return{id:q.id,skillId:q.skillId,subject:q.subject,topic:q.topic,difficulty:q.difficulty,prompt:q.prompt,options:q.options}
}
function grade(questionId,selected){const q=bank.find(x=>x.id===questionId);if(!q)return null;const correct=Number(selected)===q.answer;return{questionId:q.id,skillId:q.skillId,subject:q.subject,topic:q.topic,difficulty:q.difficulty,selected:Number(selected),correct,explanation:q.explanation}}
module.exports={selectQuestion,grade};