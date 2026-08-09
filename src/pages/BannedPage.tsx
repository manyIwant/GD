import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { appealUnban } from '@/services/api';
import { fetchRandomQuiz } from '@/data/quizQuestions';
import type { AppealQuestion } from '@/data/quizQuestions';
import { ShieldAlert, Gavel, AlertTriangle, CheckCircle2, XCircle, RotateCcw, LogOut } from 'lucide-react';
import Starfield from '@/components/common/Starfield';

export default function BannedPage() {
  const { profile, signOut, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<'notice' | 'quiz' | 'result'>('notice');
  const [questions, setQuestions] = useState<AppealQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ pass: boolean; remaining: number } | null>(null);

  useEffect(() => {
    // 若已解封，自动跳回首页
    if (profile && !profile.banned) navigate('/', { replace: true });
  }, [profile, navigate]);

  const loadQuiz = useCallback(async () => {
    try {
      const q = await fetchRandomQuiz();
      setQuestions(q);
      setAnswers({});
    } catch {
      toast.error('题库加载失败，请重试');
    }
  }, []);

  const bannedAt = profile?.banned_at ? new Date(profile.banned_at) : null;
  const remaining = profile?.appeal_chances ?? 0;

  const allAnswered = questions.length > 0 && questions.every((q) => answers[q.id] !== undefined);

  const submit = async () => {
    if (!allAnswered) { toast.error('请完成所有题目'); return; }
    setSubmitting(true);
    try {
      const payload = questions.map((q) => ({ id: q.id, answer: answers[q.id] === 'true' }));
      const res = await appealUnban(payload);
      setResult({ pass: true, remaining: res.remaining });
      setStep('result');
      await refreshProfile();
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('答题未通过')) {
        setResult({ pass: false, remaining });
        setStep('result');
      } else if (msg.includes('机会已用完')) {
        toast.error('解封机会已用完，请联系管理员');
      } else {
        toast.error(msg || '提交失败，请重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-[#0a0612] p-4">
      <Starfield className="absolute inset-0 pointer-events-none" density={140} />
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(220,38,38,0.10) 0%, transparent 70%)' }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* 头部警示条 */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 flex items-center justify-center bg-red-500/20 border-2 border-red-500/60 shrink-0"
            style={{ boxShadow: '0 0 20px rgba(220,38,38,0.3)' }}>
            <ShieldAlert className="w-7 h-7 text-red-400" />
          </div>
          <div>
            <div className="text-[10px] tracking-[0.3em] text-red-400/70 uppercase font-mono">ACCOUNT SUSPENDED</div>
            <h1 className="text-xl md:text-2xl font-bold text-red-300 text-balance">账号已被封禁</h1>
          </div>
        </div>

        <div className="bg-card/90 backdrop-blur-xl border border-red-500/30 overflow-hidden">
          <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.8), transparent)' }} />

          {step === 'notice' && (
            <div className="p-6 space-y-5">
              {/* 封禁信息 */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-foreground">
                  <Gavel className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-muted-foreground">封禁时间：</span>
                  <span className="font-mono-num">
                    {bannedAt ? bannedAt.toLocaleString('zh-CN') : '未知'}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                  <span className="text-muted-foreground">封禁原因：</span>
                  <span className="text-red-300">{profile?.ban_reason || '违反星际客运公约'}</span>
                </div>
                <div className="flex items-center gap-2 text-foreground">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-muted-foreground">剩余解封机会：</span>
                  <span className={`font-mono-num font-bold ${remaining > 0 ? 'text-amber-400' : 'text-red-400'}`}>
                    {remaining} / 3
                  </span>
                </div>
              </div>

              {/* 警告 */}
              <div className="border border-amber-500/30 bg-amber-500/5 p-3 space-y-1.5">
                <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" /> 警告
                </div>
                <ul className="text-[11px] text-muted-foreground leading-relaxed space-y-1 list-disc pl-4 text-pretty">
                  <li>请认真阅读《星际客运公约》，违规行为将影响你的航行权限。</li>
                  <li>每位航行员共有 3 次答题解封机会，全部用完需联系管理员。</li>
                  <li>请勿使用外挂、脚本或第三方工具刷取数据，一经发现从严处理。</li>
                  <li>恶意刷单、虚假下单套利均属作弊行为。</li>
                </ul>
              </div>

              <div className="flex gap-3">
                {remaining > 0 ? (
                  <Button className="flex-1 btn-mech bg-amber-500/80 text-white hover:bg-amber-500 font-bold"
                    onClick={() => { loadQuiz(); setStep('quiz'); }}>
                    申请答题解封
                  </Button>
                ) : (
                  <div className="flex-1 text-center py-2 border border-red-500/40 bg-red-500/10 text-red-400 text-sm font-bold">
                    解封机会已用完，请联系管理员
                  </div>
                )}
                <Button variant="outline" className="btn-mech border-border text-muted-foreground hover:text-foreground"
                  onClick={async () => { await signOut(); navigate('/login', { replace: true }); }}>
                  <LogOut className="w-4 h-4 mr-1" /> 退出登录
                </Button>
              </div>
            </div>
          )}

          {step === 'quiz' && (
            <div className="p-6 space-y-5">
              <div className="text-xs text-muted-foreground text-pretty">
                请认真完成以下合规问卷（共 {questions.length} 题，全部答对方可解封）。本次为第
                <span className="text-amber-400 font-bold"> {4 - remaining} </span>
                次解封，剩余
                <span className="text-amber-400 font-bold"> {remaining} </span>
                次机会。
              </div>

              <div className="border border-amber-500/30 bg-amber-500/5 p-2.5 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-muted-foreground text-pretty">
                  题目随机抽取，请逐题认真作答。任何一题答错均视为未通过，将消耗一次解封机会。
                </span>
              </div>

              <div className="space-y-4 max-h-[46vh] overflow-y-auto pr-1">
                {questions.map((q, idx) => (
                  <div key={q.id} className="border border-border/60 bg-background/40 p-3">
                    <div className="text-sm text-foreground mb-2 text-pretty">
                      <span className="text-laser font-bold mr-1">{idx + 1}.</span>{q.question}
                    </div>
                    <RadioGroup
                      value={answers[q.id] ?? ''}
                      onValueChange={(v) => setAnswers((prev) => ({ ...prev, [q.id]: v }))}
                      className="flex gap-4"
                    >
                      <div className="flex items-center gap-1.5 min-h-8">
                        <RadioGroupItem value="true" id={`q${q.id}-t`} />
                        <Label htmlFor={`q${q.id}-t`} className="text-xs text-green-400 cursor-pointer">正确</Label>
                      </div>
                      <div className="flex items-center gap-1.5 min-h-8">
                        <RadioGroupItem value="false" id={`q${q.id}-f`} />
                        <Label htmlFor={`q${q.id}-f`} className="text-xs text-red-400 cursor-pointer">错误</Label>
                      </div>
                    </RadioGroup>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button variant="outline" className="btn-mech border-border text-muted-foreground hover:text-foreground"
                  onClick={() => setStep('notice')}>
                  返回
                </Button>
                <Button className="flex-1 btn-mech bg-laser text-primary-foreground hover:bg-laser/90 font-bold"
                  disabled={!allAnswered || submitting}
                  onClick={submit}>
                  {submitting ? '提交中…' : '提交答卷'}
                </Button>
              </div>
            </div>
          )}

          {step === 'result' && result && (
            <div className="p-6 text-center space-y-4">
              {result.pass ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-green-400 mx-auto" />
                  <div className="text-lg font-bold text-green-400">申诉通过，账号已解封</div>
                  <p className="text-xs text-muted-foreground text-pretty">
                    你的账号已恢复航行权限。本次为第 {4 - result.remaining} 次解封，剩余 {result.remaining} 次机会。
                    请遵守公约，珍惜航行资格。
                  </p>
                  <Button className="w-full btn-mech bg-laser text-primary-foreground hover:bg-laser/90 font-bold"
                    onClick={() => navigate('/', { replace: true })}>
                    进入星际客运
                  </Button>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 text-red-400 mx-auto" />
                  <div className="text-lg font-bold text-red-400">答题未通过</div>
                  <p className="text-xs text-muted-foreground text-pretty">
                    你的答卷存在错误，请重新作答。剩余解封机会：{result.remaining} / 3。
                  </p>
                  <Button className="w-full btn-mech bg-amber-500/80 text-white hover:bg-amber-500 font-bold"
                    onClick={() => { setResult(null); loadQuiz(); setStep('quiz'); }}>
                    <RotateCcw className="w-4 h-4 mr-1" /> 重新答题
                  </Button>
                </>
              )}
            </div>
          )}

          <div className="h-0.5" style={{ background: 'linear-gradient(90deg, transparent, rgba(220,38,38,0.8), transparent)' }} />
        </div>

        <div className="mt-4 text-center text-[10px] text-muted-foreground/40 font-mono-num">
          ISC SAFETY & COMPLIANCE · APPEAL TERMINAL
        </div>
      </div>
    </div>
  );
}