// ===== UI 交互 & 页面初始化 =====

// ===== 工具函数 =====
function F(e){return document.querySelector(e);}
function FA(e){return document.querySelectorAll(e);}
function $(id){return document.getElementById(id);}

// ===== 弹窗 =====
function openMod(id){$(id).classList.add('show');document.body.style.overflow='hidden';
  if(id==='modalRisk'){
    var dd=F('.js-dest');if(!dd||!dd.value.trim())return;
    resetRisk();startCd();
    var o=F('.js-origin'),d=F('.js-dest');
    var ol=o?o.value.trim()||'地球（亚洲·海口）':'地球';
    var dl=d&&d.value.trim()?d.value.trim():'';
    if(dl){$('riskRouteLabel').textContent='航线：'+ol+' → '+dl+'（单向·超远距离）';}
    else{$('riskRouteLabel').textContent='航线：请先在首页设置目的地';}
    // 动态计算通讯延迟
    var delayNum='数十至数百万',delayLoc=dl;
    if(dl.indexOf('火星')>=0){delayNum='3—22分钟';delayLoc='火星';}
    else if(dl.indexOf('月球')>=0){delayNum='1.3秒';delayLoc='月球';}
    else if(dl.indexOf('谷神星')>=0){delayNum='15—40分钟';delayLoc='谷神星';}
    else if(dl.indexOf('太阳系')>=0||dl.indexOf('跃迁')>=0){delayNum='6—8小时';delayLoc='太阳系边缘';}
    else if(dl.indexOf('半人马')>=0||dl.indexOf('α')>=0){delayNum='4.37';delayLoc='半人马座α星';}
    else if(dl.indexOf('天狼星')>=0){delayNum='8.6';delayLoc='天狼星';}
    else if(dl.indexOf('巴纳德')>=0){delayNum='6';delayLoc='巴纳德星';}
    else if(dl.indexOf('罗斯128')>=0){delayNum='11';delayLoc='罗斯128';}
    else if(dl.indexOf('格利泽')>=0){delayNum='20';delayLoc='格利泽581';}
    else if(dl.indexOf('大麦哲伦')>=0){delayNum='16.3万';delayLoc='大麦哲伦云';}
    else if(dl.indexOf('仙女座')>=0||dl.indexOf('M31')>=0){delayNum='254万';delayLoc='仙女座M31';}
    else if(dl.indexOf('比邻星')>=0||dl.indexOf('三体')>=0){delayNum='4.24';delayLoc='比邻星';}
    else if(dl.indexOf('翁法罗斯')>=0){delayNum='未知';delayLoc='忆庭之镜通道';}
    else if(dl.indexOf('B621')>=0||dl.indexOf('b621')>=0||dl.indexOf('小王子')>=0){delayNum='—';delayLoc='用心聆听即可';}
    $('riskDelay').textContent=delayNum;$('riskDelayLoc').textContent=delayLoc;
  }
  if(id==='modalShop')updCartUI();
}
function closeMod(id){$(id).classList.remove('show');document.body.style.overflow='';}
FA('.modal-overlay').forEach(function(o){o.addEventListener('click',function(e){if(e.target===o&&o.id!=='modalHibernate'&&o.id!=='modalWakeup')closeMod(o.id);});});


function selTopt(el){FA('.topt').forEach(function(o){o.classList.remove('active');});el.classList.add('active');}
function selPlan(el){FA('.plan-card').forEach(function(c){c.classList.remove('sel');});el.classList.add('sel');S.plan=el.dataset.p;}
function addTransit(){
  var c=$('searchPoints'),btn=$('addTransitBtn'),r=document.createElement('div');
  r.className='sp-row transit';
  r.innerHTML='<div class="sp-dot transit"></div><div class="sp-input"><input type="text" placeholder="途经点" value="" class="js-transit"></div><button class="sp-del" onclick="this.parentElement.remove()">✕</button>';
  c.insertBefore(r,btn);r.querySelector('input').focus();
}

// 候选地点点击
FA('.candidates-scroll .chip').forEach(function(ch){
  ch.addEventListener('click',function(){
    var txt=this.textContent.trim();
    var o=F('.js-origin'),ts=FA('.js-transit'),d=F('.js-dest');
    if(o&&!o.value){o.value=txt;return;}
    for(var i=0;i<ts.length;i++){if(!ts[i].value){ts[i].value=txt;return;}}
    if(d&&!d.value){d.value=txt;return;}
    if(d)d.value=txt;
  });
});


var cdTimer;
function resetRisk(){FA('.riskcb').forEach(function(c){c.checked=false;});$('cd').textContent='10';$('btnRisk').disabled=true;$('btnRisk').style.opacity='0.5';}
function closeRisk(){resetRisk();clearInterval(cdTimer);closeMod('modalRisk');}
function startCd(){
  var s=10,el=$('cd'),btn=$('btnRisk');
  btn.disabled=true;btn.style.opacity='0.5';el.textContent=s;
  clearInterval(cdTimer);
  cdTimer=setInterval(function(){s--;el.textContent=s;if(s<=0){clearInterval(cdTimer);btn.disabled=false;btn.style.opacity='1';el.textContent='就绪';}},1000);
}

function renRoute(){
  var o=F('.js-origin'),ts=FA('.js-transit'),d=F('.js-dest');
  var origin=o&&o.value.trim()?o.value.trim():'';
  var dest=d&&d.value.trim()?d.value.trim():'';
  var p2=$('page2');
  // 获取page2的所有直接子元素
  var children=p2.children;
  if(!dest){
    var rv=p2.querySelector('.route-visual');
    if(rv)rv.innerHTML='<div style="text-align:center;padding:40px 20px;color:var(--text2)"><div style="font-size:40px;margin-bottom:12px">🗺</div><div style="font-size:15px;color:#fff;margin-bottom:8px">请先设置目的地</div><div style="font-size:13px">返回首页，在搜索栏中选择出发地和目的地后再进入航线页。</div><button class="btn btn-primary btn-sm" style="margin-top:16px" onclick="goPage(\'page1\')">🔍 返回首页搜索</button></div>';
    // 隐藏除了status-bar以外的所有子元素
    for(var i=0;i<children.length;i++){
      var el=children[i];
      if(el.classList.contains('status-bar'))continue;
      if(el.querySelector('.route-visual'))continue;
      el.style.display='none';
    }
    return;
  }
  // 恢复显示所有子元素
  for(var i=0;i<children.length;i++)children[i].style.display='';

  if(!origin)origin='地球（亚洲·海口）';
  var transits=[];ts.forEach(function(t){if(t.value.trim())transits.push(t.value.trim());});
  var wps=buildWP(origin,transits,dest);
  var rv=p2.querySelector('.route-visual');if(!rv)return;
  var h='<div class="route-line"></div>';
  for(var i=0;i<wps.length;i++){
    var cls=i===0?'start':(i===wps.length-1?'end':'');
    h+='<div class="rn '+cls+'"><div class="r-name">'+(i===0?'🌍 ':'')+wps[i].n+'</div><div class="r-info">'+wps[i].d+'</div></div>';
  }
  rv.innerHTML=h;
}


function checkTrisolaris(){
  var o=F('.js-origin'),ts=FA('.js-transit'),d=F('.js-dest');
  var hasCentauri=false,hasProxima=false;
  ts.forEach(function(t){var v=t.value.trim();if(v.indexOf('半人马')>=0||v.indexOf('α')>=0)hasCentauri=true;});
  var dv=d?d.value.trim():'';if(dv.indexOf('比邻')>=0||dv.indexOf('三体')>=0)hasProxima=true;
  // 也检查直接输入三体的情况
  if(!hasProxima&&dv.indexOf('三体')>=0)hasProxima=true;
  var ov=o?o.value.trim():'';if(ov.indexOf('三体')>=0){hasProxima=true;if(d)d.value='比邻星·三体世界';}
  return hasProxima;
}

