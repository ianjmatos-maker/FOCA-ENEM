function computeTodayMission(snapshot){
  const state=snapshot||{};
  const history=state.history||{};
  const errors=(state.errors||[]).filter(e=>!e.resolved);

  if(errors.length){
    const e=errors[0];
    return {
      type:'review',
      pill:'REVISÃO PRIORITÁRIA',
      title:`História · ${e.skill}`,
      reason:'Você errou este conceito recentemente. Revisá-lo agora tem mais valor do que acumular conteúdo novo.',
      timeMinutes:10,
      priority:'Recuperar lacuna',
      action:'errors',
      label:'Revisar agora',
      source:'server-engine-v6'
    };
  }

  if(history.quizCompleted && Number(history.mastery||0)>=75){
    return {
      type:'study',
      pill:'PRÓXIMA MISSÃO',
      title:'Matemática · Razão e Proporção',
      reason:'História está consolidada neste tópico. O plano volta agora para sua prioridade estratégica de Matemática.',
      timeMinutes:25,
      priority:'Alta prioridade',
      action:'study',
      label:'Começar missão',
      source:'server-engine-v6'
    };
  }

  if(Number(history.lessonStep||0)>0 || history.lessonCompleted){
    return {
      type:'continue',
      pill:'CONTINUAR APRENDIZAGEM',
      title:'História · Brasil Colônia',
      reason:'Você já iniciou este conteúdo. Concluir a aula e o quiz agora evita quebrar o ciclo de aprendizagem.',
      timeMinutes:15,
      priority:'Continuidade',
      action:'subject',
      label:history.lessonCompleted?'Fazer quiz':'Continuar aula',
      source:'server-engine-v6'
    };
  }

  return {
    type:'study',
    pill:'MISSÃO PRINCIPAL',
    title:'Matemática · Razão e Proporção',
    reason:'Este tópico é prioridade porque desbloqueia várias habilidades e aparece no seu plano de hoje.',
    timeMinutes:25,
    priority:'Alta prioridade',
    action:'study',
    label:'Começar missão',
    source:'server-engine-v6'
  };
}
module.exports={computeTodayMission};