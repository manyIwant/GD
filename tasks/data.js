// ===== 星际飞船 / 方案数据 =====
var PLANS = {
  cnsa:{n:'中国航天·长征跃迁舰',p:'¥1,280,000',c:'经济休眠舱',r:'Lv4',d:180,i:'🇨🇳'},
  nasa:{n:'NASA·猎户座聚变星舰',p:'¥2,560,000',c:'标准生态舱',r:'Lv5',d:155,i:'🇺🇸'},
  spacex:{n:'SpaceX·星舰超光速号',p:'¥5,800,000',c:'豪华生态圈',r:'Lv6',d:120,i:'🚀'},
  esa:{n:'欧空局·雅典娜远航船',p:'¥1,980,000',c:'科研观测舱',r:'Lv4',d:210,i:'🇪🇺'},
  ark:{n:'私营星际·方舟号',p:'¥860,000',c:'经济休眠舱',r:'Lv3',d:200,i:'🏛'}
};

// ===== 星球/航点数据 =====
var WPS = [
  {n:'地球·海口航天港',t:'earth',d:'出发点',bg:'bg-earth',g:'1.00G',a:'N₂-O₂',dl:'24h',nt:'人类文明母星'},
  {n:'月球静海中转港',t:'moon',d:'384,400km·8h',bg:'bg-moon',g:'0.16G',a:'真空',dl:'27.3天',nt:'无'},
  {n:'火星奥林匹斯港',t:'mars',d:'225M km·3d',bg:'bg-mars',g:'0.38G',a:'CO₂',dl:'24.6h',nt:'无'},
  {n:'太阳系跃迁枢纽',t:'jump',d:'4.5B km·12d',bg:'bg-jump',g:'0.8G',a:'人工',dl:'24h',nt:'无'},
  {n:'半人马座α星',t:'centauri',d:'4.37ly·45d',bg:'bg-centauri',g:'1.12G',a:'N₂-O₂',dl:'28h',nt:'原始微生物'},
  {n:'仙女座M31',t:'andromeda',d:'2.537M ly·180d',bg:'bg-andromeda',g:'0.92G',a:'N₂-O₂',dl:'36h',nt:'无'}
];
// 地名→节点名映射

// ===== 地名→节点名映射 =====
var LOC_MAP = {
  '地球':'地球·海口航天港','海口':'地球·海口航天港','地球（亚洲·海口）':'地球·海口航天港',
  '月球':'月球静海中转港','月球静海中转港':'月球静海中转港',
  '火星':'火星奥林匹斯港','火星奥林匹斯港':'火星奥林匹斯港','火星奥林匹斯航天港':'火星奥林匹斯港',
  '谷神星':'谷神星补给站','谷神星补给站':'谷神星补给站',
  '太阳系':'太阳系跃迁枢纽','太阳系跃迁枢纽':'太阳系跃迁枢纽','太阳系边缘跃迁枢纽':'太阳系跃迁枢纽',
  '半人马座':'半人马座α星','半人马座α星':'半人马座α星','半人马座α星中转站':'半人马座α星',
  '天狼星':'天狼星殖民地','天狼星殖民地':'天狼星殖民地',
  '大麦哲伦':'大麦哲伦云前哨','大麦哲伦云前哨':'大麦哲伦云前哨','大麦哲伦云前哨站':'大麦哲伦云前哨',
  '仙女座':'仙女座M31','仙女座M31':'仙女座M31','仙女座星系M31':'仙女座M31',
  '巴纳德':'巴纳德星中转站','巴纳德星中转站':'巴纳德星中转站',
  '罗斯128':'罗斯128殖民地','罗斯128殖民地':'罗斯128殖民地',
  '格利泽581':'格利泽581宜居站','格利泽581宜居站':'格利泽581宜居站',
  '翁法罗斯':'翁法罗斯·永恒沙海','翁法罗斯·永恒沙海':'翁法罗斯·永恒沙海',
  '三体':'比邻星·三体世界','三体星':'比邻星·三体世界','比邻星':'比邻星·三体世界','比邻星·三体世界':'比邻星·三体世界',
  'B621':'B612·小王子之星','B621星云':'B612·小王子之星','b621':'B612·小王子之星','B-612':'B612·小王子之星','B612':'B612·小王子之星','小王子':'B612·小王子之星'
};
// 根据起终点+中转动态生成路线

