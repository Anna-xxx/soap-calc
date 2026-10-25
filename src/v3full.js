const DB=__DB__;
const OILS=DB.oils, ACIDS=DB.acids;
const byName=Object.fromEntries(OILS.map(o=>[o.n,o]));
const POTS=[["Ввести вес тары вручную",0]];
const FA=[["Лауриновая",.119,.205],["Миристиновая",.077,.152],["Пальмитиновая",.046,.097],["Стеариновая",.029,.07],["Олеиновая",.042,.08],["Линолевая",.066,.10],["Эруковая",.016,.027],["Рицинолевая",.25,.43],["Линоленовая",.26,.4446]];

const $=id=>document.getElementById(id);
const nf2=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});
const nf3=new Intl.NumberFormat('ru-RU',{minimumFractionDigits:3,maximumFractionDigits:3});
const nf0=new Intl.NumberFormat('ru-RU',{maximumFractionDigits:0});
const ok=x=>Number.isFinite(x);
const g=x=>ok(x)?nf2.format(x):'—';
const pc=(x,d=2)=>ok(x)?new Intl.NumberFormat('ru-RU',{minimumFractionDigits:d,maximumFractionDigits:d}).format(x*100)+'%':'—';
const v=id=>{const x=parseFloat(String($(id).value).replace(',','.'));return ok(x)?x:0};
const div=(a,b)=>b?a/b:NaN;
function onlyLye(rows){const sh=+S.params.share;return rows.filter(r=>{if(!r)return 0;const a=/NaOH/.test(r[0]),b=/KOH/.test(r[0]);if(a&&!b&&sh<=0)return 0;if(b&&!a&&sh>=100)return 0;return 1}).map(r=>sh>=100||sh<=0?[r[0].replace(/ NaOH \/ KOH| NaOH| KOH|, NaOH|, KOH/g,'').replace(/^(ПКЭ)$/,'ПКЭ щёлочи').replace(/^ПКЭ NaCl \/ на$/,'ПКЭ NaCl'),...r.slice(1)].map((x,i)=>i===1&&/ \/ /.test(x)?x.split(' / ')[sh>=100?0:1].replace(/^(?!.* г$)(.*\d)$/,'$1')+(/ г$/.test(x)&&!/ г$/.test(x.split(' / ')[sh>=100?0:1])?' г':''):x):r)}
function LYE(){const sh=+S.params.share;return sh>=100?'NaOH':sh<=0?'KOH':'NaOH/KOH'}
function kv(el,rows){
  $(el).innerHTML=rows.filter(Boolean).map(([k,val,sub,hl])=>(val=typeof val==='string'&&/^-\d/.test(val)?'—'+(val.match(/ (г|мл)$/)?' '+val.match(/ (г|мл)$/)[1]:''):val,0)||`<div class="${hl?'hl':''}"><dt>${k}${sub?`<small>${sub}</small>`:''}</dt><dd>${val}</dd></div>`).join('');
}
function toast(t){const e=$('toast');e.textContent=t;e.hidden=false;clearTimeout(toast.t);toast.t=setTimeout(()=>e.hidden=true,1800)}

// ---------- state ----------
const SAMPLE={name:'Пример: хозяйственное',mode:'direct',oils:[
  {n:'Говяжий жир',ph:'core',fa:0,mzs:450},{n:'Свиное сало',ph:'core',fa:0,mzs:200},
  {n:'Кокосовое масло',ph:'glue',fa:0,mzs:250},{n:'Подсолнечное масло',ph:'glue',fa:0,mzs:100}],
  adds:[{n:'Отдушка',p:1.5}],params:{cat:0,catkch:0,kch:70,kna:1.02,kk:1.04,share:100,two:false},sample:true};
let S;
function oilRow(o){const d=byName[o.n]||{};return {n:o.n||'',ph:o.ph||'core',fa:o.fa||0,mzs:o.mzs||0,
  sap:o.sap??d.sapK??0,pke:o.pke??(d.pke!=null?d.pke*100:0),iod:o.iod??d.iod??0,titr:o.titr??d.titr??''}}
function load(){
  try{const s=JSON.parse(localStorage.getItem('soap.current'));if(s&&s.oils)return s}catch(e){}
  return JSON.parse(JSON.stringify(SAMPLE));
}
function persist(){try{localStorage.setItem('soap.current',JSON.stringify(S))}catch(e){}}
function saved(){try{return JSON.parse(localStorage.getItem('soap.saved'))||{}}catch(e){return{}}}

// ---------- oils table ----------
$('oil-names').innerHTML=OILS.map(o=>`<option value="${o.n}">${o.fav?'★ избранное':''}</option>`).join('');
function kindOf(o){return o.fa>0&&!o.mzs?'fa':(o.kind||'mzs')}
function autoKind(n){return /кислот/i.test(n)?'fa':'mzs'}
function setKind(o,k){const w=o.fa+o.mzs;o.kind=k;o.fa=k==='fa'?w:0;o.mzs=k==='fa'?0:w}
function renderOils(){
  const tb=document.querySelector('#oils tbody');
  tb.innerHTML=S.oils.map((o,i)=>`<tr data-i="${i}">
    <td class="name" data-label="Сырьё"><input list="oil-names" data-k="n" value="${o.n.replace(/"/g,'&quot;')}" placeholder="Выберите масло" aria-label="Сырьё"></td>
    <td data-label="Фаза"><select data-k="ph" aria-label="Фаза"><option value="core"${o.ph==='core'?' selected':''}>ядровая</option><option value="glue"${o.ph==='glue'?' selected':''}>клеевая</option></select></td>
    <td class="w" data-label="Вес, ${S.unit==='p'?'%':'г'}"><input class="n manual" type="number" step="any" data-k="wt" value="${disp(o.fa+o.mzs)}" aria-label="Вес"></td>
    <td data-label="Что это"><select data-k="kind" aria-label="Тип сырья"><option value="mzs"${kindOf(o)==='mzs'?' selected':''}>масло или жир</option><option value="fa"${kindOf(o)==='fa'?' selected':''}>жирная кислота</option></select></td>
    <td class="p" data-label="ЧО"><input class="n" type="number" step="any" data-k="sap" value="${o.sap}" aria-label="ЧО"></td>
    <td class="p" data-label="ПКЭ, %"><input class="n" type="number" step="any" data-k="pke" value="${o.pke}" aria-label="ПКЭ, %"></td>
    <td class="p" data-label="Й"><input class="n" type="number" step="any" data-k="iod" value="${o.iod}" aria-label="Йодное число"></td>
    <td class="p" data-label="Титр"><input class="n" type="number" step="any" data-k="titr" value="${o.titr}" aria-label="Титр"></td>
    <td class="n" data-o="p" data-label="Доля"></td><td class="n" data-o="na" data-label="NaOH, г"></td><td class="n" data-o="k" data-label="KOH, г"></td>
    <td class="del"><button class="btn ghost" type="button" data-del="${i}" aria-label="Удалить строку">✕</button></td></tr>`).join('');
}
document.querySelector('#oils tbody').addEventListener('input',e=>{
  const tr=e.target.closest('tr');if(!tr)return;const i=+tr.dataset.i,k=e.target.dataset.k;const o=S.oils[i];
  if(k==='n'){o.n=e.target.value;const d=byName[o.n];if(d){o.sap=d.sapK??0;o.pke=d.pke!=null?+(d.pke*100).toFixed(3):0;o.iod=d.iod??0;o.titr=d.titr??'';
      tr.querySelector('[data-k=sap]').value=o.sap;tr.querySelector('[data-k=pke]').value=o.pke;tr.querySelector('[data-k=iod]').value=o.iod;tr.querySelector('[data-k=titr]').value=o.titr;}
      setKind(o,autoKind(o.n));tr.querySelector('[data-k=kind]').value=o.kind;}
  else if(k==='ph')o.ph=e.target.value;
  else if(k==='titr')o.titr=e.target.value;
  else if(k==='wt'){const x=parseFloat(e.target.value)||0,w=S.unit==='p'?S.total*x/100:x,kd=kindOf(o);o.fa=kd==='fa'?w:0;o.mzs=kd==='fa'?0:w}
  else if(k==='kind'){setKind(o,e.target.value)}
  else o[k]=parseFloat(e.target.value)||0;
  S.sample=false;updSample();calc();
});
document.querySelector('#oils tbody').addEventListener('change',e=>{if(e.target.dataset.k==='ph'){S.oils[+e.target.closest('tr').dataset.i].ph=e.target.value;calc()}});
document.querySelector('#oils tbody').addEventListener('click',e=>{const d=e.target.dataset.del;if(d!=null){S.oils.splice(+d,1);renderOils();calc()}});
$('add-oil').onclick=()=>{S.oils.push(oilRow({}));renderOils();calc();document.querySelector('#oils tbody tr:last-child input').focus()};

// ---------- additives ----------
function renderAdds(){
  document.querySelector('#adds tbody').innerHTML=S.adds.map((a,i)=>`<tr data-i="${i}">
   <td><input data-k="n" value="${(a.n||'').replace(/"/g,'&quot;')}" placeholder="Название" aria-label="Добавка"></td>
   <td class="n"><input class="n manual" style="width:80px" type="number" step="any" data-k="p" value="${a.p}" aria-label="%"></td>
   <td class="n" data-o="g"></td><td><button class="btn ghost" type="button" data-del="${i}" aria-label="Удалить">✕</button></td></tr>`).join('');
}
document.querySelector('#adds tbody').addEventListener('input',e=>{const i=+e.target.closest('tr').dataset.i,k=e.target.dataset.k;S.adds[i][k]=k==='n'?e.target.value:(parseFloat(e.target.value)||0);calc()});
document.querySelector('#adds tbody').addEventListener('click',e=>{const d=e.target.dataset.del;if(d!=null){S.adds.splice(+d,1);renderAdds();calc()}});
$('add-add').onclick=()=>{S.adds.push({n:'',p:0});renderAdds();calc()};

