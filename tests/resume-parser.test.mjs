import assert from "node:assert/strict";
import test from "node:test";
import { extractResumeProfile } from "../app/resume-parser.ts";

test("extracts education, major and job-related skills from resume text", () => {
  const result = extractResumeProfile(`
    教育经历：四川大学，应用统计专业，硕士在读。
    项目经历：使用 Python、SQL 完成用户数据分析和统计建模，使用 Tableau 制作数据可视化看板。
    熟悉 Git，具备项目管理和团队协作经验。
  `);
  assert.equal(result.degree, "硕士");
  assert.equal(result.major, "应用统计");
  assert.deepEqual(result.skills.filter((skill) => ["Python", "SQL", "Tableau", "数据分析", "统计建模"].includes(skill)), ["Python", "SQL", "Tableau", "数据分析", "统计建模"]);
  assert.ok(result.keywords.includes("团队协作"));
});

test("returns an editable partial profile when fields are missing", () => {
  const result = extractResumeProfile("负责市场研究、产品设计和用户访谈，熟练使用 Excel。 ");
  assert.equal(result.degree, "");
  assert.equal(result.major, "");
  assert.ok(result.skills.includes("Excel"));
  assert.ok(result.keywords.includes("产品"));
});
