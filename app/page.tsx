"use client";

import { useMemo, useState } from "react";

type Strategy = "score" | "fit" | "chance";
type Job = {
  id: number; company: string; role: string; city: string; salary: string;
  fit: number; chance: number; score: number; color: string; tag: string;
  reason: string; next: string;
};

const jobs: Job[] = [
  { id: 1, company: "星网智造", role: "数据分析培养生", city: "成都", salary: "9–12K", fit: 91, chance: 76, score: 86, color: "blue", tag: "重点投递", reason: "专业背景、数据建模经验与岗位要求高度契合，工作城市也符合你的地域偏好。", next: "9月18日 · 望江校区线下宣讲" },
  { id: 2, company: "西部科技", role: "商业分析师", city: "重庆", salary: "10–15K", fit: 84, chance: 88, score: 85, color: "purple", tag: "高把握", reason: "往届录用画像与你的教育经历相近，当前竞争热度适中。", next: "9月20日 · 线上宣讲" },
  { id: 3, company: "锦江数字", role: "策略运营", city: "成都", salary: "8–13K", fit: 79, chance: 93, score: 84, color: "pink", tag: "保底机会", reason: "岗位与现有项目经验迁移性较好，录用门槛与你的竞争力匹配。", next: "9月22日 · 江安校区双选会" },
  { id: 4, company: "川路投资集团", role: "经营管理岗", city: "成都", salary: "8–11K", fit: 82, chance: 81, score: 82, color: "yellow", tag: "国企优选", reason: "统计学背景与经营分析要求匹配，组织类型符合你的稳定性偏好。", next: "9月25日 · 国企专场双选会" },
  { id: 5, company: "灵犀咨询", role: "数据咨询顾问", city: "上海", salary: "14–20K", fit: 94, chance: 61, score: 80, color: "green", tag: "摸高机会", reason: "能力匹配度很高，但热门城市与岗位竞争度偏高，适合作为摸高选项。", next: "9月27日 · 线上笔试截止" },
];

const labels: Record<Strategy, string> = { score: "综合最优", fit: "匹配度优先", chance: "成功率优先" };

function Icon({ children }: { children: React.ReactNode }) {
  return <span className="nav-icon" aria-hidden="true">{children}</span>;
}

function Ring({ value, tone }: { value: number; tone: string }) {
  return <div className={`ring ${tone}`} style={{ "--value": `${value * 3.6}deg` } as React.CSSProperties}><span>{value}</span></div>;
}