// ===== 根据起终点+中转动态生成路线 =====
function buildWP(origin,transits,dest){
  var nodes=[],seen={};
  function match(s){
    for(var k in LOC_MAP){if(s.indexOf(k)>=0||k.indexOf(s)>=0)return LOC_MAP[k];}
    return s;
  }
  function find(s){
    var mn=match(s);
    for(var i=0;i<WPS.length;i++){if(WPS[i].n===mn)return WPS[i];}
    // 额外节点
    var ext={n:'巴纳德星中转站',t:'jump',d:'6光年·星际中转',bg:'bg-barnard',g:'0.7G',a:'人工',dl:'25h',nt:'无'};
    var ext2={n:'罗斯128殖民地',t:'jump',d:'11光年·红矮星殖民地',bg:'bg-ross',g:'0.85G',a:'人工·N₂-O₂',dl:'22h',nt:'无'};
    var ext3={n:'格利泽581宜居站',t:'jump',d:'20光年·宜居带空间站',bg:'bg-gliese',g:'0.95G',a:'N₂-O₂',dl:'26h',nt:'无'};
    var ext4={n:'天狼星殖民地',t:'jump',d:'8.6光年·亮星殖民地',bg:'bg-sirius',g:'1.05G',a:'N₂-O₂',dl:'30h',nt:'无'};
    var ext5={n:'大麦哲伦云前哨',t:'jump',d:'16.3万光年·河外前哨',bg:'bg-jump',g:'0.85G',a:'稀薄',dl:'22h',nt:'原始细菌'};
    var ext6={n:'谷神星补给站',t:'jump',d:'小行星带·补给站',bg:'bg-ceres',g:'0.03G',a:'真空',dl:'9h',nt:'无'};
    var ext7={n:'翁法罗斯·永恒沙海',t:'omphalos',d:'IPC档案·琥珀纪·沙漠星球',bg:'bg-omphalos',g:'0.95G',a:'稀薄·含沙尘',dl:'32h',nt:'远古文明遗迹'};
    var ext8={n:'比邻星·三体世界',t:'proxima',d:'半人马座α·红矮星·三体星系',bg:'bg-proxima',g:'1.12G',a:'N₂·含硫',dl:'??h·混沌',nt:'三体文明(已灭绝)'};
    var ext9={n:'B612·小王子之星',t:'b612',d:'小行星·比一座房子稍大',bg:'bg-b621',g:'0.01G',a:'极稀薄',dl:'很短·可以看44次日落',nt:'1朵玫瑰·3座火山·猴面包树'};
    var map={n:mn,d:'自定义节点',bg:'bg-jump',g:'?',a:'?',dl:'?',nt:'?'};
    if(mn.indexOf('巴纳德')>=0)map=ext;
    else if(mn.indexOf('罗斯128')>=0)map=ext2;
    else if(mn.indexOf('格利泽')>=0)map=ext3;
    else if(mn.indexOf('天狼星')>=0)map=ext4;
    else if(mn.indexOf('大麦哲伦')>=0)map=ext5;
    else if(mn.indexOf('谷神星')>=0)map=ext6;
    else if(mn.indexOf('翁法罗斯')>=0)map=ext7;
    else if(mn.indexOf('比邻星')>=0||mn.indexOf('三体')>=0)map=ext8;
    else if(mn.indexOf('B621')>=0||mn.indexOf('b621')>=0||mn.indexOf('B612')>=0||mn.indexOf('b612')>=0||mn.indexOf('小王子')>=0)map=ext9;
    return map;
  }
  function add(s){
    var node=find(s);var key=node.n;
    if(!seen[key]){seen[key]=true;nodes.push(node);}
  }
  add(origin);
  if(transits)for(var i=0;i<transits.length;i++)add(transits[i]);
  add(dest);
  return nodes.length>=2?nodes:WPS;
}


