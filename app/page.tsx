"use client";

import { useEffect, useMemo, useState } from "react";
import { campusEvents, officialSources, type CampusEvent } from "./events";

type Scope = "all" | "upcoming" | "saved";
type EventType = "全部类型" | CampusEvent["type"];
type Campus = "全部校区" | CampusEvent["campus"];
type CompanyType = "全部企业" | CampusEvent["companyType"];
type Profile = { name: string; degree: string; major: string; skills: string; campus: CampusEvent["campus"] | "不限"; targetTypes: CampusEvent["companyType"][] };
type RecommendedEvent = CampusEvent & { match: number; reason: string };
type ScuJob = {
  id: string; title: string; company: string; jobType: string; nature: string; education: string;
  headcount: string; salary: string; publishedAt: string; deadline: string; major: string; location: string;
  requirements: string; responsibilities: string; industry: string; source: string; sourceUrl: string;
};
type ScuJobFeed = { source: string; sourceUrl: string; updatedAt: string; count: number; jobs: ScuJob[] };
const prepItems = ["更新一页简历", "准备60秒自我介绍", "整理3个想问企业的问题"];
const companyTypes: CampusEvent["companyType"][] = ["国企央企", "金融", "教育", "医药卫生", "地方引才", "综合招聘"];
const defaultProfile: Profile = { name: "君宝", degree: "硕士", major: "", skills: "", campus: "不限", targetTypes: ["国企央企"] };
const categoryKeywords: Record<CampusEvent["companyType"], string[]> = {
  国企央企: ["工程", "计算机", "数据", "统计", "管理", "能源", "材料", "机械", "电气"],
  金融: ["金融", "经济", "会计", "统计", "数据", "风控", "市场"],
  教育: ["教育", "师范", "中文", "英语", "数学", "教师", "课程"],
  医药卫生: ["医学", "药学", "护理", "生物", "公卫", "临床", "口腔"],
  地方引才: ["公共管理", "城市", "规划", "工程", "经济", "管理"],
  综合招聘: ["计算机", "数据", "运营", "产品", "工程", "管理", "市场"],
};

function displayDate(date: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric", weekday: "short" }).format(new Date(`${date}T12:00:00+08:00`));
}

function countdown(date: string) {
  const days = Math.ceil((new Date(`${date}T00:00:00+08:00`).getTime() - new Date("2026-08-18T00:00:00+08:00").getTime()) / 86400000);
  return days > 0 ? `${days} 天后` : days === 0 ? "今天" : "已结束";
}

function calendarDate(date: string, time: string, end = false) {
  const matches = time.match(/\d{2}:\d{2}/g) || [];
  const safeTime = matches[end ? 1 : 0] || (end ? "17:00" : "14:00");
  return `${date.replaceAll("-", "")}T${safeTime.replace(":", "")}00`;
}

function displaySyncTime(value: string) {
  if (!value) return "等待首次同步";
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }).format(new Date(value));
}

function jobMatch(job: ScuJob, profile: Profile) {
  const profileTerms = `${profile.major} ${profile.skills}`.toLowerCase().split(/[\s,，、/]+/).filter((term) => term.length > 1);
  const jobText = `${job.title} ${job.major} ${job.requirements} ${job.responsibilities} ${job.industry}`.toLowerCase();
  const hits = profileTerms.filter((term) => jobText.includes(term));
  const degreeHit = !profile.degree || job.education === "不限" || job.education.includes(profile.degree.replace("在读", ""));
  return Math.min(96, 56 + (degreeHit ? 16 : 0) + Math.min(24, hits.length * 8));
}

