const fs=require('fs'),path=require('path');
const pairs=JSON.parse(fs.readFileSync(path.join(__dirname,'..','data','misconception-pairs-v58.json'),'utf8')).pairs;
function norm(s=''){return String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function detect(text=''){
 const n=norm(text);
 for(const p of pairs){
   const a=norm(p.a),b=norm(p.b);
   if(n.includes(a)&&n.includes(b))return{...p,detected:true};
   if((n.includes('diferenca')||n.includes('confundo')||n.includes('mesma coisa'))&&(n.includes(a)||n.includes(b)))return{...p,detected:true};
 }
 return null;
}
module.exports={detect};