// ---------- params ----------
const PARAMS=['cat','catkch','kch','kna','kk','share'];
function setParams(){PARAMS.forEach(p=>$(p).value=S.params[p]);$('two').checked=!!S.params.two}
$('two').onchange=()=>{S.params.two=$('two').checked;vis();modeTexts();calc()};
function vis(){const ind=S.mode==='indirect',two=ind&&!!S.params.two;
  document.querySelectorAll('.only-ind').forEach(e=>e.hidden=!ind);document.querySelectorAll('.only-two').forEach(e=>e.hidden=!two)}
PARAMS.forEach(p=>$(p).addEventListener('input',()=>{S.params[p]=v(p);calc()}));
function setMode(m,resetDefaults){
  S.mode=m;$('m-direct').setAttribute('aria-pressed',m==='direct');$('m-indirect').setAttribute('aria-pressed',m==='indirect');
  if(resetDefaults){Object.assign(S.params,m==='direct'?{kch:70,kna:1.02,kk:1.04}:{kch:60,kna:1.02,kk:1.111});setParams()}
  vis();
  modeTexts();calc();
}
$('m-direct').onclick=()=>setMode('direct',true);
$('m-indirect').onclick=()=>setMode('indirect',true);

// ---------- calc ----------
let R={};
function calc(){
  const P=S.params, ind=S.mode==='indirect', two=ind&&!!P.two;
  // two: клеевые жиры уходят во 2-е омыление, в 1-м считаются только ядровые
  const in2=o=>two&&o.ph==='glue';
  let FA_=0,MZS=0,NA=0,K=0,core=0,glue=0,FA2=0,MZS2=0,NA2=0,K2=0,ALL=0;
  S.oils.forEach(o=>{const w=o.fa+o.mzs;ALL+=w;
    if(in2(o)){FA2+=o.fa;MZS2+=o.mzs;NA2+=o.sap/1.403*w;K2+=o.sap*w;return}
    FA_+=o.fa;MZS+=o.mzs;NA+=o.sap/1.403*w;K+=o.sap*w;if(o.ph==='glue')glue+=w;else core+=w});
  const O23=FA_+MZS, O78=FA2+MZS2;
  let pke2=0;
  let sapMix=0,pke=0,pkeNacl=0,iod=0,titr=0,titrW=0;
  const props={hard:[0,0],clean:[0,0],cond:[0,0],bub:[0,0],cream:[0,0]};
  const rows=document.querySelectorAll('#oils tbody tr');
  const warns=[];
  S.oils.forEach((o,i)=>{const w=o.fa+o.mzs,s2=in2(o),p=div(w,s2?O78:O23)||0,pa=div(w,ALL)||0;
    if(s2)pke2+=o.pke/100*p;else{sapMix+=o.sap*p;pke+=o.pke/100*p;pkeNacl+=o.pke/100*1.15*p}
    iod+=o.iod*pa;
    const t=parseFloat(o.titr);if(ok(t)){titr+=t*pa;titrW+=pa}
    const d=byName[o.n];if(d)for(const k in props)if(d[k]!=null){props[k][0]+=d[k]*pa;props[k][1]+=pa}
    if(w>0&&!o.pke)warns.push(o.n||'строка '+(i+1));
    const tr=rows[i];if(tr){tr.querySelector('[data-o=p]').textContent=pc(p,1)+(s2?' 2-е':'');tr.querySelector('[data-o=na]').textContent=g(o.sap/1.403*w);tr.querySelector('[data-o=k]').textContent=g(o.sap*w)}
  });
  $('oil-warn').textContent=warns.length?`Нет ПКЭ для: ${warns.join(', ')}. ПКЭ смеси занижена, вода по ПКЭ и размер дозы считаются неверно. Впишите ПКЭ вручную.`:'';
  const C2=O23+P.cat;
  const C6=MZS*0.95+FA_+P.cat*P.catkch/100;
  const F24=NA*P.kna+NA*0.02, G24=K*P.kk+K*0.05;
  const K22=pke,K23=pke*1.403,M22=pkeNacl,M23=pkeNacl/1.043;
  const C7=K22?NA/((K22*100)-0.5)*100-(C2+NA):NaN;
  const C8=K23?K/((K23*100)-0.5)*100-(C2+K):NaN;
  const A47=div(C6,P.kch)*100;
  const C14=A47/100*((100*K22)-0.5), C15=A47/100*((100*K23)-0.5);
  const C16=C14>0?Math.ceil(F24/C14):NaN, C17=C15>0?Math.ceil(G24/C15):NaN;
  const D16=C16?F24/C16/2:NaN, D17=C17?G24/C17/2:NaN;
  const D20=C16>1?(F24-D16)/(C16-1):NaN, D21=C17>1?(G24-D17)/(C17-1):NaN;
  const A48=A47-F24-C2, A49=A47-G24-C2;
  R={FA_,MZS,O23,C2,C6,NA,K,F24,G24,K22,K23,M22,M23,sapMix,C7,C8,ind,two,A47,FA2,MZS2,O78,NA2,K2,pke2};

  const P_=S.unit==='p';
  $('t-fa').textContent='';$('t-mzs').textContent=P_?pc(div(MZS+FA_,S.total)||0,1):g(MZS+FA_);
  if(!P_){S.total=+O23.toFixed(2);if(document.activeElement!==$('total'))$('total').value=S.total}
  const sumP=div(O23,S.total)*100;
  $('unit-note').className='note'+(P_&&Math.abs(sumP-100)>0.05?' bad':'');
  $('unit-note').textContent=P_?(Math.abs(sumP-100)>0.05?`Сумма процентов ${nf2.format(sumP)}%, должна быть 100%.`:'Сумма 100%. Измените общий вес, и граммы пересчитаются.'):'Впишите другой общий вес, и все масла пересчитаются в той же пропорции.';$('t-sap').textContent=nf3.format(sapMix);
  $('t-pke').textContent=pc(K22);$('t-iod').textContent=g(iod);$('t-titr').textContent=titrW?g(titr/titrW):'—';
  $('t-p').textContent=two?'1-е':pc(div(O23,O23)||0,0);$('t-naoh').textContent=g(NA);$('t-koh').textContent=g(K);

  const tiles=[['Смесь, г',g(C2),'с катализатором'],['Жирн. кислот, г',g(C6),'МЖС × 0,95 + ЖК'],
    ['NaOH, г',g(F24),two?'1-е омыление':'с Кщ и избытком','lye'],['KOH, г',g(G24),two?'1-е омыление':'с Кщ и избытком','lye'],
    ['ПКЭ NaOH',pc(K22),'при 100 °С'],['Йодное число',g(iod),iod>55?'выше 55':'норма до 55']];
  $('tiles').innerHTML=tiles.map(([l,val,u,c])=>`<div class="tile ${c||''}"><span class="l">${l}</span><span class="v">${val}</span><span class="u">${u}</span></div>`).join('');

  const pr=k=>props[k][1]?props[k][0]/props[k][1]:NaN;
  const bar=x=>ok(x)?`<span class="row" style="justify-content:flex-end;flex-wrap:nowrap"><span class="bar" style="width:90px"><i style="width:${Math.min(100,x)}%"></i></span>${nf0.format(x)}</span>`:'—';
  kv('props',[['Твёрдость',bar(pr('hard'))],['Очищающие качества',bar(pr('clean'))],['Смягчающие качества',bar(pr('cond'))],['Пузыристость пены',bar(pr('bub'))],['Кремовость пены',bar(pr('cream'))],
    ['Йодное число (устойчивость к прогорканию)',`${g(iod)} <span class="chip ${iod>55?'warn':'ok'}">${iod>55?'> 55':'≤ 55'}</span>`],
    ['Титр жиров',titrW?g(titr/titrW)+' °С':'—','по маслам с известным титром'],
    ['ЧО смеси жиров (KOH)',nf3.format(sapMix)]]);

  kv('full',onlyLye([['ЖК всего',g(C6)+' г','МЖС × 0,95 + ЖК + катализатор × КЧ'],
    ['Щёлочь на омыление NaOH / KOH',`${g(NA)} / ${g(K)} г`],
    ['NaOH итого с избытком',g(F24)+' г',`× Кщ ${P.kna} + 2%`,1],['KOH итого с избытком',g(G24)+' г',`× Кщ ${P.kk} + 5%`,1],
    ['ПКЭ NaOH / KOH',`${pc(K22)} / ${pc(K23)}`],['ПКЭ NaCl / на KOH',`${pc(M22)} / ${pc(M23)}`],
    ['Вода при омылении NaOH',g(C7)+' г','концентрация щёлочи = ПКЭ − 0,5%'],['Вода при омылении KOH',g(C8)+' г'],
    ['Вес массы в котле, NaOH',g(C2+C7+F24)+' г'],['Вес массы в котле, KOH',g(C2+C8+G24)+' г']]));
  kv('frac',onlyLye([['Масса при желаемом КЧ',g(A47)+' г',`КЧ ${g(P.kch)}%`],
    ['Макс. вес дозы NaOH',g(C14)+' г','с учётом ПКЭ'],['Макс. вес дозы KOH',g(C15)+' г'],
    ['Количество внесений NaOH',ok(C16)?C16:'—'],['Первая доза NaOH',g(D16)+' г','половина средней дозы',1],['Последующие дозы NaOH, каждая',C16>1?g(D20)+' г':'не нужны',C16>1?null:'всё вносится одной дозой',1],
    ['Количество внесений KOH',ok(C17)?C17:'—'],['Первая доза KOH',g(D17)+' г',null,1],['Последующие дозы KOH, каждая',C17>1?g(D21)+' г':'не нужны',C17>1?null:'всё вносится одной дозой',1],
    ['Вода при дробном, NaOH',g(A47-C14-C2)+' г'],['Вода при дробном, KOH',g(A47-C15-C2)+' г'],
    ['Вода по КЧ, NaOH',g(A48<F24?F24:A48)+' г'],['Вода по КЧ, KOH',g(A49<G24?G24:A49)+' г'],
    ['Вес массы в котле',g(C2+(A47-C14-C2)+C14)+' г','при дробном внесении']]));

  const salt=ind?C2*0.01:core*0.01+glue*0.04, alk=ind?C2*0.008:core*0.008+glue*0.032;
  $('mob-rule').textContent=ind?'1,0% соли и 0,8% щёлочи от ядровой МЖС':'1% от ядровой + 4% от клеевой МЖС';
  kv('mob',[['NaCl 20% р-р: соль',g(salt)+' г',null,1],['NaCl 20% р-р: вода',g(salt*4)+' г'],[LYE()+' 50% р-р: щёлочь',g(alk)+' г',null,1],[LYE()+' 50% р-р: вода',g(alk)+' г']]);
  const sh=Math.min(100,Math.max(0,P.share))/100;
  const W=[];
  if(sh>0)W.push(['NaOH',F24*sh,'г','lye']);
  if(sh<1)W.push(['KOH',G24*(1-sh),'г','lye']);
  W.push(['Вода на омыление',sh>=.5?C7:C8,'г'],['Соль для подвижности',salt,'г'],['Щёлочь для подвижности',alk,'г','lye']);
  $('weigh').innerHTML=W.map(([l,x,u])=>`<div class="lye"><span class="l">${l} <button type="button" class="q" data-t="w:${l}">?</button></span><span class="v">${g(x)}<small>${u}</small></span></div>`).join('');
  kv('split',[['NaOH',pc(sh,0)+' → '+g(F24*sh)+' г',null,1],['KOH',pc(1-sh,0)+' → '+g(G24*(1-sh))+' г',null,1]]);

  let ap=0;const arows=document.querySelectorAll('#adds tbody tr');
  S.adds.forEach((a,i)=>{ap+=a.p;if(arows[i])arows[i].querySelector('[data-o=g]').textContent=g(O23*a.p/100)});
  $('adds-p').textContent=pc(ap/100);$('adds-g').textContent=g(O23*ap/100);
  R.addsG=O23*ap/100;

  const carb=[['Na₂CO₃ 70%',F24*0.7*1.32,K22/0.474,(F24*0.7*1.32)/30*100-F24*0.7*1.32,'р-р 30%'],['NaOH 30%',F24*0.3,K22,C7*0.3,'*'],
    ['K₂CO₃ 70%',G24*0.7*1.23,K23/0.55,(G24*0.7*1.23)/50*100-G24*0.7*1.23,'р-р 50%'],['KOH 30%',G24*0.3,K23,C8*0.3,'*']];
  $('carb').innerHTML=carb.map(r=>`<tr><td>${r[0]}</td><td class="n">${g(r[1])}</td><td class="n">${pc(r[2])}</td><td class="n">${g(r[3])}</td><td>${r[4]}</td></tr>`).join('');

  calcSalt();begRender();persist();
}

