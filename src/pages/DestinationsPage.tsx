import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HudPanel, LocationHero, AlertBar } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { WPS, EXTRA_WPS } from '@/data/waypoints';
import { ERA_DATA } from '@/data/eras';
import { useGameStore } from '@/hooks/useGameStore';
import { Target, MapPin, ChevronRight } from 'lucide-react';
import type { Waypoint } from '@/types/types';

// 普通目的地列表
const NORMAL_DESTS: Waypoint[] = [...WPS.slice(1), EXTRA_WPS.sirius, EXTRA_WPS.barnard, EXTRA_WPS.ross128, EXTRA_WPS.gliese581, EXTRA_WPS.ceres, EXTRA_WPS.lmc];
// 隐藏目的地
const HIDDEN_DESTS: Waypoint[] = [EXTRA_WPS.omphalos, EXTRA_WPS.proxima, EXTRA_WPS.b612];

export default function DestinationsPage() {
  const navigate = useNavigate();
  const store = useGameStore();
  const [active, setActive] = useState<Waypoint>(NORMAL_DESTS[0]);
  const [showHidden, setShowHidden] = useState(false);

  const renderDetail = (wp: Waypoint) => {
    // 三体彩蛋
    if (wp.t === 'proxima') return <TrisolarisDetail wp={wp} />;
    // B-612 彩蛋
    if (wp.t === 'b612') return <B612Detail wp={wp} />;
    // 翁法罗斯
    if (wp.t === 'omphalos') return <OmphalosDetail wp={wp} />;
    // 普通
    return <NormalDetail wp={wp} />;
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <Target className="w-5 h-5 text-laser" /> 目的地探索
        </h1>
        <Button
          variant="outline"
          size="sm"
          className="btn-mech"
          onClick={() => setShowHidden(!showHidden)}
        >
          {showHidden ? '✨ 隐藏目的地' : '🔒 隐藏目的地'}
        </Button>
      </div>

      {/* 候选 chip 列表 */}
      <HudPanel className="mb-4">
        <div className="p-3 flex flex-wrap gap-1.5">
          {NORMAL_DESTS.map((wp) => (
            <button
              key={wp.n}
              onClick={() => setActive(wp)}
              className={`px-3 py-1.5 text-xs border btn-mech transition-colors ${
                active.n === wp.n ? 'neon-active text-laser' : 'border-border text-muted-foreground hover:text-foreground hover:border-laser/50'
              }`}
            >
              {wp.n}
            </button>
          ))}
          {showHidden && HIDDEN_DESTS.map((wp) => (
            <button
              key={wp.n}
              onClick={() => setActive(wp)}
              className={`px-3 py-1.5 text-xs border btn-mech transition-colors ${
                active.n === wp.n ? 'neon-active text-laser' : 'border-purple-500/50 text-purple-300 hover:border-purple-400'
              }`}
            >
              ✨ {wp.n}
            </button>
          ))}
        </div>
      </HudPanel>

      {/* 详情 */}
      {renderDetail(active)}

      {/* 预订按钮 */}
      <div className="mt-5">
        <Button
          className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90"
          onClick={() => navigate(`/route?o=${encodeURIComponent('地球（亚洲·海口）')}&d=${encodeURIComponent(active.n)}`)}
        >
          <MapPin className="w-4 h-4 mr-1.5" /> 预订前往 {active.n}
        </Button>
      </div>
    </div>
  );
}

function NormalDetail({ wp }: { wp: Waypoint }) {
  return (
    <div>
      <LocationHero bg={wp.bg} name={wp.n} desc={wp.d} />
      <HudPanel className="mt-4">
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <InfoCell label="重力" value={wp.g} />
            <InfoCell label="大气" value={wp.a} />
            <InfoCell label="日长" value={wp.dl} />
            <InfoCell label="原住民" value={wp.nt} />
          </div>
        </div>
      </HudPanel>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-muted/30 border border-border/60 px-3 py-2">
      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="text-sm font-bold text-foreground font-mono-num">{value}</div>
    </div>
  );
}

