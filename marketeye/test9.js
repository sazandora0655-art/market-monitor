/* 総仕上げの検証:
   A 内蔵データと一致しない画像でも、線2本＋価格2つで必ず仕込める
   B その仕込みが本番で黙って出る
   C 「見る」に分析結果まで出る
   D 照合が通る画像では今まで通り自動で価格が入る */
window.__t={running:true, log:[]};
function L(k,v){ window.__t.log.push(k+': '+JSON.stringify(v)); }
function ldImg(src){return new Promise(function(r){var i=new Image(); i.onload=function(){r(i)}; i.src=src;});}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)});}
function clickLine(yn){
  var r=edCv.getBoundingClientRect();
  edCv.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width*0.5, clientY:r.top+r.height*yn, bubbles:true, cancelable:true}));
}
function setVal(id,v){ var el=document.getElementById(id); el.value=v; el.dispatchEvent(new Event('input',{bubbles:true})); }
(async function(){
 try{
  localStorage.removeItem('sg2'); S=load();

  /* --- A: 内蔵データに無い画像（合成チャート）で仕込む --- */
  edOpen(); edSetImage(makeSampleChart(false,3350,2));
  await sleep(1800);
  L('A1 読み込み直後', {cal:ED.cal?ED.cal.mode:null, arm:ED.arm,
      案内:document.getElementById('ocrMsg').textContent.slice(0,60),
      出どころ:(document.getElementById('mcFrom')||{}).textContent.slice(0,50),
      手入力欄:document.getElementById('manualCal').style.display,
      サブ:document.getElementById('edSub').textContent.slice(0,45)});
  clickLine(0.28); await sleep(80); clickLine(0.72); await sleep(80);
  L('A2 線だけ', {err:(edCompute().err||'').slice(0,60)});
  setVal('mcP1','4411.08'); setVal('mcP2','4504.78'); await sleep(150);
  var r=edCompute();
  L('A3 価格を入力', {mode:ED.cal&&ED.cal.mode, err:r.err||null, dir:r.plan&&r.plan.dir,
      entry:r.plan&&r.plan.entry, sl:r.plan&&r.plan.sl, tp1:r.plan&&r.plan.tp1, tp2:r.plan&&r.plan.tp2,
      出どころ:(document.getElementById('mcFrom')||{}).textContent.slice(0,40),
      仕込める:!document.getElementById('edSave').disabled});
  if(r.err){ window.__t.running=false; return; }
  document.getElementById('edSave').click(); await sleep(250);
  var p=S.presets[0];
  L('A4 保存', {name:p.name, dir:p.dir, dsKey:p.v2.dsKey});

  /* --- B: 本番 --- */
  var im=await ldImg(makeSampleChart(true,3350,2));
  var ap=answerPlan(im,p);
  L('B 本番', {how:ap.how, warn:ap.warn||'なし', dir:ap.plan.dir, entry:ap.plan.entry,
      sl:ap.plan.sl, tp2:ap.plan.tp2, 仕込み通り:(ap.plan.dir==='long' && ap.plan.entry===p.entry)});

  /* --- C: 見る --- */
  pvOpen(p);
  var html=document.getElementById('pvInfo').innerHTML;
  L('C 見る', {開いた:document.getElementById('pvView').classList.contains('on'),
      ENTRYあり:html.indexOf('ENTRY')>=0, TP2あり:html.indexOf('TP2')>=0,
      市況:html.indexOf('市況スナップショット')>=0, 構造:html.indexOf('構造分析')>=0,
      根拠:html.indexOf('エントリー根拠')>=0, 文字数:html.length});
  pvClose();

  /* --- D: 照合が通る画像 --- */
  bankApply(1);
  var idx=Math.floor(DATA.n*0.62);
  edOpen(); edSetImage(renderBarsImage(idx,70));
  await sleep(1800);
  L('D 照合が通る場合', {cal:ED.cal&&ED.cal.mode,
      出どころ:(document.getElementById('mcFrom')||{}).textContent.slice(0,40),
      案内:document.getElementById('ocrMsg').textContent.slice(0,50)});
 }catch(e){ L('ERR', String(e&&e.message)+' @ '+String(e&&e.stack||'').split('\n')[1]); }
 window.__t.running=false;
})();
