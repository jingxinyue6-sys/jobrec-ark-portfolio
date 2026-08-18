"use client";

import { useMemo, useState } from "react";

type Job = {
  id: number;
  company: string;
  role: string;
  city: string;
  type: string;
  salary: string;
  fit: number;
  chance: number;
  score: number;
  tags: string[];
  reason: string;
  event: string;
};

const jobs: Job[] = [
  { id: 1, company: "星网智造", role: "数据分析培养生", city: "成都", type: "国企", salary: "9–12K", fit: 91, chance: 76, score: 86, tags: ["应用统计", "SQL", "校招"], reason: "专业背景、数据建模经验与岗位高度契合，且所在城市符合你的地域偏好。", event: "望江校区就业指导中心 · 9月18日" },
  { id: 2, company: "西部科技", role: "商业分析师", city: "重庆", type: "科技", salary: "10–15K", fit: 84, chance: 88, score: 85, tags: ["Python", "商业洞察", "双休"], reason: "往届录用画像与你的教育经历相近，竞争热度适中，属于高把握机会。", event: "云校招线上宣讲 · 9月20日" },
  { id: 3, company: "锦江数字", role: "策略运营", city: "成都", type: "互联网", salary: "8–13K", fit: 79, chance: 93, score: 84, tags: ["用户研究", "可视化", "应届"], reason: "岗位与项目经验有较好迁移性，录用门槛与你的当前竞争力匹配。", event: "江安校区青春广场 · 9月22日" },
  { id: 4, company: "川路投资集团", role: "经营管理岗", city: "成都", type: "国企", salary: "8–11K", fit: 82, chance: 81, score: 82, tags: ["数据分析", "管理", "稳定"], reason: "统计学背景与经营分析要求匹配，组织类型符合你的稳定性偏好。", event: "国企专场双选会 · 9月25日" },
  { id: 5, company: "灵犀咨询", role: "数据咨询顾问", city: "上海", type: "咨询", salary: "14–20K", fit: 94, chance: 61, score: 80, tags: ["高成长", "建模", "英语"], reason: "能力匹配度极高，但热门城市与岗位竞争度较高，适合作为摸高选项。", event: "上海站线上笔试 · 9月27日" },
  { id: 6, company: "云岭能源", role: "人力资源数据专员", city: "昆明", type: "国企", salary: "7–10K", fit: 73, chance: 95, score: 80, tags: ["国企", "人力分析", "安居"], reason: "竞争压力低、岗位要求覆盖现有技能，适合作为高性价比保底机会。", event: "西南专场空中宣讲 · 10月8日" },
];

type Strategy = "score" | "fit" | "chance";

const strategyLabel: Record<Strategy, string> = { score: "综合最优", fit: "匹配度", chance: "成功率" };

function Metric({ value, label, tone = "teal" }: { value: number; label: string; tone?: "teal" | "lime" }) {
  return <div className={`metric ${tone}`}><b>{value}</b><span>{label}</span><i><em style={{ width: `${value}%` }} /></i></div>;
}

