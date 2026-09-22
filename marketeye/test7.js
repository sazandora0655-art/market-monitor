/* PC版のマウス操作で、照合なし→線2本→価格手入力→仕込み→本番 を通す */
window.__t={running:true, log:[]};
function L(k,v){ window.__t.log.push(k+': '+JSON.stringify(v)); }
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)});}
function clickLine(yn){
  var r=edCv.getBoundingClientRect();
  edCv.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width*0.5, clientY:r.top+r.height*yn,
                                             bubbles:true, cancelable:true}));
}
function setVal(id,v){ var el=document.getElementById(id); el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); }
(async function(){
 try{
  localStorage.removeItem('sg2'); S=load();
  BANK.length=0; DATA.n=0;
  edOpen(); edSetImage(makeSampleChart(false,3350,2));
  await sleep(1500);
  L('読み込み後',{cal:ED.cal?ED.cal.mode:null, arm:ED.arm,
                手入力欄:document.getElementById('manualCal').style.display,
                サブ:document.getElementById('edSub').textContent.slice(0,45)});
  clickLine(0.30); await sleep(100);
  clickLine(0.70); await sleep(100);
  L('線2本',{en:!!ED.en, tg:!!ED.tg, err:(edCompute().err||'').slice(0,40)});
  setVal('mcP1','4383.34'); setVal('mcP2','4219.73'); await sleep(150);
  var r=edCompute();
  L('価格入力',{mode:ED.cal&&ED.cal.mode, err:r.err||null, dir:r.plan&&r.plan.dir,
              entry:r.plan&&r.plan.entry, sl:r.plan&&r.plan.sl, tp1:r.plan&&r.plan.tp1, tp2:r.plan&&r.plan.tp2,
              save:!document.getElementById('edSave').disabled});
  if(r.err){ window.__t.running=false; return; }
  document.getElementById('edSave').click(); await sleep(250);
  var p=S.presets[0];
  L('保存',{name:p.name, dir:p.dir, dsKey:p.v2.dsKey});
  var im=new Image();
  await new Promise(function(res){ im.onload=res; im.src=makeSampleChart(true,3350,2); });
  var ap=answerPlan(im,p);
  L('本番',{how:ap.how, warn:ap.warn||'なし', dir:ap.plan.dir, entry:ap.plan.entry,
           sl:ap.plan.sl, tp1:ap.plan.tp1, tp2:ap.plan.tp2,
           仕込み通り:(ap.plan.dir==='short' && ap.plan.entry===p.entry)});
 }catch(e){ L('ERR', String(e&&e.message)+' @ '+String(e&&e.stack||'').split('\n')[1]); }
 window.__t.running=false;
})();
