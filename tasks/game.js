// ===== 核心游戏逻辑 =====

// ===== 状态 =====
var S = {
  orders:[], aid:null, bat:100, batTs:Date.now(), plan:'cnsa',
  origin:'地球（亚洲·海口）', dest:'', transits:[], flt:'all',
  vTs:null, hibMode:null, hibWP:null, hibStart:null, hib:false,
  tick:null, hibTick:null, cart:[],
  user:null, balance:0  // 新增：用户信息和余额
};

function updBat(){
  var b = Math.max(1, S.bat - Math.floor((Date.now()-S.batTs)/180000));
  var t = b>20?'🔋 '+b+'%':'🪫 '+b+'%';
  for(var i=1;i<=15;i++){var el=$('bat'+i);if(el)el.textContent=t;}
}
function updClock(){
  var t = new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  for(var i=1;i<=15;i++){var el=$('st'+i);if(el)el.textContent=t;}
}
setInterval(updBat,30000);updBat();
setInterval(updClock,10000);updClock();


var curPage='page1';
function goPage(id){
  FA('.page').forEach(function(p){p.classList.remove('active');});
  var t=$(id);if(!t)return;
  t.classList.add('active');curPage=id;
  FA('.mobile-tabs button').forEach(function(b){b.classList.toggle('active',b.dataset.page===id);});
  FA('.tb-nav').forEach(function(b){b.classList.toggle('active',b.dataset.page===id);});
  $('mainContent').scrollTop=0;
  if(id==='page2'){renRoute();updatePlanPrices();if(checkTrisolaris()){openEraModal();}}
  if(id==='page5')renOrders();
  if(id==='page10')renMon();
  if(id==='page4')renDetail();
  if(id==='page8')swDest(FA('#page8 .chip')[0],0);
}
FA('.mobile-tabs button').forEach(function(b){b.addEventListener('click',function(){goPage(b.dataset.page);});});


function doConfirm(){
  if(!checkLogin())return;
  closeMod('modalRisk');resetRisk();clearInterval(cdTimer);
  var o=F('.js-origin'),ts=FA('.js-transit'),d=F('.js-dest');
  var origin=o?o.value.trim():'地球（亚洲·海口）';
  var dest=d?d.value.trim():'';
  if(!dest){alert('⚠ 请先在首页搜索栏中设置目的地。');closeMod('modalRisk');return;}
  var transits=[];
  ts.forEach(function(t){if(t.value.trim())transits.push(t.value.trim());});
  S.origin=origin;S.dest=dest;S.transits=transits;
  var pk=S.plan||'cnsa',plan=PLANS[pk];
  var price=calcPrice(pk,dest);
  if(!spend(price,'购买船票：'+origin+' → '+dest))return;
  var oid='XD'+new Date().toISOString().slice(0,10).replace(/-/g,'')+'-'+Math.random().toString(36).slice(2,7).toUpperCase();
  var now=Date.now();
  var order={id:oid,pk:pk,pn:plan.n,price:fmtPrice(price),cabin:plan.c,rad:plan.r,days:plan.d,icon:plan.i,
    origin:origin,destination:dest,transits:transits,createdAt:now,
    departureTime:now+17*86400000,arrivalTime:now+(17+plan.d)*86400000,
    status:'pending',ticketNumber:'ISPT-'+oid.slice(-8),waypoints:buildWP(origin,transits,dest),cwp:0,purchases:[]};
  S.orders.unshift(order);S.aid=order.id;S.vTs=null;S.hib=false;S.hibMode=null;
  saveOrders();updBadges();setTimeout(function(){goPage('page4');},300);
}

function updatePlanPrices(){
  var d=F('.js-dest');var dest=d&&d.value.trim()?d.value.trim():'';if(!dest)return;
  var cards=FA('.plan-card');
  for(var i=0;i<cards.length;i++){
    var c=cards[i],pk=c.dataset.p;
    if(!pk)continue;
    var price=calcPrice(pk,dest);
    var priceEl=c.querySelector('.price');
    if(priceEl)priceEl.textContent=fmtPrice(price);
  }
}