function calcSalt(){
  const {C6,K22,K23,M22,M23,ind}=R;const P=S.params;
  const mass=v('brutto')-v('tare');
  const anNa=C6*1.08, anK=C6*1.14, wfNa=mass-anNa, wfK=mass-anK;
  const M=mass>0,D=(x,u)=>M?x+u:'— '+u.trim();const keNa=M?div(v('ke-na'),wfNa):NaN, keK=M?div(v('ke-k'),wfK):NaN;
  kv('mass',[['Вес массы в котле (нетто)',g(mass)+' г'],['Безводное мыло натровое',g(anNa)+' г','ЖК × 1,08'],['Безводное мыло калийное',g(anK)+' г','ЖК × 1,14'],
    ['Водная фаза натровое',D(g(wfNa),' г'),'масса в котле − безводное мыло'],['Водная фаза калийное',D(g(wfK),' г')],
    ['КЧ при варке (фактическое)',pc(div(C6,mass))],
    ['Расчётный вес при желаемом КЧ',g(R.A47)+' г',`КЧ ${g(P.kch)}%`],
    mass>0&&ok(R.A47)?['Разница с расчётом',(mass>=R.A47?'+':'−')+g(Math.abs(mass-R.A47))+' г',mass>R.A47?'тяжелее расчётного: в массе больше воды':'легче расчётного: воды меньше, чем нужно для желаемого КЧ']:null]);
  const reqNa=v('ke-req-na')/100, reqK=v('ke-req-k')/100;
  kv('ke',[['КЭ в водной фазе натр. (факт)',pc(keNa)],['КЭ в водной фазе кали. (факт)',pc(keK)],
    ['Понижение КЭ: долить воды, натр.',D(g(v('ke-na')/(reqNa*100)*100-wfNa),' мл'),`до ${pc(reqNa)}`,1],
    ['Понижение КЭ: долить воды, кали.',D(g(v('ke-k')/(reqK*100)*100-wfK),' мл'),`до ${pc(reqK)}`,1]]);
  const sc=[['< 0,5%','стоит колом',0,.005],['0,5%','густая, как студень',.005,.0051],['0,5–1,0%','однородная подвижная',.0051,.01],['1,0–3,0%','мутнеет, клей и ядро',.01,.03],['3,0–3,5%','щёлок/клей/ядро',.03,.035],['3,5% – ПКЭ','высаливание щёлок/ядро',.035,9]];
  $('ke-scale').innerHTML=sc.map(s=>`<div class="${ok(keNa)&&v('ke-na')>0&&keNa>=s[2]&&keNa<s[3]?'on':''}"><b>${s[0]}</b>${s[1]}</div>`).join('');

  $('salting-block').querySelector('h2').textContent=ind?'Полная высолка: расчёт ПКЭ от водной части':'Полная высолка';
  const Kna=P.kna;
  kv('salting',[['NaCl 20% р-р для натрового мыла',g(((keNa*1.15)*wfNa-M22*wfNa)/(M22-0.2))+' г','вес раствора; 1 часть = значение / 5',1],
    ['NaOH 20% р-р для натрового мыла',g(((keNa*wfNa-K22*wfNa)/(K22-0.2))*Kna)+' г',null,1],
    ['NaCl 20% р-р для калийного мыла',g(((keK*wfK-M23*wfK)/(M23-0.2))*1.043)+' г',null,1],
    ['NaOH 20% р-р для калийного мыла',g(((keK*wfK-K23*wfK)/(K23-0.2))/1.403*Kna)+' г',null,1],
    ['NaCl для натрового мыла, сухое в-во',g(wfNa/(100-(M22*100))*100-wfNa-v('ke-na'))+' г']]);

  const core=v('w-core'),glue1=v('w-glue'),lye1=v('w-lye');
  const kchCore=div(C6-lye1*0.01-glue1*0.3,core), kc=ok(kchCore)?kchCore:0, wcore=core-core*kc*1.03;
  if(ind)kv('core1out',[['КЧ ядра (основы)',pc(kchCore),'(ЖК − щёлок × 1% − клей × 30%) / вес ядра',1],
    ['Вода в ядре',core?g(wcore)+' г':'—','вес ядра − ЖК ядра × 1,03'],
    ['Соль при растапливании ядра',core?g(core*0.004)+'–'+g(core*0.005)+' г':'—','0,4–0,5% от массы, если соли в ядре нет']]);
  if(R.two)calcSap2(core,kc,wcore);
  const chip=k=>ok(k)?` <span class="chip ${k>=0.74?'ok':k>=0.64?'warn':'bad'}">${k>=0.74?'туалетное по ГОСТ':k>=0.64?'хозяйственное по ГОСТ':'ниже ГОСТ'}</span>`:'';
  const fin=v('w-final'),sf=v('w-sf');
  if(ind){
    // КЧ основы и готового мыла по шаблону: ЖК 1-го омыления (+ клеевая МЖС 2-го) минус потери с клеем и щёлоком
    const base=C6-glue1*0.3-lye1*0.01+(R.two?R.MZS2*0.95+R.FA2-v('w-glue2')*0.3:0);
    const coreF=R.two?v('w-core2'):core, kchF=div(base+sf*0.95,fin);
    kv('kchout',[[R.two?'КЧ шлифованного ядра':'Качественное число основы (итог.)',pc(div(base,coreF)),R.two?'по весу шлифованного ядра':'из итога полной высолки'],
      R.two&&v('w-lye2')>0?['<span class="chip bad">Шлифование не удалось</span>','','после шлифования не должно быть подмыльного щёлока, только ядро и клей; массу нужно переделывать']:null,
      ['Качественное число готового мыла',pc(kchF)+chip(kchF),'(ЖК + SF × 0,95) / вес перед разливом',1],
      ['Доля безводного мыла NaOH',fin?g(fin*kchF*1.08)+' г':'—'],['Водная фаза и неомыленное, NaOH',fin?g(fin-fin*kchF*1.08-(R.MZS+R.MZS2)*0.05)+' г':'—']]);
  }else{
    const kch=div(C6+sf*0.95,fin);
    kv('kchout',[['Качественное число готового мыла',pc(kch)+chip(kch),'(ЖК + SF × 0,95) / вес перед разливом'],
      ['Соль при растапливании ядра',fin?g(fin*0.004)+'–'+g(fin*0.005)+' г':'—','0,4–0,5% от массы, если соли в ядре нет'],
      ['Доля безводного мыла NaOH',g(C6*1.08)+' г'],['Доля безводного мыла KOH',g(C6*1.14)+' г'],
      ['Водная фаза и неомыленное, NaOH',g(fin-C6*1.08)+' г'],['Водная фаза и неомыленное, KOH',g(fin-C6*1.14)+' г']]);
  }
  const fm=v('fa-mass');const iNa=fm*v('fa-na')/100,iK=fm*v('fa-k')/100;
  kv('free',[['Натровое: щёлочи в массе',g(iNa)+' г'],['Натровое: % в водной фазе',M?pc(div(iNa,wfNa),3):'—'],['Калийное: щёлочи в массе',g(iK)+' г'],['Калийное: % в водной фазе',M?pc(div(iK,wfK),3):'—']]);
  const exNa=mass*v('ff-na')/100, exK=mass*v('ff-k')/100;
  const nOil=byName[$('neut-oil').value], sapN=nOil&&nOil.sapK?nOil.sapK:R.sapMix, nName=nOil&&nOil.sapK?nOil.n:'смеси', nw=v('neut-w');
  kv('neut',[['Избыток NaOH',g(exNa)+' г'],['Жира для нейтрализации NaOH',g(div(exNa,sapN/1.403))+' г',`избыток / (ЧО ${nName} / 1,403)`,1],
    ['Избыток KOH',g(exK)+' г'],['Жира для нейтрализации KOH',g(div(exK,sapN))+' г',`избыток / ЧО ${nName}`,1],
    nw?['Этот жир погасит',`${g(nw*sapN/1.403)} г NaOH или ${g(nw*sapN)} г KOH`,`${g(nw)} г, ЧО ${nf3.format(sapN)}`]:null]);
}
// 2-е омыление косвенного способа (лист «Косвенный», строки 56–112)
function calcSap2(core,kc,wcore){
  const {K22,MZS2,FA2,O78,NA2,K2,pke2}=R;const P=S.params;
  const fa2=MZS2*0.95+core*kc+FA2;
  const F77=NA2*P.kna, G77=K2*P.kk;
  const F79=F77-v('rest-na')+F77*0.02, G79=G77-v('rest-k')+G77*0.05;
  // ПКЭ с учётом ядра: ядро (ПКЭ 1-го омыления − 0,5% на глицерин) и клеевая МЖС по долям
  const I82=core*kc, I84=I82+O78, M82=div(I82,I84)||0, M83=div(O78,I84)||0;
  const J84=((K22*100)-0.5)/100*M82+pke2*M83, K84=J84*1.71, L84=J84*1.15;
  const A99=J84?F79/((J84*100)-0.5)*100-F79-O78-wcore:NaN, A100=K84?G79/((K84*100)-0.5)*100-G79-O78-wcore:NaN;
  const wNa=A99<F79?F79:A99, wK=A100<G79?G79:A100, m70=core+O78+F79, m71=core+O78+G79;
  kv('sap2',[['Клеевая МЖС',g(O78)+' г','клеевые жиры из рецепта'],['Ядро из 1-го омыления',g(core)+' г',`КЧ ядра ${pc(kc)}`],['Вода в ядре',g(wcore)+' г'],
    ['Жирных кислот всего',g(fa2)+' г','МЖС × 0,95 + ядро × КЧ + ЖК'],
    ['NaOH итого',g(F79)+' г','× Кщ − остаток в ядре + 2%',1],['KOH итого',g(G79)+' г','× Кщ − остаток в ядре + 5%',1],
    ['ПКЭ клеевой МЖС NaOH / KOH',`${pc(pke2)} / ${pc(pke2*1.403)}`],
    ['ПКЭ с учётом ядра NaOH / KOH / NaCl',`${pc(J84)} / ${pc(K84)} / ${pc(L84)}`,'по долям ядра и МЖС, −0,5% на глицерин'],
    ['Вода при омылении NaOH',g(wNa)+' г','при полном внесении щёлочи',1],['Вода при омылении KOH',g(wK)+' г',null,1],
    ['Вес массы в котле (расчёт.) NaOH / KOH',`${g(m70)} / ${g(m71)} г`],['КЧ расчётное',pc(div(fa2,m70))]]);
  const salt=core*0.01+O78*0.04, alk=core*0.008+O78*0.032;
  kv('mob2',[['NaCl 20% р-р: соль',g(salt)+' г','1% от ядра + 4% от клеевой МЖС',1],['NaCl 20% р-р: вода',g(salt*4)+' г'],
    [LYE()+' 50% р-р: щёлочь',g(alk)+' г','0,8% от ядра + 3,2% от клеевой МЖС',1],[LYE()+' 50% р-р: вода',g(alk)+' г'],
    ['40% р-р NaOH: вода',g(F77/40*100-F77)+' г',`на ${g(F77)} г NaOH`],['40% р-р KOH: вода',g(G77/40*100-G77)+' г',`на ${g(G77)} г KOH`]]);
  const m2=v('brutto2')-v('tare2'), wf2=m2-fa2*1.08, ke2=v('ke2'), req=v('ke2-req')/100, k87=div(ke2,wf2);
  kv('part2',[['Вес массы в котле (нетто)',g(m2)+' г'],['КЧ фактическое',pc(div(fa2,m2))],['Безводное мыло (натровое)',g(fa2*1.08)+' г','ЖК × 1,08'],
    ['Водная фаза',g(wf2)+' г','масса − безводное мыло'],['КЭ в водной фазе (факт)',pc(k87)],
    ['NaCl 20% р-р',g(((k87*1.15)*m2-(req*1.15)*m2)/(req-0.2))+' г',`чтобы довести КЭ до ${pc(req)}`,1],
    ['или NaOH 50% р-р',g(((k87*m2-req*m2)/(req-0.5))*P.kna)+' г',null,1],
    ['Понижение КЭ: долить воды',ke2/(req*100)*100-wf2>0?g(ke2/(req*100)*100-wf2)+' мл':'не нужно','если КЭ выше нужной']]);
  kv('full2',[['ПКЭ для высолки',pc(J84)],['NaCl 20% р-р для натрового мыла',g(((k87*1.15)*wf2-(J84*1.15)*wf2)/(J84-0.2))+' г',null,1],
    ['NaOH 20% р-р для натрового мыла',g(((k87*wf2-J84*wf2)/(J84-0.2))*P.kna)+' г',null,1]]);
}
['brutto','tare','ke-na','ke-k','ke-req-na','ke-req-k','w-core','w-glue','w-lye','w-sf','w-final','fa-mass','fa-na','fa-k','ff-na','ff-k',
 'rest-na','rest-k','brutto2','tare2','ke2','ke2-req','w-core2','w-glue2','w-lye2','neut-oil','neut-w'].forEach(id=>$(id).addEventListener('input',calcSalt));