function recommendEvent(event: CampusEvent, profile: Profile): RecommendedEvent {
  const profileText = `${profile.major} ${profile.skills}`.toLowerCase();
  const hits = categoryKeywords[event.companyType].filter((keyword) => profileText.includes(keyword.toLowerCase()));
  const typeHit = (profile.targetTypes || []).includes(event.companyType);
  const campusHit = !profile.campus || profile.campus === "不限" || profile.campus === event.campus;
  const score = Math.min(96, 48 + (typeHit ? 25 : 0) + (campusHit ? 10 : 0) + (event.status === "upcoming" ? 8 : 0) + Math.min(13, hits.length * 5));
  const reason = typeHit
    ? `符合你关注的${event.companyType}${hits.length ? `，并命中${hits.slice(0, 2).join("、")}关键词` : ""}`
    : hits.length ? `你的${hits.slice(0, 2).join("、")}背景与活动主题相关` : `${event.companyType}活动，可用于拓展求职方向`;
  return { ...event, match: score, reason };
}

export default function Home() {
  const [scope, setScope] = useState<Scope>("all");
  const [query, setQuery] = useState("");
  const [eventType, setEventType] = useState<EventType>("全部类型");
  const [campus, setCampus] = useState<Campus>("全部校区");
  const [companyType, setCompanyType] = useState<CompanyType>("全部企业");
  const [profile, setProfile] = useState<Profile>(() => {
    if (typeof window === "undefined") return defaultProfile;
    try { return JSON.parse(localStorage.getItem("jobrec-campus-profile") || "null") || defaultProfile; } catch { return defaultProfile; }
  });
  const [draftProfile, setDraftProfile] = useState<Profile>(profile);
  const [loggedIn, setLoggedIn] = useState(() => typeof window !== "undefined" && localStorage.getItem("jobrec-campus-login") === "true");
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [resumeFileName, setResumeFileName] = useState("");
  const [saved, setSaved] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("jobrec-campus-saved") || "[]"); } catch { return []; }
  });
  const [prep, setPrep] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try { return JSON.parse(localStorage.getItem("jobrec-campus-prep") || "[]"); } catch { return []; }
  });
  const [selected, setSelected] = useState<CampusEvent | null>(null);
  const [toast, setToast] = useState("");
  const [jobFeed, setJobFeed] = useState<ScuJobFeed | null>(null);
  const [jobQuery, setJobQuery] = useState("");
  const [jobNature, setJobNature] = useState("全部岗位");

  useEffect(() => { localStorage.setItem("jobrec-campus-saved", JSON.stringify(saved)); }, [saved]);
  useEffect(() => { localStorage.setItem("jobrec-campus-prep", JSON.stringify(prep)); }, [prep]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);
  useEffect(() => {
    const feedUrl = new URL("./scu-jobs.json", window.location.href);
    fetch(feedUrl, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(String(response.status))))
      .then((feed: ScuJobFeed) => setJobFeed(feed))
      .catch(() => setJobFeed(null));
  }, []);

  const upcoming = campusEvents.find((event) => event.status === "upcoming")!;
  const recommendations = useMemo(() => campusEvents.map((event) => recommendEvent(event, profile)).sort((a, b) => Number(b.status === "upcoming") - Number(a.status === "upcoming") || b.match - a.match).slice(0, 3), [profile]);
  const filteredEvents = useMemo(() => campusEvents.filter((event) => {
    const keyword = `${event.title}${event.address}${event.organizer}${event.audience}${event.companyType}`.toLowerCase();
    return (!query || keyword.includes(query.toLowerCase()))
      && (eventType === "全部类型" || event.type === eventType)
      && (campus === "全部校区" || event.campus === campus)
      && (companyType === "全部企业" || event.companyType === companyType)
      && (scope === "all" || (scope === "upcoming" ? event.status === "upcoming" : saved.includes(event.id)));
  }), [campus, companyType, eventType, query, saved, scope]);
  const filteredJobs = useMemo(() => (jobFeed?.jobs || []).filter((job) => {
    const keyword = `${job.title}${job.company}${job.major}${job.location}${job.industry}`.toLowerCase();
    return (!jobQuery || keyword.includes(jobQuery.toLowerCase()))
      && (jobNature === "全部岗位" || job.nature.includes(jobNature));
  }).slice(0, 12), [jobFeed, jobNature, jobQuery]);

  function toggleSave(id: string) {
    const exists = saved.includes(id);
    setSaved(exists ? saved.filter((item) => item !== id) : [...saved, id]);
    setToast(exists ? "已从日程移除" : "已加入我的日程");
  }
  function togglePrep(item: string) { setPrep(prep.includes(item) ? prep.filter((value) => value !== item) : [...prep, item]); }
  function openProfile() { setDraftProfile(profile); setShowUserMenu(false); setShowProfileModal(true); }
  function saveProfile() {
    const normalized = { ...draftProfile, name: draftProfile.name.trim() || "君宝", major: draftProfile.major.trim(), skills: draftProfile.skills.trim() };
    setProfile(normalized); setLoggedIn(true); setShowProfileModal(false);
    localStorage.setItem("jobrec-campus-profile", JSON.stringify(normalized)); localStorage.setItem("jobrec-campus-login", "true");
    setToast("求职档案已保存，推荐已更新");
  }
  function logout() { setLoggedIn(false); setShowUserMenu(false); localStorage.removeItem("jobrec-campus-login"); setToast("已退出本机体验账号"); }
  function toggleTargetType(value: CampusEvent["companyType"]) {
    setDraftProfile((current) => ({ ...current, targetTypes: current.targetTypes.includes(value) ? current.targetTypes.filter((item) => item !== value) : [...current.targetTypes, value] }));
  }
  function addCalendar(event: CampusEvent) {
    const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//JobRec//Campus Events//CN", "BEGIN:VEVENT", `UID:${event.id}@jobrec`, `DTSTART;TZID=Asia/Shanghai:${calendarDate(event.date, event.time)}`, `DTEND;TZID=Asia/Shanghai:${calendarDate(event.date, event.time, true)}`, `SUMMARY:${event.title}`, `LOCATION:${event.campus} ${event.address}`, `DESCRIPTION:信息来源：四川大学就业指导中心官网 ${event.officialUrl}`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const url = URL.createObjectURL(new Blob([body], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${event.title}.ics`; link.click(); URL.revokeObjectURL(url);
    setToast("日历文件已下载");
  }
  function copyAddress(event: CampusEvent) {
    navigator.clipboard.writeText(`${event.campus} ${event.address}`).then(() => setToast("地点已复制")).catch(() => setToast("请手动复制活动地点"));
  }
  function scrollToEvents(nextScope: Scope) {
    setScope(nextScope); document.getElementById("events")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return <div className="site-shell">
    <header className="site-header">
      <a className="brand" href="#top" aria-label="返回首页"><span className="brand-mark">ssp</span><span><b>智聘方舟</b><small>SCU CAMPUS CAREER</small></span></a>
      <nav aria-label="主导航"><button onClick={() => document.getElementById("jobs")?.scrollIntoView({ behavior: "smooth" })}>最新岗位</button><button onClick={() => scrollToEvents("upcoming")}>近期活动</button><button onClick={() => scrollToEvents("all")}>全部日历</button><button onClick={() => scrollToEvents("saved")}>我的日程 <em>{saved.length}</em></button></nav>
      <a className="official-link" href={officialSources.home} target="_blank" rel="noreferrer">川大就业官网 ↗</a>
      <div className="account-wrap">
        <button className="account-button" onClick={() => setShowUserMenu(!showUserMenu)} aria-label="打开个人中心"><span className="avatar">{loggedIn ? profile.name.slice(0, 1) : "登"}</span><span className="account-label">{loggedIn ? profile.name : "登录"}</span></button>
        {showUserMenu && <div className="account-menu">{loggedIn ? <><span>本机体验账号</span><b>{profile.name}</b><p>{profile.degree} · {profile.major || "专业待完善"}</p><button className="menu-primary" onClick={openProfile}>编辑求职档案</button><button onClick={logout}>退出登录</button></> : <><span>个人中心</span><b>建立你的求职档案</b><p>填写学历、专业和技能，获得更合适的活动推荐。</p><button className="menu-primary" onClick={openProfile}>登录 / 建立档案</button><small>资料仅保存在当前浏览器</small></>}</div>}
      </div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow">为川大校招生做减法</span><h1>别错过下一场<br /><strong>校园招聘会</strong></h1><p>把分散在学校就业平台里的宣讲会、双选会和校区信息，整理成一张真正可执行的求职日历。</p><div className="hero-actions"><button className="primary" onClick={() => scrollToEvents("upcoming")}>查看近期活动</button><button className="secondary" onClick={() => toggleSave(upcoming.id)}>{saved.includes(upcoming.id) ? "✓ 已加入日程" : "+ 加入我的日程"}</button></div><div className="trust-row"><span>✓ 官方来源</span><span>✓ 本地收藏</span><span>✓ 一键加日历</span></div></div>
        <article className="next-event-card"><div className="next-head"><span>下一场校内活动</span><b>{countdown(upcoming.date)}</b></div><div className="date-block"><strong>04</strong><span>SEP<br />FRI</span></div><div className="event-type-row"><span className="tag blue">{upcoming.type}</span><span className="tag">{upcoming.campus}</span></div><h2>{upcoming.title}</h2><dl><div><dt>时间</dt><dd>{displayDate(upcoming.date)} · {upcoming.time}</dd></div><div><dt>地点</dt><dd>{upcoming.address}</dd></div></dl><button className="card-action" onClick={() => setSelected(upcoming)}>查看详情与准备清单 <span>→</span></button></article>
      </section>

      <section className="quick-stats" aria-label="数据概览"><div><span>下一场活动</span><b>09.04</b><small>国企央企专场</small></div><div><span>同步岗位</span><b>{jobFeed?.count || "—"}</b><small>全职 · 实习 · 综合</small></div><div><span>覆盖校区</span><b>3</b><small>望江 · 江安 · 华西</small></div><div><span>最近同步</span><b>{jobFeed ? displaySyncTime(jobFeed.updatedAt).slice(0, 5) : "—"}</b><small>{jobFeed ? displaySyncTime(jobFeed.updatedAt) : "正在读取官方数据"}</small></div></section>

      {loggedIn ? <section className="recommend-section">
        <div className="recommend-head"><div><span className="eyebrow">FOR YOU</span><h2>为{profile.name}推荐</h2><p>根据你的{profile.degree}学历、{profile.major || "专业"}背景、技能与求职偏好计算。</p></div><button onClick={openProfile}>调整求职档案</button></div>
        <div className="recommend-grid">{recommendations.map((event) => <article key={event.id}><div className="match-score"><b>{event.match}%</b><span>匹配度</span></div><div className="recommend-content"><div><span className="tag blue">{event.companyType}</span><span className="tag">{event.campus}</span></div><h3>{event.title}</h3><p>{event.reason}</p><small>{displayDate(event.date)} · {event.time}</small></div><div className="recommend-actions"><button onClick={() => setSelected(event)}>查看详情</button><button className={saved.includes(event.id) ? "saved" : ""} onClick={() => toggleSave(event.id)}>{saved.includes(event.id) ? "✓ 已加入日程" : "+ 加入日程"}</button></div></article>)}</div>
        <p className="recommend-note">推荐基于活动主题与个人填写信息的规则匹配，不代表企业资格审核或录用承诺。</p>
      </section> : <section className="profile-callout"><div><span>◎</span><p><b>让合适的宣讲会主动找到你</b><small>登录并填写学历、专业、技能和意向企业类型，系统会优先呈现相关活动。</small></p></div><button onClick={openProfile}>建立求职档案 →</button></section>}

      <section className="jobs-section" id="jobs">
        <div className="jobs-heading"><div><span className="eyebrow">SCU LIVE JOB FEED</span><h2>川大最新岗位</h2><p>系统每 6 小时同步一次就业指导中心官网公开岗位，结果以官方原文为准。</p></div><div className="sync-badge"><i className={jobFeed ? "online" : ""} /><span>{jobFeed ? `已同步 ${jobFeed.count} 条` : "正在读取"}<small>{jobFeed ? displaySyncTime(jobFeed.updatedAt) : "等待数据"}</small></span></div></div>
        <div className="jobs-toolbar"><label><span>⌕</span><input value={jobQuery} onChange={(event) => setJobQuery(event.target.value)} placeholder="搜索岗位、企业、专业或地点" /></label><select value={jobNature} onChange={(event) => setJobNature(event.target.value)}><option>全部岗位</option><option>全职</option><option>实习</option></select><a href={jobFeed?.sourceUrl || "https://jy.scu.edu.cn/index/index/employjob.html"} target="_blank" rel="noreferrer">川大岗位原始列表 ↗</a></div>
        <div className="jobs-grid">{filteredJobs.map((job) => <article key={job.id}><div className="job-top"><span>{job.nature}</span><b>{loggedIn ? `${jobMatch(job, profile)}% 匹配` : job.publishedAt || "最新发布"}</b></div><h3>{job.title}</h3><p>{job.company}</p><dl><div><dt>地点</dt><dd>{job.location}</dd></div><div><dt>学历</dt><dd>{job.education}</dd></div><div><dt>薪资</dt><dd>{job.salary}</dd></div><div><dt>截止</dt><dd>{job.deadline || "以官网为准"}</dd></div></dl><div className="job-tags"><span>{job.jobType}</span><span>{job.industry}</span></div><a href={job.sourceUrl} target="_blank" rel="noreferrer">查看川大官方原文 <span>→</span></a></article>)}{!filteredJobs.length && <div className="jobs-empty"><b>{jobFeed ? "没有匹配岗位" : "正在获取川大最新岗位"}</b><p>{jobFeed ? "试试更换关键词或岗位类型。" : "首次加载可能需要几秒钟。"}</p></div>}</div>
        <p className="jobs-disclaimer">岗位来自四川大学就业指导中心官网公开页面；同步可能存在延迟，投递要求、截止时间及联系方式请以官方原文为准。</p>
      </section>

      <section className="workspace" id="events">
        <div className="events-panel">
          <div className="section-heading"><div><span className="eyebrow">CAMPUS CALENDAR</span><h2>校园求职日历</h2><p>未来场次优先展示，往期活动保留作求职节奏参考。</p></div><a href={officialSources.talks} target="_blank" rel="noreferrer">查看官方完整日历 ↗</a></div>
          <div className="toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索活动、企业或地点" /></label><select value={eventType} onChange={(event) => setEventType(event.target.value as EventType)} aria-label="活动类型"><option>全部类型</option><option>双选会</option><option>线下宣讲</option><option>线上宣讲</option></select><select value={companyType} onChange={(event) => setCompanyType(event.target.value as CompanyType)} aria-label="企业类型"><option>全部企业</option><option>国企央企</option><option>金融</option><option>教育</option><option>医药卫生</option><option>地方引才</option><option>综合招聘</option></select><select value={campus} onChange={(event) => setCampus(event.target.value as Campus)} aria-label="校区"><option>全部校区</option><option>望江校区</option><option>江安校区</option><option>华西校区</option><option>线上</option></select></div>
          <div className="scope-tabs"><button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>全部活动</button><button className={scope === "upcoming" ? "active" : ""} onClick={() => setScope("upcoming")}>即将开始</button><button className={scope === "saved" ? "active" : ""} onClick={() => setScope("saved")}>我的日程 ({saved.length})</button></div>
          <div className="event-list">{filteredEvents.map((event) => <article className={`event-row ${event.status}`} key={event.id}><div className="event-date"><b>{event.date.slice(8)}</b><span>{event.date.slice(5, 7)}月</span></div><button className="event-main" onClick={() => setSelected(event)}><div><span className={`tag ${event.type === "双选会" ? "blue" : ""}`}>{event.type}</span><span className="tag">{event.campus}</span>{event.status === "past" && <span className="tag muted">已结束</span>}</div><h3>{event.title}</h3><p>{event.time} · {event.address}</p></button><div className="event-actions"><button className={saved.includes(event.id) ? "saved" : ""} onClick={() => toggleSave(event.id)} aria-label="加入日程">{saved.includes(event.id) ? "★" : "☆"}</button><button onClick={() => setSelected(event)} aria-label="查看详情">›</button></div></article>)}{!filteredEvents.length && <div className="empty-state"><span>◎</span><h3>{scope === "saved" ? "还没有加入日程的活动" : "没有找到匹配活动"}</h3><p>{scope === "saved" ? "点击活动右侧的星标，把重要场次集中到这里。" : "试试清除搜索词或切换筛选条件。"}</p><button onClick={() => { setScope("all"); setQuery(""); setEventType("全部类型"); setCampus("全部校区"); }}>查看全部活动</button></div>}</div>
        </div>
        <aside className="planner">
          <section className="planner-card"><div className="planner-title"><div><span>我的日程</span><b>{saved.length} 场</b></div><span className="mini-calendar">▦</span></div>{saved.length ? <div className="saved-list">{campusEvents.filter((event) => saved.includes(event.id)).map((event) => <button key={event.id} onClick={() => setSelected(event)}><span>{event.date.slice(5).replace("-", ".")}</span><p><b>{event.title}</b><small>{event.campus}</small></p><em>›</em></button>)}</div> : <p className="planner-empty">收藏活动后，会在这里形成你的专属求职日程。</p>}</section>
          <section className="planner-card prep-card"><div className="planner-title"><div><span>参会前准备</span><b>{prep.length}/{prepItems.length}</b></div><span className="progress-ring">{Math.round(prep.length / prepItems.length * 100)}%</span></div><div className="prep-list">{prepItems.map((item) => <label key={item}><input type="checkbox" checked={prep.includes(item)} onChange={() => togglePrep(item)} /><i>✓</i><span>{item}</span></label>)}</div><p>准备进度仅保存在当前浏览器，不会上传个人信息。</p></section>
          <section className="source-card"><span>数据可信度</span><h3>只展示可核验的学校官方信息</h3><p>{jobFeed ? `岗位最近同步于 ${displaySyncTime(jobFeed.updatedAt)}。` : `活动数据核验于 ${officialSources.updatedAt}。`}安排可能调整，请在行动前再次查看官网。</p><div><a href={officialSources.talks} target="_blank" rel="noreferrer">宣讲会官网 ↗</a><a href={officialSources.fairs} target="_blank" rel="noreferrer">双选会官网 ↗</a></div></section>
        </aside>
      </section>

      <section className="why-section"><div><span className="eyebrow">PRODUCT FOCUS</span><h2>只解决一件事：<br />让校内求职资源真正被用起来。</h2></div><div className="why-grid"><article><b>01</b><h3>信息不再分散</h3><p>宣讲、双选与校区地点进入同一张日历。</p></article><article><b>02</b><h3>行动不再遗忘</h3><p>收藏、准备清单和日历下载形成执行闭环。</p></article><article><b>03</b><h3>历史不再混用</h3><p>未来场次与往期记录明确区分，链接官方核验。</p></article></div></section>
    </main>

    <footer><div className="brand"><span className="brand-mark">ssp</span><span><b>智聘方舟</b><small>校园求职资源导航</small></span></div><p>作品集交互原型 · 数据来自四川大学就业指导中心官网</p><a href={officialSources.home} target="_blank" rel="noreferrer">官方数据源 ↗</a></footer>

    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */}
    {showProfileModal && <div className="modal-layer" onMouseDown={() => setShowProfileModal(false)}><section className="profile-modal" role="dialog" aria-modal="true" aria-labelledby="profile-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setShowProfileModal(false)}>×</button><span className="profile-kicker">本机体验登录</span><h2 id="profile-title">建立求职档案</h2><p className="profile-intro">信息仅保存在当前浏览器，用于计算活动推荐，不会上传至服务器。</p><form onSubmit={(event) => { event.preventDefault(); saveProfile(); }}><div className="profile-form-grid"><label><span>昵称</span><input value={draftProfile.name} onChange={(event) => setDraftProfile({ ...draftProfile, name: event.target.value })} placeholder="例如：君宝" /></label><label><span>最高学历</span><select value={draftProfile.degree} onChange={(event) => setDraftProfile({ ...draftProfile, degree: event.target.value })}><option>本科</option><option>硕士</option><option>博士</option></select></label><label className="wide"><span>专业</span><input value={draftProfile.major} onChange={(event) => setDraftProfile({ ...draftProfile, major: event.target.value })} placeholder="例如：应用统计、计算机科学、临床医学" /></label><label className="wide"><span>技能关键词</span><textarea value={draftProfile.skills} onChange={(event) => setDraftProfile({ ...draftProfile, skills: event.target.value })} rows={3} placeholder="例如：Python、数据分析、英语、项目管理" /></label><label><span>偏好校区</span><select value={draftProfile.campus} onChange={(event) => setDraftProfile({ ...draftProfile, campus: event.target.value as Profile["campus"] })}><option>不限</option><option>望江校区</option><option>江安校区</option><option>华西校区</option><option>线上</option></select></label><label className="resume-upload"><span>附加简历（可选）</span><input type="file" accept=".pdf,.doc,.docx" onChange={(event) => setResumeFileName(event.target.files?.[0]?.name || "")} /><i>{resumeFileName || "选择 PDF / Word"}</i></label></div><fieldset><legend>意向企业类型（可多选）</legend><div className="target-types">{companyTypes.map((item) => <label key={item}><input type="checkbox" checked={draftProfile.targetTypes.includes(item)} onChange={() => toggleTargetType(item)} /><span>{item}</span></label>)}</div></fieldset><div className="privacy-note">🔒 简历文件只读取文件名，不上传、不解析；推荐依据由你填写的专业与技能生成。</div><button className="profile-save" type="submit">保存档案并查看推荐</button></form></section></div>}

    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */}
    {selected && <div className="modal-layer" onMouseDown={() => setSelected(null)}><section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><div className="event-type-row"><span className={`tag ${selected.type === "双选会" ? "blue" : ""}`}>{selected.type}</span><span className="tag">{selected.campus}</span><span className={`tag ${selected.status === "past" ? "muted" : "green"}`}>{selected.status === "past" ? "往期记录" : "即将开始"}</span></div><h2 id="event-title">{selected.title}</h2><p className="modal-summary">{selected.summary}</p><dl className="event-details"><div><dt>日期</dt><dd>{displayDate(selected.date)}</dd></div><div><dt>时间</dt><dd>{selected.time}</dd></div><div><dt>地点</dt><dd>{selected.campus} · {selected.address}</dd></div><div><dt>适合人群</dt><dd>{selected.audience}</dd></div><div><dt>发布方</dt><dd>{selected.organizer}</dd></div></dl><div className="modal-note">信息核验于 {officialSources.updatedAt}。活动安排可能变化，请以官方页面最新通知为准。</div><div className="modal-actions"><button onClick={() => copyAddress(selected)}>复制地点</button><button onClick={() => addCalendar(selected)}>下载日历</button><button className="primary" onClick={() => toggleSave(selected.id)}>{saved.includes(selected.id) ? "✓ 已加入日程" : "+ 加入我的日程"}</button></div><a className="modal-official" href={selected.officialUrl} target="_blank" rel="noreferrer">前往四川大学就业指导中心官网核验详情 ↗</a></section></div>}
    {toast && <div className="toast">✓ {toast}</div>}
  </div>;
}