function TrisolarisDetail({ wp }: { wp: Waypoint }) {
  return (
    <div>
      <LocationHero bg={wp.bg} name="🔴 比邻星·三体世界" desc="半人马座α·红矮星·距地球4.24光年" />
      <div className="space-y-4 mt-4">
        {ERA_DATA.map((e) => (
          <HudPanel key={e.id}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{e.icon}</span>
                <span className="text-base font-bold" style={{ color: e.color }}>{e.name}</span>
                <span className="text-[11px] text-muted-foreground font-mono-num ml-auto">{e.year}</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{e.desc}</p>
              <div className="mt-3 border-l-2 pl-3" style={{ borderColor: e.color }}>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">关键场景</div>
                <p className="text-xs italic text-foreground/80 leading-relaxed mt-1">「{e.scene}」</p>
              </div>
            </div>
          </HudPanel>
        ))}
        <AlertBar tone="warning">
          ⚠ 三体世界在广播纪元已被光粒摧毁。你访问的是时空切片——一段被引力波记录封存的文明记忆。
          如果你在这里收到了来自过去的讯息——<b className="text-yellow-300">「不要回答」</b>。
        </AlertBar>
        <AlertBar tone="info">
          <b>三体文明关键词：</b>脱水（乱纪元存活）·思维透明（无欺骗）·智子（量子锁死人类科学）·水滴（强互作用力材料）·黑暗森林（宇宙法则）
        </AlertBar>
      </div>
    </div>
  );
}

function B612Detail({ wp }: { wp: Waypoint }) {
  return (
    <div>
      <LocationHero bg={wp.bg} name="🌹 B-612·小王子之星" desc="「如果你在下午四点来，从三点开始我就感到幸福。」" />
      <div className="space-y-4 mt-4">
        <AlertBar tone="warning">
          ✨ 你不应该在这里。B-612 不在任何星图上。但如果你执意要去——请记住：
          <b className="text-yellow-300">重要的东西是眼睛看不见的。</b>
        </AlertBar>

        <HudPanel>
          <div className="p-4">
            <div className="text-sm font-bold text-foreground mb-2">📖 《小王子》·安托万·德·圣埃克苏佩里</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              法国作家、飞行员（1900—1944）。1943年《小王子》在纽约出版。1944年7月31日执行侦察任务时失踪。
              他像小王子一样，去了一个我们找不到的地方。本书被翻译成超过500种语言，全球销量超过2亿册。
            </p>
          </div>
        </HudPanel>

        <HudPanel>
          <div className="p-4">
            <div className="text-sm font-bold text-foreground mb-2">🪐 小行星 B-612</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              🌋 <b className="text-red-400">三座火山</b>——两活一死，小王子每天清扫。<br />
              🌳 <b className="text-green-400">猴面包树</b>——不及时拔除会撑裂星球。<br />
              🌹 <b className="text-red-400">一朵玫瑰</b>——「正是你为玫瑰花费的时间，才使你的玫瑰变得如此重要。」
            </p>
          </div>
        </HudPanel>

        <HudPanel>
          <div className="p-4">
            <div className="text-sm font-bold text-foreground mb-2">🦊 狐狸与驯服</div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              「驯服就是建立联系。如果你驯服了我——我们就会彼此需要。你对我来说是独一无二的，我对你来说也是独一无二的。」<br />
              <b className="text-yellow-300">「只有用心才能看清。重要的东西，用眼睛是看不见的。」</b>
            </p>
          </div>
        </HudPanel>

        <AlertBar tone="success">
          🌹 B-612 不在任何天体物理目录中。它只存在于那些「用心去看」的人的星图里。
          如果你听到星星在笑，你就找对了方向。
        </AlertBar>
      </div>
    </div>
  );
}

function OmphalosDetail({ wp }: { wp: Waypoint }) {
  return (
    <div>
      <LocationHero bg={wp.bg} name="🏛 翁法罗斯·永恒之地" desc="忆庭之镜·虚拟演算世界" />
      <div className="space-y-4 mt-4">
        <AlertBar tone="warning">
          ⚠ 翁法罗斯不存在于物理宇宙。它是一段被「忆庭之镜」记录并演算的虚拟文明——
          居住着黄金裔，他们已被湮灭，但记忆仍在镜中循环播放。
        </AlertBar>
        <HudPanel>
          <div className="p-4">
            <div className="text-sm font-bold text-foreground mb-2">🌍 行星档案</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              <InfoCell label="重力" value={wp.g} />
              <InfoCell label="大气" value={wp.a} />
              <InfoCell label="日长" value={wp.dl} />
              <InfoCell label="原住民" value={wp.nt} />
            </div>
          </div>
        </HudPanel>
        <AlertBar tone="info">
          <b>翁法罗斯关键词：</b>琥珀纪·沙海·黄金裔·忆庭之镜·虚拟演算·湮灭循环。
          在这里，时间不是线性的——每一次日落都是同一次日落的回放。
        </AlertBar>
      </div>
    </div>
  );
}
