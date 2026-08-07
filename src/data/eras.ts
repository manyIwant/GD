// ===== 三体纪元数据（彩蛋）=====
import type { EraData } from '@/types/types';

export const ERA_DATA: EraData[] = [
  { id: 'crisis', name: '危机纪元', year: '危机1—208年', color: '#fcd34d', icon: '⚠️',
    desc: '三体危机被联合国确认。面壁计划启动——四位面壁者被赋予无限权力。罗辑在冰湖上悟出黑暗森林法则。破壁人逐一揭穿面壁者。章北海劫持自然选择号逃离。两千艘恒星级战舰在木星轨道集结——然后被一枚水滴全灭。这是人类从傲慢跌入绝望的世纪。',
    scene: '一枚水滴静静悬浮在木星轨道。表面绝对光滑，零摩擦。两千艘战舰的火光映在它的镜面上——像两千朵同时绽放的烟花。人类舰队，全军覆没。' },
  { id: 'deterrence', name: '威慑纪元', year: '威慑1—62年', color: '#60a5fa', icon: '⚖️',
    desc: '罗辑持剑。引力波天线对准三体世界。恐怖平衡维持了六十二年。三体人学会了人类的文明——他们拍电影、写小说、甚至学会了「爱」这个概念。但他们始终没有学会「欺骗」。直到程心接过了执剑人的按钮——在那千分之一秒的犹豫里，水滴摧毁了所有引力波发射器。威慑失败。',
    scene: '程心的手指悬在按钮上方。她面对的是一片宁静的蓝天和孩子的笑声。在她犹豫的那千分之一秒里，三颗水滴同时撞击了地球上的引力波天线。黑暗森林威慑——终结。' },
  { id: 'broadcast', name: '广播纪元', year: '广播1—7年', color: '#f87171', icon: '📡',
    desc: '威慑失败后，万有引力号在深空中广播了三体的坐标。三体世界被黑暗森林打击摧毁——一枚光粒穿透了三颗恒星中的一颗，整个星系在耀眼中化为灰烬。三体舰队仍在流亡途中，但家园已不复存在。人类欢呼——然后才意识到，太阳系的坐标也即将暴露。',
    scene: '光粒击中比邻星。三体世界的三颗太阳在一瞬间同时变亮——然后一切归于黑暗。一个文明，两百多次的毁灭与重生，终结于一粒光的问候。' },
  { id: 'bunker', name: '掩体纪元', year: '掩体1—67年', color: '#a78bfa', icon: '🏚️',
    desc: '人类躲进木星背后的掩体。歌者向太阳系投掷了一枚二向箔——一张没有厚度的纸。太阳系从三维跌入二维，像一幅无限延伸的画卷。罗辑在冥王星上守着地球文明的墓碑，程心和艾AA乘星环号逃离。太阳系——终结。',
    scene: '二向箔展开。太阳系开始坠落。木星的大红斑最先被压平，然后是土星环——它们变成了一幅画上精致的笔触。罗辑站在冥王星的雪地上，看着这一切沉入二维。他说：「给岁月以文明，而不是给文明以岁月。」' },
  { id: 'galactic', name: '银河纪元', year: '银河纪元', color: '#4ade80', icon: '🌌',
    desc: '程心和关一帆在647号小宇宙中度过了一千八百九十万年。归零者向全宇宙广播——呼吁所有文明归还质量，重启宇宙。程心留下了五公斤的生态球——一个微型地球。这是人类文明最后的墓碑，也是最后的希望。宇宙正在坍缩。大爆炸将再次发生。',
    scene: '647号小宇宙。一扇门。门外是正在死去的旧宇宙，门内是一小块麦田、一缕阳光、和一个装着地球生态的小球。程心把它放在桌上，走出了门。新宇宙的曙光即将亮起。' },
];

export function getEra(id: string | null): EraData {
  if (id) {
    const found = ERA_DATA.find((e) => e.id === id);
    if (found) return found;
  }
  return ERA_DATA[1];
}

// 检测是否为三体航线
export function isTrisolarisRoute(origin: string, transits: string[], dest: string): boolean {
  const hasCentauri = transits.some((t) => t.includes('半人马') || t.includes('α'));
  const hasProxima = dest.includes('比邻') || dest.includes('三体');
  const fromTrisolaris = origin.includes('三体');
  return hasCentauri || hasProxima || fromTrisolaris;
}
