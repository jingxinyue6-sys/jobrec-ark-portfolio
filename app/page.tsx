"use client";

import { useEffect, useMemo, useState } from "react";
import { datasetStats, jobs, type JobRecord } from "./data";

type View = "dashboard" | "jobs" | "events" | "saved" | "profile" | "preferences" | "model" | "story";
type Profile = { name: string; degree: string; major: string; skills: string };
type Preferences = { province: string; organization: string; focus: string; fitWeight: number };
type ScoredJob = JobRecord & { fit: number; chance: number; composite: number; reasons: string[] };

const defaultProfile: Profile = { name: "君宝", degree: "硕士", major: "应用统计", skills: "Python、R、SQL、机器学习、数据可视化" };
const defaultPreferences: Preferences = { province: "四川省", organization: "国有企业", focus: "数据分析", fitWeight: 55 };

const viewTitles: Record<View, [string, string]> = {
  dashboard: ["求职仪表盘", "基于四川大学就业指导中心往年校招数据的决策原型"],
  jobs: ["岗位推荐", "筛选、排序和比较真实岗位记录"],
  events: ["宣讲与双选活动", "查看往年活动记录，并前往官方平台核验今年安排"],
  saved: ["我的收藏", "保存在当前浏览器中的重点岗位"],
  profile: ["能力档案", "完善个人信息，让评分更贴近你的情况"],
  preferences: ["求职偏好", "调整地域、单位性质和决策权重"],
  model: ["评分模型", "了解匹配度、成功潜力与综合指数的计算逻辑"],
  story: ["项目故事", "从校招信息过载到可执行求职策略"],
};

const degreeRank: Record<string, number> = { "不限": 0, "大专": 1, "本科": 2, "硕士": 3, "博士": 4 };
const focusKeywords: Record<string, string[]> = {
  "数据分析": ["数据", "统计", "分析", "经营", "运营", "风控"],
  "算法与AI": ["算法", "人工智能", "机器学习", "大模型", "视觉", "SLAM"],
  "产品与策略": ["产品", "策略", "咨询", "市场", "运营"],
};

function numericHeadcount(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 1;
}

function scoreJob(job: JobRecord, profile: Profile, preferences: Preferences): ScoredJob {
  const text = `${job.role} ${job.major} ${job.requirements} ${job.responsibilities}`.toLowerCase();
  const skills = profile.skills.split(/[、,，\s]+/).filter(Boolean);
  const focusHits = (focusKeywords[preferences.focus] || []).filter((word) => text.includes(word.toLowerCase())).length;
  const skillHits = skills.filter((skill) => text.includes(skill.toLowerCase())).length;
  const majorHit = text.includes(profile.major.toLowerCase()) || /不限/.test(job.major);
  const locationHit = job.province.includes(preferences.province) || job.city.includes(preferences.province.replace("省", ""));
  const orgHit = job.org === preferences.organization;
  const degreeReady = (degreeRank[profile.degree] ?? 0) >= (degreeRank[job.education] ?? 0);

  const fit = Math.min(98, Math.round(45 + Math.min(24, focusHits * 8) + Math.min(16, skillHits * 4) + (majorHit ? 7 : 0) + (locationHit ? 8 : 0) + (orgHit ? 5 : 0)));
  const headcount = numericHeadcount(job.headcount);
  const salaryTop = Math.max(...(job.salary.match(/\d+/g) || ["0"]).map(Number));
  const chance = Math.max(42, Math.min(96, Math.round(52 + (degreeReady ? 12 : -10) + Math.min(18, Math.log2(headcount + 1) * 4) + (/无要求/.test(job.internship) ? 8 : 2) - (salaryTop >= 20000 ? 6 : 0) + (locationHit ? 4 : 0))));
  const weight = preferences.fitWeight / 100;
  const composite = Math.round(fit * weight + chance * (1 - weight));
  const reasons = [
    focusHits ? `岗位内容命中「${preferences.focus}」方向关键词` : "岗位方向与当前偏好关联较弱",
    degreeReady ? `你的${profile.degree}学历达到岗位${job.education}要求` : `岗位要求${job.education}，高于当前学历设置`,
    locationHit ? `工作地符合${preferences.province}偏好` : `工作地不在首选地区`,
    orgHit ? `单位性质符合${preferences.organization}偏好` : `单位性质为${job.org}`,
  ];
  return { ...job, fit, chance, composite, reasons };
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="field"><span>{label}</span>{children}</label>;
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return <span className="nav-icon" aria-hidden="true">{children}</span>;
}

