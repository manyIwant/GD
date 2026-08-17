import { useState, useEffect, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Button } from '@/components/ui/button';
import { useGameStore } from '@/hooks/useGameStore';
import { toast } from 'sonner';
import { Target, Clock, AlertTriangle, Sparkles, Rocket, X } from 'lucide-react';

// ===== 情节定义（10 个独立场景）=====
interface Scenario {
  id: string;
  title: string;
  desc: string;
  instruction: string;
  kind: string;
  target: number;
  duration: number;
  goodLabel: string;
  badLabel: string;
}

const SCENARIOS: Scenario[] = [
  { id: 'meteor', title: '陨石风暴', desc: '飞船遭遇密集陨石带，来袭陨石正高速逼近！', instruction: '点击橙色陨石将其摧毁，别让它们撞上飞船！', kind: 'meteor', target: 8, duration: 15, goodLabel: '能量晶核', badLabel: '陨石' },
  { id: 'mining', title: '深空采矿', desc: '小行星带蕴藏稀有矿物，为舰队补充宝贵资源。', instruction: '点击青色矿物进行采集，避开灰暗的废渣！', kind: 'crystal', target: 10, duration: 15, goodLabel: '稀有矿物', badLabel: '废渣' },
  { id: 'intel', title: '情报收集', desc: '截获散落于星海的加密数据包，破译星际情报。', instruction: '点击绿色数据包收集情报，小心红色病毒程序！', kind: 'data', target: 10, duration: 14, goodLabel: '数据包', badLabel: '病毒' },
  { id: 'energy', title: '能量补给', desc: '漂浮的等离子能量球可为引擎充能，抓紧收集！', instruction: '点击黄色能量球充能，远离紫色不稳定粒子！', kind: 'energy', target: 9, duration: 14, goodLabel: '能量球', badLabel: '不稳定粒子' },
  { id: 'asteroid', title: '小行星规避', desc: '前方出现巨型小行星群，精准击碎含矿陨石。', instruction: '点击青色含矿陨石获取资源，躲避灰色岩石！', kind: 'asteroid', target: 9, duration: 15, goodLabel: '含矿陨石', badLabel: '岩石' },
  { id: 'nebula', title: '星云穿越', desc: '绚烂星云中蕴藏稀有气体样本，小心辐射！', instruction: '点击紫色气体云采集样本，避开红色辐射团！', kind: 'nebula', target: 8, duration: 15, goodLabel: '气体样本', badLabel: '辐射团' },
  { id: 'wreckage', title: '残骸回收', desc: '古战场散落着失落的飞船残骸，寻找珍贵遗物。', instruction: '点击金色残骸回收，避开红色爆炸碎片！', kind: 'wreckage', target: 9, duration: 14, goodLabel: '飞船残骸', badLabel: '爆炸碎片' },
  { id: 'signal', title: '信号追踪', desc: '追踪神秘的求救信号源，定位散落的信标。', instruction: '点击蓝色信标定位信号，远离粉色干扰源！', kind: 'signal', target: 8, duration: 14, goodLabel: '信标', badLabel: '干扰源' },
  { id: 'ice', title: '冰晶采集', desc: '彗星尾部凝结着纯净冰晶，可补充冷却剂。', instruction: '点击白色冰晶采集，避开蓝色冻结碎片！', kind: 'ice', target: 10, duration: 15, goodLabel: '纯净冰晶', badLabel: '冻结碎片' },
  { id: 'plasma', title: '等离子风暴', desc: '闯入等离子风暴中心，捕获高能粒子！', instruction: '点击粉色等离子体捕获，避开紫色湍流！', kind: 'plasma', target: 9, duration: 15, goodLabel: '等离子体', badLabel: '湍流' },
];