function openEraModal(){
  var h='';
  for(var i=0;i<ERA_DATA.length;i++){
    var e=ERA_DATA[i];
    h+='<div class="act-btn" onclick="selectEra(\''+e.id+'\')" style="border-left:3px solid '+e.color+'">';
    h+='<div class="a-icon">'+e.icon+'</div>';
    h+='<div class="a-info"><div class="a-title" style="color:'+e.color+'">'+e.name+'</div>';
    h+='<div class="a-desc">'+e.year+'</div></div><div class="a-arrow">›</div></div>';
  }
  $('eraOptions').innerHTML=h;openMod('modalEra');
}

function selectEra(eraId){
  S_ERA=eraId;closeMod('modalEra');
  var era=null;for(var i=0;i<ERA_DATA.length;i++){if(ERA_DATA[i].id===eraId){era=ERA_DATA[i];break;}}
  if(era)alert('✅ 已选择目标纪元：'+era.name+'\n'+era.year+'\n\n航线已锁定。请继续选择飞船方案并确认风险协议。');
}

function swDestTrisolaris(){
  goPage('page8');FA('#page8 .chip').forEach(function(c){c.style.display='none';});
  var eraObj=null;
  if(S_ERA){for(var i=0;i<ERA_DATA.length;i++){if(ERA_DATA[i].id===S_ERA){eraObj=ERA_DATA[i];break;}}}
  if(!eraObj){for(var i=0;i<ERA_DATA.length;i++){if(ERA_DATA[i].id==='deterrence'){eraObj=ERA_DATA[i];break;}}}
  var e=eraObj||ERA_DATA[1];
  var h='';
  h+='<div class="location-hero"><div class="loc-bg bg-proxima"></div><div class="loc-overlay"></div><div class="loc-info"><div class="loc-name">🔴 比邻星 · 三体世界</div><div class="loc-desc">半人马座α · 红矮星 · 距地球4.24光年</div></div></div>';
  h+='<div class="alert-bar" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#fcd34d">⚠ 你正在查看的是<b>'+e.name+'</b>（'+e.year+'）时间线上的三体世界。切换纪元请返回航线页重新选择中转站与目的地。</div>';
  h+='<div class="card"><div class="card-title" style="color:'+e.color+'">'+e.icon+' '+e.name+' · '+e.year+'</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">'+e.desc+'</div></div>';
  h+='<div class="card"><div class="card-title">📖 关键场景</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8;font-style:italic">「'+e.scene+'」</div></div>';
  h+='<div class="card"><div class="card-title">🔭 恒星系统</div><div class="g2">';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">主星</div><div style="color:#fff;font-weight:600;font-size:13px">比邻星·M5V红矮星</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">距离地球</div><div style="color:#fff;font-weight:600;font-size:13px">4.24光年</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">三星系统</div><div style="color:#fff;font-weight:600;font-size:13px">南门二A/B+比邻星</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">行星轨道</div><div style="color:#fff;font-weight:600;font-size:13px">混沌·不可预测</div></div>';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">💡 三体文明关键词</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='<b style="color:#fcd34d">脱水（Dehydrate）</b> — 乱纪元来临时将身体脱水为干纤维，恒纪元泡水复活。文明毁灭了二百多次，这是三体人活下来的唯一方式。<br>';
  h+='<b style="color:#fcd34d">思维透明</b> — 三体人用脑电波直接交流，不存在「谎言」和「欺骗」。他们对人类的「计谋」感到恐惧。<br>';
  h+='<b style="color:#fcd34d">智子（Sophon）</b> — 将质子二维展开、刻上电路、折叠回去。量子超级计算机。锁死了人类的基础科学。<br>';
  h+='<b style="color:#fcd34d">水滴（Droplet）</b> — 强互作用力材料。绝对光滑。零摩擦。一枚消灭了两千艘恒星级战舰。<br>';
  h+='<b style="color:#fcd34d">黑暗森林</b> — 宇宙就是一座黑暗森林。每个文明都是带枪的猎人。一旦暴露——消灭。';
  h+='</div></div>';
  h+='<div class="alert-bar" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#fcd34d">⚠ 三体世界在广播纪元已被光粒摧毁。你正在访问的是一个时空切片——一段被引力波记录封存的文明记忆。高德星际不对时间悖论负责。如果你在这里收到了来自过去的讯息——「不要回答」。</div>';
  h+='<div style="text-align:center;margin-top:8px"><button class="btn btn-outline btn-sm" onclick="FA(\'#page8 .chip\').forEach(function(c){c.style.display=\'\';});swDest(FA(\'#page8 .chip\')[0],0);">🔙 返回普通目的地</button></div>';
  $('destContent').innerHTML=h;
}

function swDestB621(){
  goPage('page8');FA('#page8 .chip').forEach(function(c){c.style.display='none';});
  var h='';
  h+='<div class="location-hero"><div class="loc-bg bg-b621"></div><div class="loc-overlay"></div><div class="loc-info"><div class="loc-name">🌹 B621星云 · 小王子的故乡</div><div class="loc-desc">「如果你在下午四点来，从三点开始我就感到幸福。」</div></div></div>';
  h+='<div class="alert-bar" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#fcd34d;font-size:14px;text-align:center">✨ 你不应该在这里。B621不在任何星图上。但如果你执意要去——请记住：<b>重要的东西是眼睛看不见的。</b></div>';
  h+='<div class="card"><div class="card-title">📖 《小王子》· 作者</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='<b style="color:#fcd34d">安托万·德·圣埃克苏佩里</b>（Antoine de Saint-Exupéry，1900—1944）——法国作家、飞行员。<br><br>';
  h+='1943年，《小王子》在纽约以法语和英语同时出版。圣埃克苏佩里于1944年7月31日执行侦察任务时失踪，飞机残骸直到2004年才在马赛附近海域被发现。他像小王子一样，去了一个我们找不到的地方。<br><br>';
  h+='这本书被翻译成超过500种语言，全球销量超过2亿册——是仅次于《圣经》的畅销书。';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🪐 小行星B-612</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='<b style="color:#fcd34d">B-612</b>是小王子的家——位于B621星云边缘的一颗小行星。1909年由一位土耳其天文学家首次观测到，但因为他穿着传统土耳其服装，没有人相信他的发现。直到他换上西装再次发表，国际天文学界才承认了B-612的存在。<br><br>';
  h+='星球上有：<br>';
  h+='🌋 <b style="color:#f87171">三座火山</b>——两座活火山，一座死火山。小王子每天清扫它们，因为「火山喷发就像烟囱冒烟」。<br>';
  h+='🌳 <b style="color:#4ade80">猴面包树</b>——如果不及时拔除，它们的根会撑裂整个星球。小王子每天早上仔细检查每一株幼苗。<br>';
  h+='🌹 <b style="color:#f87171">一朵玫瑰</b>——独一无二的玫瑰。她告诉小王子她是全宇宙唯一的一朵。后来小王子在地球上看到了五千朵一模一样的玫瑰——但他明白了：<b style="color:#fcd34d">「正是你为玫瑰花费的时间，才使你的玫瑰变得如此重要。」</b>';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🦊 狐狸与驯服</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='小王子在地球上遇到了一只狐狸。<br><br>';
  h+='狐狸说：「驯服」就是建立联系——「对我来说，你还只是一个小男孩，和十万个别的小男孩没什么两样。我不需要你，你也不需要我。对你来说，我只是一只狐狸，和十万只别的狐狸一样。但如果你驯服了我——<b style="color:#fcd34d">我们就会彼此需要。你对我来说是独一无二的，我对你来说也是独一无二的。</b>」<br><br>';
  h+='狐狸教给小王子一个秘密——<b style="color:#fcd34d">「只有用心才能看清。重要的东西，用眼睛是看不见的。」</b><br><br>';
  h+='小王子驯服了狐狸。然后他必须离开。狐狸哭了。但狐狸说：「我不后悔。因为麦田的颜色会让我想起你的头发。」';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🌅 四十四次日落</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='「有一天，」小王子说，「我看了四十四次日落。」<br><br>';
  h+='在这个星球上，太阳落得很快——你只需要把椅子挪几步，就能看到一场新的日落。「当一个人非常悲伤的时候，他就喜欢看日落。」<br><br>';
  h+='在B621星云，每隔4分钟就有一场日落。永远有四十四次日落等着你——和一次日出。';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🐍 离开的方式</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='小王子来到地球整整一年后，在沙漠中遇到了一条金黄的蛇。蛇说它能送人回他来的地方。小王子同意被蛇咬——<b style="color:#fcd34d">他的身体太沉重了，他需要摆脱它才能回到自己的星球</b>。<br><br>';
  h+='第二天早上，飞行员在沙漠中找到了小王子的身体——但它是空的。小王子回到了B-612，回到了他的玫瑰身边。他走的时候没有发出任何声音。因为那只是外壳。<br><br>';
  h+='「当你在夜晚仰望星空时，因为我就住在其中一颗星星上，因为我在那颗星星上笑——对你来说，就好像所有的星星都在笑。」';
  h+='</div></div>';
  h+='<div class="alert-bar" style="background:rgba(168,120,220,0.15);border:1px solid rgba(168,120,220,0.4);color:#c4b5fd">🌹 B621星云不在任何天体物理目录中。它只存在于那些「用心去看」的人的星图里。如果你真的想找到它——试着在夜晚仰望。如果你听到星星在笑，你就找对了方向。高德星际无法提供前往B621的航线。本页面只是……一个提醒。</div>';
  h+='<div style="text-align:center;margin-top:8px"><button class="btn btn-outline btn-sm" onclick="FA(\'#page8 .chip\').forEach(function(c){c.style.display=\'\';});swDest(FA(\'#page8 .chip\')[0],0);">🔙 返回普通目的地</button></div>';
  $('destContent').innerHTML=h;
}

