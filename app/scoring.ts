export type ScoringProfile = {
  degree: string;
  major: string;
  skills: string;
  targetLocations?: string;
};

export type ScoringJob = {
  title: string;
  education: string;
  headcount: string;
  salary: string;
  deadline: string;
  major: string;
  location: string;
  requirements: string;
  responsibilities: string;
  industry: string;
};

export type JobDecisionScore = {
  match: number;
  success: number;
  composite: number;
  matchReasons: string[];
  successReasons: string[];
};

const degreeLevel: Record<string, number> = { 不限: 0, 专科: 1, 本科: 2, 硕士: 3, 博士: 4 };

function terms(value: string) {
  return value.toLowerCase().split(/[\s,，、/；;|]+/).map((term) => term.trim()).filter((term) => term.length > 1);
}

function degreeFits(required: string, owned: string) {
  if (!required || required.includes("不限")) return true;
  const ownedLevel = Object.entries(degreeLevel).find(([name]) => owned.includes(name))?.[1] ?? 0;
  const requiredLevels = Object.entries(degreeLevel).filter(([name]) => required.includes(name)).map(([, level]) => level);
  return requiredLevels.length === 0 || ownedLevel >= Math.min(...requiredLevels);
}

function headcountValue(value: string) {
  const parsed = Number.parseInt(value.match(/\d+/)?.[0] ?? "0", 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function deadlineDays(value: string, now: Date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  return Math.ceil((new Date(`${value}T23:59:59+08:00`).getTime() - now.getTime()) / 86400000);
}

export function scoreJob(job: ScoringJob, profile: ScoringProfile, now = new Date()): JobDecisionScore {
  const profileTerms = [...new Set(terms(`${profile.major} ${profile.skills}`))];
  const jobText = `${job.title} ${job.major} ${job.requirements} ${job.responsibilities} ${job.industry}`.toLowerCase();
  const matchedTerms = profileTerms.filter((term) => jobText.includes(term));
  const fitsDegree = degreeFits(job.education, profile.degree);
  const locationTerms = terms(profile.targetLocations ?? "");
  const matchedLocations = locationTerms.filter((term) => job.location.toLowerCase().includes(term));

  let match = 38 + (fitsDegree ? 18 : -18) + Math.min(32, matchedTerms.length * 8);
  match += locationTerms.length === 0 ? 4 : Math.min(12, matchedLocations.length * 6);
  match = Math.max(18, Math.min(96, match));

  const matchReasons = [
    fitsDegree ? `学历要求与${profile.degree}背景相符` : `需再次确认${job.education}学历要求`,
    matchedTerms.length ? `命中${matchedTerms.slice(0, 3).join("、")}等关键词` : "暂未命中专业或技能关键词",
  ];
  if (locationTerms.length) matchReasons.push(matchedLocations.length ? `工作地符合${matchedLocations.slice(0, 2).join("、")}偏好` : "工作地未命中已填写偏好");

  const headcount = headcountValue(job.headcount);
  const days = deadlineDays(job.deadline, now);
  let success = 44 + (fitsDegree ? 12 : -18);
  success += headcount >= 20 ? 16 : headcount >= 5 ? 11 : headcount > 0 ? 6 : 2;
  success += days === null ? 2 : days < 0 ? -22 : days <= 7 ? -4 : days <= 30 ? 7 : 11;
  success += job.major.includes("不限") ? 8 : matchedTerms.length ? 5 : 0;
  success += job.salary && job.salary !== "面议" ? 4 : 0;
  success = Math.max(12, Math.min(94, success));

  const successReasons = [
    headcount >= 20 ? `计划招聘${headcount}人，岗位容量较高` : headcount > 0 ? `计划招聘${headcount}人` : "招聘人数以官网为准",
    days === null ? "截止日期以官网为准" : days < 0 ? "公开截止日期已过" : days <= 7 ? `距截止约${days}天，建议尽快核验` : `距截止约${days}天`,
  ];
  if (job.major.includes("不限")) successReasons.push("专业限制相对宽松");

  return { match, success, composite: Math.round(match * 0.6 + success * 0.4), matchReasons, successReasons };
}