export default function Home() {
  const [strategy, setStrategy] = useState<Strategy>("score");
  const [city, setCity] = useState("全部城市");
  const [query, setQuery] = useState("");
  const [saved, setSaved] = useState<number[]>([2]);
  const [selected, setSelected] = useState<Job | null>(null);
  const [mobileMenu, setMobileMenu] = useState(false);

  const shownJobs = useMemo(() => jobs
    .filter((job) => city === "全部城市" || job.city === city)
    .filter((job) => `${job.role}${job.company}`.includes(query.trim()))
    .sort((a, b) => b[strategy] - a[strategy]), [strategy, city, query]);

  const toggleSave = (id: number) => setSaved((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "open" : ""}`}>
        <div className="logo-row">
          <span className="logo">A</span>
          <div><b>智聘方舟</b><small>JobRec</small></div>
          <button onClick={() => setMobileMenu(false)} className="close-menu" aria-label="关闭菜单">×</button>
        </div>

        <a className="ai-button" href="#dashboard" onClick={() => setMobileMenu(false)}><span>✧</span> AI 求职顾问</a>

        <nav className="side-nav" aria-label="主要导航">
          <a className="active" href="#dashboard" onClick={() => setMobileMenu(false)}><Icon>▦</Icon>求职仪表盘</a>
          <p>求职管理</p>
          <a href="#opportunities" onClick={() => setMobileMenu(false)}><Icon>◎</Icon>岗位推荐 <em>{jobs.length}</em></a>
          <a href="#schedule" onClick={() => setMobileMenu(false)}><Icon>□</Icon>宣讲日程</a>
          <a href="#opportunities" onClick={() => setMobileMenu(false)}><Icon>☆</Icon>我的收藏 <em>{saved.length}</em></a>
          <p>个人画像</p>
          <a href="#profile" onClick={() => setMobileMenu(false)}><Icon>◇</Icon>能力档案</a>
          <a href="#profile" onClick={() => setMobileMenu(false)}><Icon>⌁</Icon>求职偏好</a>
          <p>项目说明</p>
          <a href="#case-study" onClick={() => setMobileMenu(false)}><Icon>◫</Icon>产品方法</a>
          <a href="#case-study" onClick={() => setMobileMenu(false)}><Icon>↗</Icon>项目故事</a>
        </nav>

        <div className="profile-progress" id="profile">
          <div><span className="mini-avatar">景</span><p><b>个人画像</b><small>硕士 · 应用统计</small></p><span>⋮</span></div>
          <p className="progress-title"><span>资料完整度</span><b>86%</b></p>
          <i><em /></i>
          <button onClick={() => alert("演示模式：完整版可编辑技能、经历与求职偏好。")}>继续完善</button>
        </div>
      </aside>

      {mobileMenu && <button className="menu-overlay" onClick={() => setMobileMenu(false)} aria-label="关闭菜单" />}

      <div className="workspace">
        <header className="topbar">
          <button className="menu-button" onClick={() => setMobileMenu(true)} aria-label="打开菜单">☰</button>
          <div><span>智聘方舟</span><b>求职仪表盘</b></div>
          <label className="global-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索岗位、企业或询问 AI" /></label>
          <button className="notice" aria-label="通知">♧<i /></button>
          <div className="user-chip"><span>景</span><p><b>景欣悦</b><small>求职者</small></p><em>⌄</em></div>
        </header>

        <main className="dashboard" id="dashboard">
          <div className="page-head">
            <div><p>2026 秋招 · 第 3 周</p><h1>晚上好，景欣悦 👋</h1><span>这里是你今天的求职进展与优先行动。</span></div>
            <button onClick={() => document.getElementById("opportunities")?.scrollIntoView({ behavior: "smooth" })}>查看全部机会 <span>→</span></button>
          </div>

          <section className="ai-suggestion">
            <div className="ai-title"><span>✦</span><b>AI 今日建议</b><em>基于你的画像实时生成</em></div>
            <p><span>▲</span> 优先投递 <b>星网智造 · 数据分析培养生</b>；今晚有 2 个职位即将截止，周内还有 3 场相关宣讲会。</p>
            <button onClick={() => setSelected(jobs[0])}>查看建议详情 →</button>
          </section>

          <section className="stat-grid" aria-label="求职进展概览">
            <article><p>推荐岗位</p><strong>28</strong><div className="status green"><span>●</span> 本周新增 6 个</div></article>
            <article><p>重点机会</p><strong>07</strong><div className="status purple"><span>◆</span> 3 个建议优先投递</div></article>
            <article><p>平均匹配度</p><strong>84<span>%</span></strong><div className="status blue"><span>↗</span> 高于上周 5%</div></article>
            <article><p>待办事项</p><strong>05</strong><div className="status yellow"><span>◷</span> 2 项即将截止</div></article>
          </section>

          <div className="content-grid">
            <section className="panel opportunities" id="opportunities">
              <div className="panel-head"><div><h2>优先岗位</h2><p>根据你的画像与当前策略排序</p></div><button onClick={() => alert("演示版已展示全部脱敏岗位。")}>查看全部</button></div>

              <div className="controls">
                <div className="tabs" role="tablist" aria-label="岗位排序策略">
                  {(Object.keys(labels) as Strategy[]).map((key) => <button key={key} role="tab" aria-selected={strategy === key} className={strategy === key ? "active" : ""} onClick={() => setStrategy(key)}>{labels[key]}</button>)}
                </div>
                <select value={city} onChange={(event) => setCity(event.target.value)} aria-label="城市筛选"><option>全部城市</option><option>成都</option><option>重庆</option><option>上海</option></select>
              </div>

              <div className="job-list">
                <div className="job-columns"><span>岗位信息</span><span>匹配度</span><span>成功率</span><span>综合分</span><span /></div>
                {shownJobs.map((job) => <article className="job-item" key={job.id}>
                  <div className="job-identity"><span className={`company-logo ${job.color}`}>{job.company.slice(0, 1)}</span><div><button onClick={() => setSelected(job)}>{job.role}</button><p>{job.company} · {job.city} · {job.salary}</p><span className={`job-tag ${job.color}`}>{job.tag}</span></div></div>
                  <div className="score-bar"><b>{job.fit}%</b><i><em style={{ width: `${job.fit}%` }} /></i></div>
                  <div className="score-bar chance"><b>{job.chance}%</b><i><em style={{ width: `${job.chance}%` }} /></i></div>
                  <div className="score-badge">{job.score}</div>
                  <div className="job-actions"><button className={saved.includes(job.id) ? "saved" : ""} onClick={() => toggleSave(job.id)} aria-label="收藏岗位">{saved.includes(job.id) ? "★" : "☆"}</button><button onClick={() => setSelected(job)} aria-label="查看岗位">›</button></div>
                </article>)}
                {!shownJobs.length && <div className="no-results">没有找到符合条件的岗位</div>}
              </div>
            </section>

            <section className="panel schedule" id="schedule">
              <div className="panel-head"><div><h2>本周日程</h2><p>宣讲、笔试与投递节点</p></div><button onClick={() => alert("演示模式：完整版本可同步系统日历。")}>查看日历</button></div>
              <div className="week-row"><button>‹</button>{["一|18", "二|19", "三|20", "四|21", "五|22"].map((day, index) => { const [week, date] = day.split("|"); return <span className={index === 2 ? "today" : ""} key={day}><small>周{week}</small><b>{date}</b></span>; })}<button>›</button></div>
              <div className="schedule-tabs"><button className="active">求职事项 <em>3</em></button><button>截止日期 <em>2</em></button></div>
              <div className="events">
                <article><div className="event-time"><b>09:30</b><span>10:30</span></div><div><span className="event-type blue">线上宣讲</span><h3>西部科技校园招聘宣讲</h3><p>腾讯会议 · 提前 10 分钟入场</p><div className="event-foot"><span><i>西</i><i>景</i> +2</span><em>商业分析</em></div></div></article>
                <article><div className="event-time"><b>14:00</b><span>15:30</span></div><div><span className="event-type purple">线下双选</span><h3>数据与金融专场双选会</h3><p>望江校区就业指导中心 3 楼</p><div className="event-foot"><span><i>数</i><i>金</i> +8</span><em>重点关注</em></div></div></article>
                <article><div className="event-time"><b>23:59</b><span>截止</span></div><div><span className="event-type yellow">投递截止</span><h3>星网智造网申关闭</h3><p>建议今天 20:00 前完成投递</p><div className="event-foot"><span><i>星</i> 86 分</span><em>高优先级</em></div></div></article>
              </div>
            </section>

            <section className="panel analytics">
              <div className="panel-head"><div><h2>求职竞争力</h2><p>你的能力画像与目标岗位要求对比</p></div><button onClick={() => document.getElementById("case-study")?.scrollIntoView({ behavior: "smooth" })}>了解模型</button></div>
              <div className="analytics-body">
                <div className="rings"><div><Ring value={84} tone="blue" /><p>平均匹配度<strong>较上周 +5%</strong></p></div><div><Ring value={81} tone="purple" /><p>平均成功率<strong>处于前 26%</strong></p></div><div><Ring value={86} tone="pink" /><p>画像完整度<strong>还可提升 14%</strong></p></div></div>
                <div className="skill-bars">{[["统计建模", 92, "blue"], ["数据工具", 86, "purple"], ["业务理解", 78, "pink"], ["项目经历", 72, "yellow"]].map(([name, value, tone]) => <div key={name}><p><span>{name}</span><b>{value}%</b></p><i><em className={String(tone)} style={{ width: `${value}%` }} /></i></div>)}</div>
              </div>
            </section>

            <section className="panel case-card" id="case-study">
              <div className="case-copy"><span>PORTFOLIO CASE STUDY</span><h2>从信息过载，到可执行的求职策略</h2><p>智聘方舟用“匹配度 × 成功率 × 个人偏好”构建岗位决策模型，让求职者知道什么适合自己，也知道下一步应该先做什么。</p><div><b>9,878<small>岗位样本</small></b><b>3<small>决策指标</small></b><b>4<small>产品模块</small></b></div></div>
              <div className="case-steps"><article><span>01</span><div><b>问题定义</b><p>拆解信息筛选、岗位匹配与竞争判断</p></div></article><article><span>02</span><div><b>模型设计</b><p>双塔匹配与竞争度动态修正</p></div></article><article><span>03</span><div><b>产品原型</b><p>把模型结果转化为可理解、可执行的界面</p></div></article></div>
            </section>
          </div>
          <footer><p>智聘方舟 JobRec · AI 驱动的多元指标个性化求职平台</p><span>作品集演示数据均已脱敏</span></footer>
        </main>
      </div>

      {selected && <div className="modal-layer" onMouseDown={() => setSelected(null)}><section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="job-title" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)} aria-label="关闭">×</button><span className={`job-tag ${selected.color}`}>{selected.tag}</span><h2 id="job-title">{selected.role}</h2><p className="modal-company">{selected.company} · {selected.city} · {selected.salary}</p><div className="modal-metrics"><div><b>{selected.fit}%</b><span>匹配度</span></div><div><b>{selected.chance}%</b><span>成功率</span></div><div className="total"><b>{selected.score}</b><span>综合指数</span></div></div><div className="modal-block"><span>✦ AI 推荐理由</span><p>{selected.reason}</p></div><div className="modal-block"><span>◷ 下一步行动</span><p>{selected.next}</p></div><div className="modal-buttons"><button onClick={() => toggleSave(selected.id)}>{saved.includes(selected.id) ? "★ 已收藏" : "☆ 收藏岗位"}</button><button className="primary" onClick={() => alert("演示模式：已加入你的投递计划。")}>加入投递计划 →</button></div></section></div>}
    </div>
  );
}