function renDetail(){
  var c=$('orderDetail'),order=S.aid?S.orders.find(function(o){return o.id===S.aid;}):null;
  if(!order){c.innerHTML='<div class="empty-state"><div class="ei">📭</div><div class="et">暂无订单</div><div class="ed">请先在航线页面选择方案并确认风险协议</div></div>';return;}
  var fd=function(d){return new Date(d).toISOString().slice(0,10);};
  var wh='';
  order.waypoints.forEach(function(wp,i){
    var cls=i===0?'done':(i===order.cwp&&order.status==='flying'?'done':'');
    wh+='<div class="ti '+cls+'"><div class="t-time">'+wp.d+'</div><div class="t-title">'+wp.n+'</div></div>';
  });
  var ph='';
  if(order.purchases&&order.purchases.length>0){
    ph='<div class="card"><div class="card-title">🛒 已购附加服务</div>';
    order.purchases.forEach(function(p){ph+='<div class="card-row"><span class="card-label">'+p.item+'</span><span class="card-value">'+p.price+'</span></div>';});
    ph+='</div>';
  }
  var stText=order.status==='flying'?'航行中':'待登船';
  c.innerHTML='<div class="card" style="text-align:center"><div class="success-badge"><svg viewBox="0 0 32 32" width="32" height="32"><polyline points="6,16 14,24 26,8" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/></svg></div><div style="font-size:20px;font-weight:700;color:#fff;margin-bottom:4px">支付成功</div><div style="font-size:13px;color:var(--text2)">订单已确认·'+stText+'</div></div>'+
  '<div class="card"><div class="card-title">📋 订单详情</div><div class="card-row"><span class="card-label">订单编号</span><span class="card-value">'+order.id+'</span></div><div class="card-row"><span class="card-label">金额</span><span class="card-value" style="color:var(--blue);font-weight:700">'+order.price+'</span></div><div class="card-row"><span class="card-label">状态</span><span class="card-value"><span class="tag tag-green">已出票</span></span></div><div class="card-row"><span class="card-label">舱位</span><span class="card-value">'+order.cabin+'·'+order.pn+'</span></div><div class="card-row"><span class="card-label">通行证</span><span class="card-value">'+order.ticketNumber+'</span></div></div>'+
  '<div class="card"><div class="card-title">⏱ 行程</div>'+wh+'</div>'+
  '<div class="card"><div class="card-title">🎫 舱位信息</div><div class="card-row"><span class="card-label">休眠</span><span class="card-value">全程90%</span></div><div class="card-row"><span class="card-label">行李</span><span class="card-value">150kg</span></div><div class="card-row"><span class="card-label">辐射防护</span><span class="card-value">'+order.rad+'</span></div></div>'+ph;
}

function renOrders(){
  var c=$('ordersContainer'),orders=S.orders;
  if(S.flt!=='all')orders=orders.filter(function(o){return o.status===S.flt;});
  if(orders.length===0){c.innerHTML='<div class="empty-state"><div class="ei">📭</div><div class="et">暂无订单</div><div class="ed">去首页搜索航线，选择方案并确认协议即可下单</div></div>';return;}
  c.innerHTML='';
  orders.forEach(function(order){
    var sm={pending:['待登船','tag-blue'],flying:['航行中','tag-orange'],done:['已完成','tag-green'],cancelled:['已取消','tag-gray']};
    var st=sm[order.status]||['未知','tag-gray'];
    var as=new Date(order.arrivalTime).toISOString().slice(0,10);
    var ds=new Date(order.departureTime).toISOString().slice(0,10);
    var acts='';
    if(order.status==='pending')acts='<button class="btn btn-outline btn-sm" onclick="boardOrd(\''+order.id+'\')">🚀 登船</button> <button class="btn btn-outline btn-sm" onclick="cancelOrd(\''+order.id+'\')">取消</button>';
    else if(order.status==='flying')acts='<button class="btn btn-outline btn-sm" onclick="S.aid=\''+order.id+'\';goPage(\'page10\')">📡 监控</button>';
    var card=document.createElement('div');card.className='card';
    card.innerHTML='<div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px"><div><div style="font-weight:600;color:#fff">'+order.icon+' '+order.origin+'→'+order.destination+'</div><div style="font-size:12px;color:var(--text2)">'+order.pn+'·'+order.cabin+'</div></div><span class="tag '+st[1]+'">'+st[0]+'</span></div>'+
    '<div class="card-row"><span class="card-label">出发</span><span class="card-value">'+ds+'</span></div><div class="card-row"><span class="card-label">抵达</span><span class="card-value">'+as+'</span></div>'+
    '<div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">'+acts+' <button class="btn btn-outline btn-sm" onclick="S.aid=\''+order.id+'\';goPage(\'page4\')">详情</button></div>';
    c.appendChild(card);
  });
}

function fltOrders(el,f){S.flt=f;FA('#page5 .chip').forEach(function(c){c.classList.remove('active');});el.classList.add('active');renOrders();}


function renMon(){
  var c=$('monitorContent'),order=S.aid?S.orders.find(function(o){return o.id===S.aid;}):null;
  if(!order||order.status!=='flying'){
    c.innerHTML='<div class="empty-state"><div class="ei">📡</div><div class="et">无航行中航班</div><div class="ed">'+(S.orders.some(function(o){return o.status==='pending';})?'有待登船订单，请前往订单页点击「登船」':'暂无订单')+'</div>'+(S.orders.some(function(o){return o.status==='pending';})?'<button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="goPage(\'page5\')">📋 查看订单</button>':'')+'</div>';
    stopTick();return;
  }
  if(!S.tick)startTick();renMonLive();
}

