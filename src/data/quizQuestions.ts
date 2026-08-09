// 封号申诉答题问卷（参考腾讯封号答题问卷）
// correct 为 true 表示应选「正确」，与数据库 appeal_unban 的期望答案数组一致
export interface QuizQuestion {
  id: number;
  question: string;
  correct: boolean; // true=正确, false=错误
}

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 0,
    question: '使用外挂、脚本、自动化工具或第三方软件来刷取信用点、经验或航行次数，属于严重违规行为。',
    correct: true,
  },
  {
    id: 1,
    question: '发现系统漏洞或可被利用的异常时，应当主动上报官方，而不是利用漏洞获取不当利益。',
    correct: true,
  },
  {
    id: 2,
    question: '为了帮助朋友快速升级，我可以把自己的账号密码分享给他，让他替我登录刷数据。',
    correct: false,
  },
  {
    id: 3,
    question: '每位航行员共有 3 次答题解封机会，全部用完后需联系管理员处理。',
    correct: true,
  },
  {
    id: 4,
    question: '恶意刷单、虚假下单套取信用点或奖励，属于作弊行为，一经发现将被封禁。',
    correct: true,
  },
];