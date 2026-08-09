// ===== 星际明信片：精致可下载 / 可打印图片生成 =====
// 使用 Canvas 绘制 1080x1620（竖版明信片比例）精致科幻明信片
import { findDestination, fmtLY, fmtPrice } from '@/data/pricing';
import { pickQuote, getDestFeature } from '@/data/quotes';
import { SHIPS } from '@/data/ships';
import type { FlightLogRow } from '@/types/types';

const W = 1080;
const H = 1620;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// 绘制明信片到指定 canvas（可复用于下载与打印）
export function drawPostcard(canvas: HTMLCanvasElement, log: FlightLogRow, username?: string) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = W;
  canvas.height = H;
  const dest = findDestination(log.destination);
  const color = dest?.color || '#67e8f9';
  const date = new Date(log.arrived_at);
  const pd = (log.postcard_data || {}) as {
    price?: number; flight_no?: string; duration_days?: number;
    achievements?: string[]; achievement_icons?: string[]; cabin?: string;
  };
  const quote = pickQuote(log.id || log.destination + date.toISOString());
  const feature = getDestFeature(log.destination);
  const ship = SHIPS.find((s) => s.name === log.ship_name);
  const badge = ship?.icon || '🚀';

  // 背景：深空渐变
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0a0a2e');
  bg.addColorStop(0.5, '#03040a');
  bg.addColorStop(1, '#1a0a2e');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // 星云光晕
  const glow = ctx.createRadialGradient(W * 0.3, H * 0.22, 0, W * 0.3, H * 0.22, W * 0.6);
  glow.addColorStop(0, `${color}33`);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // 星星
  for (let i = 0; i < 200; i++) {
    const sx = Math.random() * W;
    const sy = Math.random() * H;
    const sr = Math.random() * 2.2 + 0.4;
    ctx.fillStyle = `rgba(255,255,255,${0.2 + Math.random() * 0.6})`;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // 外框
  ctx.strokeStyle = `${color}88`;
  ctx.lineWidth = 6;
  roundRect(ctx, 40, 40, W - 80, H - 80, 24);
  ctx.stroke();
  ctx.strokeStyle = `${color}33`;
  ctx.lineWidth = 2;
  roundRect(ctx, 56, 56, W - 112, H - 112, 18);
  ctx.stroke();

  // 顶部标签
  ctx.fillStyle = `${color}cc`;
  ctx.font = 'bold 30px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('★ INTERSTELLAR POSTCARD ★', W / 2, 125);

  // 航行编号
  if (pd.flight_no) {
    ctx.fillStyle = `${color}66`;
    ctx.font = '20px monospace';
    ctx.fillText(pd.flight_no, W / 2, 158);
  }

  // 目的地 emoji 徽章
  ctx.beginPath();
  ctx.arc(W / 2, 330, 110, 0, Math.PI * 2);
  ctx.fillStyle = `${color}22`;
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.font = '110px serif';
  ctx.textBaseline = 'middle';
  ctx.fillText(dest?.emoji || '🪐', W / 2, 335);
  ctx.textBaseline = 'alphabetic';

  // 目的地名称
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 52px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(log.destination, W / 2, 510);

  // 目的地特色信息
  ctx.fillStyle = `${color}aa`;
  ctx.font = '22px sans-serif';
  wrapText(ctx, feature, W / 2, 552, W - 200, 30);

  // 分隔线
  ctx.strokeStyle = `${color}55`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 612);
  ctx.lineTo(W - 180, 612);
  ctx.stroke();

  // 数据卡片
  const cards = [
    { label: '航行光年', value: `${fmtLY(log.light_years)} ly` },
    { label: '搭乘飞船', value: log.ship_name || '—' },
    { label: '抵达日期', value: date.toLocaleDateString('zh-CN') },
    { label: '飞行时长', value: pd.duration_days ? `${pd.duration_days} 天` : '—' },
  ];
  const cardW = (W - 160 - 40) / 2;
  const cardH = 110;
  cards.forEach((c, i) => {
    const cx = 80 + (i % 2) * (cardW + 40);
    const cy = 640 + Math.floor(i / 2) * (cardH + 22);
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    roundRect(ctx, cx, cy, cardW, cardH, 12);
    ctx.fill();
    ctx.strokeStyle = `${color}33`;
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx, cy, cardW, cardH, 12);
    ctx.stroke();
    ctx.fillStyle = `${color}99`;
    ctx.font = '20px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(c.label.toUpperCase(), cx + 20, cy + 36);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 28px sans-serif';
    const val = c.value.length > 16 ? c.value.slice(0, 16) + '…' : c.value;
    ctx.fillText(val, cx + 20, cy + 78);
  });

  // 本次航行成就
  const achNames = pd.achievements || [];
  const achIcons = pd.achievement_icons || [];
  let achY = 920;
  if (achNames.length > 0) {
    ctx.fillStyle = `${color}cc`;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('🎖 本次航行成就', 100, achY);
    achY += 44;
    achNames.forEach((name, i) => {
      const icon = achIcons[i] || '🏅';
      ctx.font = '34px serif';
      ctx.textAlign = 'left';
      ctx.fillText(icon, 100, achY);
      ctx.fillStyle = '#ffffff';
      ctx.font = '24px sans-serif';
      ctx.fillText(name, 150, achY);
      achY += 48;
    });
  } else {
    ctx.fillStyle = `${color}66`;
    ctx.font = 'italic 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('本次航行暂无新成就，继续探索吧！', W / 2, achY + 10);
    achY += 50;
  }

  // 随机星际语录
  ctx.fillStyle = `${color}aa`;
  ctx.font = 'italic 28px serif';
  ctx.textAlign = 'center';
  wrapText(ctx, `「${quote}」`, W / 2, achY + 40, W - 200, 38);

  // 邮票区域（含飞船徽章）
  ctx.strokeStyle = `${color}66`;
  ctx.lineWidth = 3;
  ctx.setLineDash([8, 6]);
  roundRect(ctx, W - 300, H - 300, 220, 190, 8);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '60px serif';
  ctx.textAlign = 'center';
  ctx.fillText(badge, W - 190, H - 215);
  ctx.fillStyle = `${color}88`;
  ctx.font = '18px monospace';
  ctx.fillText('SHIP BADGE', W - 190, H - 160);

  // 底部署名
  ctx.fillStyle = `${color}66`;
  ctx.font = '18px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`高德星际·星际客运 · STARDATE ${date.getUTCFullYear()}.${String(date.getUTCMonth() + 1).padStart(2, '0')}.${String(date.getUTCDate()).padStart(2, '0')}`, W / 2, H - 95);

  if (pd.price) {
    ctx.fillStyle = `${color}88`;
    ctx.font = '20px monospace';
    ctx.fillText(`本次航程 ${fmtPrice(pd.price)}`, W / 2, H - 130);
  }
}

// 文本自动换行
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const chars = Array.from(text);
  let line = '';
  let curY = y;
  for (let i = 0; i < chars.length; i++) {
    const test = line + chars[i];
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, curY);
      line = chars[i];
      curY += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, curY);
}

// 下载明信片为 PNG
export function downloadPostcard(log: FlightLogRow, username?: string) {
  const canvas = document.createElement('canvas');
  drawPostcard(canvas, log, username);
  const link = document.createElement('a');
  link.download = `星际明信片_${log.destination}_${new Date(log.arrived_at).toISOString().slice(0, 10)}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

// 打印明信片
export function printPostcard(log: FlightLogRow, username?: string) {
  const canvas = document.createElement('canvas');
  drawPostcard(canvas, log, username);
  const dataUrl = canvas.toDataURL('image/png');
  const win = window.open('', '_blank');
  if (!win) return;
  win.document.write(`
    <html><head><title>星际明信片 - ${log.destination}</title>
    <style>body{margin:0;display:flex;align-items:center;justify-content:center;background:#000;}
    img{max-width:100%;max-height:100vh;}</style></head>
    <body><img src="${dataUrl}" onload="window.print();setTimeout(()=>window.close(),300);"/></body></html>
  `);
  win.document.close();
}