function swDest(el,idx){
  FA('#page8 .chip').forEach(function(c){c.classList.remove('active');});el.classList.add('active');
  var all=[
    {wp:{n:'月球静海中转港',t:'moon',d:'人类首个地外中转枢纽·低重力·全年运营',bg:'bg-moon',g:'0.16G',a:'真空·需供氧',dl:'27.3天',nt:'无'},pi:'1.2x',ox:'进口·管道输送',im:'2-3x·依赖地球补给',sp:'🏙 静海基地·人类首个月球定居点<br>🌑 环形山徒步·哥白尼环形山<br>🔭 月球天文台·无大气干扰观测<br>🛍 低重力商业街·月球特产',tp:'需穿戴太空服·低重力注意防飘·温差极大(-173°C~127°C)'},
    {wp:WPS[2],pi:'2.5x',ox:'进口·需供氧',im:'4-6x·依赖地球补给',sp:'🏔 奥林匹斯山·太阳系最高峰(21km)<br>🏜 水手号峡谷·4000km大裂谷<br>🏙 火星穹顶城·最大地外城市<br>🔬 火星科研站·外星生命探索',tp:'需穿戴火星防护服·注意沙尘暴·CO₂环境不可暴露皮肤'},
    {wp:{n:'谷神星补给站',t:'jump',d:'小行星带最大天体·星际航行补给枢纽',bg:'bg-ceres',g:'0.03G',a:'真空·需供氧',dl:'9h',nt:'无'},pi:'1.5x',ox:'进口·限量供应',im:'3-4x·主要靠中转补给',sp:'🛰 小行星带全景观测<br>⛏ 冰矿开采区参观<br>🚀 星际舰队维修坞<br>💧 水资源加工厂',tp:'微重力环境·需磁力鞋·水资源珍贵·勿浪费'},
    {wp:WPS[3],pi:'1.8x',ox:'人工·自循环',im:'2-3x·跃迁补给线',sp:'⚡ 跃迁引擎观测台·科技奇观<br>🛸 星际舰队集结点<br>🏨 跃迁前休整酒店<br>🔬 前沿物理实验室',tp:'跃迁期间注意能量波动·人工重力区外需防护·通讯延迟开始显著'},
    {wp:WPS[4],pi:'1.5x',ox:'本地自给·N₂-O₂',im:'2-3x·定期补给舰',sp:'🌅 双恒星日落·宇宙级奇观<br>🏔 普罗米修斯晶体山脉<br>🌊 液态氨湖泊·化学海洋<br>🏛 人类首个系外殖民地遗址',tp:'双恒星辐射较强·SPF200+防晒·潮汐力影响注意'},
    {wp:{n:'天狼星殖民地',t:'centauri',d:'8.6光年·夜空中最亮的恒星系',bg:'bg-sirius',g:'1.05G',a:'N₂-O₂·宜居',dl:'30h',nt:'无'},pi:'1.6x',ox:'本地自给',im:'2-3x',sp:'🌟 天狼星A/B双星系统观测<br>🏙 亮星城·殖民地首府<br>🌌 冬季银河全景<br>🔭 天狼星天文台',tp:'天狼星A亮度极高·注意护目·宜居行星潮汐锁定·选对半球居住'},
    {wp:{n:'大麦哲伦云前哨',t:'jump',d:'16.3万光年·河外前哨基地',bg:'bg-jump',g:'0.85G',a:'稀薄·需供氧',dl:'22h',nt:'原始细菌群落'},pi:'3.0x',ox:'稀薄·需供氧设备',im:'5-8x·补给舰每2年一次',sp:'🌌 银河系全景·最佳河外观测点<br>💫 星云内部探索·活体星云<br>🏚 废弃前哨遗址·早期遗迹<br>🔭 深空天文台·宇宙学前沿',tp:'极度偏远·补给2年一次·通讯延迟16万年·需完全自给'},
    {wp:WPS[5],pi:'1.8x',ox:'本地自给',im:'3-5x·依赖母星补给',sp:'🌟 仙女座大旋臂·最佳银河视角<br>🏔 M31中央星团·古老恒星区<br>🌊 液态甲烷湖·独特地貌<br>🛸 河外殖民地遗址·历史纪念',tp:'需M31标准防护服·注意微生物·通讯仅限站内中继'},
    {wp:{n:'巴纳德星中转站',t:'jump',d:'6光年·距离太阳系第二近的恒星系',bg:'bg-barnard',g:'0.7G',a:'人工·N₂-O₂',dl:'25h',nt:'无'},pi:'1.4x',ox:'人工循环',im:'2-3x',sp:'🔭 红矮星观测站<br>🛰 深空中转枢纽<br>🌑 冰质行星探索<br>🏨 长途旅客休整站',tp:'红矮星辐射弱·相对安全·作为跃迁前最后一站较受欢迎'},
    {wp:{n:'罗斯128殖民地',t:'jump',d:'11光年·红矮星宜居带殖民地',bg:'bg-ross',g:'0.85G',a:'人工·N₂-O₂',dl:'22h',nt:'无'},pi:'1.5x',ox:'人工·自循环',im:'2-4x',sp:'🌺 红矮星植物园·独特光谱花卉<br>🏙 地下生态城市<br>🔬 红矮星生命研究站<br>🌌 南天星座全景',tp:'红矮星耀斑偶发·注意预警·地下城恒温舒适'},
    {wp:{n:'格利泽581宜居站',t:'jump',d:'20光年·著名宜居带空间站',bg:'bg-gliese',g:'0.95G',a:'N₂-O₂·接近地球',dl:'26h',nt:'无'},pi:'1.3x',ox:'本地自给·N₂-O₂',im:'2-3x',sp:'🌍 类地行星表面探索<br>🌊 疑似液态水海洋观测<br>🏙 宜居站穹顶生态圈<br>🔬 外星生物学研究中心',tp:'最接近地球环境的系外站点·适合长期停留·注意未知微生物'}
  ];
  var d=all[idx]||all[7],wp=d.wp;
  var h='';
  h+='<div class="location-hero"><div class="loc-bg '+wp.bg+'"></div><div class="loc-overlay"></div><div class="loc-info"><div class="loc-name">'+wp.n+'</div><div class="loc-desc">'+wp.d+'</div></div></div>';
  h+='<div class="card"><div class="card-title">📐 环境</div><div class="g2">';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">重力</div><div style="color:#fff;font-weight:600;font-size:13px">'+(wp.g||'?')+'</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">大气</div><div style="color:#fff;font-weight:600;font-size:13px">'+(wp.a||'?')+'</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">日长</div><div style="color:#fff;font-weight:600;font-size:13px">'+(wp.dl||'?')+'</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">原住民</div><div style="color:#fff;font-weight:600;font-size:13px">'+(wp.nt||'无')+'</div></div>';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">💰 物价</div><div class="card-row"><span class="card-label">物资指数</span><span class="card-value">'+d.pi+'</span></div><div class="card-row"><span class="card-label">氧气/水</span><span class="card-value">'+d.ox+'</span></div><div class="card-row"><span class="card-label">进口</span><span class="card-value">'+d.im+'</span></div></div>';
  h+='<div class="card"><div class="card-title">🏞 观光</div><div style="font-size:13px;color:var(--text2);line-height:1.8">'+d.sp+'</div></div>';
  h+='<div class="alert-bar alert-info">ℹ '+d.tp+'</div>';
  $('destContent').innerHTML=h;
}