// котлы: встроенные из шаблона + свои, сохранённые в браузере
function myPots(){try{return JSON.parse(localStorage.getItem('soap.pots'))||[]}catch(e){return[]}}
function allPots(){return POTS.concat(myPots().map(p=>[p[0],p[1],1]))}
function renderPots(){const L=allPots();['pot','pot2'].forEach(id=>{const s=$(id),cur=s.value;
  s.innerHTML=L.map((p,i)=>`<option value="${i}">${p[2]?'★ ':''}${String(p[0]).replace(/</g,'&lt;')}${p[1]?' — '+nf0.format(p[1])+' г':''}</option>`).join('');
  if(cur&&+cur<L.length)s.value=cur})}
[['pot','tare'],['pot2','tare2']].forEach(([s,t])=>$(s).onchange=()=>{const p=allPots()[+$(s).value];if(p&&p[1])$(t).value=p[1];calcSalt()});
$('pot-save').onclick=()=>{const n=$('pot-name').value.trim(),w=v('tare');
  if(!n){toast('Впишите название посуды');$('pot-name').focus();return}if(!(w>0)){toast('Сначала впишите вес тары');return}
  const L=myPots().filter(p=>p[0]!==n);L.push([n,w]);try{localStorage.setItem('soap.pots',JSON.stringify(L))}catch(e){}
  renderPots();$('pot').value=POTS.length+L.length-1;$('pot-name').value='';toast('Посуда запомнена в этом браузере')};
$('pot-del').onclick=()=>{const i=+$('pot').value-POTS.length;if(i<0){toast('Удалить можно только свою посуду, отмеченную ★');return}
  const L=myPots();L.splice(i,1);try{localStorage.setItem('soap.pots',JSON.stringify(L))}catch(e){}$('pot').value='0';renderPots();toast('Удалено')};
renderPots();