var S_ERA=null; // 用户选择的三体纪元

function boardOrd(oid){
  var order=S.orders.find(function(o){return o.id===oid;});if(!order)return;
  order.status='flying';order.cwp=1;S.aid=oid;S.vTs=Date.now();S.hib=false;S.hibMode=null;
  saveOrders();startTick();renOrders();renDetail();renMon();updBadges();goPage('page10');
}
function cancelOrd(oid){
  if(!confirm('确定取消？'))return;
  var order=S.orders.find(function(o){return o.id===oid;});if(!order)return;
  order.status='cancelled';if(S.aid===oid)S.aid=null;
  saveOrders();stopTick();renOrders();renDetail();renMon();updBadges();
}

function startTick(){stopTick();S.tick=setInterval(function(){if(curPage==='page10')renMonLive();},1000);}
function stopTick(){if(S.tick){clearInterval(S.tick);S.tick=null;}}

function renMonLive(){
  var c=$('monitorContent'),order=S.aid?S.orders.find(function(o){return o.id===S.aid;}):null;
  if(!order||order.status!=='flying'){renMon();return;}
  var wps=order.waypoints||WPS;
  var totalMs=order.arrivalTime-order.departureTime;
  var elapsedReal=Date.now()-(S.vTs||Date.now());
  var displayElapsed=elapsedReal;
  if(S.hib&&S.hibStart){
    var hibElapsed=Date.now()-S.hibStart;
    var preHib=S.hibStart-(S.vTs||Date.now());
    var remainingReal=totalMs-preHib;
    var speed=Math.max(800,remainingReal/Math.max(10000-hibElapsed,100));
    displayElapsed=preHib+hibElapsed*speed;
    var wpWeights=wps.map(function(_,i){return i/Math.max(wps.length-1,1);});
    if(S.hibWP!==null&&displayElapsed>=totalMs*wpWeights[S.hibWP]){
      displayElapsed=totalMs*wpWeights[S.hibWP];
      var arrWP=S.hibWP;
      S.hib=false;S.hibMode=null;S.hibWP=null;S.hibStart=null;
      order.cwp=arrWP;
      if(arrWP>=wps.length-1){order.status='done';saveOrders();stopTick();renOrders();updBadges();}
      showBS('🧊','休眠结束·正在唤醒…',1500,function(){showWakeup(order,arrWP);});
      return;
    }
  }
  var remainingMs=Math.max(0,totalMs-displayElapsed);
  var progress=totalMs>0?Math.min(100,(displayElapsed/totalMs)*100):0;
  var wpIndex=Math.min(Math.floor(progress/100*(wps.length-1)),wps.length-1);
  var cwp=wps[wpIndex];order.cwp=wpIndex;
  var nwpIndex=Math.min(wpIndex+1,wps.length-1);var nwp=wps[nwpIndex];

  var cdHTML='';
  if(remainingMs<=0){
    cdHTML='<div class="countdown-box"><div class="cd-label">🎉 已抵达</div><div class="cd-time">已抵达!</div><div class="cd-sub">'+order.destination+'</div></div>';
    if(order.status==='flying'){order.status='done';saveOrders();stopTick();renOrders();updBadges();}
  }else{
    var d=Math.floor(remainingMs/86400000),h=Math.floor((remainingMs%86400000)/3600000),m=Math.floor((remainingMs%3600000)/60000),s=Math.floor((remainingMs%60000)/1000);
    cdHTML='<div class="countdown-box'+(S.hib?' hibernation-card':'')+'"><div class="cd-label">'+(S.hib?'💤 休眠中':'⏱ 距抵达')+'</div><div class="cd-time">'+d+'d '+String(h).padStart(2,'0')+'h '+String(m).padStart(2,'0')+'m '+String(s).padStart(2,'0')+'s</div><div class="cd-sub">'+order.destination+'</div></div>';
  }
  var speedC=(0.72+progress/100*0.2).toFixed(2);
  var radLevel=(0.5+Math.random()*0.6).toFixed(1);

  var actHTML='';
  if(!S.hib&&remainingMs>0){
    actHTML='<div style="font-size:14px;font-weight:600;color:#fff;margin:16px 0 8px">🕹 航行操作</div><div class="action-menu">'+
    '<div class="act-btn" onclick="initHib(\'full\')"><div class="a-icon">🧊</div><div class="a-info"><div class="a-title">深度休眠·直达目的地</div><div class="a-desc">休眠至'+order.destination+'自动唤醒</div></div></div>'+
    '<div class="act-btn" onclick="initHib(\'next\')"><div class="a-icon">🌙</div><div class="a-info"><div class="a-title">浅度休眠·下一站唤醒</div><div class="a-desc">休眠至'+nwp.n+'唤醒，可观景后继续</div></div></div>'+
    '<div class="act-btn" onclick="S.hib=false;renMonLive()"><div class="a-icon">👁</div><div class="a-info"><div class="a-title">保持清醒·继续观测</div><div class="a-desc">不进入休眠，实时观测航行数据</div></div></div></div>';
  }else if(S.hib&&remainingMs>0){
    actHTML='<div class="hibernation-card" style="margin-top:16px"><div style="font-size:48px;margin-bottom:8px">🧊</div><div style="font-size:16px;font-weight:700;color:#fff">深度休眠中</div><div style="font-size:12px;color:var(--text2);margin-top:4px">生命维持正常</div><div style="display:flex;gap:8px;justify-content:center;margin-top:12px;flex-wrap:wrap"><span style="font-size:11px;color:var(--text3)">🧬 基因锁:激活</span><span style="font-size:11px;color:var(--text3)">💉 营养液:循环</span><span style="font-size:11px;color:var(--text3)">🌡 体温:36.2°C</span></div><button class="btn btn-outline btn-sm" style="margin-top:12px" onclick="emerWake()">⚠ 紧急唤醒</button></div>';
  }
  var commDelay=Math.floor(progress*12000);
  c.innerHTML=cdHTML+
  '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px"><div class="card-title" style="margin-bottom:0">📡 实时监控</div><span class="tag '+(S.hib?'tag-purple':'tag-orange')+'">'+(S.hib?'休眠中':'航行中')+'</span></div>'+
  '<div class="progress-bar" style="margin-bottom:12px"><div class="progress-fill" style="width:'+progress.toFixed(1)+'%"></div></div>'+
  '<div class="data-panel"><div class="di"><div class="dv">'+speedC+'c</div><div class="dl">航速</div></div><div class="di"><div class="dv">'+progress.toFixed(1)+'%</div><div class="dl">进度</div></div><div class="di"><div class="dv">'+radLevel+'μSv</div><div class="dl">辐射</div></div></div></div>'+
  '<div class="location-hero"><div class="loc-bg '+cwp.bg+'"></div><div class="loc-overlay"></div><div class="loc-info"><div class="loc-name">📍 '+cwp.n+'</div><div class="loc-desc">'+cwp.d+'</div></div></div>'+
  '<div class="card"><div class="card-title">📶 通讯</div><div style="color:#fff">延迟: ~'+commDelay+'年 (单向)</div></div>'+
  '<div class="alert-bar alert-info">ℹ 下一站: '+nwp.n+'</div>'+actHTML;
}