export default function Home() {
  const [strategy, setStrategy] = useState<Strategy>("score");
  const [city, setCity] = useState("全部城市");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Job | null>(null);
  const [saved, setSaved] = useState<number[]>([2]);

  const sortedJobs = useMemo(() => jobs
    .filter((job) => city === "全部城市" || job.city === city)
    .filter((job) => `${job.company}${job.role}${job.tags.join("")}`.includes(query.trim()))
    .sort((a, b) => b[strategy] - a[strategy]), [strategy, city, query]);

  const toggleSaved = (id: number) => setSaved((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);

  return (
    <main>
      <section className="hero">
        <nav className="nav shell">
          <a className="brand" href="#top" aria-label="智聘方舟首页"><span className="brand-mark">A</span><span>智聘方舟 <small>JOBREC</small></span></a>
          <div className="nav-items"><a href="#demo">产品演示</a><a href="#method">决策模型</a><a href="#about">项目故事</a></div>
          <a className="nav-link" href="#demo">开始体验 <span>↓</span></a>
        </nav>

        <div className="hero-grid shell" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><span /> AI 驱动的求职决策系统</p>
            <h1>把海量岗位，<br />变成你的求职策略。</h1>
            <p className="lede">不只告诉你“像不像”，更回答“能不能上岸”。用匹配度、成功率和综合指数，帮你在理想与现实之间做出更好的选择。</p>
            <div className="hero-actions"><a className="button primary" href="#demo">开始体验 <span>→</span></a><a className="button ghost" href="#about">了解项目</a></div>
            <div className="proof"><b>9,878</b> 岗位样本 <i /> <b>3</b> 维决策指标 <i /> <b>1</b> 套个性化策略</div>
          </div>

          <div className="hero-card" aria-label="岗位推荐预览">
            <div className="card-top"><div><span className="tiny-label">为你推荐</span><h2>今日优先投递</h2></div><span className="live"><i /> 已更新</span></div>
            <div className="strategy-tabs"><span className="active">综合最优</span><span>最匹配</span><span>高成功率</span></div>
            <div className="job-stack">{jobs.slice(0, 3).map((job, index) => <article className="job-row" key={job.company}><span className="rank">0{index + 1}</span><div className="job-main"><h3>{job.role}</h3><p>{job.company} · {job.city}</p></div><div className="score"><b>{job.score}</b><span>综合分</span></div></article>)}</div>
            <div className="card-foot"><span>策略偏好：平衡型</span><a href="#demo">查看完整清单 ↗</a></div>
          </div>
        </div>
      </section>

      <section className="problem-strip">
        <div className="shell problem-grid"><p>求职者真正需要的，不是另一个“职位列表”。</p><div><b>36.26%</b><span>毕业生求职目标较迷茫</span></div><div><b>30万+</b><span>大型双选会可投递岗位</span></div><div><b>3 个问题</b><span>去哪场、投哪个、如何取舍</span></div></div>
      </section>

      <section className="demo-section shell" id="demo">
        <div className="section-heading"><div><p className="eyebrow"><span /> 交互产品演示</p><h2>选一种求职策略，<br />看看排名如何改变。</h2></div><p>以应用统计专业、偏好西南城市与国企的应届求职者为示例。页面数据经过脱敏与精简，专用于产品演示。</p></div>

        <div className="product-shell">
          <aside className="profile-panel">
            <div className="profile-title"><span className="avatar">景</span><div><b>我的求职画像</b><small>Profile 01 · 已完善 86%</small></div></div>
            <dl><div><dt>学历 / 专业</dt><dd>硕士 · 应用统计</dd></div><div><dt>意向方向</dt><dd>数据分析、策略运营</dd></div><div><dt>地域偏好</dt><dd>成都、重庆 · 西南优先</dd></div><div><dt>组织偏好</dt><dd>国企 / 成长型科技公司</dd></div></dl>
            <div className="skills"><span>Python</span><span>SQL</span><span>统计建模</span><span>可视化</span></div>
            <button className="edit-profile" type="button" onClick={() => alert("演示模式：完整版可在这里编辑个人画像与偏好权重。")}>调整求职偏好 <span>→</span></button>
            <p className="local-note"><i /> 演示不会上传个人信息</p>
          </aside>

          <div className="results-panel">
            <div className="results-top"><div><span className="kicker">智能推荐结果</span><h3>{sortedJobs.length} 个优先机会</h3></div><div className="mini-stats"><span><b>84</b>平均综合分</span><span><b>{saved.length}</b>已收藏</span></div></div>
            <div className="toolbar">
              <div className="segment" role="tablist" aria-label="排序策略">{(Object.keys(strategyLabel) as Strategy[]).map((key) => <button key={key} className={strategy === key ? "active" : ""} onClick={() => setStrategy(key)} role="tab">{strategyLabel[key]}</button>)}</div>
              <div className="filters"><label><span className="sr-only">搜索岗位</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索岗位 / 公司" /></label><select value={city} onChange={(event) => setCity(event.target.value)} aria-label="按城市筛选"><option>全部城市</option><option>成都</option><option>重庆</option><option>上海</option><option>昆明</option></select></div>
            </div>
            <div className="table-head"><span>排名 / 岗位</span><span>匹配度</span><span>成功率</span><span>综合分</span><span /></div>
            <div className="result-list">
              {sortedJobs.map((job, index) => <article className="result-row" key={job.id}>
                <div className="result-job"><span className="rank-big">{String(index + 1).padStart(2, "0")}</span><div><button onClick={() => setSelected(job)}>{job.role}</button><p>{job.company} · {job.city} · {job.salary}</p><div className="row-tags">{job.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div></div>
                <Metric value={job.fit} label="匹配" /><Metric value={job.chance} label="成功" tone="lime" /><div className="total-score"><b>{job.score}</b><small>/ 100</small></div>
                <div className="row-actions"><button className={saved.includes(job.id) ? "saved" : ""} onClick={() => toggleSaved(job.id)} aria-label={saved.includes(job.id) ? "取消收藏" : "收藏"}>{saved.includes(job.id) ? "★" : "☆"}</button><button onClick={() => setSelected(job)} aria-label="查看详情">↗</button></div>
              </article>)}
              {sortedJobs.length === 0 && <div className="empty-state">没有找到符合条件的岗位，试试其他关键词。</div>}
            </div>
          </div>
        </div>
      </section>

      <section className="method-section" id="method">
        <div className="shell"><div className="section-heading light"><div><p className="eyebrow"><span /> 决策模型</p><h2>一个好工作，不止一个分数。</h2></div><p>双塔模型学习“你与岗位是否契合”，竞争度调节因子再估计“你有多大机会”，最后结合个人偏好形成可执行排名。</p></div>
          <div className="method-flow"><article><span>01</span><b>用户画像</b><p>教育、技能、经历与主观偏好</p></article><i>→</i><article><span>02</span><b>双塔匹配</b><p>用户特征与岗位特征进入共同空间</p></article><i>→</i><article><span>03</span><b>动态修正</b><p>融合竞争热度与录用可能性</p></article><i>→</i><article className="highlight"><span>04</span><b>求职策略</b><p>摸高、平衡、保底三种投递视角</p></article></div>
          <div className="score-cards"><article><div><span>FIT</span><b>匹配度</b></div><strong>91</strong><p>回答“这份工作适不适合我”</p></article><article><div><span>ODDS</span><b>成功率</b></div><strong>76</strong><p>回答“在当前竞争下我能不能上岸”</p></article><article className="accent"><div><span>INDEX</span><b>综合指数</b></div><strong>86</strong><p>回答“我现在最应该优先做什么”</p></article></div>
        </div>
      </section>

      <section className="about-section shell" id="about">
        <div className="about-grid"><div><p className="eyebrow"><span /> PRODUCT CASE STUDY</p><h2>从一次校招痛点观察，<br />到一个可交互的产品原型。</h2></div><div className="about-copy"><p>智聘方舟起源于一个简单的问题：当一场双选会出现成千上万个机会时，求职者如何把有限时间用在真正值得的岗位上？</p><p>项目完成了需求研究、指标设计、数据整理、推荐逻辑和 Web 原型的端到端验证。当前网页展示了可公开的精简版演示数据。</p></div></div>
        <div className="contribution-grid"><article><span>01</span><h3>问题定义</h3><p>将“信息过载”拆解为筛选、匹配、上岸概率与偏好取舍。</p></article><article><span>02</span><h3>指标系统</h3><p>设计匹配度、成功率、综合指数三层决策指标。</p></article><article><span>03</span><h3>产品原型</h3><p>打通求职画像、策略排序、岗位解释与投递管理链路。</p></article><article><span>04</span><h3>业务思考</h3><p>探索面向高校就业中心与个人求职者的两类价值路径。</p></article></div>
      </section>

      <footer><div className="shell"><div><span className="brand-mark">A</span><b>智聘方舟 JobRec</b></div><p>AI 驱动的多元指标个性化求职平台 · 作品集演示版</p><a href="#top">返回顶部 ↑</a></div></footer>

      {selected && <div className="modal-backdrop" role="presentation" onMouseDown={() => setSelected(null)}><section className="job-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" onMouseDown={(event) => event.stopPropagation()}><button className="close" onClick={() => setSelected(null)} aria-label="关闭">×</button><p className="eyebrow"><span /> 推荐解释</p><h2 id="modal-title">{selected.role}</h2><p className="modal-company">{selected.company} · {selected.city} · {selected.salary}</p><div className="modal-scores"><Metric value={selected.fit} label="匹配度" /><Metric value={selected.chance} label="成功率" tone="lime" /><div className="modal-total"><b>{selected.score}</b><span>综合指数</span></div></div><div className="insight"><span>为什么推荐给你</span><p>{selected.reason}</p></div><div className="event-card"><span>最近宣讲 / 投递节点</span><b>{selected.event}</b></div><div className="modal-actions"><button onClick={() => toggleSaved(selected.id)}>{saved.includes(selected.id) ? "★ 已收藏" : "☆ 收藏岗位"}</button><button className="primary-modal" onClick={() => alert("演示模式：完整版可记录投递进度。")}>加入投递计划 →</button></div></section></div>}
    </main>
  );
}