// ---------- reference ----------
function calcRef(){
  const kt=v('cb-kt');const dNa=v('cb-na-v')*kt*0.021, dK=v('cb-k-v')*kt*0.028055;
  const kNa=div(v('cb-na-w'),dNa),kK=div(v('cb-k-w'),dK);
  kv('carbcheck',[['NaOH фактически',dNa?nf3.format(dNa)+' г':'—'],['Кщ NaOH',ok(kNa)?nf3.format(kNa):'—',null,1],['KOH фактически',dK?nf3.format(dK)+' г':'—'],['Кщ KOH',ok(kK)?nf3.format(kK):'—',null,1]]);
  calcRef.k=[kNa,kK];
  document.querySelectorAll('#sol tbody tr').forEach(tr=>{const [a,b,c]=[...tr.querySelectorAll('input')].map(i=>parseFloat(i.value)||0);
    tr.querySelector('[data-o=s]').textContent=pc(div(a,a+b));tr.querySelector('[data-o=w]').textContent=c?g(a/(c/100)-a):'—'});
  const m=v('dil-m'),a=v('dil-a'),b=v('dil-b');
  kv('dil',[['Долить воды',b?g(m*a/b-m)+' мл':'—','для КЧ: долить 1%-го р-ра электролита',1],['Итого масса',b?g(m+m*a/b-m)+' г':'—']]);
  let s=0,na=0,k=0;document.querySelectorAll('#pkefa tbody tr').forEach((tr,i)=>{const x=(parseFloat(tr.querySelector('input').value)||0)/100;s+=x;na+=FA[i][1]*x;k+=FA[i][2]*x});
  $('pkefa-sum').textContent=pc(s,1);$('pkefa-na').textContent=pc(na);$('pkefa-k').textContent=pc(k);
  kv('pkefa-nacl',[['ПКЭ NaCl',pc(na*1.15)]]);
  const ac=ACIDS[+$('acid').value]||{},w=v('acid-w'),kk=(ac.sapK||0)*w;
  kv('acidout',[['KOH на нейтрализацию',g(kk)+' г',`КЧ кислоты ${ac.sapK??'—'}`,1],['NaOH на нейтрализацию',g(kk/1.403)+' г',null,1],
    ['Вес натровой соли',ac.ksNa?g(w*ac.ksNa)+' г':'—',ac.ksNa?`КС ${ac.ksNa}`:'КС не указан'],['Вес калийной соли',ac.ksK?g(w*ac.ksK)+' г':'—',ac.ksK?`КС ${ac.ksK}`:'']]);
  kv('cv',[['NaOH из KOH',g(v('cv-k')/1.403)+' г'],['KOH из NaOH',g(v('cv-na')*1.403)+' г']]);
}
$('sol').querySelector('tbody').innerHTML=[['40% р-р NaOH',40],['40% р-р KOH',40],['20% р-р NaCl',20],['NaOH',''],['KOH',''],['NaCl','']].map((r,i)=>`<tr><td>${r[0]}</td>
  <td class="n"><input class="n manual" style="width:80px" type="number" step="any" id="sol-a${i}" value="0" aria-label="Вес"></td>
  <td class="n"><input class="n manual" style="width:80px" type="number" step="any" id="sol-b${i}" value="0" aria-label="Вода"></td>
  <td class="n" data-o="s"></td><td class="n"><input class="n manual" style="width:64px" type="number" step="any" id="sol-c${i}" value="${r[1]}" aria-label="Нужно %"></td><td class="n" data-o="w"></td></tr>`).join('');
$('pkefa').querySelector('tbody').innerHTML=FA.map((f,i)=>`<tr><td>${f[0]}</td><td class="n"><input class="n manual" style="width:80px" type="number" step="any" id="fa${i}" value="0" aria-label="Доля ${f[0]}"></td><td class="n">${pc(f[1],1)}</td><td class="n">${pc(f[2],1)}</td></tr>`).join('');
$('acid').innerHTML=ACIDS.map((a,i)=>`<option value="${i}">${a.n}</option>`).join('');
document.getElementById('step-ref').addEventListener('input',calcRef);
document.getElementById('step-ref').addEventListener('change',calcRef);
$('apply-k').onclick=()=>{const [a,b]=calcRef.k||[];let n=0;
  if(ok(a)&&a>0){S.params.kna=+a.toFixed(3);n++}if(ok(b)&&b>0){S.params.kk=+b.toFixed(3);n++}
  if(n){setParams();calc();toast('Кщ подставлены в рецепт')}else toast('Сначала впишите навеску и расход HCl')};

// ---------- cost ----------
let COST=[['Масла и жиры, кг',0,0,0],['Реактивы',0,0,0],['Эфирные',0,0,0],['Отдушки',0,0,0],['Травы, кг',0,0,0],['Экстракты',0,0,0],['Добавки',0,0,0],['Тара/упаковка',0,0,0],['Этикетки',0,0,0],['Электричество, часы',1,21,0],['Вода, литры',1000,60,0]];
try{const c=JSON.parse(localStorage.getItem('soap.cost'));if(Array.isArray(c))COST=c}catch(e){}
function renderCost(){
  $('costs').querySelector('tbody').innerHTML=COST.map((r,i)=>`<tr data-i="${i}"><td><input data-c="0" value="${String(r[0]).replace(/"/g,'&quot;')}" aria-label="Статья"></td>
  ${[1,2].map(c=>`<td class="n"><input class="n manual" style="width:90px" type="number" step="any" data-c="${c}" value="${r[c]}"></td>`).join('')}
  <td class="n" data-o="u"></td><td class="n"><input class="n manual" style="width:90px" type="number" step="any" data-c="3" value="${r[3]}"></td><td class="n" data-o="t"></td>
  <td><button class="btn ghost" type="button" data-del="${i}" aria-label="Удалить">✕</button></td></tr>`).join('');
}
function calcCost(){
  let sum=0;document.querySelectorAll('#costs tbody tr').forEach((tr,i)=>{const r=COST[i];const u=div(r[2],r[1]);const t=ok(u)?u*r[3]:0;sum+=t;
    tr.querySelector('[data-o=u]').textContent=ok(u)?g(u):'—';tr.querySelector('[data-o=t]').textContent=g(t)});
  $('cost-sum').textContent=g(sum)+' ₽';const tot=sum*v('cost-k');
  kv('costout',[['Итого с неучтёнными',g(tot)+' ₽',null,1],['Готовое мыло, за 1 кг',v('cost-kg')?g(tot/v('cost-kg'))+' ₽':'—'],['Себестоимость единицы товара',v('cost-packs')?g(tot/v('cost-packs'))+' ₽':'—',null,1]]);
  try{localStorage.setItem('soap.cost',JSON.stringify(COST))}catch(e){}
}
$('costs').addEventListener('input',e=>{const tr=e.target.closest('tr');if(!tr||e.target.dataset.c==null)return;const c=+e.target.dataset.c;COST[+tr.dataset.i][c]=c?(parseFloat(e.target.value)||0):e.target.value;calcCost()});
$('costs').addEventListener('click',e=>{const d=e.target.dataset.del;if(d!=null){COST.splice(+d,1);renderCost();calcCost()}});
$('add-cost').onclick=()=>{COST.push(['',0,0,0]);renderCost();calcCost()};
['cost-k','cost-kg','cost-packs'].forEach(id=>$(id).addEventListener('input',calcCost));

// ---------- saved recipes ----------
function renderSaved(){const s=saved(),cur=s[S.name]?S.name:'';
  $('recipe-list').innerHTML='<option value="">'+(Object.keys(s).length?'Открыть сохранённый…':'Сохранённых пока нет')+'</option>'+Object.keys(s).map(k=>`<option>${k.replace(/</g,'&lt;')}</option>`).join('')+'<option value="__new">+ Новый рецепт</option>';
  $('recipe-list').value=cur;$('del-recipe').hidden=!cur;$('save-recipe').textContent=cur?'Сохранить изменения':'Сохранить'}
$('save-recipe').onclick=()=>{const n=$('recipe-name').value.trim();if(!n){toast('Впишите название рецепта');$('recipe-name').focus();return}
  const s=saved();S.name=n;S.sample=false;s[n]=JSON.parse(JSON.stringify(S));try{localStorage.setItem('soap.saved',JSON.stringify(s));toast('Рецепт «'+n+'» сохранён в этом браузере')}catch(e){toast('Браузер не дал сохранить')}renderSaved();calc();updSample()};
$('recipe-list').onchange=()=>{const n=$('recipe-list').value;if(!n)return;
  if(n==='__new'){S=JSON.parse(JSON.stringify(SAMPLE));S.sample=false;S.name='';S.oils=[{n:'',ph:'core',fa:0,mzs:0}];boot();$('recipe-name').focus();return}
  const r=saved()[n];if(!r)return;S=JSON.parse(JSON.stringify(r));boot()};
$('del-recipe').onclick=()=>{const n=S.name;const s=saved();if(!s[n])return;delete s[n];try{localStorage.setItem('soap.saved',JSON.stringify(s))}catch(e){}renderSaved();toast('Рецепт «'+n+'» удалён')};
$('recipe-name').addEventListener('input',e=>{S.name=e.target.value;persist();renderSaved()});
function updSample(){$('sample-note').textContent=S.sample?'Сейчас открыт пример рецепта. Замените масла и веса на свои. ЧО, ПКЭ, Й и титр подставляются из базы, их можно поправить вручную.':'ЧО, ПКЭ, Й и титр подставляются из базы, их можно поправить вручную. Рецепт запоминается в этом браузере.'}