function initHib(mode){
  var order=S.aid?S.orders.find(function(o){return o.id===S.aid;}):null;if(!order)return;
  S.hibMode=mode;
  var wps=order.waypoints||WPS;
  var totalMs=order.arrivalTime-order.departureTime;
  var progress=totalMs>0?(Date.now()-(S.vTs||Date.now()))/totalMs:0;
  var cwpi=Math.min(Math.floor(progress*(wps.length-1)),wps.length-1);
  S.hibWP=mode==='full'?wps.length-1:Math.min(cwpi+1,wps.length-1);
  var twp=wps[S.hibWP];
  $('hibTitle').textContent=mode==='full'?'🧊 深度休眠·直达目的地':'🌙 浅度休眠·下一站唤醒';
  $('hibDesc').textContent=mode==='full'?'将在抵达目的地时自动唤醒':'将在抵达'+twp.n+'时自动唤醒';
  $('hibCount').textContent='10';$('hibProg').style.width='0%';
  openMod('modalHibernate');startHibCd(mode);
}
var hibTimer;
function startHibCd(mode){
  var s=10,el=$('hibCount'),prog=$('hibProg');
  clearInterval(hibTimer);
  hibTimer=setInterval(function(){s--;el.textContent=s;prog.style.width=((10-s)*10)+'%';if(s<=3)el.style.color='var(--orange)';
    if(s<=0){clearInterval(hibTimer);finishHib();}},1000);
}
function cancelHib(){clearInterval(hibTimer);closeMod('modalHibernate');S.hibMode=null;S.hibWP=null;}
function finishHib(){
  closeMod('modalHibernate');$('hibCount').style.color='#fff';
  var mode=S.hibMode,order=S.aid?S.orders.find(function(o){return o.id===S.aid;}):null;
  if(mode==='next'&&order){
    var wps=order.waypoints||WPS;
    var totalMs=order.arrivalTime-order.departureTime;
    var progress=totalMs>0?(Date.now()-(S.vTs||Date.now()))/totalMs:0;
    var cwpi=Math.min(Math.floor(progress*(wps.length-1)),wps.length-1);
    var twpi=Math.min(cwpi+1,wps.length-1);
    showBS('🌙','浅度休眠·航行至下一站…',1800,function(){
      var weights=wps.map(function(_,i){return i/Math.max(wps.length-1,1);});
      S.vTs=Date.now()-(weights[twpi]*totalMs);
      S.hib=false;S.hibMode=null;S.hibWP=null;S.hibStart=null;
      order.cwp=twpi;
      if(twpi>=wps.length-1){order.status='done';saveOrders();stopTick();renOrders();updBadges();}
      showWakeup(order,twpi);
    });
    return;
  }
  showBS('🧊','深度休眠启动·直达目的地…',1500,function(){
    S.hib=true;S.hibStart=Date.now();renMonLive();
  });
}
function emerWake(){
  if(!confirm('⚠ 紧急唤醒可能造成身体不适。确定吗？'))return;
  S.hib=false;S.hibMode=null;S.hibWP=null;S.hibStart=null;clearInterval(hibTimer);renMonLive();
}