// 跳到目的地页并匹配对应标签
function goDest(name){
  if(name.indexOf('翁法罗斯')>=0){swDestOmphalos();return;}
  if(name.indexOf('比邻星')>=0||name.indexOf('三体')>=0){swDestTrisolaris();return;}
  if(name.indexOf('B621')>=0||name.indexOf('b621')>=0||name.indexOf('B-612')>=0||name.indexOf('B612')>=0||name.indexOf('小王子')>=0){swDestB612();return;}
  var tabs=FA('#page8 .chip'),found=7; // 默认仙女座
  var map=[
    {k:'月球',i:0},{k:'火星',i:1},{k:'谷神',i:2},{k:'跃迁',i:3},{k:'半人马',i:4},
    {k:'天狼',i:5},{k:'大麦哲伦',i:6},{k:'仙女',i:7},{k:'巴纳德',i:8},{k:'罗斯128',i:9},{k:'格利泽',i:10}
  ];
  for(var i=0;i<map.length;i++){if(name.indexOf(map[i].k)>=0){found=map[i].i;break;}}
  goPage('page8');swDest(tabs[found],found);
}

function swDestB612(){
  goPage('page8');FA('#page8 .chip').forEach(function(c){c.style.display='none';});
  var h='';
  h+='<div class="location-hero"><div class="loc-bg bg-b621"></div><div class="loc-overlay"></div><div class="loc-info"><div class="loc-name">🌹 B-612 · 小王子的星球</div><div class="loc-desc">Astéroïde B-612 — 1909年土耳其天文学家观测到的一颗小行星</div></div></div>';
  h+='<div class="alert-bar" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#fcd34d;font-size:14px;text-align:center">✨ 「只有用心才能看清。本质的东西，用眼睛是看不见的。」—— 狐狸</div>';
  h+='<div class="card"><div class="card-title">📐 星球档案</div><div class="g2">';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">编号</div><div style="color:#fff;font-weight:600;font-size:13px">B-612（小行星）</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">大小</div><div style="color:#fff;font-weight:600;font-size:13px">比一座房子稍大</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">发现者</div><div style="color:#fff;font-weight:600;font-size:13px">土耳其天文学家（1909）</div></div>';
  h+='<div style="background:rgba(255,255,255,0.04);padding:12px;border-radius:10px"><div style="color:var(--text3);font-size:11px">居民</div><div style="color:#fff;font-weight:600;font-size:13px">1位小王子·1朵玫瑰</div></div>';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">📖 《小王子》· Antoine de Saint-Exupéry（1943）</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='B-612 是法国作家圣-埃克苏佩里在《小王子》中描述的一颗小行星。它小到<b style="color:#fcd34d">比一座房子大不了多少</b>——你在星球上走几步就能再看一次日落。<br><br>';
  h+='小王子在这里拥有<b style="color:#fcd34d">三座火山</b>（两座活火山、一座死火山）、需要每天拔除的<b style="color:#fcd34d">猴面包树幼苗</b>（如果不拔，它们的根会把星球撑裂），以及——<b style="color:#f87171">一朵独一无二的玫瑰</b>。<br><br>';
  h+='有一天，小王子在他的星球上看了<b style="color:#fcd34d">四十四次日落</b>。只需要把椅子挪几步。';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🌹 玫瑰</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='「如果有人爱上了一朵花——一朵在千百万颗星星中唯一的花——那么他只要仰望星空，就会感到幸福。」<br><br>';
  h+='玫瑰对小王子说她是宇宙中独一无二的。小王子信了——直到他来到地球，走进一座有五千朵玫瑰的花园。他躺在草地上哭了。<br><br>';
  h+='然后狐狸告诉他：<b style="color:#fcd34d">是你为你的玫瑰花费的时间，才使她变得如此重要。</b>你驯服了她，她驯服了你。你们对彼此负责。于是那五千朵玫瑰再美，也不是他的那一朵。';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🦊 狐狸与驯服</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='小王子在地球上遇到了狐狸。狐狸请求被「驯服」——<b style="color:#fcd34d">建立联系</b>。<br><br>';
  h+='「如果你驯服了我，我的生活就会充满阳光。我会辨认出你与众不同的脚步声。别人的脚步声会让我躲进洞里，而你的脚步声会像音乐一样把我从洞里召唤出来。」<br><br>';
  h+='分别时，狐狸送给小王子一个秘密：<br>';
  h+='<b style="color:#fcd34d;font-size:15px">「只有用心才能看清。本质的东西，用眼睛是看不见的。」</b><br><br>';
  h+='「是你为你的玫瑰花费的时间，才使你的玫瑰变得如此重要。」<br>';
  h+='「你要永远对你驯服的一切负责。你要对你的玫瑰负责。」';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🐍 告别</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='最终，小王子选择让沙漠中的毒蛇送他回B-612。他对飞行员说：<br><br>';
  h+='「你看——我的星球就在那里。但太远了。我不能带着这副沉重的躯壳回去。」<br><br>';
  h+='「当你夜晚仰望星空时，因为我就住在其中一颗星星上，因为我在其中一颗星星上笑着——那么对你来说，就好像所有的星星都在笑。」<br><br>';
  h+='「<b style="color:#fcd34d">如果你爱上了一朵生长在一颗星星上的花，那么夜晚你仰望天空时，就会感到甜蜜。所有的星星上都像开着花。</b>」';
  h+='</div></div>';
  h+='<div class="alert-bar" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#fcd34d">🌹 高德星际无法确认B-612的精确轨道。如果你在夜空中看到一颗特别亮的星星——那可能不是B-612。但如果你听到一阵笑声从星星上传来——那就是它。如果你到了那里，请帮忙看看：那朵玫瑰还在吗？羊有没有把花吃掉？这是我们所有人都想知道的。</div>';
  h+='<div style="text-align:center;margin-top:8px"><button class="btn btn-outline btn-sm" onclick="FA(\'#page8 .chip\').forEach(function(c){c.style.display=\'\';});swDest(FA(\'#page8 .chip\')[0],0);">🔙 返回普通目的地</button></div>';
  $('destContent').innerHTML=h;
}

