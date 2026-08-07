import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useGameStore } from '@/hooks/useGameStore';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { HudPanel, LocationHero, AlertBar } from '@/components/common/Hud';
import { PLANS, PLAN_KEYS } from '@/data/plans';
import { buildWP } from '@/data/waypoints';
import { ERA_DATA, getEra, isTrisolarisRoute } from '@/data/eras';
import { calcPrice, fmtPrice, getCommDelay } from '@/data/pricing';
import { getShip } from '@/data/ships';
import { toast } from 'sonner';
import { CheckCircle2, AlertTriangle, Rocket, Clock, Shield, Wallet } from 'lucide-react';

export default function RoutePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const store = useGameStore();
  const { profile } = store;

  const origin = searchParams.get('o') || '地球（亚洲·海口）';
  const dest = searchParams.get('d') || '';
  const transitStr = searchParams.get('t') || '';
  const transits = useMemo(() => transitStr.split('|').filter(Boolean), [transitStr]);

  const [selectedPlan, setSelectedPlan] = useState('cnsa');
  const [selectedEra, setSelectedEra] = useState<string | null>(null);
  const [riskOpen, setRiskOpen] = useState(false);
  const [riskChecks, setRiskChecks] = useState([false, false, false, false]);
  const [countdown, setCountdown] = useState(10);
  const [eraOpen, setEraOpen] = useState(false);

  const isTrisolaris = useMemo(() => isTrisolarisRoute(origin, transits, dest), [origin, transits, dest]);
  const waypoints = useMemo(() => buildWP(origin, transits, dest), [origin, transits, dest]);
  const ship = getShip(profile?.selected_ship || 'cnsa');
  const shipDiscount = ship.buffType === 'discount' ? ship.buffValue : 0;

  // 进入页面检测三体航线
  useEffect(() => {
    if (isTrisolaris && !selectedEra) setEraOpen(true);
  }, [isTrisolaris, selectedEra]);

  // 倒计时
  useEffect(() => {
    if (!riskOpen) return;
    setCountdown(10);
    const timer = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) { clearInterval(timer); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [riskOpen]);

  const canConfirm = riskChecks.every(Boolean) && countdown === 0;

  const handleConfirm = async () => {
    if (!dest) {
      toast.error('请先设置目的地');
      return;
    }
    setRiskOpen(true);
    setRiskChecks([false, false, false, false]);
  };

  const submitOrder = async () => {
    setRiskOpen(false);
    const order = await store.placeOrder({
      origin, destination: dest, transits, planKey: selectedPlan, waypoints,
    });
    if (order) navigate('/orders');
  };

  const commDelay = dest ? getCommDelay(dest) : { num: '—', loc: '—' };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      {/* 路线可视化 */}
      <HudPanel title="航线规划" className="mb-5">
        {!dest ? (
          <div className="p-8 text-center">
            <div className="text-4xl mb-3 opacity-60">🗺</div>
            <div className="text-base font-semibold text-foreground mb-2">请先设置目的地</div>
            <div className="text-xs text-muted-foreground mb-4">返回首页搜索栏中选择出发地与目的地</div>
            <Button className="btn-mech bg-laser text-primary-foreground" onClick={() => navigate('/')}>返回首页搜索</Button>
          </div>
        ) : (
          <div className="p-4">
            <div className="relative pl-6">
              <div className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {waypoints.map((wp, i) => (
                <div key={i} className="relative pb-4 last:pb-0">
                  <div className={`absolute -left-6 top-1 w-3.5 h-3.5 border-2 ${
                    i === 0 ? 'border-green-500 bg-green-500' : i === waypoints.length - 1 ? 'border-laser bg-laser' : 'border-yellow-500 bg-yellow-500'
                  }`} />
                  <div className="font-semibold text-sm text-foreground">{i === 0 ? '🌍 ' : ''}{wp.n}</div>
                  <div className="text-xs text-muted-foreground">{wp.d}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </HudPanel>

      {dest && (
        <>
          {/* 通讯延迟提示 */}
          <AlertBar tone="info" >
            <div className="flex items-start gap-2">
              <Rocket className="w-4 h-4 mt-0.5 shrink-0" />
              <span>航线：<b className="text-foreground">{origin}</b> → <b className="text-laser">{dest}</b> · 通讯延迟约 <b className="text-laser">{commDelay.num}</b>（{commDelay.loc}）</span>
            </div>
          </AlertBar>

          {/* 三体纪元选择 */}
          {isTrisolaris && (
            <HudPanel title="三体纪元选择" className="mt-5">
              <div className="p-4">
                <AlertBar tone="warning">
                  <b>⚠ 三体航线已检测</b>：需选择目标纪元时间线。不同纪元的三体世界状态不同。
                </AlertBar>
                <div className="mt-3 space-y-2">
                  {ERA_DATA.map((e) => (
                    <button
                      key={e.id}
                      onClick={() => setSelectedEra(e.id)}
                      className={`w-full flex items-center gap-3 p-3 border-l-4 btn-mech transition-colors text-left ${
                        selectedEra === e.id ? 'neon-active bg-muted/60' : 'border-border bg-muted/20 hover:bg-muted/40'
                      }`}
                      style={{ borderLeftColor: e.color }}
                    >
                      <span className="text-2xl">{e.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold" style={{ color: e.color }}>{e.name}</div>
                        <div className="text-[11px] text-muted-foreground">{e.year}</div>
                      </div>
                      {selectedEra === e.id && <CheckCircle2 className="w-4 h-4 text-laser" />}
                    </button>
                  ))}
                </div>
              </div>
            </HudPanel>
          )}

          {/* 飞船方案 */}
          <HudPanel title="飞船方案" className="mt-5">
            <div className="p-3 space-y-2">
              {PLAN_KEYS.map((key) => {
                const plan = PLANS[key];
                const price = calcPrice(key, dest, shipDiscount);
                const shipDef = getShip(key);
                const locked = (profile?.level || 1) < shipDef.unlockLevel && !(store.unlockedShips.some((s) => s.ship_code === key));
                return (
                  <button
                    key={key}
                    disabled={locked}
                    onClick={() => setSelectedPlan(key)}
                    className={`w-full p-3 border flex items-center gap-3 btn-mech transition-colors text-left ${
                      selectedPlan === key ? 'neon-active bg-muted/60' : 'border-border bg-muted/20 hover:bg-muted/40'
                    } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    <span className="text-3xl">{plan.i}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground">{plan.n}</div>
                      <div className="text-[11px] text-muted-foreground">{plan.c} · 辐射{plan.r} · {plan.d}天</div>
                      {locked && <div className="text-[10px] text-red-400">需 Lv.{shipDef.unlockLevel} 解锁</div>}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-laser font-mono-num">{fmtPrice(price)}</div>
                      {shipDef.buffType !== 'discount' && shipDef.buffValue > 0 && (
                        <div className="text-[10px] text-green-400">
                          {shipDef.buffType === 'speed' ? `速度+${Math.round((shipDef.buffValue - 1) * 100)}%` : `XP+${Math.round(shipDef.buffValue * 100)}%`}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </HudPanel>

          {/* 确认下单 */}
          <div className="mt-5 sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border p-4 -mx-4 md:-mx-8">
            <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
              <div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">应付金额</div>
                <div className="text-xl font-bold text-laser font-mono-num text-glow">{fmtPrice(calcPrice(selectedPlan, dest, shipDiscount))}</div>
              </div>
              <Button
                className="btn-mech bg-laser text-primary-foreground hover:bg-laser/90 font-bold px-8"
                onClick={handleConfirm}
              >
                <Shield className="w-4 h-4 mr-1.5" /> 确认风险协议
              </Button>
            </div>
          </div>
        </>
      )}

      {/* 风险协议弹窗 */}
      <Dialog open={riskOpen} onOpenChange={setRiskOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="w-5 h-5 text-yellow-500" /> 星际航行风险知情确认书
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-xs text-muted-foreground">
            <p>航线：<b className="text-foreground">{origin}</b> → <b className="text-laser">{dest}</b>（单向·超远距离）</p>
            <p>通讯延迟：约 <b className="text-laser">{commDelay.num}</b>（{commDelay.loc}）</p>
            <div className="space-y-2">
              {[
                '我已知晓本次航行为单向航行，抵达后无法返程。',
                '我已知晓航行中可能遭遇宇宙事件、辐射波动、时空褶皱等未知风险。',
                '我已知晓休眠舱唤醒存在千分之三的失败率，并已签署基因备案凭证。',
                '我同意遵守《星际远航安全知情确认书》全部条款。',
              ].map((text, i) => (
                <label key={i} className="flex items-start gap-2 cursor-pointer min-h-12">
                  <Checkbox checked={riskChecks[i]} onCheckedChange={(v) => setRiskChecks((prev) => { const n = [...prev]; n[i] = !!v; return n; })} className="mt-0.5" />
                  <span className="leading-relaxed">{text}</span>
                </label>
              ))}
            </div>
            <AlertBar tone="warning">⚠ 三体航线相关风险已特别提示，请谨慎确认。</AlertBar>
          </div>
          <DialogFooter className="flex-col gap-2">
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-muted-foreground">倒计时</span>
              <span className={`font-mono-num font-bold ${countdown === 0 ? 'text-green-400' : 'text-laser'}`}>
                {countdown === 0 ? '就绪' : countdown + 's'}
              </span>
            </div>
            <div className="flex gap-2 w-full">
              <Button variant="outline" className="flex-1 btn-mech" onClick={() => setRiskOpen(false)}>取消</Button>
              <Button
                className="flex-1 btn-mech bg-laser text-primary-foreground hover:bg-laser/90"
                disabled={!canConfirm}
                onClick={submitOrder}
              >
                <Rocket className="w-4 h-4 mr-1.5" /> 确认下单
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 三体纪元弹窗 */}
      <Dialog open={eraOpen} onOpenChange={setEraOpen}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">⚠ 三体航线检测</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-muted-foreground">
            <p>你的航线指向<b className="text-laser">比邻星·三体世界</b>。三体世界存在于多个时间线中。</p>
            <p>请在下方选择你想访问的纪元，不同纪元的三体世界处于不同的状态。</p>
          </div>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {ERA_DATA.map((e) => (
              <button
                key={e.id}
                onClick={() => { setSelectedEra(e.id); setEraOpen(false); toast.success(`已选择纪元：${e.name}`); }}
                className="w-full flex items-center gap-3 p-2.5 border-l-4 btn-mech hover:bg-muted/40 text-left"
                style={{ borderLeftColor: e.color }}
              >
                <span className="text-xl">{e.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold" style={{ color: e.color }}>{e.name}</div>
                  <div className="text-[11px] text-muted-foreground">{e.year}</div>
                </div>
                <span className="text-muted-foreground">›</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
