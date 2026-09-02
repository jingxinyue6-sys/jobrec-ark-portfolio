import assert from "node:assert/strict";
import test from "node:test";
import { scoreJob } from "../app/scoring.ts";

const now = new Date("2026-09-02T12:00:00+08:00");
const profile = { degree: "硕士", major: "应用统计", skills: "Python 数据分析", targetLocations: "成都" };
const baseJob = {
  title: "数据分析师", education: "硕士", headcount: "10", salary: "9000-12000", deadline: "2026-10-20",
  major: "统计学、应用统计", location: "四川省成都市", requirements: "熟悉 Python 与数据分析",
  responsibilities: "负责业务数据分析", industry: "信息技术服务业",
};

test("matched background produces a higher match score", () => {
  const matched = scoreJob(baseJob, profile, now);
  const unrelated = scoreJob({ ...baseJob, title: "临床医生", major: "临床医学", requirements: "医学专业", responsibilities: "临床诊疗" }, profile, now);
  assert.ok(matched.match > unrelated.match);
  assert.match(matched.matchReasons.join(" "), /Python|数据分析|应用统计/);
});

test("capacity and deadline affect the opportunity score", () => {
  const open = scoreJob(baseJob, profile, now);
  const closed = scoreJob({ ...baseJob, headcount: "1", deadline: "2026-08-01" }, profile, now);
  assert.ok(open.success > closed.success);
});

test("composite score follows the documented 60/40 weighting", () => {
  const score = scoreJob(baseJob, profile, now);
  assert.equal(score.composite, Math.round(score.match * 0.6 + score.success * 0.4));
});