function OfficialDataNotice({ compact = false }: { compact?: boolean }) {
  return <aside className={`official-data-notice ${compact ? "compact" : ""}`}>
    <div><strong>数据来源说明</strong><p>本页数据整理自四川大学就业指导中心往年公开校招信息，可能为上一年度历史样本，不代表今年仍在招聘。</p></div>
    <a href="https://jy.scu.edu.cn/" target="_blank" rel="noreferrer">前往官方平台查看今年数据 ↗</a>
  </aside>;
}

export default function Home() {
  const [view, setView] = useState<View>("dashboard");
  const [profile, setProfile] = useState<Profile>(defaultProfile);
  const [preferences, setPreferences] = useState<Preferences>(defaultPreferences);
  const [draftProfile, setDraftProfile] = useState<Profile>(defaultProfile);
  const [draftPreferences, setDraftPreferences] = useState<Preferences>(defaultPreferences);
  const [saved, setSaved] = useState<string[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("全部地区");
  const [organization, setOrganization] = useState("全部单位");
  const [sort, setSort] = useState<"composite" | "fit" | "chance" | "salary">("composite");
  const [selected, setSelected] = useState<ScoredJob | null>(null);
  const [eventDetail, setEventDetail] = useState<JobRecord | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [copilotAnswer, setCopilotAnswer] = useState("请选择一个问题，我会基于当前画像和真实岗位样本给出建议。");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem("jobrec-state-v3") || "{}");
      if (stored.profile) {
        const migratedProfile = { ...stored.profile, name: stored.profile.name === "景欣悦" ? "君宝" : stored.profile.name };
        setProfile(migratedProfile);
        setDraftProfile(migratedProfile);
      }
      if (stored.preferences) { setPreferences(stored.preferences); setDraftPreferences(stored.preferences); }
      if (Array.isArray(stored.saved)) setSaved(stored.saved);
      if (stored.notes) setNotes(stored.notes);
    } catch { /* Ignore invalid browser-local drafts. */ }
  }, []);

  useEffect(() => {
    localStorage.setItem("jobrec-state-v3", JSON.stringify({ profile, preferences, saved, notes }));
  }, [profile, preferences, saved, notes]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const scoredJobs = useMemo(() => jobs.map((job) => scoreJob(job, profile, preferences)), [profile, preferences]);
  const filteredJobs = useMemo(() => scoredJobs
    .filter((job) => !query.trim() || `${job.role}${job.company}${job.major}${job.industry}`.toLowerCase().includes(query.trim().toLowerCase()))
    .filter((job) => province === "全部地区" || job.province === province)
    .filter((job) => organization === "全部单位" || job.org === organization)
    .sort((a, b) => sort === "salary" ? Math.max(...(b.salary.match(/\d+/g) || ["0"]).map(Number)) - Math.max(...(a.salary.match(/\d+/g) || ["0"]).map(Number)) : b[sort] - a[sort]), [scoredJobs, query, province, organization, sort]);
  const savedJobs = scoredJobs.filter((job) => saved.includes(job.id)).sort((a, b) => b.composite - a.composite);
  const comparedJobs = scoredJobs.filter((job) => compareIds.includes(job.id));
  const uniqueEvents = useMemo(() => Array.from(new Map(jobs.map((job) => [`${job.event}-${job.eventAddress}`, job])).values()), []);
  const provinces = Array.from(new Set(jobs.map((job) => job.province))).sort();
  const organizations = Array.from(new Set(jobs.map((job) => job.org))).sort();
  const averageFit = Math.round(scoredJobs.reduce((sum, job) => sum + job.fit, 0) / scoredJobs.length);
  const averageChance = Math.round(scoredJobs.reduce((sum, job) => sum + job.chance, 0) / scoredJobs.length);

  function navigate(next: View) { setView(next); setMobileMenu(false); setShowNotifications(false); setShowUserMenu(false); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function toggleSave(id: string) { setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]); setToast(saved.includes(id) ? "已取消收藏" : "已保存到本机收藏"); }
  function toggleCompare(id: string) {
    setCompareIds((items) => items.includes(id) ? items.filter((item) => item !== id) : items.length < 3 ? [...items, id] : items);
    if (!compareIds.includes(id) && compareIds.length >= 3) setToast("最多比较 3 个岗位");
  }
  function saveProfile() { setProfile(draftProfile); setToast("能力档案已保存到当前浏览器"); }
  function savePreferences() { setPreferences(draftPreferences); setToast("偏好已保存，岗位评分已重新计算"); }
  function exportCsv(recordsOrEvent: ScoredJob[] | unknown = filteredJobs) {
    const records = Array.isArray(recordsOrEvent) ? recordsOrEvent as ScoredJob[] : filteredJobs;
    const header = ["岗位编号", "职位", "单位", "工作地", "学历", "薪资", "单位性质", "行业", "匹配度", "成功潜力", "综合指数"];
    const rows = records.map((job) => [job.id, job.role, job.company, job.city, job.education, job.salary, job.org, job.industry, job.fit, job.chance, job.composite]);
    const csv = "\uFEFF" + [header, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "JobRec岗位推荐.csv"; link.click(); URL.revokeObjectURL(url);
    setToast(`已导出 ${rows.length} 条岗位`);
  }
  function askCopilot(question: string) {
    const top = scoredJobs.slice().sort((a, b) => b.composite - a.composite)[0];
    const answers: Record<string, string> = {
      "今天先做什么？": `建议先查看 ${top.company} 的「${top.role}」。它的综合指数为 ${top.composite}，主要优势是：${top.reasons.filter((reason) => !reason.includes("较弱") && !reason.includes("不在")).slice(0, 2).join("；")}。`,
      "适合我的方向": `当前画像下，「${preferences.focus}」是最相关方向。样本中平均匹配度 ${averageFit}%，建议同时关注${preferences.organization}与${preferences.province}岗位。`,
      "如何提高成功潜力？": `成功潜力目前平均 ${averageChance}%。可优先补充岗位要求中频繁出现、但能力档案尚未包含的技能，并优先选择招聘人数较多、学历门槛匹配的岗位。`,
    };
    setCopilotAnswer(answers[question]);
  }

  const navGroups: { label: string; items: [View, string, string][] }[] = [
    { label: "概览", items: [["dashboard", "求职仪表盘", "▦"]] },
    { label: "求职管理", items: [["jobs", "岗位推荐", "◎"], ["events", "宣讲活动", "□"], ["saved", "我的收藏", "☆"]] },
    { label: "个人画像", items: [["profile", "能力档案", "◇"], ["preferences", "求职偏好", "⌁"]] },
    { label: "项目说明", items: [["model", "评分模型", "◫"], ["story", "项目故事", "↗"]] },
  ];

  function JobTable({ records }: { records: ScoredJob[] }) {
    return <div className="job-table">
      <div className="job-head"><span>比较</span><span>岗位信息</span><span>匹配度</span><span>成功潜力</span><span>综合指数</span><span>操作</span></div>
      {records.map((job) => <article className="job-row" key={job.id}>
        <label className="compare-check"><input type="checkbox" checked={compareIds.includes(job.id)} onChange={() => toggleCompare(job.id)} aria-label={`比较${job.role}`} /><i /></label>
        <div className="job-main"><span className="company-logo">{job.company.slice(0, 1)}</span><div><button onClick={() => setSelected(job)}>{job.role}</button><p>{job.company} · {job.city} · {job.salary}</p><div><em>{job.org}</em><em>{job.education}</em><em>{job.tag}</em></div></div></div>
        <div className="score-cell blue"><b>{job.fit}%</b><i><em style={{ width: `${job.fit}%` }} /></i></div>
        <div className="score-cell purple"><b>{job.chance}%</b><i><em style={{ width: `${job.chance}%` }} /></i></div>
        <div className="total-score">{job.composite}</div>
        <div className="row-actions"><button className={saved.includes(job.id) ? "saved" : ""} onClick={() => toggleSave(job.id)} aria-label="收藏">{saved.includes(job.id) ? "★" : "☆"}</button><button onClick={() => setSelected(job)} aria-label="查看详情">›</button></div>
      </article>)}
      {!records.length && <div className="empty"><span>⌕</span><b>没有找到符合条件的岗位</b><p>修改筛选条件或个人偏好后再试试。</p></div>}
    </div>;
  }

  function DashboardView() {
    const topJobs = scoredJobs.slice().sort((a, b) => b.composite - a.composite).slice(0, 5);
    return <>
      <OfficialDataNotice />
      <section className="ai-banner"><div><span>✦</span><p><b>AI 今日建议</b><small>基于当前画像与历史校招样本动态计算</small></p></div><p>当前最值得优先研究的是 <b>{topJobs[0].company} · {topJobs[0].role}</b>，综合指数 {topJobs[0].composite}。</p><button onClick={() => setSelected(topJobs[0])}>查看详情 →</button></section>
      <section className="stat-grid">
        <article><p>历史岗位样本</p><strong>{datasetStats.totalJobs.toLocaleString()}</strong><span className="status green">● 两个工作表已关联</span></article>
        <article><p>数据相关岗位</p><strong>{datasetStats.dataRelatedJobs}</strong><span className="status purple">◆ 按职位名称检索</span></article>
        <article><p>当前平均匹配度</p><strong>{averageFit}<small>%</small></strong><span className="status blue">↗ 随画像实时变化</span></article>
        <article><p>已收藏岗位</p><strong>{saved.length.toString().padStart(2, "0")}</strong><button className="status yellow" onClick={() => navigate("saved")}>☆ 查看本机收藏</button></article>
      </section>
      <div className="dashboard-grid">
        <section className="panel top-jobs"><div className="panel-head"><div><h2>优先岗位</h2><p>24 条真实记录中的当前 Top 5</p></div><button onClick={() => navigate("jobs")}>查看全部</button></div><JobTable records={topJobs} /></section>
        <section className="panel event-preview"><div className="panel-head"><div><h2>宣讲与双选活动</h2><p>来源于岗位附加信息表</p></div><button onClick={() => navigate("events")}>全部活动</button></div><div className="events-list">{uniqueEvents.slice(0, 4).map((event) => <button key={`${event.id}-${event.event}`} onClick={() => setEventDetail(event)}><span className={event.eventType === "线上" ? "online" : "offline"}>{event.eventType}</span><div><b>{event.event}</b><p>{event.eventAddress}</p></div><em>›</em></button>)}</div></section>
        <section className="panel dataset-panel"><div className="panel-head"><div><h2>数据集概览</h2><p>完整 9,878 条岗位的真实分布</p></div><button onClick={() => navigate("model")}>数据说明</button></div><div className="distribution"><div><h3>单位性质</h3>{datasetStats.organizations.slice(0, 5).map((item) => <div key={item.name}><p><span>{item.name}</span><b>{item.value.toLocaleString()}</b></p><i><em style={{ width: `${item.value / datasetStats.organizations[0].value * 100}%` }} /></i></div>)}</div><div><h3>行业分布</h3>{datasetStats.industries.slice(0, 5).map((item) => <div key={item.name}><p><span>{item.name}</span><b>{item.value.toLocaleString()}</b></p><i><em style={{ width: `${item.value / datasetStats.industries[0].value * 100}%` }} /></i></div>)}</div></div></section>
      </div>
    </>;
  }

  function JobsView({ records = filteredJobs, savedOnly = false }: { records?: ScoredJob[]; savedOnly?: boolean }) {
    return <><OfficialDataNotice compact /><section className="panel full-panel">
      <div className="panel-head"><div><h2>{savedOnly ? "收藏岗位" : "岗位数据"}</h2><p>{savedOnly ? "收藏保存在当前设备浏览器中" : `展示 ${records.length} 条真实岗位记录，评分会随画像和偏好变化`}</p></div><div className="head-actions"><button onClick={() => exportCsv(records)}>导出 CSV</button>{compareIds.length >= 2 && <button className="primary" onClick={() => setShowCompare(true)}>比较 {compareIds.length} 个岗位</button>}</div></div>
      {!savedOnly && <div className="filterbar"><Field label="搜索"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="岗位、单位、专业或行业" /></Field><Field label="工作地区"><select value={province} onChange={(event) => setProvince(event.target.value)}><option>全部地区</option>{provinces.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="单位性质"><select value={organization} onChange={(event) => setOrganization(event.target.value)}><option>全部单位</option>{organizations.map((item) => <option key={item}>{item}</option>)}</select></Field><Field label="排序"><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="composite">综合指数</option><option value="fit">匹配度</option><option value="chance">成功潜力</option><option value="salary">薪资上限</option></select></Field><button className="reset" onClick={() => { setQuery(""); setProvince("全部地区"); setOrganization("全部单位"); setSort("composite"); }}>重置</button></div>}
      <JobTable records={records} />
    </section></>;
  }

  function EventsView() {
    return <><OfficialDataNotice compact /><section className="panel full-panel"><div className="panel-head"><div><h2>往年活动记录</h2><p>活动名称、形式和地址来自四川大学就业指导中心历史数据，不代表今年仍在开放。</p></div></div><div className="event-grid">{uniqueEvents.map((event) => <button key={`${event.id}-${event.event}`} onClick={() => setEventDetail(event)}><div className="event-card-top"><span className={event.eventType === "线上" ? "online" : "offline"}>{event.eventType}</span><em>{event.id}</em></div><h3>{event.event}</h3><p>⌖ {event.eventAddress}</p><div><span>{event.company}</span><b>查看关联岗位 →</b></div></button>)}</div></section></>;
  }

  function ProfileView() {
    return <div className="form-grid"><section className="panel form-card"><div className="panel-head"><div><h2>能力档案</h2><p>这些信息只保存在当前浏览器中，用于重新计算评分。</p></div></div><div className="form-body"><Field label="姓名"><input value={draftProfile.name} onChange={(event) => setDraftProfile({ ...draftProfile, name: event.target.value })} /></Field><Field label="最高学历"><select value={draftProfile.degree} onChange={(event) => setDraftProfile({ ...draftProfile, degree: event.target.value })}><option>本科</option><option>硕士</option><option>博士</option></select></Field><Field label="专业"><input value={draftProfile.major} onChange={(event) => setDraftProfile({ ...draftProfile, major: event.target.value })} /></Field><Field label="技能关键词"><textarea value={draftProfile.skills} onChange={(event) => setDraftProfile({ ...draftProfile, skills: event.target.value })} rows={5} placeholder="用顿号或逗号分隔，例如 Python、SQL、R" /></Field><button className="save-button" onClick={saveProfile}>保存并重新计算 →</button></div></section><section className="panel profile-summary"><div className="profile-avatar">{profile.name.slice(0, 1)}</div><h2>{profile.name}</h2><p>{profile.degree} · {profile.major}</p><div className="skill-cloud">{profile.skills.split(/[、,，\s]+/).filter(Boolean).map((skill) => <span key={skill}>{skill}</span>)}</div><dl><div><dt>样本平均匹配度</dt><dd>{averageFit}%</dd></div><div><dt>当前偏好方向</dt><dd>{preferences.focus}</dd></div><div><dt>资料存储方式</dt><dd>当前浏览器</dd></div></dl></section></div>;
  }

  function PreferencesView() {
    return <div className="form-grid"><section className="panel form-card"><div className="panel-head"><div><h2>求职偏好</h2><p>调整后会即时改变匹配度和综合排序。</p></div></div><div className="form-body"><Field label="首选地区"><select value={draftPreferences.province} onChange={(event) => setDraftPreferences({ ...draftPreferences, province: event.target.value })}>{datasetStats.provinces.map((item) => <option key={item.name}>{item.name}</option>)}</select></Field><Field label="首选单位性质"><select value={draftPreferences.organization} onChange={(event) => setDraftPreferences({ ...draftPreferences, organization: event.target.value })}>{datasetStats.organizations.map((item) => <option key={item.name}>{item.name}</option>)}</select></Field><Field label="意向方向"><select value={draftPreferences.focus} onChange={(event) => setDraftPreferences({ ...draftPreferences, focus: event.target.value })}>{Object.keys(focusKeywords).map((item) => <option key={item}>{item}</option>)}</select></Field><Field label={`综合指数权重：匹配度 ${draftPreferences.fitWeight}% / 成功潜力 ${100 - draftPreferences.fitWeight}%`}><input type="range" min="20" max="80" value={draftPreferences.fitWeight} onChange={(event) => setDraftPreferences({ ...draftPreferences, fitWeight: Number(event.target.value) })} /></Field><button className="save-button" onClick={savePreferences}>应用偏好并重新排序 →</button></div></section><section className="panel preference-preview"><h2>当前策略</h2><div className="strategy-visual"><span style={{ width: `${preferences.fitWeight}%` }}>匹配度 {preferences.fitWeight}%</span><span style={{ width: `${100 - preferences.fitWeight}%` }}>成功潜力 {100 - preferences.fitWeight}%</span></div><p>优先考虑 <b>{preferences.province}</b> 的 <b>{preferences.organization}</b>，方向为 <b>{preferences.focus}</b>。</p><button onClick={() => navigate("jobs")}>查看新排序 →</button></section></div>;
  }

  function ModelView() {
    return <div className="info-stack"><section className="model-hero"><span>EXPLAINABLE PROTOTYPE</span><h2>每个分数都能解释，也能随着你的选择变化。</h2><p>网页使用真实岗位字段和透明规则重现 PPT 中的“匹配度 + 成功率 + 综合指数”框架。由于源数据没有真实投递人数和录用结果，页面将第二项明确标为“成功潜力”，不把原型估计冒充真实录用概率。</p></section><section className="model-cards"><article><span>01</span><h3>匹配度</h3><p>由方向关键词、技能、专业、地域和单位性质共同计算。</p><b>{averageFit}%<small>当前样本均值</small></b></article><article><span>02</span><h3>成功潜力</h3><p>由学历门槛、招聘人数、实习要求和薪资竞争度估计。</p><b>{averageChance}%<small>原型估计，不是承诺</small></b></article><article><span>03</span><h3>综合指数</h3><p>按照你设置的权重，将匹配度和成功潜力合成为排序依据。</p><b>{preferences.fitWeight}/{100 - preferences.fitWeight}<small>当前权重</small></b></article></section><section className="panel provenance"><div className="panel-head"><div><h2>数据来源与边界</h2><p>所有公开字段均来自用户提供的原始项目文件。</p></div></div><div><p><b>数据表：</b>{datasetStats.source}</p><p><b>页面样本：</b>从 328 条数据相关岗位中选取 24 条，保留岗位编号、单位、职位、学历、薪资、地点、单位性质、行业、要求、职责及关联活动。</p><p><b>时间边界：</b>数据包含历史校招信息，仅用于产品验证和作品集展示；不能视为当前招聘公告。</p><p><b>隐私处理：</b>未展示联系人、手机号、邮箱等字段。</p></div></section></div>;
  }

  function StoryView() {
    return <div className="story"><section><span>PROJECT CASE STUDY</span><h2>智聘方舟：把海量岗位变成可执行的求职策略</h2><p>项目从高校毕业生面临的信息过载与目标迷茫出发，将“去哪场、投哪个、如何取舍”转化为可量化的产品问题。</p></section><div className="story-grid"><article><b>01</b><h3>信息筛选</h3><p>把 9,878 条历史岗位关联到单位、行业、地点、薪资、专业和活动信息。</p></article><article><b>02</b><h3>双指标决策</h3><p>区分“适不适合”与“是否更有把握”，减少只看单一匹配分的误导。</p></article><article><b>03</b><h3>个性化权重</h3><p>允许用户根据求职阶段，在理想岗位与高把握机会之间调整权重。</p></article><article><b>04</b><h3>可解释推荐</h3><p>每个岗位展示评分理由、要求、职责和关联活动，帮助用户行动。</p></article></div><section className="impact"><div><strong>9,878</strong><span>历史岗位记录</span></div><div><strong>328</strong><span>数据相关岗位</span></div><div><strong>24</strong><span>公开交互样本</span></div><div><strong>8</strong><span>可操作产品模块</span></div></section></div>;
  }

  const [title, subtitle] = viewTitles[view];
  return <div className="app-shell">
    <aside className={`sidebar ${mobileMenu ? "open" : ""}`}><div className="logo-row"><span className="logo">A</span><div><b>智聘方舟</b><small>JOBREC</small></div><button className="mobile-close" onClick={() => setMobileMenu(false)}>×</button></div><button className="ai-entry" onClick={() => { setShowCopilot(true); setMobileMenu(false); }}><span>✦</span> AI 求职顾问</button><nav>{navGroups.map((group) => <div key={group.label}><p>{group.label}</p>{group.items.map(([key, label, icon]) => <button key={key} className={view === key ? "active" : ""} onClick={() => navigate(key)}><NavIcon>{icon}</NavIcon>{label}{key === "jobs" && <em>{jobs.length}</em>}{key === "saved" && <em>{saved.length}</em>}</button>)}</div>)}</nav><div className="source-card"><span>真实数据集</span><b>{datasetStats.totalJobs.toLocaleString()} 条历史岗位</b><p>训练数据 + 附加信息</p><button onClick={() => navigate("model")}>查看数据说明</button></div></aside>
    {mobileMenu && <button className="mobile-overlay" onClick={() => setMobileMenu(false)} aria-label="关闭菜单" />}
    <div className="workspace"><header className="topbar"><button className="menu-button" onClick={() => setMobileMenu(true)}>☰</button><div className="top-title"><b>{title}</b><span>{subtitle}</span></div><label className="top-search"><span>⌕</span><input value={query} onChange={(event) => { setQuery(event.target.value); if (event.target.value) setView("jobs"); }} placeholder="搜索岗位、企业或行业" /></label><div className="popover-wrap"><button className="icon-button" onClick={() => setShowNotifications(!showNotifications)} aria-label="通知">♧<i /></button>{showNotifications && <div className="popover notifications"><b>数据提醒</b><p>源数据为历史校招样本，请在真实投递前核验最新公告。</p><button onClick={() => navigate("model")}>查看数据边界</button></div>}</div><div className="popover-wrap"><button className="user-button" onClick={() => setShowUserMenu(!showUserMenu)}><span>{profile.name.slice(0, 1)}</span><p><b>{profile.name}</b><small>{profile.degree} · {profile.major}</small></p><em>⌄</em></button>{showUserMenu && <div className="popover user-menu"><button onClick={() => navigate("profile")}>编辑能力档案</button><button onClick={() => navigate("preferences")}>调整求职偏好</button></div>}</div></header><main className="content"><div className="page-intro"><div><p>历史校招数据 · 可解释推荐原型</p><h1>{title}</h1><span>{subtitle}</span></div>{view === "jobs" && <button className="primary-action" onClick={exportCsv}>导出当前结果</button>}</div>{view === "dashboard" && <DashboardView />}{view === "jobs" && <JobsView />}{view === "events" && <EventsView />}{view === "saved" && <JobsView records={savedJobs} savedOnly />}{view === "profile" && <ProfileView />}{view === "preferences" && <PreferencesView />}{view === "model" && <ModelView />}{view === "story" && <StoryView />}<footer><span>智聘方舟 JobRec · 作品集交互原型</span><span>岗位数据来自用户提供的历史校招数据集</span></footer></main></div>

    {selected && <div className="modal-layer" onMouseDown={() => setSelected(null)}><section className="modal job-modal" role="dialog" aria-modal="true" aria-labelledby="job-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><span className="record-id">真实记录 · {selected.id}</span><h2 id="job-title">{selected.role}</h2><p className="modal-company">{selected.company} · {selected.city} · {selected.salary}</p><div className="modal-scores"><div><b>{selected.fit}%</b><span>匹配度</span></div><div><b>{selected.chance}%</b><span>成功潜力</span></div><div className="accent"><b>{selected.composite}</b><span>综合指数</span></div></div><div className="reason-list"><h3>评分依据</h3>{selected.reasons.map((reason) => <p key={reason}>✓ {reason}</p>)}</div><div className="detail-grid"><div><span>学历要求</span><b>{selected.education}</b></div><div><span>招聘人数</span><b>{selected.headcount}</b></div><div><span>单位性质</span><b>{selected.org}</b></div><div><span>所属行业</span><b>{selected.industry}</b></div></div><div className="long-text"><h3>岗位要求</h3><p>{selected.requirements}</p><h3>岗位职责</h3><p>{selected.responsibilities}</p><h3>关联活动</h3><p>{selected.event} · {selected.eventAddress} · {selected.eventType}</p></div><Field label="我的备注（仅保存在当前浏览器）"><textarea value={notes[selected.id] || ""} onChange={(event) => setNotes({ ...notes, [selected.id]: event.target.value })} rows={3} placeholder="记录投递准备、面试重点等" /></Field><div className="modal-actions"><button onClick={() => toggleCompare(selected.id)}>{compareIds.includes(selected.id) ? "取消比较" : "加入比较"}</button><button onClick={() => toggleSave(selected.id)}>{saved.includes(selected.id) ? "★ 已收藏" : "☆ 收藏岗位"}</button><button className="primary" onClick={() => { setNotes({ ...notes, [selected.id]: `${notes[selected.id] || ""}${notes[selected.id] ? "\n" : ""}待核验最新招聘公告后投递` }); setToast("已加入本机投递准备清单"); }}>加入准备清单</button></div></section></div>}
    {eventDetail && <div className="modal-layer" onMouseDown={() => setEventDetail(null)}><section className="modal event-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setEventDetail(null)}>×</button><span className={eventDetail.eventType === "线上" ? "event-type online" : "event-type offline"}>{eventDetail.eventType}</span><h2>{eventDetail.event}</h2><p>⌖ {eventDetail.eventAddress}</p><div><span>关联单位</span><b>{eventDetail.company}</b><span>关联岗位</span><b>{eventDetail.role}</b><span>岗位编号</span><b>{eventDetail.id}</b></div><p className="warning">这是历史活动记录，不代表当前仍在举办。请通过学校就业网或单位官网核验最新信息。</p><button className="primary wide" onClick={() => { setEventDetail(null); setSelected(scoredJobs.find((job) => job.id === eventDetail.id) || null); }}>查看关联岗位 →</button></section></div>}
    {showCompare && <div className="modal-layer" onMouseDown={() => setShowCompare(false)}><section className="modal compare-modal" role="dialog" aria-modal="true" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowCompare(false)}>×</button><span className="record-id">岗位比较</span><h2>并排比较 {comparedJobs.length} 个岗位</h2><div className="compare-grid">{comparedJobs.map((job) => <article key={job.id}><span className="company-logo">{job.company.slice(0, 1)}</span><h3>{job.role}</h3><p>{job.company}</p><dl><div><dt>匹配度</dt><dd>{job.fit}%</dd></div><div><dt>成功潜力</dt><dd>{job.chance}%</dd></div><div><dt>综合指数</dt><dd>{job.composite}</dd></div><div><dt>工作地</dt><dd>{job.city}</dd></div><div><dt>薪资</dt><dd>{job.salary}</dd></div><div><dt>单位性质</dt><dd>{job.org}</dd></div></dl><button onClick={() => setSelected(job)}>查看详情</button></article>)}</div></section></div>}
    {showCopilot && <div className="drawer-layer" onMouseDown={() => setShowCopilot(false)}><aside className="copilot" onMouseDown={(event) => event.stopPropagation()}><div className="copilot-head"><div><span>✦</span><p><b>AI 求职顾问</b><small>规则驱动的作品集演示</small></p></div><button onClick={() => setShowCopilot(false)}>×</button></div><div className="copilot-body"><p className="assistant-message">{copilotAnswer}</p><div className="quick-questions">{["今天先做什么？", "适合我的方向", "如何提高成功潜力？"].map((question) => <button key={question} onClick={() => askCopilot(question)}>{question}</button>)}</div><div className="copilot-note">回答基于当前个人画像和 24 条公开岗位样本生成，不连接外部 AI，也不会上传个人信息。</div></div><button className="copilot-action" onClick={() => { setShowCopilot(false); navigate("preferences"); }}>调整我的求职策略 →</button></aside></div>}
    {toast && <div className="toast">✓ {toast}</div>}
  </div>;
}