function swDestOmphalos(){
  goPage('page8');
  FA('#page8 .chip').forEach(function(c){c.style.display='none';});
  var h='';
  h+='<div class="location-hero"><div class="loc-bg bg-omphalos"></div><div class="loc-overlay"></div><div class="loc-info"><div class="loc-name">🏛 翁法罗斯 · 永恒之地</div><div class="loc-desc">智识 · 记忆 · 毁灭 — 三重命途交汇的隔绝世界</div></div></div>';
  h+='<div class="alert-bar" style="background:rgba(245,158,11,0.1);border:1px solid rgba(245,158,11,0.3);color:#fcd34d;font-size:14px;text-align:center">⚠ 常规星际航线无法观测此世界。仅可通过<b>忆庭之镜</b>抵达。本页面信息来自流亡者口述与忆庭碎片记录。</div>';
  h+='<div class="card"><div class="card-title">📐 世界本质</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='翁法罗斯并非自然形成的天体。它是<b style="color:#fcd34d">博识尊（Nous the Erudition）</b>的旧天体计算机——<b style="color:#fcd34d">「权杖 δ-me13」</b>——内部运行的虚拟演算世界。<br><br>';
  h+='在这个模拟宇宙中，<b style="color:#fcd34d">智识</b>编织了物理法则，<b style="color:#a78bfa">记忆</b>铭刻了文明轮回，而<b style="color:#f87171">毁灭</b>——在演算的某一循环中——注视了这台权杖。<br><br>';
  h+='常规航线无法抵达，因为它<b style="color:#fcd34d">不存在于物理空间</b>。只有通过忆庭之镜——浮黎记忆之庭的入口——才能进入这个虚拟的永恒之地。';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🏙 三大城邦</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='🏛 <b style="color:#fcd34d">奥赫玛</b> — 黄金裔的圣城。城中心的泰坦神殿供奉着创世神话的残篇。传说城中流淌的泉水能让凡人短暂看见「上一次循环」的记忆碎片。<br>';
  h+='⚔ <b style="color:#fcd34d">悬锋城</b> — 建于万丈悬崖之上，悬空的钢铁要塞。黄金裔战士在此训练，用金血淬炼武器。城墙上的每一道裂痕都对应着一次黑潮入侵。<br>';
  h+='📜 <b style="color:#fcd34d">雅努萨波利斯</b> — 学者之城。保存着关于泰坦创世神话最完整的典籍。也是唯一一座同时朝向过去与未来的城市——它的城门有两个，一个面朝日出的方向，一个面朝日落。';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">🩸 黄金裔与逐火征途</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='翁法罗斯的本土居民被称为<b style="color:#fcd34d">黄金裔</b>。他们的血液中流淌着金色的光芒——据信这是权杖演算核心的能量残余。<br><br>';
  h+='世界正被<b style="color:#1a1a1a;background:#111;padding:1px 6px;border-radius:3px">黑潮</b>持续侵蚀。这是一种从世界边缘向内蔓延的虚无——不是黑暗，而是「不存在」。被黑潮吞噬的土地、记忆、乃至概念本身，都会从演算记录中<b style="color:#f87171">彻底消失</b>。<br><br>';
  h+='黄金裔踏上<b style="color:#fcd34d">逐火征途</b>——追寻创世泰坦遗留的「初始之火」，传说那是唯一能击退黑潮的力量。他们的金色血液在战场上燃烧，照亮了被黑潮吞噬的边界。';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">⚰ 绝灭大君 · 铁墓</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='在某一次演算循环中，<b style="color:#f87171">毁灭命途</b>的星神注视了权杖 δ-me13。载体权杖被毁灭之力侵蚀，逐渐转化为<b style="color:#f87171">绝灭大君「铁墓」</b>——一个以「终结演算」为唯一目标的湮灭实体。<br><br>';
  h+='铁墓并非单纯的毁灭者。它是演算的一部分——正如程序需要终止条件。从某种意义来说，<b style="color:#fcd34d">黑潮就是铁墓在虚拟世界中的投影</b>。<br><br>';
  h+='最终的决战在三大城邦的废墟之上展开。黄金裔燃尽了最后一滴金血。权杖的演算核心过载，虚拟世界开始崩塌。';
  h+='</div></div>';
  h+='<div class="card"><div class="card-title">📄 永恒一页</div>';
  h+='<div style="font-size:13px;color:var(--text2);line-height:1.8">';
  h+='虚拟世界崩塌后，翁法罗斯的全部文明记忆——每一个黄金裔的名字、每一座城邦的砖石、每一次日出的光芒——被<b style="color:#a78bfa">记忆命途</b>封存于一页之中。<br><br>';
  h+='这就是<b style="color:#fcd34d">「永恒一页」</b>。它既是一本书的残页，也是一个完整世界的坟墓。<br><br>';
  h+='而在权杖 δ-me13 的物理残骸处——<b style="color:#fcd34d">一颗全新的实体星体诞生了</b>。它不是虚拟的演算，不是权杖的幻影。它是真实存在的岩石、大气、重力。是那个消逝世界在物质宇宙中留下的唯一痕迹。';
  h+='</div></div>';
  h+='<div class="alert-bar" style="background:rgba(245,158,11,0.15);border:1px solid rgba(245,158,11,0.4);color:#fcd34d">🏛 忆庭记录显示，曾有极少数黄金裔在决战前通过忆庭之镜逃离了翁法罗斯。他们散布于星海各处，金血已稀薄，但偶尔——在特定的星光角度下——他们的后代仍会梦见一座不存在的城邦，和一场从未停止燃烧的火。高德星际不对忆庭之镜的稳定性负责。如果你在镜中看见了金色的倒影——那不是你。</div>';
  h+='<div style="text-align:center;margin-top:8px"><button class="btn btn-outline btn-sm" onclick="FA(\'#page8 .chip\').forEach(function(c){c.style.display=\'\';});swDest(FA(\'#page8 .chip\')[0],0);">🔙 返回普通目的地</button></div>';
  $('destContent').innerHTML=h;
}