// ---------- steps ----------
let curStep='1';
(function(){const t=$('tabs'),set=()=>document.documentElement.style.setProperty('--tabh',t.offsetHeight+'px');set();addEventListener('resize',set);if(document.fonts)document.fonts.ready.then(set)})();
function go(step){
  if(step==='beg')step=(S&&S.beg&&S.beg.type)||'hard';
  const calc=/^[1-5]$/.test(step),isBeg=step==='hard'||step==='liquid',tab=calc?'calc':step;
  curStep=step;document.body.dataset.view=isBeg?'beg':calc?'calc':step;
  if(isBeg&&S&&S.beg&&S.beg.type!==step){S.beg.type=step;begApply();persist()}
  document.querySelectorAll('.tabs button').forEach(b=>{if(b.dataset.tab===tab)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
  $('stepnav').hidden=!calc;
  document.querySelectorAll('.stepnav button').forEach(b=>{b.toggleAttribute('aria-current',b.dataset.step===step);if(b.dataset.step===step)b.setAttribute('aria-current','step')});
  const n=calc?+step:0;document.querySelectorAll('.stepnav button').forEach(b=>b.classList.toggle('done',n&&+b.dataset.step<n));
  document.querySelectorAll('section.panel').forEach(s=>s.hidden=s.id!=='step-'+(isBeg?'beg':step));
  try{localStorage.setItem('soap.step',step);if(calc)localStorage.setItem('soap.calcstep',step)}catch(e){}
}
document.querySelectorAll('.stepnav button').forEach(b=>b.onclick=()=>go(b.dataset.step));
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{let t=b.dataset.tab;if(t==='calc'){try{t=localStorage.getItem('soap.calcstep')||'1'}catch(e){t='1'}}go(t)});
document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{go(b.dataset.go);document.querySelector('.wrap').scrollIntoView({block:'start'})});

// ---------- glossary ----------
const FIELD_HELP={"beg-alk":"NaOH (каустическая сода) даёт твёрдое мыло, KOH (едкое кали) мягкое и жидкое. Щёлочь определяется типом мыла, который выбран выше, поэтому здесь её менять нельзя.","beg-sf":"Пережир: какую часть масла намеренно оставляют неомылённой, чтобы мыло было мягче к коже и не оставалось свободной щёлочи. Для твёрдого мыла обычно 5%, для жидкого 3%. Чем больше пережир, тем мягче мыло.","beg-pur":"Чистота щёлочи по упаковке, %. У NaOH обычно 98–100%, у KOH чаще всего около 90%. Если в упаковке указано иначе, впишите своё значение: калькулятор увеличит навеску, чтобы чистой щёлочи хватило. Если оставить 100%, а в упаковке 89%, настоящей щёлочи будет на 11% меньше нужного, и часть масла останется неомылённой.","beg-conc":"Сколько щёлочи в готовом растворе, %. Например 33% значит 1 часть щёлочи на 2 части воды. Чем меньше воды, тем быстрее схватывается мыло. Новичкам удобно 30–33%.","beg-dil":"Сколько воды добавить, чтобы развести готовую пасту жидкого мыла, % от веса массы. Обычно 1:1 (100%), если хотите гуще, берите меньше. Считается примерно.","kk": "Коэффициент щёлочи для KOH: поправка на то, что часть едкого кали при хранении стала карбонатом. Определяется титрованием во вкладке «Справочник». Если не титровали, оставьте 1,04.", "catkch": "Качественное число катализатора, %: сколько жирных кислот в подмыльном клее, который вы вносите. Для спирта оставьте 0.", "pot": "Выберите сохранённую посуду, и её вес подставится в «Вес тары». Если её нет в списке, выберите «Ввести вес тары вручную».", "tare": "Вес пустой посуды без массы, г. Нужен, чтобы из общего веса вычесть посуду.", "brutto": "Вес посуды вместе с массой, г. Взвесьте посуду на весах прямо с мыльной массой.", "ke-na": "Сколько граммов электролита (щёлочь и соль) сейчас в массе натрового мыла: по анализу или по вашему учёту всего внесённого.", "ke-k": "То же для калийного мыла: граммы щёлочи и соли в массе по анализу или по учёту внесённого.", "ke-req-na": "Какую концентрацию электролита вы хотите получить в водной фазе натрового мыла, %. Например 1% для однородной подвижной массы.", "ke-req-k": "Желаемая концентрация электролита в водной фазе калийного мыла, %.", "fa-mass": "Вес пробы массы, которую вы отдали на анализ свободной щёлочи, г.", "fa-na": "Результат анализа: сколько процентов свободной NaOH в пробе натрового мыла.", "fa-k": "Результат анализа: сколько процентов свободной KOH в пробе калийного мыла.", "w-core": "Вес ядра после высолки, г: мыло, которое осталось в котле после слива щёлока.", "w-glue": "Вес подмыльного клея, г, если он отделился при шлифовании.", "w-lye": "Вес слитого подмыльного щёлока после первой высолки, г.", "rest-na": "Сколько NaOH осталось в ядре, г, по анализу. Учтётся при втором омылении.", "rest-k": "Сколько KOH осталось в ядре, г, по анализу.", "pot2": "Посуда для второго омыления: вес подставится в «Вес тары».", "tare2": "Вес пустой посуды, г.", "brutto2": "Вес посуды с массой, г.", "ke2": "Сколько граммов электролита сейчас в водной фазе натрового мыла.", "ke2-req": "Какую концентрацию электролита нужно получить, %, например для шлифования.", "w-final": "Вес массы в котле перед разливом в формы, г (без посуды).", "ff-na": "Проба с фенолфталеином показала избыток NaOH: впишите его процент. По нему считается, сколько жира добавить для нейтрализации.", "ff-k": "Избыток KOH по пробе с фенолфталеином, %.", "neut-oil": "Каким жиром гасить избыток щёлочи. По умолчанию смесь рецепта, можно выбрать одно масло.", "neut-w": "Сколько граммов этого жира нужно добавить. Считается само, можно поправить.", "cb-na-w": "Сколько граммов NaOH вы взяли для титрования.", "cb-na-v": "Сколько миллилитров 0,5 Н соляной кислоты ушло на титрование NaOH.", "cb-k-w": "Сколько граммов KOH вы взяли для титрования.", "cb-k-v": "Сколько миллилитров 0,5 Н соляной кислоты ушло на титрование KOH.", "cb-kt": "Поправочный коэффициент раствора кислоты, указан на фиксанале или в паспорте. Обычно 1.", "dil-m": "Вес раствора, который хотите развести, г.", "dil-a": "Крепость раствора сейчас, %.", "dil-b": "Какая крепость нужна, %.", "acid": "Жирная кислота, которую вносите в рецепт.", "acid-w": "Сколько граммов этой кислоты.", "cv-k": "Впишите граммы KOH, чтобы узнать, сколько это NaOH.", "cv-na": "Впишите граммы NaOH, чтобы узнать, сколько это KOH.", "cost-k": "Наценка на мелкие расходы, которые не посчитаны отдельно: электричество, упаковка, брак. 1,1 значит +10%.", "cost-kg": "Сколько килограммов готового мыла получилось.", "cost-packs": "Сколько кусков или упаковок получилось. Нужно для цены за штуку."};
const WEIGH_HELP={'NaOH':'Сколько граммов едкого натра (каустической соды) отвесить на омыление. Уже с поправкой на Кщ и избытком 2%.','KOH':'Сколько граммов едкого кали отвесить на омыление. Уже с поправкой на Кщ и избытком 5%.','Вода на омыление':'Сколько воды взять, чтобы растворить щёлочь и вести омыление. Рассчитано так, чтобы раствор был на 0,5% слабее ПКЭ и масса не высолилась раньше времени.','Соль для подвижности':'Сколько соли (NaCl) приготовить, чтобы масса была однородной и жидкой. Вносят 20%-м раствором: 1 часть соли на 4 части воды.','Щёлочь для подвижности':'Немного щёлочи сверх расчёта, тоже для подвижности массы. Вносят 50%-м раствором: равные части щёлочи и воды.'};
const TERMS={
  'Способ':'Прямой способ: все жиры омыляются вместе, высаливания нет, мыло после омыления разливают в формы. Косвенный: сначала омыляют ядровые жиры, делают высолку, отделяют ядро от щёлока, затем при необходимости второе омыление и шлифование.',
  'Фаза':'Ядровые жиры (говяжий, свиной, пальмовое) дают твёрдое ядро. Клеевые (кокосовое, пальмоядровое, жидкие масла) плохо высаливаются. В прямом способе от этого зависит, сколько соли и щёлочи нужно для подвижности.',
  'ЖК':'Свободные жирные кислоты, например стеариновая или олеиновая. Омыляются сразу и целиком считаются жирными кислотами.',
  'Две щёлочи':'NaOH (каустическая сода) даёт твёрдое мыло, KOH (едкое кали) — мягкое или жидкое. Иногда их смешивают, например 80% NaOH и 20% KOH: мыло получается мягче, пена обильнее, оно лучше растворяется. Если варите только на NaOH, оставьте «Доля NaOH» 100% и этот блок не нужен; для чистого KOH поставьте 0%.',
  'Тип':'«Масло или жир» — обычные масла и жиры (МЖС): из 100 г получается 95 г жирных кислот, остальное уходит в глицерин. «Жирная кислота» — чистые жирные кислоты (ЖК), например стеариновая: из 100 г получается 100 г. Тип ставится сам по названию сырья, но его можно поменять.',
  'МЖС':'Масложировая смесь: обычные (нейтральные) масла и жиры. В жирные кислоты пересчитываются с коэффициентом 0,95, потому что около 5% веса уходит в глицерин.',
  'ЧО':'Число омыления: сколько граммов KOH нужно, чтобы омылить 1 г жира. Для NaOH число делят на 1,403. Пример: говяжий жир 0,200, значит на 100 г нужно 20 г KOH или 14,3 г NaOH.',
  'ПКЭ':'Предельная концентрация электролита при 100 °С: сколько щёлочи или соли может быть в водной фазе, пока мыло ещё не высаливается. Воду считают так, чтобы раствор был на 0,5% слабее ПКЭ. Если у масла нет ПКЭ, впишите его вручную, иначе вода посчитается неверно.',
  'Й':'Йодное число показывает, сколько в жире ненасыщенных кислот. Чем выше, тем мягче мыло и тем быстрее оно прогоркает. Для смеси оптимально до 55.',
  'Титр':'Температура застывания жирных кислот, °С. Чем выше титр, тем твёрже мыло. По ГОСТ для мыла не ниже 35.',
  'Кщ':'Коэффициент щёлочи: поправка на то, что часть щёлочи при хранении превратилась в карбонат и не работает. Определяется титрованием во вкладке «Справочник», там же кнопка подставляет результат в расчёт.',
  'КЧ':'Качественное число: массовая доля жирных кислот в мыле, %. Чем выше, тем меньше воды и тем «плотнее» мыло. По ГОСТ туалетное мыло 74–78%, хозяйственное 64–70,5%. При варке массу обычно держат на 52–58%.',
  'Доля':'Если варите на смеси NaOH и KOH, укажите, какую долю щёлочи даёт NaOH. 100% значит только NaOH, 0% только KOH.',
  'Катализатор':'Спирт (предпочтительнее) или подмыльный клей с прошлых варок без соли. Ускоряет начало омыления. Если вносите клей, впишите его вес и КЧ, они войдут в расчёт жирных кислот.',
  'Дробное':'Щёлочь вносится несколькими порциями. Макс. доза ограничена ПКЭ, чтобы масса не высолилась раньше времени. Первая порция в два раза меньше средней, чтобы омыление пошло мягко.',
  'Подвижность':'Немного соли и щёлочи, чтобы масса была однородной и жидкой, а не стояла колом. Косвенный способ: 1% соли и 0,8% щёлочи от МЖС. Прямой: 1% и 0,8% от ядровых жиров плюс 4% и 3,2% от клеевых.',
  'КЭ':'Концентрация электролитов: сколько щёлочи и соли растворено в водной фазе, %. Водная фаза = масса в котле минус безводное мыло. По КЭ видно, как ведёт себя масса: от «стоит колом» до разделения на ядро и щёлок.',
  'Высолка':'Полная высолка: в массу добавляют соль или щёлочь, пока она не разделится на ядро (мыло сверху) и подмыльный щёлок (снизу). Отстаивать до затвердения ядра или 2–4 часа, щёлок слить через нижний кран.',
  'Шлифование':'КЭ доводят до уровня, при котором масса делится на клей и ядро. Отстаивать при 80–99 °С от 12 до 36 часов. Удачно, если деление произошло, а проба ядра с фенолфталеином бесцветная или чуть розовая.',
  '2-е омыление':'В косвенном способе ядро после полной высолки смешивают с клеевыми жирами (кокосовое, пальмоядровое, жидкие масла) и омыляют ещё раз. Щёлочь считается только на новые жиры, минус остаток щёлочи в ядре, если его определили титрованием. Затем частичная высолка (шлифование) при КЭ около 2,2% в водной фазе: масса делится на туалетное ядро и подмыльный клей.',
  'SF':'Пережир: масло, которое вносят в конце и которое остаётся неомылённым. Учитывается в КЧ готового мыла с коэффициентом 0,95.',
  'ФФ':'Фенолфталеин: проба на свободную щёлочь. Малиновый цвет значит избыток щёлочи. По проценту избытка калькулятор считает, сколько жира добавить для нейтрализации.'
};
function openTerm(t){const s=$('sheet');if(t.startsWith('w:')){$('sheet-t').textContent=t.slice(2);$('sheet-b').textContent=WEIGH_HELP[t.slice(2)]||''}else if(t.startsWith('f:')){const id=t.slice(2),l=document.querySelector(`label[for="${id}"]`);$('sheet-t').textContent=l?l.firstChild.textContent.trim():'';$('sheet-b').textContent=FIELD_HELP[id]||''}else{$('sheet-t').textContent=t==='Способ'?'Способ варки':t;$('sheet-b').textContent=TERMS[t]||''}s.hidden=false;$('sheet-x').focus()}
document.addEventListener('click',e=>{const q=e.target.closest('button.q');if(q&&q.dataset.t){e.preventDefault();openTerm(q.dataset.t)}});
$('sheet-x').onclick=()=>$('sheet').hidden=true;
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('sheet').hidden=true});
$('gloss').innerHTML=Object.entries(TERMS).map(([k,t])=>`<div><dt>${k==='Способ'?'Способ варки':k==='Доля'?'Доля NaOH':k==='Дробное'?'Дробное внесение':k}</dt><dd>${t}</dd></div>`).join('');