function showBS(icon,text,dur,cb){
  var bs=$('blackScreen');bs.querySelector('.bs-icon').textContent=icon;$('bsText').textContent=text;
  bs.classList.add('show');
  setTimeout(function(){bs.classList.remove('show');if(cb)setTimeout(cb,400);},dur);
}


function showWakeup(order,wpIndex){
  var wps=order.waypoints||WPS,wp=wps[wpIndex],isFinal=wpIndex>=wps.length-1;
  if(isFinal){
    var oel=F('.js-origin');if(oel)oel.value=wp.n;
    FA('.js-transit').forEach(function(t){t.value='';});var del=F('.js-dest');if(del)del.value='';
    FA('.transit').forEach(function(r){r.remove();});
    S.origin=wp.n;S.dest='';S.transits=[];
  }
  $('wuTitle').textContent=isFinal?'🎉 已抵达目的地！':'🌅 唤醒·已抵达中转站';
  var b='';
  b+='<div class="wakeup-banner" style="margin-bottom:16px"><div style="font-size:48px;margin-bottom:8px">'+(isFinal?'🌌':'🛰')+'</div>';
  b+='<div style="font-size:20px;font-weight:700;color:#fff">'+(isFinal?'欢迎抵达'+wp.n:wp.n)+'</div>';
  b+='<div style="font-size:13px;color:var(--text2);margin-top:4px">'+(isFinal?'航程结束':'休眠唤醒')+'</div></div>';
  b+='<div class="location-hero"><div class="loc-bg '+wp.bg+'"></div><div class="loc-overlay"></div><div class="loc-info"><div class="loc-name">'+wp.n+'</div><div class="loc-desc">'+wp.d+'</div></div></div>';
  if(isFinal){
    var cards=[{ic:'🌌',ti:'欢迎抵达 '+wp.n,de:wp.d,cl:'#a78bfa'},{ic:'🌡',ti:'舱外环境',de:'重力 '+wp.g+'·大气 '+wp.a+'·请穿戴防护服',cl:'#fbbf24'},{ic:'🧳',ti:'行李提取',de:'已配送至传送带·休眠物资同步送达',cl:'#4ade80'},{ic:'⚠️',ti:'单向航行提示',de:'不支持返程·请及时办理本地身份登记',cl:'#f87171'},{ic:'💌',ti:'星际客运寄语',de:'感谢您选择高德星际。您已抵达'+wp.n+'。新的世界等待着您。',cl:'#c084fc'}];
    for(var i=0;i<cards.length;i++){var g=cards[i];b+='<div style="background:rgba(255,255,255,0.04);border-left:3px solid '+g.cl+';border-radius:0 var(--radius-sm) var(--radius-sm) 0;padding:12px 14px;margin-bottom:8px"><div style="display:flex;align-items:center;gap:8px;margin-bottom:3px"><span style="font-size:20px">'+g.ic+'</span><span style="font-weight:600;color:#fff;font-size:14px">'+g.ti+'</span></div><div style="font-size:12px;color:var(--text2);margin-left:28px">'+g.de+'</div></div>';}
    b+='<div style="margin-top:12px"><button class="btn btn-primary btn-block" onclick="closeMod(\'modalWakeup\');goDest(\''+wp.n+'\')">🌍 查看目的地详情</button><button class="btn btn-outline btn-sm btn-block" style="margin-top:6px" onclick="closeMod(\'modalWakeup\');goPage(\'page5\')">📋 订单记录</button></div>';
  }else{
    b+='<div class="alert-bar alert-success">✅ 生命体征正常·唤醒成功</div>';
    b+='<div style="margin-top:12px"><button class="btn btn-outline btn-sm btn-block" style="margin-bottom:6px" onclick="closeMod(\'modalWakeup\');goPage(\'page7\')">🛒 中转站服务</button>';
    b+='<button class="btn btn-nextstop btn-sm btn-block" style="margin-bottom:6px" onclick="closeMod(\'modalWakeup\');initHib(\'next\')">🌙 继续休眠至下一站</button>';
    b+='<button class="btn btn-hibernate btn-sm btn-block" onclick="closeMod(\'modalWakeup\');initHib(\'full\')">🧊 深度休眠直达目的地</button></div>';
  }
  $('wuBody').innerHTML=b;openMod('modalWakeup');renMonLive();
}