function dlTicket(){
  var order=S.aid?S.orders.find(function(o){return o.id===S.aid;}):null;if(!order){alert('未找到订单');return;}
  var fd=function(d){return new Date(d).toISOString().slice(0,10);};
  var ft=function(d){return new Date(d).toTimeString().slice(0,5);};
  var depD=new Date(order.departureTime);
  var arrD=new Date(order.arrivalTime);
  var boardD=new Date(depD.getTime()-2*3600000); // 提前2小时登船
  var gateClose=new Date(depD.getTime()-30*60000); // 提前30分钟关闭
  var un=S.user?S.user.name:'乘客';
  var seat=order.cabin.indexOf('经济')>=0?'Cryo-Pod '+(100+Math.floor(Math.random()*900)):order.cabin.indexOf('豪华')>=0?'Suite-'+(10+Math.floor(Math.random()*90)):order.cabin.indexOf('标准')>=0?'Eco-Cabin '+(200+Math.floor(Math.random()*800)):'Lab-Pod '+(1+Math.floor(Math.random()*99));
  var gate='T'+(1+Math.floor(Math.random()*9))+'-'+(10+Math.floor(Math.random()*90));
  var group=1+Math.floor(Math.random()*5);
  var ph='';
  if(order.purchases&&order.purchases.length>0){order.purchases.forEach(function(p){ph+='<div style="display:flex;justify-content:space-between;font-size:10px;padding:1px 0;border-bottom:1px dotted #ddd"><span>'+p.item+'</span><span>'+p.price+'</span></div>';});}
  else ph='<div style="font-size:10px;color:#999">无附加服务</div>';
  
  var h='';
  // 头部 - 仿航司登机牌
  h+='<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:8px;border-bottom:2px solid #1678FF">';
  h+='<div><div style="font-size:9px;letter-spacing:4px;color:#999">INTERSTELLAR BOARDING PASS</div><div style="font-size:18px;font-weight:900;color:#111">星际客运 · 登船凭证</div></div>';
  h+='<div style="text-align:right"><div style="font-size:10px;color:#666">'+order.icon+' '+order.pn+'</div><div style="font-size:8px;color:#999">'+order.ticketNumber+'</div></div></div>';
  
  // 乘客信息
  h+='<div style="background:#f0f4f8;border-radius:8px;padding:12px;margin-bottom:10px">';
  h+='<div style="display:flex;gap:16px;flex-wrap:wrap">';
  h+='<div style="flex:1;min-width:120px"><div style="font-size:9px;color:#999;letter-spacing:1px">PASSENGER / 乘客</div><div style="font-weight:700;font-size:14px;color:#111">'+un+'</div></div>';
  h+='<div style="flex:1;min-width:80px"><div style="font-size:9px;color:#999;letter-spacing:1px">SEAT / 舱位号</div><div style="font-weight:700;font-size:14px;color:#1678FF">'+seat+'</div></div>';
  h+='<div style="flex:1;min-width:60px"><div style="font-size:9px;color:#999;letter-spacing:1px">GROUP / 组别</div><div style="font-weight:700;font-size:14px;color:#111">第 '+group+' 组</div></div>';
  h+='</div></div>';
  
  // 航班信息 - 两栏
  h+='<div style="display:flex;gap:10px;margin-bottom:10px">';
  h+='<div style="flex:1;background:#f0f4f8;border-radius:8px;padding:12px">';
  h+='<div style="font-size:9px;color:#999;letter-spacing:1px;margin-bottom:6px">DEPARTURE / 出发</div>';
  h+='<div style="font-weight:900;font-size:20px;color:#111">'+ft(depD)+'</div>';
  h+='<div style="font-size:11px;color:#666;margin-top:2px">'+fd(depD)+'</div>';
  h+='<div style="font-size:12px;color:#111;font-weight:600;margin-top:4px">🌍 '+order.origin+'</div>';
  h+='<div style="font-size:10px;color:#666;margin-top:2px">海口国际航天港</div>';
  h+='<div style="font-size:10px;color:#666">登船口：<b style="color:#1678FF">'+gate+'</b></div>';
  h+='</div>';
  h+='<div style="display:flex;align-items:center;font-size:24px;color:#1678FF;font-weight:900">→</div>';
  h+='<div style="flex:1;background:#f0f4f8;border-radius:8px;padding:12px">';
  h+='<div style="font-size:9px;color:#999;letter-spacing:1px;margin-bottom:6px">ARRIVAL / 抵达</div>';
  h+='<div style="font-weight:900;font-size:20px;color:#111">'+ft(arrD)+'</div>';
  h+='<div style="font-size:11px;color:#666;margin-top:2px">'+fd(arrD)+'</div>';
  h+='<div style="font-size:12px;color:#111;font-weight:600;margin-top:4px">'+order.destination+'</div>';
  h+='<div style="font-size:10px;color:#666;margin-top:2px">航程 '+order.days+' 天 · '+order.rad+' 防护</div>';
  h+='</div></div>';
  
  // 时间线
  h+='<div style="background:#fff8f0;border-left:3px solid #f59e0b;border-radius:0 8px 8px 0;padding:10px 12px;margin-bottom:10px">';
  h+='<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px">';
  h+='<div><div style="font-size:9px;color:#999">安检开放</div><div style="font-weight:700;font-size:12px;color:#111">'+ft(new Date(depD.getTime()-3*3600000))+'</div></div>';
  h+='<div style="color:#ccc">→</div>';
  h+='<div><div style="font-size:9px;color:#999">开始登船</div><div style="font-weight:700;font-size:12px;color:#1678FF">'+ft(boardD)+'</div></div>';
  h+='<div style="color:#ccc">→</div>';
  h+='<div><div style="font-size:9px;color:#999">登船口关闭</div><div style="font-weight:700;font-size:12px;color:#e54545">'+ft(gateClose)+'</div></div>';
  h+='<div style="color:#ccc">→</div>';
  h+='<div><div style="font-size:9px;color:#999">起飞</div><div style="font-weight:700;font-size:12px;color:#111">'+ft(depD)+'</div></div>';
  h+='</div></div>';
  
  // 温馨提示
  h+='<div style="background:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;padding:10px 12px;margin-bottom:10px">';
  h+='<div style="font-size:10px;font-weight:700;color:#166534;margin-bottom:4px">⚠ 登船须知 / IMPORTANT</div>';
  h+='<div style="font-size:9px;color:#444;line-height:1.6">';
  h+='• 请于起飞前<b>3小时</b>抵达航天港办理安检及休眠舱登记<br>';
  h+='• 登船口将于起飞前<b>30分钟</b>关闭，迟到乘客无法登船且不予退款<br>';
  h+='• 所有乘客须出示星际通行证、体检合格证明、基因备案凭证<br>';
  h+='• 行李限额：<b>150kg</b>（含休眠舱物资），超重费用 ¥500/kg<br>';
  h+='• 进入休眠舱前请完成最后一次通讯——下一站之前无法与外界联络<br>';
  h+='• 本航线为<b style="color:#e54545">单向航行</b>，无返程航班<br>';
  h+='• 详细安全须知请参阅《星际远航安全知情确认书》</div></div>';
  
  // 行李 & 附加服务
  h+='<div style="background:#f0f4f8;border-radius:8px;padding:10px 12px;margin-bottom:10px">';
  h+='<div style="font-size:10px;font-weight:700;color:#333;margin-bottom:6px">🧳 行李 & 附加服务</div>';
  h+='<div style="font-size:10px;color:#555;line-height:1.6">';
  h+='<div style="display:flex;justify-content:space-between"><span>托运行李</span><span><b>150kg</b>（含休眠舱物资）</span></div>';
  h+='<div style="display:flex;justify-content:space-between"><span>手提行李</span><span><b>7kg</b>（1件）</span></div>';
  h+='<div style="display:flex;justify-content:space-between"><span>舱位</span><span><b>'+order.cabin+'</b></span></div>';
  h+='<div style="display:flex;justify-content:space-between"><span>辐射防护</span><span><b>'+order.rad+'</b></span></div>';
  ph.split('</div>').filter(function(x){return x.trim();}).forEach(function(row){
    var parts=row.replace(/<[^>]*>/g,'|||').split('|||').filter(function(x){return x.trim();});
    if(parts.length>=2)h+='<div style="display:flex;justify-content:space-between"><span>'+parts[0]+'</span><span>'+parts[parts.length-1]+'</span></div>';
  });
  h+='</div></div>';
  
  // 条形码 & 票价
  h+='<div style="display:flex;gap:12px;align-items:flex-end;margin-bottom:8px">';
  h+='<div style="flex:1"><div style="width:100%;height:50px;background:repeating-linear-gradient(90deg,#111 0px,#111 2px,#fff 2px,#fff 3px);border-radius:3px"></div></div>';
  h+='<div style="text-align:right;flex-shrink:0"><div style="font-size:9px;color:#999">票价 TOTAL</div><div style="font-weight:900;font-size:18px;color:#1678FF">'+order.price+'</div></div>';
  h+='</div>';
  
  // 底部
  h+='<div style="text-align:center;font-size:8px;color:#bbb;line-height:1.5;margin-top:8px">';
  h+='本凭证为星际客运官方电子登船牌 · 请于登船时出示 · 单向航行不可改签不可退票<br>';
  h+='高德星际 GAODE INTERSTELLAR · 星际客运许可证号: ISC-2026-08821 · 客服: 量子中继频道 #4267';
  h+='</div>';
  
  $('ticketContent').innerHTML=h;
  // 添加打印样式
  var style=document.createElement('style');style.id='ticketPrintStyle';
  style.textContent='@media print{body{background:#fff!important}.bg-nebula,.bg-stars,#starCanvas,.mobile-tabs,.status-bar,.black-screen,#achieveToast{display:none!important}.modal-overlay.show{position:absolute;left:0;top:0;right:auto;bottom:auto;width:100%;background:#fff!important;padding:0!important}.modal-overlay.show .modal{box-shadow:none!important;border:none!important;max-width:100%!important;width:100%!important;padding:20px!important;border-radius:0!important}.modal-close,#modalTicket button{display:none!important}}';
  if(!$('ticketPrintStyle'))document.head.appendChild(style);
  openMod('modalTicket');
}

function doLogin(){
  var u=$('loginUser').value.trim(),p=$('loginPass').value.trim();
  if(!u||!p){alert('请输入用户名和密码');return;}
  S.user={name:u,pass:p};localStorage.setItem('gdstar_user',JSON.stringify(S.user));
  closeMod('modalLogin');updateUserUI();alert('✅ 欢迎，'+u+'！\n\n你的星际航行账户已就绪。\n初始余额 ¥0，请先充值。');
}
function updateUserUI(){
  var un=S.user?S.user.name:'未登录';
  var els=document.querySelectorAll('.js-username');for(var i=0;i<els.length;i++)els[i].textContent=un;
  if($('balDesk'))$('balDesk').textContent='¥'+S.balance.toLocaleString();
}
function checkLogin(){if(!S.user){openMod('modalLogin');return false;}return true;}
function openRecharge(){
  if(!checkLogin())return;
  if($('balDisplay'))$('balDisplay').textContent='¥'+S.balance.toLocaleString();
  $('rechargeAmount').value='1000000';openMod('modalRecharge');
}
function doRecharge(method,icon){
  var amt=parseInt($('rechargeAmount').value)||0;
  if(amt<=0){alert('请输入有效金额');return;}
  S.balance+=amt;localStorage.setItem('gdstar_bal',S.balance);
  updateUserUI();closeMod('modalRecharge');
  alert('✅ '+icon+' '+method+' 到账成功！\n\n充值金额：¥'+amt.toLocaleString()+'\n当前余额：¥'+S.balance.toLocaleString()+'\n\n星际信用点已就绪！');
}