// ---------- per-mode instructions ----------
function modeTexts(){
  const ind=S.mode==='indirect';
  $('todo-3').textContent=ind
    ?'Растопите ядровые жиры, влейте воду по расчёту, введите катализатор. Вносите щёлочь полностью или порциями и варите до омыления. Взвесьте массу в котле и следите за концентрацией электролитов.'
    :'Заложите в котёл все жиры по рецепту сразу, ядровые и клеевые. Влейте воду и щёлочь по расчёту, варите до полного омыления. Взвесьте массу и проверьте концентрацию электролитов: масса должна быть однородной и подвижной.';
  $('todo-4').innerHTML=ind
    ?'<p>Полная высолка: добавьте соль или щёлочь по расчёту выше, пока масса не разделится на ядро и подмыльный щёлок. Отстаивайте до затвердения ядра или 2–4 часа и слейте щёлок через нижний кран.</p><p>При гарантированно чистом сырье для хозяйственного мыла можно сразу высолить на 2 фазы, клей и ядро (по сути шлифование). Тогда после удачного деления варка окончена.</p>'
    +(S.params.two?'<p>Затем 2-е омыление: к ядру добавляют клеевые жиры, омыляют и шлифуют. Расчёт ниже, после итога высолки.</p>':'')
    :'<p>В прямом способе высолки нет: после омыления мыло разливают в формы. Этот этап пропускайте.</p><p>Расчёты ниже нужны для мраморного (эшвегерского) мыла, где перед разливом ставят такую концентрацию электролитов, чтобы мыло в форме само разделилось на ядро и клей.</p>';
}

function disp(x){return S.unit==='p'?(S.total?+(x/S.total*100).toFixed(2):0):x}
function setUnit(u){
  if(u==='p'){const s=S.oils.reduce((a,o)=>a+o.fa+o.mzs,0);if(s>0)S.total=+s.toFixed(2);}
  S.unit=u;$('u-g').setAttribute('aria-pressed',u==='g');$('u-p').setAttribute('aria-pressed',u==='p');
  document.querySelectorAll('#oils .u-lab').forEach((e,i)=>e.textContent='Вес'+(u==='p'?', %':', г'));
  $('total').value=S.total||0;renderOils();calc();
}
$('u-g').onclick=()=>setUnit('g');$('u-p').onclick=()=>setUnit('p');
$('total').addEventListener('change',()=>{const t=v('total');if(!(t>0)){$('total').value=S.total;return}
  const old=S.unit==='p'?S.total:S.oils.reduce((a,o)=>a+o.fa+o.mzs,0);
  if(old>0){const f=t/old;S.oils.forEach(o=>{o.fa=+(o.fa*f).toFixed(2);o.mzs=+(o.mzs*f).toFixed(2)});S.adds=S.adds;}
  S.total=t;S.sample=false;renderOils();calc();toast('Рецепт пересчитан на '+nf2.format(t)+' г')});
function boot(){
  S.beg=Object.assign({},BEG_DEF,S.beg||{});
  S.oils=S.oils.map(oilRow);S.adds=S.adds||[];S.params=Object.assign({},SAMPLE.params,S.params||{});
  $('recipe-name').value=S.sample?'':(S.name||'');
  S.unit=S.unit||'g';S.total=S.total||S.oils.reduce((a,o)=>a+o.fa+o.mzs,0);setUnit(S.unit);renderAdds();setParams();setMode(S.mode||'direct',false);updSample();renderSaved();
}
// ---------- новичку ----------
const BEG_DEF={type:'hard',method:'cold',alk:'NaOH',sf:5,pur:100,conc:33,dil:100};
const BEG_PRE={
  hard:{cold:{alk:'NaOH',sf:5,pur:100,conc:33,dil:0},hot:{alk:'NaOH',sf:5,pur:100,conc:30,dil:0}},
  liquid:{cold:{alk:'KOH',sf:3,pur:90,conc:33,dil:100},hot:{alk:'KOH',sf:3,pur:90,conc:30,dil:100}}};
const BEG_NOTE={
  'hard.cold':'Классический способ. Масло и раствор щёлочи смешивают и оставляют созревать. Варить не нужно, но мыло дозревает 4–6 недель.',
  'hard.hot':'Мыло дополнительно проваривают после смешивания. Оно готово раньше (через 1–2 недели), но масса густая и работать с ней нужно быстро.',
  'liquid.cold':'Жидкое мыло на холодном способе получается мягкой пастой и долго созревает. Новичку проще варить его горячим способом.',
  'liquid.hot':'Основной способ для жидкого мыла: пасту проваривают, а затем разводят водой. Нужна щёлочь KOH, чаще всего её чистота около 90%.'};
const BEG_INTRO={
  hard:'Твёрдое мыло варят двумя способами. Холодный: масла смешивают с раствором щёлочи и дают созреть 4–6 недель, варить не нужно. Горячий: массу после смешивания проваривают, и мыло готово через 1–2 недели.',
  liquid:'Жидкое мыло тоже бывает холодным и горячим. Холодный: паста получается мягкой и долго созревает. Горячий: пасту проваривают и разводят водой, этот способ основной и новичкам проще.'};
