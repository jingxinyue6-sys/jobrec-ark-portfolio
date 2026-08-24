import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";

const ORIGIN = "https://jy.scu.edu.cn";
const LISTS = [
  { type: "全职", url: "/index/index/employjob.html?type=1&size=20" },
  { type: "实习", url: "/index/index/employjob.html?type=2&size=20" },
  { type: "全职+实习", url: "/index/index/employjob.html?type=3&size=20" },
];

const entityMap = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

function decodeHtml(value = "") {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (match, name) => entityMap[name.toLowerCase()] ?? match);
}

function text(value = "") {
  return decodeHtml(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/[\t\r ]+/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function publicDescription(value, fallback) {
  const cleaned = (value || fallback)
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "（联系方式请查看官网原文）")
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, "（联系方式请查看官网原文）");
  return cleaned.slice(0, 1600);
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "JobRec-Ark-SCU-public-feed/1.0 (+https://github.com/jingxinyue6-sys/jobrec-ark-portfolio)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  return response.text();
}

function parseList(html, nature) {
  const items = [];
  const linkPattern = /<a\s+href="([^"]*employjobdetail\.html\?data=[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(linkPattern)) {
    const label = text(match[2]);
    const companyMatch = label.match(/^(.*?)【([^】]+)】$/);
    items.push({
      nature,
      title: companyMatch?.[1]?.trim() || label,
      company: companyMatch?.[2]?.trim() || "用人单位",
      sourceUrl: new URL(match[1], ORIGIN).toString(),
    });
  }
  return items;
}

function parseRows(html) {
  const fields = {};
  for (const row of html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)) {
    const cells = [...row[1].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)].map((cell) => text(cell[1]));
    for (let index = 0; index < cells.length - 1; index += 1) {
      if (cells[index]) fields[cells[index]] = cells[index + 1];
    }
    if (cells[0] && !fields.__dataRow && cells[0] !== "职位名称" && cells.length >= 6) fields.__dataRow = cells;
  }
  return fields;
}

function stableId(url) {
  return `scu-${createHash("sha256").update(url).digest("hex").slice(0, 14)}`;
}

async function enrich(item) {
  try {
    const html = await fetchHtml(item.sourceUrl);
    const fields = parseRows(html);
    const data = fields.__dataRow || [];
    const publishedAt = (fields["发布时间"] || html.match(/发布时间：([0-9-]+)/)?.[1] || "").slice(0, 10);
    return {
      id: stableId(item.sourceUrl),
      title: data[0] || item.title,
      company: fields["单位名称"] || html.match(/发布企业：([^<]+)/)?.[1]?.trim() || item.company,
      jobType: data[1] || item.nature,
      nature: data[2] || item.nature,
      education: data[3] || "不限",
      headcount: data[4] || "以官网为准",
      salary: data[5] || "面议",
      publishedAt,
      deadline: (fields["职位有效期"] || "").slice(0, 10),
      major: fields["专业"] || "不限",
      location: fields["工作地址"] || "以官网为准",
      requirements: publicDescription(fields["职位要求"], "请查看川大就业指导中心官网原文"),
      responsibilities: publicDescription(fields["岗位职责"] || fields["职位简介"], "请查看川大就业指导中心官网原文"),
      industry: fields["单位行业"] || "未标注",
      source: "四川大学就业指导中心",
      sourceUrl: item.sourceUrl,
    };
  } catch (error) {
    console.warn(`详情同步失败，保留列表信息：${item.sourceUrl}`, error.message);
    return {
      id: stableId(item.sourceUrl), title: item.title, company: item.company, jobType: item.nature,
      nature: item.nature, education: "不限", headcount: "以官网为准", salary: "面议",
      publishedAt: "", deadline: "", major: "不限", location: "以官网为准",
      requirements: "请查看川大就业指导中心官网原文", responsibilities: "请查看川大就业指导中心官网原文",
      industry: "未标注", source: "四川大学就业指导中心", sourceUrl: item.sourceUrl,
    };
  }
}

const listed = [];
for (const source of LISTS) {
  const html = await fetchHtml(`${ORIGIN}${source.url}`);
  listed.push(...parseList(html, source.type));
}

const unique = [...new Map(listed.map((item) => [item.sourceUrl, item])).values()].slice(0, 48);
const jobs = [];
for (let index = 0; index < unique.length; index += 4) {
  jobs.push(...await Promise.all(unique.slice(index, index + 4).map(enrich)));
}

jobs.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || a.title.localeCompare(b.title));
const feed = {
  source: "四川大学就业指导中心",
  sourceUrl: `${ORIGIN}/index/index/employjob.html`,
  updatedAt: new Date().toISOString(),
  count: jobs.length,
  jobs,
};

await mkdir(new URL("../public/", import.meta.url), { recursive: true });
await writeFile(new URL("../public/scu-jobs.json", import.meta.url), `${JSON.stringify(feed, null, 2)}\n`);
console.log(`已同步 ${jobs.length} 条川大公开岗位，更新时间 ${feed.updatedAt}`);