// ===== 场景视觉配置 =====
const KINDS: Record<string, { goodGeo: string; badGeo: string; goodColor: string; badColor: string }> = {
  meteor: { goodGeo: 'sphere', badGeo: 'dodecahedron', goodColor: '#fbbf24', badColor: '#f97316' },
  crystal: { goodGeo: 'octahedron', badGeo: 'tetrahedron', goodColor: '#22d3ee', badColor: '#6b7280' },
  data: { goodGeo: 'box', badGeo: 'torus', goodColor: '#4ade80', badColor: '#ef4444' },
  energy: { goodGeo: 'sphere', badGeo: 'cone', goodColor: '#facc15', badColor: '#a855f7' },
  asteroid: { goodGeo: 'octahedron', badGeo: 'icosahedron', goodColor: '#2dd4bf', badColor: '#78716c' },
  nebula: { goodGeo: 'sphere', badGeo: 'torusKnot', goodColor: '#c084fc', badColor: '#f43f5e' },
  wreckage: { goodGeo: 'box', badGeo: 'dodecahedron', goodColor: '#f59e0b', badColor: '#dc2626' },
  signal: { goodGeo: 'cone', badGeo: 'sphere', goodColor: '#38bdf8', badColor: '#f472b6' },
  ice: { goodGeo: 'octahedron', badGeo: 'box', goodColor: '#e0f2fe', badColor: '#93c5fd' },
  plasma: { goodGeo: 'sphere', badGeo: 'torusKnot', goodColor: '#f472b6', badColor: '#8b5cf6' },
};

interface GameObj {
  id: number;
  type: 'good' | 'bad';
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
}

let objId = 0;

function makeObject(): GameObj {
  const type = Math.random() < 0.65 ? 'good' : 'bad';
  return {
    id: ++objId,
    type,
    x: (Math.random() - 0.5) * 9,
    y: (Math.random() - 0.5) * 5,
    z: -6 - Math.random() * 3,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.4,
    vz: 1.6 + Math.random() * 2.2,
  };
}

// ===== 几何体渲染 =====
function Geo({ kind }: { kind: string }) {
  switch (kind) {
    case 'sphere': return <sphereGeometry args={[0.4, 16, 16]} />;
    case 'octahedron': return <octahedronGeometry args={[0.45]} />;
    case 'tetrahedron': return <tetrahedronGeometry args={[0.55]} />;
    case 'box': return <boxGeometry args={[0.6, 0.6, 0.6]} />;
    case 'cone': return <coneGeometry args={[0.4, 0.7, 8]} />;
    case 'torus': return <torusGeometry args={[0.3, 0.12, 8, 16]} />;
    case 'dodecahedron': return <dodecahedronGeometry args={[0.5]} />;
    case 'icosahedron': return <icosahedronGeometry args={[0.5]} />;
    case 'torusKnot': return <torusKnotGeometry args={[0.25, 0.08, 40, 8]} />;
    default: return <sphereGeometry args={[0.4, 16, 16]} />;
  }
}

// ===== 单个飞行物 =====
function GameObject({ obj, kind, onGood, onBad, onExpire }: {
  obj: GameObj; kind: string;
  onGood: (id: number) => void; onBad: (id: number) => void; onExpire: (id: number) => void;
}) {
  const ref = useRef<THREE.Mesh>(null);
  const pos = useRef(new THREE.Vector3(obj.x, obj.y, obj.z));
  const vel = useRef(new THREE.Vector3(obj.vx, obj.vy, obj.vz));
  const life = useRef(0);
  const expired = useRef(false);
  const conf = KINDS[kind];
  const geoKind = obj.type === 'good' ? conf.goodGeo : conf.badGeo;
  const color = obj.type === 'good' ? conf.goodColor : conf.badColor;

  useFrame((_, delta) => {
    const d = Math.min(delta, 0.05);
    pos.current.addScaledVector(vel.current, d);
    life.current += d;
    if (ref.current) {
      ref.current.position.copy(pos.current);
      ref.current.rotation.x += d * 1.5;
      ref.current.rotation.y += d * 2;
    }
    if (!expired.current && (pos.current.z > 7 || life.current > 6)) {
      expired.current = true;
      onExpire(obj.id);
    }
  });

  return (
    <mesh
      ref={ref}
      onClick={(e) => {
        e.stopPropagation();
        if (obj.type === 'good') onGood(obj.id);
        else onBad(obj.id);
      }}
    >
      <Geo kind={geoKind} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={obj.type === 'good' ? 0.8 : 0.5}
        transparent
        opacity={0.92}
        roughness={0.3}
        metalness={0.4}
      />
    </mesh>
  );
}

