import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { fetchBottleThread } from '@/services/api';
import type { DriftBottle } from '@/types/types';
import { Heart, Send, Waves, User } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  bottle: DriftBottle | null;
  open: boolean;
  onClose: () => void;
  onReply: (parentId: string, content: string) => Promise<boolean>;
  onLike: (bottleId: string) => Promise<number | null>;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
  return d.toLocaleDateString('zh-CN');
}

export default function DriftBottleDialog({ bottle, open, onClose, onReply, onLike }: Props) {
  const [replies, setReplies] = useState<DriftBottle[]>([]);
  const [likes, setLikes] = useState(0);
  const [liked, setLiked] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);

  const loadThread = useCallback(async () => {
    if (!bottle) return;
    const { replies: r } = await fetchBottleThread(bottle.id);
    setReplies(r);
    setLikes(bottle.likes ?? 0);
    setLiked(false);
  }, [bottle]);

  useEffect(() => {
    if (open && bottle) loadThread();
  }, [open, bottle, loadThread]);

  if (!bottle) return null;

  const handleLike = async () => {
    if (liked) return;
    const n = await onLike(bottle.id);
    if (n !== null) { setLikes(n); setLiked(true); }
  };

  const handleReply = async () => {
    if (!replyText.trim()) { toast.error('请输入回复内容'); return; }
    setSending(true);
    const ok = await onReply(bottle.id, replyText.trim());
    setSending(false);
    if (ok) {
      setReplyText('');
      await loadThread();
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-laser max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-laser flex items-center gap-2">
            <Waves className="w-5 h-5" /> 拾起的漂流瓶
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          {/* 漂流瓶内容 */}
          <div className="p-3 border border-laser/40 bg-laser/5">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 bg-muted border border-border flex items-center justify-center text-xs shrink-0">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-foreground truncate">{bottle.sender_username || '匿名航行员'}</div>
                <div className="text-[10px] text-muted-foreground">{fmtTime(bottle.created_at)}</div>
              </div>
            </div>
            <p className="text-sm text-foreground/90 leading-relaxed text-pretty break-words">{bottle.content}</p>
            <button onClick={handleLike} className={`mt-2 flex items-center gap-1 text-xs btn-mech ${liked ? 'text-red-400' : 'text-muted-foreground hover:text-red-400'}`}>
              <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-red-400' : ''}`} /> {likes}
            </button>
          </div>

          {/* 回复列表 */}
          {replies.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">回应 ({replies.length})</div>
              {replies.map((r) => (
                <div key={r.id} className="p-2 border-l-2 border-border bg-muted/20">
                  <div className="text-[10px] text-muted-foreground mb-0.5">{r.sender_username || '匿名航行员'} · {fmtTime(r.created_at)}</div>
                  <p className="text-xs text-foreground/80 break-words text-pretty">{r.content}</p>
                </div>
              ))}
            </div>
          )}

          {/* 回复输入 */}
          <div className="space-y-2">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="写下你的回应，它可能穿越星海被对方拾起…"
              className="w-full min-h-[64px] bg-background border border-border p-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-laser btn-mech resize-none"
              maxLength={500}
            />
            <Button onClick={handleReply} disabled={sending} className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90">
              <Send className="w-4 h-4 mr-1" /> {sending ? '寄出中…' : '寄出回应'}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="w-full btn-mech" onClick={onClose}>关闭</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}