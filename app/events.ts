export type CampusEvent = {
  id: string;
  title: string;
  type: "双选会" | "线下宣讲" | "线上宣讲";
  campus: "望江校区" | "江安校区" | "华西校区" | "线上";
  date: string;
  time: string;
  address: string;
  organizer: string;
  status: "upcoming" | "past";
  audience: string;
  summary: string;
  officialUrl: string;
};

const talks = "https://jy.scu.edu.cn/index/index/employ.html";
const fairs = "https://jy.scu.edu.cn/index/index/jobfair.html?type=4";

export const campusEvents: CampusEvent[] = [
  {
    id: "scu-2026-0904", title: "“周五职通车”——国企央企专场", type: "双选会", campus: "望江校区",
    date: "2026-09-04", time: "14:00–17:00", address: "就业指导中心三楼、四楼双选大厅",
    organizer: "四川大学就业指导中心", status: "upcoming", audience: "2027届毕业生及其他有求职需求的同学",
    summary: "四川大学秋季校园招聘重点场次。参会单位名单以学校就业指导中心官网后续审核公布为准。",
    officialUrl: "https://jy.scu.edu.cn/index/index/jobfairdetail.html?data=MDAwMDAwMDAwMJG6n3_Ed6imi4qQtMOfiNyKz7KXxoi3i7igr7-BZHxnkLZ9i8WGpNOaaKLSxKCalom6mNs",
  },
  {
    id: "scu-2026-0709", title: "四城联动，线上招引｜2026年“才聚高新”成德眉资同城化线上专场招聘会", type: "线上宣讲", campus: "线上",
    date: "2026-07-09", time: "14:00", address: "线上活动，入口以官方页面为准", organizer: "官方就业平台", status: "past",
    audience: "高校毕业生", summary: "成德眉资同城化线上招聘活动，方便同学集中了解区域用人需求。", officialUrl: fairs,
  },
  {
    id: "scu-2026-0515", title: "“周五职通车”——江安校区综合场（三）", type: "双选会", campus: "江安校区",
    date: "2026-05-15", time: "下午", address: "江安校区青春广场", organizer: "四川大学就业指导中心", status: "past",
    audience: "全专业毕业生", summary: "面向江安校区学生的综合类校园双选活动。", officialUrl: fairs,
  },
  {
    id: "scu-2026-0508-intern", title: "“周五职通车”——2027届实习专场", type: "双选会", campus: "望江校区",
    date: "2026-05-08", time: "下午", address: "就业指导中心三楼、四楼双选大厅", organizer: "四川大学就业指导中心", status: "past",
    audience: "2027届及有实习需求的同学", summary: "聚焦实习与提前批机会，适合希望补充实践经历的同学。", officialUrl: fairs,
  },
  {
    id: "scu-2026-0508-bocom", title: "交通银行股份有限公司四川省分行2026春季校园招聘", type: "线下宣讲", campus: "望江校区",
    date: "2026-05-08", time: "以官方记录为准", address: "就业指导中心212室", organizer: "交通银行四川省分行", status: "past",
    audience: "对银行与金融行业感兴趣的同学", summary: "企业专场宣讲，集中介绍招聘岗位、培养路径与申请流程。", officialUrl: talks,
  },
  {
    id: "scu-2026-0430-online", title: "晓禾教育2026年春季校园招聘", type: "线上宣讲", campus: "线上",
    date: "2026-04-30", time: "线上", address: "腾讯会议（会议入口以官方记录为准）", organizer: "晓禾教育", status: "past",
    audience: "对教育行业感兴趣的同学", summary: "线上招聘宣讲，可作为了解教育行业岗位与线上宣讲形式的参考。", officialUrl: talks,
  },
  {
    id: "scu-2026-0429-cnooc", title: "中国海洋石油集团有限公司2026届校园招聘宣讲会", type: "线下宣讲", campus: "望江校区",
    date: "2026-04-29", time: "以官方记录为准", address: "就业指导中心212室", organizer: "中国海洋石油集团有限公司", status: "past",
    audience: "对能源与央企岗位感兴趣的同学", summary: "央企校园招聘专场，可用于复盘岗位方向、宣讲流程与准备材料。", officialUrl: talks,
  },
  {
    id: "scu-2026-0327-medical", title: "“周五职通车”——华西校区医药卫生专场双选会", type: "双选会", campus: "华西校区",
    date: "2026-03-27", time: "下午", address: "华西校区东区田径场", organizer: "四川大学就业指导中心及华西各学院", status: "past",
    audience: "医药卫生相关专业学生", summary: "学校官方报道显示，本场吸引302家单位，提供近2万个岗位。",
    officialUrl: "https://jy.scu.edu.cn/index/index/newsdetail.html?data=MDAwMDAwMDAwMJG6n3_Ed6imi4qQtMeglt2K0dSqyGHRp7ugzc-GnZ2skMx9ZMN4gtKLipCwxKF0lZC5sq-0gqJv",
  },
];

export const officialSources = { home: "https://jy.scu.edu.cn/", talks, fairs, updatedAt: "2026-08-18" };