// ===== 三体纪元数据 =====
var ERA_DATA=[
  {id:'crisis',name:'危机纪元',year:'危机1—208年',color:'#fcd34d',icon:'⚠️',
   desc:'三体危机被联合国确认。面壁计划启动——四位面壁者被赋予无限权力。罗辑在冰湖上悟出黑暗森林法则。破壁人逐一揭穿面壁者。章北海劫持自然选择号逃离。两千艘恒星级战舰在木星轨道集结——然后被一枚水滴全灭。这是人类从傲慢跌入绝望的世纪。',
   scene:'一枚水滴静静悬浮在木星轨道。表面绝对光滑，零摩擦。两千艘战舰的火光映在它的镜面上——像两千朵同时绽放的烟花。人类舰队，全军覆没。'},
  {id:'deterrence',name:'威慑纪元',year:'威慑1—62年',color:'#60a5fa',icon:'⚖️',
   desc:'罗辑持剑。引力波天线对准三体世界。恐怖平衡维持了六十二年。三体人学会了人类的文明——他们拍电影、写小说、甚至学会了「爱」这个概念。但他们始终没有学会「欺骗」。直到程心接过了执剑人的按钮——在那千分之一秒的犹豫里，水滴摧毁了所有引力波发射器。威慑失败。',
   scene:'程心的手指悬在按钮上方。她面对的是一片宁静的蓝天和孩子的笑声。在她犹豫的那千分之一秒里，三颗水滴同时撞击了地球上的引力波天线。黑暗森林威慑——终结。'},
  {id:'broadcast',name:'广播纪元',year:'广播1—7年',color:'#f87171',icon:'📡',
   desc:'威慑失败后，万有引力号在深空中广播了三体的坐标。三体世界被黑暗森林打击摧毁——一枚光粒穿透了三颗恒星中的一颗，整个星系在耀眼中化为灰烬。三体舰队仍在流亡途中，但家园已不复存在。人类欢呼——然后才意识到，太阳系的坐标也即将暴露。',
   scene:'光粒击中比邻星。三体世界的三颗太阳在一瞬间同时变亮——然后一切归于黑暗。一个文明，两百多次的毁灭与重生，终结于一粒光的问候。'},
  {id:'bunker',name:'掩体纪元',year:'掩体1—67年',color:'#a78bfa',icon:'🏚️',
   desc:'人类躲进木星背后的掩体。歌者向太阳系投掷了一枚二向箔——一张没有厚度的纸。太阳系从三维跌入二维，像一幅无限延伸的画卷。罗辑在冥王星上守着地球文明的墓碑，程心和艾AA乘星环号逃离。太阳系——终结。',
   scene:'二向箔展开。太阳系开始坠落。木星的大红斑最先被压平，然后是土星环——它们变成了一幅画上精致的笔触。罗辑站在冥王星的雪地上，看着这一切沉入二维。他说：「给岁月以文明，而不是给文明以岁月。」'},
  {id:'galactic',name:'银河纪元',year:'银河纪元',color:'#4ade80',icon:'🌌',
   desc:'程心和关一帆在647号小宇宙中度过了一千八百九十万年。归零者向全宇宙广播——呼吁所有文明归还质量，重启宇宙。程心留下了五公斤的生态球——一个微型地球。这是人类文明最后的墓碑，也是最后的希望。宇宙正在坍缩。大爆炸将再次发生。',
   scene:'647号小宇宙。一扇门。门外是正在死去的旧宇宙，门内是一小块麦田、一缕阳光、和一个装着地球生态的小球。程心把它放在桌上，走出了门。新宇宙的曙光即将亮起。'}
];

// ===== 动态定价数据 =====
var PRICE_PER_LY={cnsa:290000,nasa:580000,spacex:1320000,esa:450000,ark:196000};
var LY_PRICE={月球:0.00004,火星:0.00048,谷神星:0.0008,太阳系:0.005,跃迁:0.005,半人马:4.37,天狼星:8.6,巴纳德:6,罗斯128:11,格利泽:20,大麦哲伦:163000,仙女座:2537000,比邻星:4.24,三体:4.24,翁法罗斯:999999};

