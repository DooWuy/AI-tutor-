INSERT INTO users(id, username, email, password_hash, full_name, gender, role)
SELECT 'a6000000-0000-0000-0000-000000000001', 'quiz-e2e', 'quiz-e2e@example.invalid', password_hash, 'Học sinh kiểm thử Quiz', 'OTHER', 'STUDENT'
FROM users WHERE username='admin';
INSERT INTO students(id, user_id, student_code, grade_level, total_xp)
VALUES ('a6000000-0000-0000-0000-000000000002','a6000000-0000-0000-0000-000000000001','QUIZ-E2E','10',90);
INSERT INTO quizzes(id, title, subject, difficulty, time_limit, is_ai_generated, created_by_id)
VALUES ('a6000000-0000-0000-0000-000000000003','Ôn tập kiến thức — 4 dạng câu hỏi','Toán','MEDIUM',15,TRUE,'a6000000-0000-0000-0000-000000000001'),
('a6000000-0000-0000-0000-000000000004','Kiểm tra tự nộp khi hết giờ','Toán','MEDIUM',1,TRUE,'a6000000-0000-0000-0000-000000000001');
INSERT INTO quiz_questions(id, quiz_id, question_text, type, options, correct_option_key, explanation, order_index)
VALUES
('a6000000-0000-0000-0000-000000000011','a6000000-0000-0000-0000-000000000003','Kết quả của 2 + 2 bằng bao nhiêu?','MULTIPLE_CHOICE','[{"key":"A","content":"4"},{"key":"B","content":"5"}]','A','Cộng 2 với 2 ta được 4.',1),
('a6000000-0000-0000-0000-000000000012','a6000000-0000-0000-0000-000000000003','Số 6 là một số chẵn.','TRUE_FALSE','[{"key":"A","content":"Đúng"},{"key":"B","content":"Sai"}]','A','6 chia hết cho 2 nên là một số chẵn.',2),
('a6000000-0000-0000-0000-000000000013','a6000000-0000-0000-0000-000000000003','Điền tên thủ đô của Việt Nam.','FILL_IN_BLANK','[]','Hà Nội','Thủ đô của Việt Nam là Hà Nội.',3),
('a6000000-0000-0000-0000-000000000014','a6000000-0000-0000-0000-000000000003','Viết tên phép toán dùng để tính tổng.','SHORT_ANSWER','[]','Phép cộng','Phép cộng được dùng để tính tổng của các số.',4),
('a6000000-0000-0000-0000-000000000015','a6000000-0000-0000-0000-000000000004','Chọn số chẵn.','MULTIPLE_CHOICE','[{"key":"A","content":"2"},{"key":"B","content":"3"}]','A','2 chia hết cho 2 nên là số chẵn.',1);
