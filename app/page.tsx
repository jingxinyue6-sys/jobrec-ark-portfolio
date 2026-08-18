"use client";

import { useEffect, useMemo, useState } from "react";
import { campusEvents, officialSources, type CampusEvent } from "./events";

type Scope = "all" | "upcoming" | "saved";
type EventType = "全部类型" | CampusEvent["type"];
type Campus = "全部校区" | CampusEvent["campus"];
const prepItems = ["更新一页简历", "准备60秒自我介绍", "整理3个想问企业的问题"];

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

export default function Home() {
  const [scope, setScope] = useState<Scope>("all");
  const [query, setQuery] = useState("");
  const [eventType, setEventType] = useState<EventType>("全部类型");
  const [campus, setCampus] = useState<Campus>("全部校区");
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

  useEffect(() => { localStorage.setItem("jobrec-campus-saved", JSON.stringify(saved)); }, [saved]);
  useEffect(() => { localStorage.setItem("jobrec-campus-prep", JSON.stringify(prep)); }, [prep]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const upcoming = campusEvents.find((event) => event.status === "upcoming")!;
  const filteredEvents = useMemo(() => campusEvents.filter((event) => {
    const keyword = `${event.title}${event.address}${event.organizer}${event.audience}`.toLowerCase();
    return (!query || keyword.includes(query.toLowerCase()))
      && (eventType === "全部类型" || event.type === eventType)
      && (campus === "全部校区" || event.campus === campus)
      && (scope === "all" || (scope === "upcoming" ? event.status === "upcoming" : saved.includes(event.id)));
  }), [campus, eventType, query, saved, scope]);

  function toggleSave(id: string) {
    const exists = saved.includes(id);
    setSaved(exists ? saved.filter((item) => item !== id) : [...saved, id]);
    setToast(exists ? "已从日程移除" : "已加入我的日程");
  }
  function togglePrep(item: string) { setPrep(prep.includes(item) ? prep.filter((value) => value !== item) : [...prep, item]); }
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
      <a className="brand" href="#top" aria-label="返回首页"><span className="brand-mark">舟</span><span><b>智聘方舟</b><small>SCU CAMPUS CAREER</small></span></a>
      <nav aria-label="主导航"><button onClick={() => scrollToEvents("upcoming")}>近期活动</button><button onClick={() => scrollToEvents("all")}>全部日历</button><button onClick={() => scrollToEvents("saved")}>我的日程 <em>{saved.length}</em></button></nav>
      <a className="official-link" href={officialSources.home} target="_blank" rel="noreferrer">川大就业官网 ↗</a><div className="avatar" title="君宝">君</div>
    </header>

    <main id="top">
      <section className="hero">
        <div className="hero-copy"><span className="eyebrow">为川大校招生做减法</span><h1>别错过下一场<br /><strong>校园招聘会</strong></h1><p>把分散在学校就业平台里的宣讲会、双选会和校区信息，整理成一张真正可执行的求职日历。</p><div className="hero-actions"><button className="primary" onClick={() => scrollToEvents("upcoming")}>查看近期活动</button><button className="secondary" onClick={() => toggleSave(upcoming.id)}>{saved.includes(upcoming.id) ? "✓ 已加入日程" : "+ 加入我的日程"}</button></div><div className="trust-row"><span>✓ 官方来源</span><span>✓ 本地收藏</span><span>✓ 一键加日历</span></div></div>
        <article className="next-event-card"><div className="next-head"><span>下一场校内活动</span><b>{countdown(upcoming.date)}</b></div><div className="date-block"><strong>04</strong><span>SEP<br />FRI</span></div><div className="event-type-row"><span className="tag blue">{upcoming.type}</span><span className="tag">{upcoming.campus}</span></div><h2>{upcoming.title}</h2><dl><div><dt>时间</dt><dd>{displayDate(upcoming.date)} · {upcoming.time}</dd></div><div><dt>地点</dt><dd>{upcoming.address}</dd></div></dl><button className="card-action" onClick={() => setSelected(upcoming)}>查看详情与准备清单 <span>→</span></button></article>
      </section>

      <section className="quick-stats" aria-label="数据概览"><div><span>下一场活动</span><b>09.04</b><small>国企央企专场</small></div><div><span>覆盖校区</span><b>3</b><small>望江 · 江安 · 华西</small></div><div><span>活动类型</span><b>3</b><small>宣讲 · 双选 · 线上</small></div><div><span>官方更新</span><b>08.18</b><small>2026 年最新核验</small></div></section>

      <section className="workspace" id="events">
        <div className="events-panel">
          <div className="section-heading"><div><span className="eyebrow">CAMPUS CALENDAR</span><h2>校园求职日历</h2><p>未来场次优先展示，往期活动保留作求职节奏参考。</p></div><a href={officialSources.talks} target="_blank" rel="noreferrer">查看官方完整日历 ↗</a></div>
          <div className="toolbar"><label className="search-box"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索活动、企业或地点" /></label><select value={eventType} onChange={(event) => setEventType(event.target.value as EventType)} aria-label="活动类型"><option>全部类型</option><option>双选会</option><option>线下宣讲</option><option>线上宣讲</option></select><select value={campus} onChange={(event) => setCampus(event.target.value as Campus)} aria-label="校区"><option>全部校区</option><option>望江校区</option><option>江安校区</option><option>华西校区</option><option>线上</option></select></div>
          <div className="scope-tabs"><button className={scope === "all" ? "active" : ""} onClick={() => setScope("all")}>全部活动</button><button className={scope === "upcoming" ? "active" : ""} onClick={() => setScope("upcoming")}>即将开始</button><button className={scope === "saved" ? "active" : ""} onClick={() => setScope("saved")}>我的日程 ({saved.length})</button></div>
          <div className="event-list">{filteredEvents.map((event) => <article className={`event-row ${event.status}`} key={event.id}><div className="event-date"><b>{event.date.slice(8)}</b><span>{event.date.slice(5, 7)}月</span></div><button className="event-main" onClick={() => setSelected(event)}><div><span className={`tag ${event.type === "双选会" ? "blue" : ""}`}>{event.type}</span><span className="tag">{event.campus}</span>{event.status === "past" && <span className="tag muted">已结束</span>}</div><h3>{event.title}</h3><p>{event.time} · {event.address}</p></button><div className="event-actions"><button className={saved.includes(event.id) ? "saved" : ""} onClick={() => toggleSave(event.id)} aria-label="加入日程">{saved.includes(event.id) ? "★" : "☆"}</button><button onClick={() => setSelected(event)} aria-label="查看详情">›</button></div></article>)}{!filteredEvents.length && <div className="empty-state"><span>◎</span><h3>{scope === "saved" ? "还没有加入日程的活动" : "没有找到匹配活动"}</h3><p>{scope === "saved" ? "点击活动右侧的星标，把重要场次集中到这里。" : "试试清除搜索词或切换筛选条件。"}</p><button onClick={() => { setScope("all"); setQuery(""); setEventType("全部类型"); setCampus("全部校区"); }}>查看全部活动</button></div>}</div>
        </div>
        <aside className="planner">
          <section className="planner-card"><div className="planner-title"><div><span>我的日程</span><b>{saved.length} 场</b></div><span className="mini-calendar">▦</span></div>{saved.length ? <div className="saved-list">{campusEvents.filter((event) => saved.includes(event.id)).map((event) => <button key={event.id} onClick={() => setSelected(event)}><span>{event.date.slice(5).replace("-", ".")}</span><p><b>{event.title}</b><small>{event.campus}</small></p><em>›</em></button>)}</div> : <p className="planner-empty">收藏活动后，会在这里形成你的专属求职日程。</p>}</section>
          <section className="planner-card prep-card"><div className="planner-title"><div><span>参会前准备</span><b>{prep.length}/{prepItems.length}</b></div><span className="progress-ring">{Math.round(prep.length / prepItems.length * 100)}%</span></div><div className="prep-list">{prepItems.map((item) => <label key={item}><input type="checkbox" checked={prep.includes(item)} onChange={() => togglePrep(item)} /><i>✓</i><span>{item}</span></label>)}</div><p>准备进度仅保存在当前浏览器，不会上传个人信息。</p></section>
          <section className="source-card"><span>数据可信度</span><h3>只展示可核验的学校官方信息</h3><p>数据核验于 {officialSources.updatedAt}。未来安排可能调整，请在出发前再次查看官网。</p><div><a href={officialSources.talks} target="_blank" rel="noreferrer">宣讲会官网 ↗</a><a href={officialSources.fairs} target="_blank" rel="noreferrer">双选会官网 ↗</a></div></section>
        </aside>
      </section>

      <section className="why-section"><div><span className="eyebrow">PRODUCT FOCUS</span><h2>只解决一件事：<br />让校内求职资源真正被用起来。</h2></div><div className="why-grid"><article><b>01</b><h3>信息不再分散</h3><p>宣讲、双选与校区地点进入同一张日历。</p></article><article><b>02</b><h3>行动不再遗忘</h3><p>收藏、准备清单和日历下载形成执行闭环。</p></article><article><b>03</b><h3>历史不再混用</h3><p>未来场次与往期记录明确区分，链接官方核验。</p></article></div></section>
    </main>

    <footer><div className="brand"><span className="brand-mark">舟</span><span><b>智聘方舟</b><small>校园求职资源导航</small></span></div><p>作品集交互原型 · 数据来自四川大学就业指导中心官网</p><a href={officialSources.home} target="_blank" rel="noreferrer">官方数据源 ↗</a></footer>

    {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/no-noninteractive-element-interactions */}
    {selected && <div className="modal-layer" onMouseDown={() => setSelected(null)}><section className="event-modal" role="dialog" aria-modal="true" aria-labelledby="event-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><div className="event-type-row"><span className={`tag ${selected.type === "双选会" ? "blue" : ""}`}>{selected.type}</span><span className="tag">{selected.campus}</span><span className={`tag ${selected.status === "past" ? "muted" : "green"}`}>{selected.status === "past" ? "往期记录" : "即将开始"}</span></div><h2 id="event-title">{selected.title}</h2><p className="modal-summary">{selected.summary}</p><dl className="event-details"><div><dt>日期</dt><dd>{displayDate(selected.date)}</dd></div><div><dt>时间</dt><dd>{selected.time}</dd></div><div><dt>地点</dt><dd>{selected.campus} · {selected.address}</dd></div><div><dt>适合人群</dt><dd>{selected.audience}</dd></div><div><dt>发布方</dt><dd>{selected.organizer}</dd></div></dl><div className="modal-note">信息核验于 {officialSources.updatedAt}。活动安排可能变化，请以官方页面最新通知为准。</div><div className="modal-actions"><button onClick={() => copyAddress(selected)}>复制地点</button><button onClick={() => addCalendar(selected)}>下载日历</button><button className="primary" onClick={() => toggleSave(selected.id)}>{saved.includes(selected.id) ? "✓ 已加入日程" : "+ 加入我的日程"}</button></div><a className="modal-official" href={selected.officialUrl} target="_blank" rel="noreferrer">前往四川大学就业指导中心官网核验详情 ↗</a></section></div>}
    {toast && <div className="toast">✓ {toast}</div>}
  </div>;
}
