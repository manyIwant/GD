import { useGameStore } from '@/hooks/useGameStore';
import { HudPanel, EmptyState } from '@/components/common/Hud';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fmtLY, findDestination } from '@/data/pricing';
import { findWaypoint } from '@/data/waypoints';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen, MapPin, Clock, Rocket, Download, Printer, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { downloadPostcard, printPostcard, drawPostcard } from '@/lib/postcard';
import type { FlightLogRow } from '@/types/types';
import { useEffect, useRef, useState } from 'react';

export default function LogsPage() {
  const store = useGameStore();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { flightLogs } = store;
  const [previewLog, setPreviewLog] = useState<FlightLogRow | null>(null);

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-laser" /> 飞行日志
        </h1>
        <span className="text-xs text-muted-foreground">共 {flightLogs.length} 条记录</span>
      </div>

      {flightLogs.length === 0 ? (
        <EmptyState
          icon="📖"
          title="还没有星际明信片"
          desc="完成一次星际航行后，系统会自动为你生成一张专属明信片"
          action={<Button className="btn-mech bg-laser text-primary-foreground" onClick={() => navigate('/route')}>搜索航线</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {flightLogs.map((log, i) => <Postcard key={log.id} log={log} index={i} onPreview={() => setPreviewLog(log)} />)}
        </div>
      )}

      {/* 明信片预览弹窗 */}
      <Dialog open={!!previewLog} onOpenChange={(v) => !v && setPreviewLog(null)}>
        <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-border p-0 overflow-hidden">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Rocket className="w-5 h-5 text-laser" /> 星际明信片
            </DialogTitle>
          </DialogHeader>
          <div className="px-4 pb-4 space-y-3">
            <PostcardCanvas log={previewLog} username={profile?.username || undefined} />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 btn-mech" onClick={() => { if (previewLog) { printPostcard(previewLog, profile?.username || undefined); toast.success('已发送至打印'); } }}>
                <Printer className="w-4 h-4 mr-1.5" /> 打印
              </Button>
              <Button className="flex-1 btn-mech bg-laser text-primary-foreground" onClick={() => { if (previewLog) { downloadPostcard(previewLog, profile?.username || undefined); toast.success('明信片已下载'); } }}>
                <Download className="w-4 h-4 mr-1.5" /> 下载图片
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// 预览用 Canvas 渲染
function PostcardCanvas({ log, username }: { log: FlightLogRow | null; username?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (log && canvasRef.current) {
      drawPostcard(canvasRef.current, log, username);
    }
  }, [log, username]);
  if (!log) return null;
  return (
    <div className="w-full aspect-[2/3] bg-[#03040a] border border-border overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" style={{ imageRendering: 'auto' }} />
    </div>
  );
}

function Postcard({ log, index, onPreview }: { log: FlightLogRow; index: number; onPreview: () => void }) {
  const wp = findWaypoint(log.destination);
  const dest = findDestination(log.destination);
  const date = new Date(log.arrived_at);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <HudPanel>
        <div className="relative h-32 overflow-hidden border-b border-border">
          <div className={`absolute inset-0 ${wp.bg}`} />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute top-2 right-2 text-[9px] text-muted-foreground font-mono-num bg-background/70 px-1.5 py-0.5">
            #{String(index + 1).padStart(3, '0')}
          </div>
          <div className="absolute bottom-2 left-3 flex items-center gap-2">
            <span className="text-lg">{dest?.emoji || '🪐'}</span>
            <div className="text-sm font-bold text-foreground text-glow">{log.destination}</div>
          </div>
          <div className="absolute bottom-2 right-3 text-2xl">📮</div>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Rocket className="w-3 h-3" /> {log.ship_name}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-3 h-3" /> {fmtLY(log.light_years)} 光年
            </div>
            <div className="flex items-center gap-1 text-muted-foreground">
              <Clock className="w-3 h-3" /> {date.toLocaleDateString('zh-CN')}
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-border/60 text-[11px] text-muted-foreground italic">
            「抵达这片未知的世界，写下属于你的星际印记。」
          </div>
          <div className="mt-2 flex gap-2">
            <Button variant="outline" size="sm" className="flex-1 btn-mech text-xs" onClick={onPreview}>
              <Eye className="w-3.5 h-3.5 mr-1" /> 预览
            </Button>
            <Button size="sm" className="flex-1 btn-mech bg-laser text-primary-foreground text-xs" onClick={() => { downloadPostcard(log); toast.success('明信片已下载'); }}>
              <Download className="w-3.5 h-3.5 mr-1" /> 下载
            </Button>
          </div>
        </div>
      </HudPanel>
    </motion.div>
  );
}
