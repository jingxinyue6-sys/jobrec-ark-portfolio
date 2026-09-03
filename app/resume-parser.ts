export type ParsedResumeProfile = {
  degree: string;
  major: string;
  skills: string[];
  keywords: string[];
  textLength: number;
};

const skillCatalog = [
  "Python", "R语言", "SQL", "Excel", "Tableau", "Power BI", "SPSS", "Stata", "SAS",
  "机器学习", "深度学习", "数据分析", "数据可视化", "统计建模", "时间序列", "A/B测试",
  "Java", "JavaScript", "TypeScript", "React", "Vue", "Node.js", "Spring Boot", "MySQL",
  "PostgreSQL", "MongoDB", "Redis", "Docker", "Git", "Linux", "C++", "MATLAB",
  "产品设计", "需求分析", "用户研究", "项目管理", "市场分析", "财务分析", "风险管理",
  "自然语言处理", "计算机视觉", "大模型", "Pytorch", "TensorFlow", "Scikit-learn",
];

const majorPatterns = [
  /(?:专业|主修|学科)\s*[:：]?\s*([^\n，,；;]{2,24})/,
  /(应用统计(?:学)?|统计学|计算机科学与技术|软件工程|数据科学与大数据技术|金融学|经济学|会计学|工商管理|公共管理|电子信息|临床医学|药学|护理学)/,
];

const keywordCatalog = [
  "运营", "产品", "算法", "数据", "分析", "建模", "研究", "咨询", "金融", "风控", "审计",
  "营销", "市场", "供应链", "人力资源", "开发", "测试", "运维", "前端", "后端", "全栈",
  "人工智能", "推荐系统", "用户增长", "商业分析", "量化", "项目管理", "沟通", "团队协作",
];

function normalizeText(text: string) {
  return text.split(String.fromCharCode(0)).join(" ").replace(/[\t\r ]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
}

function includesTerm(text: string, term: string) {
  const normalized = text.toLowerCase();
  const aliases: Record<string, string[]> = {
    "R语言": ["r语言", "r language"],
    "Power BI": ["power bi", "powerbi"],
    "A/B测试": ["a/b测试", "ab测试", "a/b test"],
    "Node.js": ["node.js", "nodejs"],
    "Pytorch": ["pytorch"],
    "Scikit-learn": ["scikit-learn", "sklearn"],
  };
  return (aliases[term] ?? [term.toLowerCase()]).some((alias) => normalized.includes(alias));
}

export function extractResumeProfile(rawText: string): ParsedResumeProfile {
  const text = normalizeText(rawText);
  const degree = ["博士", "硕士", "本科", "专科"].find((value) => text.includes(value)) ?? "";
  const major = majorPatterns.map((pattern) => text.match(pattern)?.[1]?.trim() ?? "").find(Boolean) ?? "";
  const skills = skillCatalog.filter((skill) => includesTerm(text, skill));
  const keywords = keywordCatalog.filter((keyword) => text.includes(keyword));
  return { degree, major, skills, keywords, textLength: text.length };
}

async function extractPdfText(file: File) {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const workerUrl = (await import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url")).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  const document = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => ("str" in item ? item.str : "")).join(" "));
  }
  return pages.join("\n");
}

async function extractDocxText(file: File) {
  const mammoth = await import("mammoth/mammoth.browser");
  const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
  return result.value;
}

export async function parseResumeFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "pdf") return extractResumeProfile(await extractPdfText(file));
  if (extension === "docx") return extractResumeProfile(await extractDocxText(file));
  if (extension === "txt") return extractResumeProfile(await file.text());
  throw new Error("暂时只支持 PDF、DOCX 和 TXT 简历");
}
