// ===== 存档 & 读取系统 =====

// 用户登录信息
function loadUser(){try{var d=localStorage.getItem('gdstar_user');if(d){S.user=JSON.parse(d);}}catch(e){}}

// 余额
function loadBalance(){try{var b=localStorage.getItem('gdstar_bal');if(b)S.balance=parseInt(b)||0;}catch(e){}}

// 订单存档/读取
function saveOrders(){try{localStorage.setItem('gdstar_orders',JSON.stringify(S.orders));}catch(e){}}
function loadOrders(){try{var d=localStorage.getItem('gdstar_orders');if(d){var arr=JSON.parse(d);S.orders=arr;for(var i=0;i<S.orders.length;i++){var o=S.orders[i];o.departureTime=Number(o.departureTime);o.arrivalTime=Number(o.arrivalTime);o.createdAt=Number(o.createdAt);}}}catch(e){}}

// 成就存档/读取
function loadAch(){try{var d=localStorage.getItem('gdstar_ach');if(d){var a=JSON.parse(d);for(var k in a){if(ACHIEVEMENTS[k])ACHIEVEMENTS[k].unlocked=a[k];}}}catch(e){}}
function saveAch(){var o={};for(var k in ACHIEVEMENTS){o[k]=ACHIEVEMENTS[k].unlocked;}try{localStorage.setItem('gdstar_ach',JSON.stringify(o));}catch(e){}}
