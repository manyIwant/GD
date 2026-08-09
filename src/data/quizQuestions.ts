// 封号申诉答题问卷：从云端题库随机抽取
export interface AppealQuestion {
  id: number;
  question: string;
  correct: boolean;
}

import { supabase } from '@/db/supabase';

const QUIZ_COUNT = 5;

// 从云端题库随机抽取指定数量的题目
export async function fetchRandomQuiz(): Promise<AppealQuestion[]> {
  const { data, error } = await supabase.from('appeal_questions').select('id, question, correct');
  if (error || !data || data.length === 0) {
    // 兜底：使用内置题目
    return FALLBACK_QUIZ;
  }
  const pool = data as AppealQuestion[];
  // Fisher-Yates 洗牌后取前 QUIZ_COUNT 个
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(QUIZ_COUNT, shuffled.length));
}

// 兜底题库（仅当云端不可用时使用）
const FALLBACK_QUIZ: AppealQuestion[] = [
  { id: 1, question: '使用外挂、脚本、自动化工具或第三方软件来刷取信用点、经验或航行次数，属于严重违规行为。', correct: true },
  { id: 2, question: '发现系统漏洞或可被利用的异常时，应当主动上报官方，而不是利用漏洞获取不当利益。', correct: true },
  { id: 3, question: '为了帮助朋友快速升级，我可以把自己的账号密码分享给他，让他替我登录刷数据。', correct: false },
  { id: 4, question: '每位航行员共有 3 次答题解封机会，全部用完后需联系管理员处理。', correct: true },
  { id: 5, question: '恶意刷单、虚假下单套取信用点或奖励，属于作弊行为，一经发现将被封禁。', correct: true },
];