function togCart(el){
  var item=el.dataset.item,price=parseInt(el.dataset.price),idx=S.cart.findIndex(function(c){return c.item===item;});
  if(idx>=0){S.cart.splice(idx,1);el.classList.remove('selected');}else{S.cart.push({item:item,price:price});el.classList.add('selected');}
  updCartUI();
}
function updCartUI(){
  var cnt=S.cart.length,total=S.cart.reduce(function(s,c){return s+c.price;},0);
  var badge=$('cartCnt');if(badge){badge.textContent=cnt;badge.style.display=cnt>0?'block':'none';}
  var tel=$('cartTotal');if(tel)tel.textContent='¥'+total.toLocaleString();
  FA('.shop-item').forEach(function(el){var inCart=S.cart.some(function(c){return c.item===el.dataset.item;});if(inCart)el.classList.add('selected');else el.classList.remove('selected');});
}
function showCart(){if(S.cart.length===0){alert('🛒 购物车为空');return;}updCartUI();}
function clearCart(){S.cart=[];FA('.shop-item').forEach(function(el){el.classList.remove('selected');});updCartUI();}
function checkout(){
  if(S.cart.length===0){alert('请先选择物资');return;}
  var total=S.cart.reduce(function(s,c){return s+c.price;},0);
  if(!spend(total,'购买航行物资'))return;
  var items=S.cart.map(function(c){return c.item;}).join('、');
  var order=S.aid?S.orders.find(function(o){return o.id===S.aid;}):null;
  if(order){if(!order.purchases)order.purchases=[];S.cart.forEach(function(c){order.purchases.push({item:'商城:'+c.item,price:'¥'+c.price.toLocaleString()});});}
  alert('✅ 购买成功！\n物资将在下一中转站配送。');clearCart();closeMod('modalShop');
}