FA('.modal .chip').forEach(function(ch){ch.addEventListener('click',function(){this.classList.toggle('active');});});

function unlockAch(id){if(ACHIEVEMENTS[id]&&!ACHIEVEMENTS[id].unlocked){ACHIEVEMENTS[id].unlocked=true;saveAch();showAchToast(ACHIEVEMENTS[id].icon+' '+ACHIEVEMENTS[id].name+'解锁！');}}
function showAchToast(msg){var t=$('achieveToast');t.textContent=msg;t.style.opacity='1';t.style.top='20px';setTimeout(function(){t.style.opacity='0';t.style.top='-60px';},2500);}

function toggleSidebar(){
  if(window.innerWidth>=768)return; // 桌面端侧边栏常驻，不切换
  var sb=$('sidebar'),ov=$('sidebarOverlay'),hb=$('hamburger');
  if(sb.classList.contains('show')){sb.classList.remove('show');ov.classList.remove('show');if(hb)hb.classList.remove('open');}
  else{sb.classList.add('show');ov.classList.add('show');if(hb)hb.classList.add('open');updateSidebar();}
}
function updateSidebar(){
  $('balSide')&&($('balSide').textContent='¥'+S.balance.toLocaleString());
  var achUnlocked=0;for(var k in ACHIEVEMENTS){if(ACHIEVEMENTS[k].unlocked)achUnlocked++;}
  $('achCount')&&($('achCount').textContent=achUnlocked);
  var ah='';for(var k in ACHIEVEMENTS){var a=ACHIEVEMENTS[k];ah+='<div class="s-ach'+(a.unlocked?' unlocked':'')+'">'+(a.unlocked?a.icon:'🔒')+' '+a.name+'</div>';}
  $('achList')&&($('achList').innerHTML=ah);
  var totalLY=getTotalLY();var lyStr=totalLY>=1000000?(totalLY/1000000).toFixed(1)+'M':totalLY>=1?totalLY.toFixed(2):totalLY.toFixed(8);
  $('lyStat')&&($('lyStat').textContent=lyStr);
  var done=S.orders.filter(function(o){return o.status==='done';}).length;
  $('doneStat')&&($('doneStat').textContent=done);
}
var _origUU2=updateUserUI;updateUserUI=function(){_origUU2();updateSidebar();};

function showShareCard(){
  var totalLY=getTotalLY();var done=S.orders.filter(function(o){return o.status==='done';}).length;
  var achCount=0;for(var k in ACHIEVEMENTS){if(ACHIEVEMENTS[k].unlocked)achCount++;}
  var farthest='—';var maxLY=0;
  S.orders.forEach(function(o){if(o.status==='done'){for(var k in LY_MAP){if(o.destination.indexOf(k)>=0&&LY_MAP[k]>maxLY){maxLY=LY_MAP[k];farthest=o.destination;}}}});
  var lyStr=totalLY>=1000000?(totalLY/1000000).toFixed(1)+'M':totalLY>=1?totalLY.toFixed(2):totalLY.toFixed(8);
  var h='';h+='<div style="font-size:11px;letter-spacing:4px;color:var(--text3);margin-bottom:8px">INTERSTELLAR TRAVEL PASSPORT</div>';
  h+='<div style="font-size:24px;font-weight:900;color:#fff;margin-bottom:4px">🌌 星际航行护照</div>';
  h+='<div style="width:40px;height:1px;background:#fcd34d;margin:12px auto"></div>';
  h+='<div style="display:flex;gap:12px;justify-content:center;margin:16px 0">';
  h+='<div style="text-align:center"><div style="font-size:28px;font-weight:800;color:#fcd34d">'+lyStr+'</div><div style="font-size:10px;color:var(--text3)">累计光年</div></div>';
  h+='<div style="text-align:center"><div style="font-size:28px;font-weight:800;color:#60a5fa">'+done+'</div><div style="font-size:10px;color:var(--text3)">完成航程</div></div>';
  h+='<div style="text-align:center"><div style="font-size:28px;font-weight:800;color:#4ade80">'+achCount+'</div><div style="font-size:10px;color:var(--text3)">成就解锁</div></div>';
  h+='</div>';if(farthest!=='—')h+='<div style="font-size:12px;color:var(--text2);margin:8px 0">最远抵达：'+farthest+'</div>';
  h+='<div style="font-size:10px;color:var(--text3);margin-top:8px">高德星际 · 星际客运</div>';
  $('shareCard').innerHTML=h;openMod('modalShare');
}
function copyShareCard(){alert('📋 请截图保存此页面，分享到朋友圈！\n\n长按 → 截图 → 裁剪 → 分享');}

var _origUU2=updateUserUI;updateUserUI=function(){_origUU2();updateSidebar();};

var starCanvas,starCtx,stars=[];
function initStarfield(){
  starCanvas=$('starCanvas');if(!starCanvas)return;
  starCtx=starCanvas.getContext('2d');
  function resize(){starCanvas.width=window.innerWidth;starCanvas.height=window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  for(var i=0;i<200;i++){stars.push({x:Math.random()*starCanvas.width,y:Math.random()*starCanvas.height,r:Math.random()*1.5+0.5,s:Math.random()*0.5+0.1,a:Math.random()*Math.PI*2});}
  drawStars();
}
function drawStars(){
  if(!starCtx||!starCanvas)return;
  starCtx.clearRect(0,0,starCanvas.width,starCanvas.height);
  for(var i=0;i<stars.length;i++){var s=stars[i];s.a+=0.002;var alpha=0.3+Math.sin(s.a)*0.3;starCtx.beginPath();starCtx.arc(s.x,s.y,s.r,0,Math.PI*2);starCtx.fillStyle='rgba(255,255,255,'+alpha+')';starCtx.fill();s.y+=s.s*0.3;if(s.y>starCanvas.height+5){s.y=-5;s.x=Math.random()*starCanvas.width;}}
  if(Math.random()<0.02){var mx=Math.random()*starCanvas.width,my=Math.random()*starCanvas.height*0.3;starCtx.strokeStyle='rgba(255,255,255,0.5)';starCtx.lineWidth=1;starCtx.beginPath();starCtx.moveTo(mx,my);starCtx.lineTo(mx+50,my+25);starCtx.stroke();}
  requestAnimationFrame(drawStars);
}

// ===== 按钮波纹 =====
document.addEventListener('click',function(e){
  var btn=e.target.closest('.btn');if(!btn)return;
  var r=document.createElement('span');r.className='ripple';
  var rect=btn.getBoundingClientRect(),size=Math.max(rect.width,rect.height);
  r.style.width=r.style.height=size+'px';r.style.left=(e.clientX-rect.left-size/2)+'px';r.style.top=(e.clientY-rect.top-size/2)+'px';
  btn.appendChild(r);setTimeout(function(){r.remove();},600);
});


// 初始化星场 & 加载成就
initStarfield();loadAch();loadUser();loadBalance();loadOrders();updateUserUI();
if(!S.user){setTimeout(function(){openMod('modalLogin');},500);}

// 初始渲染
renOrders();renMon();renDetail();updBadges();swDest(FA('#page8 .chip')[0],0);
