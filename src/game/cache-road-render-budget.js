// Presentation quality follows measured draws on the existing shared Canvas.
// It owns no gameplay clock, frame callback, input, audio or persisted state.
(function(){
  const B=window.BARCODE=window.BARCODE||{};
  const scales=[1,.85,.7,.6,.5,.4,1/3,.25];
  const create=()=>({scale:1,slowFrames:0,fastFrames:0,lastCostMs:0});
  function observe(budget,costMs,{paused=false}={}){
    if(!budget||paused||!Number.isFinite(costMs)||costMs<0)return;
    budget.lastCostMs=costMs;
    if(costMs>24){
      budget.fastFrames=0;
      if(++budget.slowFrames<3)return;
      budget.slowFrames=0;
      const target=budget.scale*Math.sqrt(22/costMs);
      const next=scales.find(scale=>scale<budget.scale&&scale<=target)??scales.at(-1);
      budget.scale=Math.min(budget.scale,next);
    }else{
      budget.slowFrames=0;
      // Recover detail only after sustained spare capacity. This hysteresis
      // avoids quality changes on individual impacts, pauses or cold loads.
      budget.fastFrames=costMs<10?budget.fastFrames+1:0;
      if(budget.fastFrames>=600){
        const index=scales.indexOf(budget.scale);
        if(index>0)budget.scale=scales[index-1];
        budget.fastFrames=0;
      }
    }
  }
  B.CacheRoadRenderBudget={create,observe};
})();