const BEG_TODO={
 'hard.cold':[
  'Отвесьте масла и воду, щёлочь и раствор по расчёту выше. Всё взвешивайте на весах с точностью до 1 г.',
  'Засыпьте щёлочь в воду (не наоборот) и помешивайте до растворения. Раствор сильно нагреется, дайте ему остыть до 35–45 °C.',
  'Растопите твёрдые масла, смешайте с жидкими и остудите смесь примерно до 35–45 °C.',
  'Тонкой струйкой влейте раствор щёлочи в масла и перемешивайте блендером короткими включениями. Нужен «след»: масса густая, как жидкий пудинг, капля на поверхности оставляет след.',
  'Добавьте отдушку и добавки, быстро перемешайте и разлейте по формам.',
  'Укутайте формы на 24–48 часов. Затем достаньте и нарежьте мыло.',
  'Выдержите куски на воздухе 4–6 недель, переворачивая раз в неделю. После этого мыло готово.'],
 'hard.hot':[
  'Отвесьте масла и воду, щёлочь и раствор по расчёту выше.',
  'Растворите щёлочь в воде (щёлочь в воду) и дайте остыть. Масла растопите в термостойкой посуде.',
  'Влейте раствор в масла и перемешайте блендером до «следа», как в холодном способе.',
  'Поставьте на водяную баню, в духовку на 80–90 °C или в мультиварку на слабый нагрев. Накройте крышкой и помешивайте каждые 15–20 минут.',
  'Варите 1–2 часа: масса сначала вспучится, затем станет похожей на густое картофельное пюре или вазелин, прозрачной на вид. Для проверки возьмите немного массы, растворите в горячей воде: масляные пятна быть не должны. Лучше проверьте индикаторной полоской pH или фенолфталеином: слабое розовое окрашивание допустимо.',
  'Остудите массу примерно до 80 °C, добавьте отдушку и добавки и быстро уложите в форму, плотно утрамбовывая.',
  'Через 12–24 часа нарежьте. Дайте высохнуть 1–2 недели.'],
 'liquid.cold':[
  'Отвесьте масла, воду и KOH по расчёту выше. KOH нагревается сильнее NaOH, работайте осторожно.',
  'Засыпьте KOH в воду (не наоборот), помешайте и остудите до 40–50 °C. Масла подогрейте до 40–50 °C.',
  'Влейте раствор в масла и перемешайте блендером до густой массы-пасты.',
  'Накройте и утеплите на 24–48 часов. Паста останется мягкой и вязкой.',
  'Проверьте готовность индикаторной полоской pH: у готовой пасты она не должна быть выше 10. Если рН выше, подержите пасту ещё несколько дней или проварите.',
  'Растворите пасту в горячей воде в нужной пропорции (см. «Вода на разведение» в расчёте). Оставьте на сутки-двое до полного растворения.',
  'Дайте жидкому мылу отстояться 1–2 недели, при необходимости отфильтруйте. Затем добавьте отдушку и консервант.'],
 'liquid.hot':[
  'Отвесьте масла, воду и KOH по расчёту выше. Особенно аккуратно: KOH сильно греется и «пылит».',
  'Засыпьте KOH в воду (не наоборот) и дайте раствору остыть. Масла нагрейте до 60–70 °C.',
  'Влейте раствор в масла и перемешайте блендером до густой массы-пасты.',
  'Поставьте на водяную баню или в мультиварку на слабый нагрев, накройте крышкой. Помешивайте раз в 15–20 минут и не давайте пасте убегать.',
  'Варите 1,5–3 часа: паста станет тягучей, резиновой и прозрачной, цвета янтаря. Проба: растворите немного пасты в горячей воде. Раствор должен быть прозрачным, без масляных капель. Проверьте pH индикаторной полоской: он должен быть не выше 10.',
  'Растворите пасту в горячей воде по расчёту (см. «Вода на разведение»). Оставьте на сутки-двое до полного растворения.',
  'Дайте мылу отстояться 1–2 недели, при необходимости отфильтруйте. Затем добавьте отдушку и консервант.']};
function begApply(){const b=S.beg,pr=BEG_PRE[b.type][b.method];Object.assign(b,pr);begFill()}
function begFill(){const b=S.beg;b.alk=b.type==='liquid'?'KOH':'NaOH';
  if(curStep!==b.type&&(curStep==='hard'||curStep==='liquid'))go(b.type);
  document.querySelectorAll('[data-bm]').forEach(e=>e.setAttribute('aria-pressed',e.dataset.bm===b.method));
  $('beg-alk').value=b.alk;$('beg-sf').value=b.sf;$('beg-pur').value=b.pur;$('beg-conc').value=b.conc;$('beg-dil').value=b.dil;
  $('beg-title').textContent=b.type==='liquid'?'Жидкое мыло':'Твёрдое мыло';$('beg-intro').textContent=BEG_INTRO[b.type];
  $('beg-note').textContent=BEG_NOTE[b.type+'.'+b.method];
  document.querySelectorAll('.only-liq').forEach(e=>e.hidden=b.type!=='liquid');
  $('beg-todo').innerHTML=BEG_TODO[b.type+'.'+b.method].map(t=>`<li>${t}</li>`).join('');
  begRender()}
document.querySelectorAll('[data-bm]').forEach(e=>e.onclick=()=>{S.beg.method=e.dataset.bm;begApply();persist()});
$('beg-reset').onclick=()=>{begApply();persist();toast('Типовые значения вернулись')};
[['beg-alk','alk'],['beg-sf','sf'],['beg-pur','pur'],['beg-conc','conc'],['beg-dil','dil']].forEach(([id,k])=>$(id).addEventListener('input',()=>{S.beg[k]=k==='alk'?$(id).value:v(id);begRender();persist()}));
function begRender(){
  if(!S||!S.beg||!$('beg-oils'))return;const b=S.beg,na=b.alk==='NaOH';
  const rows=S.oils.map(o=>({n:o.n||'без названия',w:o.fa+o.mzs,sap:o.sap})).filter(r=>r.w>0);
  const lye=r=>na?r.sap/1.403*r.w:r.sap*r.w;
  const W=rows.reduce((a,r)=>a+r.w,0),L0=rows.reduce((a,r)=>a+lye(r),0);
  $('beg-oils').querySelector('tbody').innerHTML=rows.length?rows.map(r=>`<tr><td>${r.n.replace(/</g,'&lt;')}</td><td class="n">${g(r.w)}</td><td class="n">${r.sap}</td><td class="n">${g(lye(r))}</td></tr>`).join(''):'<tr><td colspan="4">В рецепте на шаге 1 пока нет масел с весом.</td></tr>';
  $('beg-oils').querySelector('tfoot').innerHTML=`<tr><td>Итого</td><td class="n">${g(W)}</td><td class="n"></td><td class="n">${g(L0)}</td></tr>`;
  const sf=b.sf,pur=b.pur,c=b.conc;
  const L1=L0*(1-sf/100),L2=pur>0?L1/(pur/100):NaN,Wt=c>0&&c<100?L2*(100-c)/c:NaN,sol=L2+Wt,tot=W+sol,dilW=tot*b.dil/100;
  const f=x=>String(+x.toFixed(2)).replace('.',',');
  $('beg-conc-hint').textContent=c>0&&c<100?`Воды: ${f(100*(100-c)/c)} г на каждые 100 г щёлочи`:'';
  const st=[
   ['Масса масел','сумма весов всех масел',g(W)+' г'],
   ['Щёлочь на полное омыление',na?'Σ (вес × ЧО ÷ 1,403) для каждого масла (ЧО даётся для KOH, для NaOH делим на 1,403)':'Σ (вес × ЧО) для каждого масла',g(L0)+' г'],
   ['Щёлочь с учётом пережира',`${g(L0)} × (1 − ${f(sf)} ÷ 100)`,g(L1)+' г'],
   ['Щёлочи отвесить, с учётом чистоты',`${g(L1)} ÷ (${f(pur)} ÷ 100)`,g(L2)+' г',1],
   ['Воды отвесить для раствора',`щёлочь × (100 − ${f(c)}) ÷ ${f(c)}`,g(Wt)+' г',1],
   ['Вес раствора щёлочи','щёлочь + вода',g(sol)+' г'],
   ['Вес массы мыла',`масла ${g(W)} + раствор ${g(sol)}`,g(tot)+' г']];
  if(b.type==='liquid')st.push(['Воды на разведение пасты',`вес массы × ${f(b.dil)} ÷ 100 (примерно, вес пасты после варки может быть чуть меньше)`,g(dilW)+' г',1]);
  $('beg-steps').querySelector('tbody').innerHTML=st.map((r,i)=>`<tr class="${r[3]?'hl':''}"><td>${i+1}</td><td>${r[0]}</td><td class="how">${r[1]}</td><td class="n">${r[2]}</td></tr>`).join('');
  const w=[];if(!(pur>0))w.push('Чистота щёлочи должна быть больше 0.');if(!(c>0&&c<100))w.push('Крепость раствора укажите от 1 до 99%.');
  if(sf<0||sf>20)w.push('Пережир обычно от 0 до 10%, проверьте значение.');
  if(ok(Wt)&&c>0)w.push(`Вода к щёлочи как ${nf2.format((100-c)/c)} к 1. Чем крепче раствор, тем меньше воды и быстрее схватывается мыло.`);
  $('beg-warn').textContent=w.join(' ')}

S=load();boot();begFill();renderSaved();calcRef();renderCost();calcCost();
try{const t=localStorage.getItem('soap.step');go(t&&document.getElementById('step-'+t)?t:'1')}catch(e){go('1')}
document.querySelectorAll('.vtabs button').forEach(b=>b.onclick=()=>{const v=b.dataset.v;b.parentNode.querySelectorAll('button').forEach(x=>x.setAttribute('aria-selected',x===b));b.closest('.block').querySelectorAll('.vpane').forEach(p=>p.hidden=p.dataset.v!==v)});
</script>