// ===== 玩家飞船核心 =====
function PlayerShip() {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, d) => {
    if (ref.current) {
      ref.current.rotation.y += d * 0.6;
      ref.current.rotation.z += d * 0.3;
    }
  });
  return (
    <group ref={ref}>
      <mesh>
        <octahedronGeometry args={[0.7]} />
        <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.9} wireframe />
      </mesh>
      <mesh>
        <torusGeometry args={[1.2, 0.035, 8, 48]} />
        <meshStandardMaterial color="#67e8f9" emissive="#22d3ee" emissiveIntensity={0.7} />
      </mesh>
    </group>
  );
}

// ===== 3D 场景 =====
function EventScene({ kind, objects, onGood, onBad, onExpire }: {
  kind: string; objects: GameObj[];
  onGood: (id: number) => void; onBad: (id: number) => void; onExpire: (id: number) => void;
}) {
  return (
    <>
      <fog attach="fog" args={['#05060a', 7, 20]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 0, 5]} intensity={2.2} color="#67e8f9" />
      <pointLight position={[4, 3, 2]} intensity={1.2} color="#a855f7" />
      <pointLight position={[-4, -2, 1]} intensity={0.8} color="#f472b6" />
      <Stars radius={60} depth={30} count={2200} factor={4} fade speed={1} />
      <PlayerShip />
      {objects.map((o) => (
        <GameObject key={o.id} obj={o} kind={kind} onGood={onGood} onBad={onBad} onExpire={onExpire} />
      ))}
    </>
  );
}