function bookLdg(loc,name,price){
  if(confirm('🏨 预订确认\n\n'+loc+'·'+name+'\n'+price+'\n\n确认预订？')){addPurch(loc+'住宿:'+name,price);alert('✅ 预订成功！\n'+name+'\n'+loc);}
}
function addPurch(item,price){
  var order=S.aid?S.orders.find(function(o){return o.id===S.aid;}):null;
  if(order){if(!order.purchases)order.purchases=[];order.purchases.push({item:item,price:price});}
}
function sendMsg(){
  var msg=prompt('📝 输入文字讯息（延迟约120万年抵达）：');
  if(msg)alert('📨 已加入量子中继队列\n预估投递：约1,200,000年\n编号：MSG-'+Date.now().toString(36).toUpperCase());
}
function updBadges(){
  var total=S.orders.filter(function(o){return o.status==='pending'||o.status==='flying';}).length;
  ['bdg1','bdg2'].forEach(function(id){var el=$(id);if(el){if(total>0){el.classList.add('show');el.textContent=total;}else el.classList.remove('show');}});
}


function spend(amount,reason){
  if(S.balance<amount){alert('💸 资金不足！\n\n需要：¥'+amount.toLocaleString()+'\n余额：¥'+S.balance.toLocaleString()+'\n\n'+reason+'\n\n请前往充值中心充值星际信用点。');return false;}
  S.balance-=amount;localStorage.setItem('gdstar_bal',S.balance);updateUserUI();return true;
}


var lastEventProgress=0;
function checkRandomEvent(progress){
  if(progress-lastEventProgress<15)return;
  for(var i=0;i<COSMIC_EVENTS.length;i++){var e=COSMIC_EVENTS[i];if(e.cond(progress)&&Math.random()<0.015){lastEventProgress=progress;$('evtTitle').textContent=e.title;$('evtBody').innerHTML=e.body;openMod('modalEvent');return;}}
}


// ===== 飞船起飞特效 =====
function shipLaunchFX(){
  var fx=document.createElement('div');
  fx.style.cssText='position:fixed;inset:0;z-index:400;background:rgba(255,255,255,0);pointer-events:none;transition:background 0.8s ease';
  document.body.appendChild(fx);
  requestAnimationFrame(function(){fx.style.background='rgba(255,255,255,0.7)';});
  setTimeout(function(){fx.style.background='rgba(255,255,255,0)';},400);
  setTimeout(function(){fx.remove();},1200);
}


// ===== 成就覆盖 =====
var _origDC=doConfirm;doConfirm=function(){_origDC();unlockAch('firstOrder');shipLaunchFX();};
var _origBO=boardOrd;boardOrd=function(oid){_origBO(oid);unlockAch('deepSleep');};
var _origFH=finishHib;finishHib=function(){var mode=S.hibMode;_origFH();if(mode==='full')unlockAch('deepSleep');if(mode==='next')unlockAch('nextStop');};
var _origSW=showWakeup;showWakeup=function(o,i){_origSW(o,i);if(i>=o.waypoints.length-1){var d=o.destination||'';if(d.indexOf('月球')>=0)unlockAch('moonTrip');if(d.indexOf('火星')>=0)unlockAch('marsTrip');if(d.indexOf('翁法罗斯')>=0)unlockAch('omphalos');if(d.indexOf('比邻星')>=0||d.indexOf('三体')>=0)unlockAch('trisolaris');if(d.indexOf('B612')>=0||d.indexOf('小王子')>=0)unlockAch('b612');setTimeout(function(){showShareCard();},3000);}};
var _origRM=renMonLive;renMonLive=function(){_origRM();var o=S.aid?S.orders.find(function(od){return od.id===S.aid;}):null;if(o&&o.status==='flying'){var tm=o.arrivalTime-o.departureTime;var p=tm>0?((Date.now()-(S.vTs||Date.now()))/tm*100):0;checkRandomEvent(p);}};
