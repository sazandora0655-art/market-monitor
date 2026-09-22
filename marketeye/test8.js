/* OCR（価格目盛りの読み取り）が実用になるか。データ無しで仕込めるか */
window.__t={running:true, log:[]};
function L(k,v){ window.__t.log.push(k+': '+JSON.stringify(v)); }
function ldImg(src){return new Promise(function(r){var i=new Image(); i.onload=function(){r(i)}; i.src=src;});}
function sleep(ms){return new Promise(function(r){setTimeout(r,ms)});}
function clickLine(yn){
  var r=edCv.getBoundingClientRect();
  edCv.dispatchEvent(new MouseEvent('click',{clientX:r.left+r.width*0.5, clientY:r.top+r.height*yn, bubbles:true, cancelable:true}));
}
(async function(){
 try{
  localStorage.removeItem('sg2'); S=load();
  /* まず内蔵データありで、OCR単体の精度を測る */
  var res=[];
  for(var bi=0; bi<3; bi++){
    bankApply(bi);
    var idx=Math.floor(DATA.n*(0.4+0.15*bi));
    var img=await ldImg(renderBarsImage(idx,70));
    /* 画面に写っている本当の価格レンジ */
    var s=Math.max(0,idx-69), hi=-Infinity, lo=Infinity;
    for(var k=s;k<=idx;k++){ if(DATA.h[k]>hi)hi=DATA.h[k]; if(DATA.l[k]<lo)lo=DATA.l[k]; }
    var t0=performance.now();
    var r=null; try{ r=ocrReadAxis(img); }catch(e){ r={err:String(e.message)}; }
    var ms=Math.round(performance.now()-t0);
    if(r && r.ok){
      /* 読み取った較正で、チャート中央の価格を逆算して妥当性を見る */
      var bb=(r.bot.v-r.top.v)/(r.bot.yn-r.top.yn), aa=r.top.v-bb*r.top.yn;
      res.push({tf:(S.data.meta||{}).tf, ok:true, ms:ms, ラベル数:r.n, 一致度:+r.score.toFixed(2),
                読んだ上:r.top.v, 読んだ下:r.bot.v, dec:r.dec,
                実際の高値:+hi.toFixed(2), 実際の安値:+lo.toFixed(2),
                範囲が妥当:(r.top.v>hi-1 && r.bot.v<lo+1)});
    } else res.push({tf:(S.data.meta||{}).tf, ok:false, ms:ms, err:(r&&r.err)||'読めず'});
  }
  L('OCR単体', res);

  /* データを外して、OCRだけで仕込めるか */
  bankApply(0);
  var idx2=Math.floor(DATA.n*0.55);
  var shot=renderBarsImage(idx2,70);
  BANK.length=0; DATA.n=0;
  edOpen(); edSetImage(shot);
  await sleep(1600);
  L('データ無しで読み込み', {cal:ED.cal?ED.cal.mode:null, arm:ED.arm,
       出どころ:(document.getElementById('mcFrom')||{}).textContent,
       手入力欄:document.getElementById('manualCal').style.display});
  clickLine(0.35); await sleep(80);
  clickLine(0.65); await sleep(80);
  var c=edCompute();
  L('線2本だけ（入力ゼロ）', {mode:ED.cal&&ED.cal.mode, err:c.err||null, dir:c.plan&&c.plan.dir,
      en:c.enP, tg:c.tgP, entry:c.plan&&c.plan.entry, sl:c.plan&&c.plan.sl,
      tp1:c.plan&&c.plan.tp1, tp2:c.plan&&c.plan.tp2,
      仕込める:!document.getElementById('edSave').disabled});
 }catch(e){ L('ERR', String(e&&e.message)+' @ '+String(e&&e.stack||'').split('\n')[1]); }
 window.__t.running=false;
})();