// ===== 主组件 =====
export default function SpecialEventModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const store = useGameStore();
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [phase, setPhase] = useState<'intro' | 'playing' | 'result'>('intro');
  const [objects, setObjects] = useState<GameObj[]>([]);
  const [score, setScore] = useState(0);
  const [fail, setFail] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [win, setWin] = useState(false);

  const scoreRef = useRef(0);
  const failRef = useRef(0);
  const endedRef = useRef(false);

  const REWARD_XP = 160;
  const REWARD_BALANCE = 1200;

  // 打开时随机选择情节
  useEffect(() => {
    if (open) {
      const s = SCENARIOS[Math.floor(Math.random() * SCENARIOS.length)];
      setScenario(s);
      setPhase('intro');
      setObjects([]);
      setScore(0); setFail(0); setTimeLeft(s.duration);
      scoreRef.current = 0; failRef.current = 0; endedRef.current = false;
    }
  }, [open]);

  const endGame = useCallback((isWin: boolean) => {
    if (endedRef.current) return;
    endedRef.current = true;
    setWin(isWin);
    setPhase('result');
    if (isWin) {
      store.addXp(REWARD_XP);
      store.recharge(REWARD_BALANCE);
      toast.success('🎉 特殊事件达成！', { description: `奖励：+${REWARD_XP} XP · +${REWARD_BALANCE} 信用点` });
    } else {
      store.addXp(30);
      toast.error('💔 特殊事件未达成', { description: '获得少量经验补偿' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeObj = useCallback((id: number) => {
    setObjects((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const onGood = useCallback((id: number) => {
    setScore((s) => { scoreRef.current = s + 1; return s + 1; });
    removeObj(id);
    if (scenario && scoreRef.current >= scenario.target) endGame(true);
  }, [removeObj, scenario, endGame]);

  const onBad = useCallback((id: number) => {
    setFail((f) => {
      const next = f + 1;
      failRef.current = next;
      return next;
    });
    removeObj(id);
    if (failRef.current + 1 >= 3) endGame(false);
  }, [removeObj, endGame]);

  // 生成飞行物
  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => {
      setObjects((prev) => (prev.length >= 14 ? prev : [...prev, makeObject()]));
    }, 650);
    return () => clearInterval(t);
  }, [phase]);

  // 倒计时
  useEffect(() => {
    if (phase !== 'playing') return;
    const t = setInterval(() => {
      setTimeLeft((c) => {
        if (c <= 1) {
          clearInterval(t);
          endGame(scoreRef.current >= (scenario?.target ?? 999));
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [phase, scenario, endGame]);

  if (!open || !scenario) return null;

  const conf = KINDS[scenario.kind];
  const pct = Math.min(100, (score / scenario.target) * 100);

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm flex flex-col">
      {/* 顶部标题栏 */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-laser/30 bg-background/80 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-laser shrink-0" />
          <span className="text-sm font-bold text-laser truncate">特殊事件 · {scenario.title}</span>
        </div>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground shrink-0 p-1">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 主体 */}
      <div className="flex-1 relative min-h-0">
        {phase === 'intro' && (
          <div className="absolute inset-0 flex items-center justify-center p-4 overflow-y-auto">
            <div className="w-full max-w-md bg-card border border-laser/50 p-6">
              <div className="text-center mb-4">
                <div className="text-3xl mb-2">🛸</div>
                <h2 className="text-lg font-bold text-laser mb-1">{scenario.title}</h2>
                <p className="text-xs text-muted-foreground leading-relaxed text-pretty">{scenario.desc}</p>
              </div>
              <div className="p-3 bg-muted/30 border-l-2 border-laser mb-4">
                <p className="text-xs text-foreground/90 leading-relaxed text-pretty">{scenario.instruction}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="p-2 border border-border text-center">
                  <div className="w-4 h-4 mx-auto mb-1" style={{ background: conf.goodColor }} />
                  <div className="text-[10px] text-muted-foreground">收集</div>
                  <div className="text-xs font-bold text-foreground">{scenario.goodLabel}</div>
                </div>
                <div className="p-2 border border-border text-center">
                  <div className="w-4 h-4 mx-auto mb-1" style={{ background: conf.badColor }} />
                  <div className="text-[10px] text-muted-foreground">避开</div>
                  <div className="text-xs font-bold text-foreground">{scenario.badLabel}</div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Target className="w-3 h-3" />目标 {scenario.target} 个</span>
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{scenario.duration} 秒</span>
                <span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3" />失误上限 2 次</span>
              </div>
              <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={() => setPhase('playing')}>
                <Rocket className="w-4 h-4 mr-1" /> 进入事件
              </Button>
            </div>
          </div>
        )}

        {phase === 'playing' && (
          <>
            <Canvas
              className="absolute inset-0"
              camera={{ position: [0, 0, 8], fov: 60 }}
              dpr={[1, 2]}
              gl={{ antialias: true }}
            >
              <EventScene kind={scenario.kind} objects={objects} onGood={onGood} onBad={onBad} onExpire={removeObj} />
            </Canvas>

            {/* HUD 叠层 */}
            <div className="absolute top-0 left-0 right-0 p-3 pointer-events-none">
              <div className="flex items-center gap-3 text-xs">
                <div className="bg-background/70 border border-laser/40 px-2 py-1 flex items-center gap-1">
                  <Target className="w-3 h-3 text-laser" />
                  <span className="text-foreground font-mono-num">{score}/{scenario.target}</span>
                </div>
                <div className="flex-1 h-2 bg-background/70 border border-border overflow-hidden">
                  <div className="h-full bg-laser laser-line transition-all" style={{ width: `${pct}%` }} />
                </div>
                <div className="bg-background/70 border border-laser/40 px-2 py-1 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-laser" />
                  <span className="text-foreground font-mono-num">{timeLeft}s</span>
                </div>
              </div>
              <div className="flex items-center gap-1 mt-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className={`w-4 h-1 ${i < fail ? 'bg-red-500' : 'bg-muted'}`} />
                ))}
                <span className="text-[10px] text-muted-foreground ml-1">失误 {fail}/3</span>
              </div>
            </div>
          </>
        )}

        {phase === 'result' && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-card border border-laser/50 p-6 text-center">
              <div className="text-5xl mb-3">{win ? '🏆' : '💔'}</div>
              <h2 className={`text-lg font-bold mb-1 ${win ? 'text-green-400' : 'text-red-400'}`}>
                {win ? '事件达成！' : '事件未达成'}
              </h2>
              <p className="text-xs text-muted-foreground mb-4 text-pretty">
                {win
                  ? `你成功完成了「${scenario.title}」，获得丰厚奖励！`
                  : `「${scenario.title}」未能完成，但你的勇气值得嘉奖。`}
              </p>
              <div className="p-3 bg-muted/30 border border-border mb-4">
                <div className="text-[11px] text-muted-foreground">本次收获</div>
                <div className="text-sm font-bold text-laser font-mono-num mt-1">
                  +{win ? REWARD_XP : 30} XP · +{win ? REWARD_BALANCE : 0} 信用点
                </div>
              </div>
              <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={onClose}>
                返回航行
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}