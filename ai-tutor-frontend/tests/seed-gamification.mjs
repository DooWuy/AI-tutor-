// Disposable PostgreSQL fixtures for browser QA. Never use the application database.
import { randomUUID as id } from "node:crypto";
import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
const database = process.env.TASK5_DATABASE || "issue5_task5_browser_20261016";
if (!/^issue5_task5_[a-zA-Z0-9_]+$/.test(database))
  throw new Error("Use an isolated issue5_task5_* database.");
const dir = resolve("../ai-tutor-service/build/issue5-task5-runtime");
mkdirSync(dir, { recursive: true });
const group = id(),
  other = id(),
  people = {};
const sql = [
  "BEGIN;",
  `INSERT INTO school_classes(id,name,grade_level,academic_year) VALUES ('${group}','Task5 lớp ${group.slice(0, 8)}','10','2026-2027'),('${other}','Task5 khác ${other.slice(0, 8)}','10','2026-2027');`,
];
for (const [name, xp, cls] of [
  ["student", 90, group],
  ["peer", 95, group],
  ["empty", 0, null],
  ["capped", 500, group],
  ["partial", 495, group],
]) {
  const userId = id(),
    studentId = id(),
    quizId = id(),
    questionId = id(),
    username = `task5-${userId}`,
    password = "Task5Browser1!";
  people[name] = {
    username,
    password,
    userId,
    studentId,
    quizId,
    questionId,
    classId: cls,
  };
  sql.push(
    `INSERT INTO users(id,username,email,password_hash,full_name,gender,role) VALUES ('${userId}','${username}','${userId}@example.invalid',crypt('${password}',gen_salt('bf')),'Học sinh ${name}','OTHER','STUDENT');`,
  );
  sql.push(
    `INSERT INTO students(id,user_id,student_code,grade_level,class_id,total_xp,current_level) VALUES ('${studentId}','${userId}','${studentId}','10',${cls ? `'${cls}'` : "NULL"},${xp},${Math.floor(xp / 100) + 1});`,
  );
  if (xp)
    sql.push(
      `INSERT INTO xp_transactions(id,student_id,source_type,source_id,amount,balance_after,occurred_at) VALUES (gen_random_uuid(),'${studentId}','LEGACY_QUIZ_ATTEMPT',gen_random_uuid(),${xp},${xp},${["capped", "partial"].includes(name) ? "now()" : "now()-interval '2 days'"});`,
    );
  sql.push(
    `INSERT INTO quizzes(id,title,subject,difficulty,time_limit,is_ai_generated,is_active,created_by_id) VALUES ('${quizId}','Ôn tập Toán — hành trình tiến bộ','Toán','EASY',15,true,true,'${userId}');`,
  );
  sql.push(
    `INSERT INTO quiz_questions(id,quiz_id,question_text,question_type,options,correct_option_key,explanation,order_index) VALUES ('${questionId}','${quizId}','2 + 2 bằng bao nhiêu?','MULTIPLE_CHOICE','[{"key":"A","content":"4"},{"key":"B","content":"5"}]','A','Cộng 2 với 2 được 4.',1);`,
  );
}
for (let i = 0; i < 22; i++) {
  const u = id(),
    s = id(),
    xp = 600 + i;
  sql.push(
    `INSERT INTO users(id,username,email,password_hash,full_name,gender,role) VALUES ('${u}','task5-${u}','${u}@example.invalid','unused','Bạn học ${String(i + 1).padStart(2, "0")}','OTHER','STUDENT');`,
  );
  sql.push(
    `INSERT INTO students(id,user_id,student_code,class_id,total_xp,current_level) VALUES ('${s}','${u}','${s}','${other}',${xp},${Math.floor(xp / 100) + 1});`,
  );
  sql.push(
    `INSERT INTO xp_transactions(id,student_id,source_type,source_id,amount,balance_after,occurred_at) VALUES (gen_random_uuid(),'${s}','LEGACY_QUIZ_ATTEMPT',gen_random_uuid(),${xp},${xp},now()-interval '1 day');`,
  );
}
sql.push("COMMIT;");
const result = spawnSync(
  "docker",
  [
    "exec",
    "-i",
    "ai-tutor-postgres",
    "psql",
    "-U",
    "postgres",
    "-d",
    database,
    "-v",
    "ON_ERROR_STOP=1",
    "-q",
  ],
  { input: sql.join("\n"), encoding: "utf8" },
);
if (result.status !== 0)
  throw new Error(result.stderr || "Could not create fixtures");
writeFileSync(resolve(dir, "fixtures.json"), JSON.stringify(people, null, 2));
writeFileSync(
  resolve(dir, "nginx.conf"),
  readFileSync("nginx.conf", "utf8").replace(
    "http://ai-tutor-service:8088",
    "http://ai-tutor-task5-browser-backend:8088",
  ),
);
console.log("Created 5 fresh test accounts and 22 peers in", database);
