const fs=require('fs');
const path=require('path');
const catalog=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','tutor-content-catalog-v54.json'),'utf8'));

function norm(text=''){
  return String(text).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^\p{L}\p{N}%]+/gu,' ').replace(/\s+/g,' ').trim();
}
function tokens(text=''){return new Set(norm(text).split(' ').filter(x=>x.length>2))}
function scoreQuery(query,item){
  const q=norm(query),qt=tokens(query);
  let score=0;
  for(const alias of item.aliases||[]){
    const a=norm(alias);
    if(q.includes(a))score+=70+Math.min(20,a.length);
    const at=tokens(a);let overlap=0;
    for(const t of at)if(qt.has(t))overlap++;
    score+=overlap*10;
  }
  if(q.includes(norm(item.topic)))score+=90;
  return score;
}
function allItems(){
  return Object.entries(catalog.areas).flatMap(([area,items])=>items.map(x=>({...x,area})));
}
function route(query,currentId=null){
  const ranked=allItems().map(item=>({...item,score:scoreQuery(query,item)})).sort((a,b)=>b.score-a.score);
  if(ranked[0]?.score>0)return{match:ranked[0],alternatives:ranked.slice(1,4).filter(x=>x.score>0),confidence:Math.min(100,ranked[0].score)};
  if(currentId){
    const current=allItems().find(x=>x.id===currentId);
    if(current)return{match:current,alternatives:[],confidence:45};
  }
  return{match:null,alternatives:[],confidence:0};
}
function byId(id){return allItems().find(x=>x.id===id)||null}
function prerequisiteChain(id,limit=4){
  const out=[],seen=new Set();
  function walk(skillId,depth){
    if(depth>limit||seen.has(skillId))return;
    seen.add(skillId);
    const item=byId(skillId);if(!item)return;
    for(const pre of item.prerequisites||[]){const p=byId(pre);if(p){out.push(p);walk(pre,depth+1)}}
  }
  walk(id,0);return out;
}
module.exports={catalog,route,byId,prerequisiteChain,norm};