// ===== 动态定价函数 =====
function calcPrice(planKey,destination){
  var perLY=PRICE_PER_LY[planKey]||290000;var ly=1;
  for(var k in LY_PRICE){if(destination.indexOf(k)>=0){ly=LY_PRICE[k];break;}}
  var base=Math.round(perLY*Math.max(ly,0.001));
  if(base<1000)base=1000;if(base>999999999)base=999999999;
  return base;
}
function fmtPrice(n){
  if(n>=100000000)return '¥'+(n/100000000).toFixed(1)+'亿';
  if(n>=10000)return '¥'+(n/10000).toFixed(0)+'万';
  return '¥'+n.toLocaleString();
}

// 弹窗内chip点击
FA('.modal .chip').forEach(function(ch){ch.addEventListener('click',function(){this.classList.toggle('active');});});


// ===== 星际成就配置 =====
var ACHIEVEMENTS={
  firstOrder:{id:'firstOrder',name:'初入星海',desc:'完成第一次星际订票',icon:'🚀',unlocked:false},
  moonTrip:{id:'moonTrip',name:'月球漫步',desc:'抵达月球静海中转港',icon:'🌙',unlocked:false},
  marsTrip:{id:'marsTrip',name:'红色星球',desc:'抵达火星奥林匹斯港',icon:'🔴',unlocked:false},
  deepSleep:{id:'deepSleep',name:'深度沉眠',desc:'使用深度休眠模式',icon:'🧊',unlocked:false},
  nextStop:{id:'nextStop',name:'走马观花',desc:'使用浅度休眠至下一站',icon:'🌙',unlocked:false},
  omphalos:{id:'omphalos',name:'永恒之地的访客',desc:'发现翁法罗斯',icon:'🏛',unlocked:false},
  trisolaris:{id:'trisolaris',name:'不要回答',desc:'抵达三体世界',icon:'🔴',unlocked:false},
  b612:{id:'b612',name:'玫瑰与狐狸',desc:'发现B-612小行星',icon:'🌹',unlocked:false},
  andromeda:{id:'andromeda',name:'河外边疆',desc:'抵达仙女座星系',icon:'🌀',unlocked:false}
};
var LY_MAP={月球:0.00000004,火星:0.000024,谷神星:0.00004,太阳系:0.00048,跃迁:0.00048,半人马:4.37,天狼星:8.6,巴纳德:6,罗斯128:11,格利泽:20,大麦哲伦:163000,仙女座:2537000,比邻星:4.24,三体:4.24};

// ===== 累计光年计算 =====
function getTotalLY(){var total=0;S.orders.forEach(function(o){if(o.status==='done'&&o.destination){for(var k in LY_MAP){if(o.destination.indexOf(k)>=0){total+=LY_MAP[k];break;}}}});return total;}

// ===== 随机宇宙事件数据 =====
var COSMIC_EVENTS=[
  {title:'📡 收到陌生讯号',body:'飞船通讯阵列接收到一段无法解码的脉冲信号。来源未知。信号中包含一种重复模式——每22分钟重复一次，与任何已知天体周期都不匹配。舰长建议：继续航行，不要在日志中记录此事。',cond:function(p){return p>10&&p<40;}},
  {title:'🌟 观测到超新星爆发',body:'银河系旋臂方向检测到一次II型超新星爆发。距离约12万光年。飞船防护系统正在自动调整辐射屏蔽。你透过舷窗看到的光——是那颗恒星在12万年前死去的最后一瞥。',cond:function(p){return p>30&&p<70;}},
  {title:'🌀 时空褶皱预警',body:'前方航线检测到轻微时空褶皱——跃迁引擎能量波动约3.7%。飞船AI建议：降低0.02c巡航速度以避开扰动区域。预计到达时间将延迟约2小时。',cond:function(p){return p>50;}},
  {title:'👁 未知物体掠过',body:'一个金属光泽的物体从3点钟方向高速掠过飞船。直径约2米，梭形，表面无任何推进器痕迹。它没有响应任何通讯尝试。舰长的个人日志写着一行：「我不认为那是机器。」',cond:function(p){return p>20&&p<80;}},
  {title:'💤 集体梦境',body:'休眠舱监控显示——所有处于休眠状态的乘客在同一时间进入了REM睡眠。他们的脑波模式高度相似，仿佛在做同一个梦。梦境内容无法获取。醒来后，没有人记得梦见了什么。',cond:function(p){return S.hib&&p>40;}}
];
