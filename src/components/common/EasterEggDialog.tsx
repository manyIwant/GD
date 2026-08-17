import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

// 致敬《银河帝国/基地》与《三体》的宇宙密语彩蛋
const WHISPERS = [
  { tag: '基地', text: '心理史学已预测到你的到来。在川陀的穹顶之下，谢顿的危机纪元正在缓缓展开……' },
  { tag: '基地', text: '银河帝国终将倾覆，但文明的火种已在端点星点燃。愿端点星的光，照亮黑暗的纪元。' },
  { tag: '基地', text: '川陀，那颗覆盖整个星球的钢铁都市，曾统治万亿生灵。如今，只剩风穿过空荡的穹顶。' },
  { tag: '三体', text: '不要回答！不要回答！不要回答！——来自 1379 号监听员的最后警告。' },
  { tag: '三体', text: '宇宙是一座黑暗森林，每个文明都是带枪的猎人。沉默，是唯一的生存法则。' },
  { tag: '三体', text: '面壁者，我是你的破壁人。你的每一个念头，我都已洞悉。' },
  { tag: '三体', text: '水滴正在逼近，它的表面光滑得像一面镜子，却足以贯穿整支舰队。' },
  { tag: '三体', text: '给岁月以文明，而不是给文明以岁月。' },
  { tag: '三体', text: '弱小和无知不是生存的障碍，傲慢才是。' },
  { tag: '基地', text: '第一法则：机器人不得伤害人类个体，或因不作为使人类个体受到伤害。' },
];

export default function EasterEggDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [whisper, setWhisper] = useState(WHISPERS[0]);

  useEffect(() => {
    if (open) setWhisper(WHISPERS[Math.floor(Math.random() * WHISPERS.length)]);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[calc(100%-2rem)] md:max-w-md bg-card border-laser">
        <DialogHeader>
          <DialogTitle className="text-laser flex items-center gap-2">
            <Sparkles className="w-5 h-5" /> 隐藏的宇宙密语
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="inline-block px-2 py-0.5 border border-laser/50 text-[10px] text-laser tracking-wider">
            致敬 · {whisper.tag}
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed text-pretty italic">
            「{whisper.text}」
          </p>
          <p className="text-[11px] text-muted-foreground text-pretty">
            ✨ 你发现了开发者埋下的彩蛋。在浩瀚星海中，总有一些秘密，只留给愿意反复探寻的航行员。
          </p>
        </div>
        <DialogFooter>
          <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90" onClick={onClose}>
            收下这份密语
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}