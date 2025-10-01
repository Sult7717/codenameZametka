import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database("mydiary.sqlite");

// Добавляем поле completed
db.prepare(`
  CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date_created TEXT,
    date_due TEXT,
    subject TEXT,
    title TEXT,
    type TEXT,
    description TEXT,
    completed INTEGER DEFAULT 0
  )
`).run();

// Обновление статуса completed
app.patch("/homework/:id", (req, res) => {
  const { completed } = req.body;
  const { id } = req.params;
  db.prepare(`UPDATE homework SET completed = ? WHERE id = ?`).run(completed ? 1 : 0, id);
  res.json({ success: true });
});

// Примерные данные (если пусто)
const count = db.prepare("SELECT COUNT(*) AS c FROM homework").get().c;
if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO homework (date_created, date_due, subject, title, type, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const now = new Date().toISOString();
  insert.run(now, "2025-10-05", "Математика", "Задачи на производные", "Практическое", "Решить все задачи из параграфа 12.");
  insert.run(now, "2025-10-04", "Русский язык", "Сочинение", "Творческое", "Написать сочинение на тему 'Мой любимый сезон'.");
  insert.run(now, "2025-10-06", "Физика", "Лабораторная работа", "Практическое", "Выполнить лабораторную работу по законам Ньютона.");
  insert.run(now, "2025-10-07", "История", "Конспект", "Теоретическое", "Составить конспект главы о Второй мировой войне.");
  insert.run(now, "2025-10-05", "Информатика", "Проект", "Практическое", "Создать мини-приложение на JavaScript для учета задач.");
}

// Получить все задания
app.get("/homework", (req, res) => {
  const rows = db.prepare("SELECT * FROM homework").all();
  res.json(rows);
});

// Добавить новое задание
app.post("/homework", (req, res) => {
  const { date_due, subject, title, type, description } = req.body;
  const now = new Date().toISOString(); // текущая дата и время
  db.prepare(`
    INSERT INTO homework (date_created, date_due, subject, title, type, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(now, date_due, subject, title, type, description);
  res.json({ success: true });
});

app.listen(3000, () => console.log("✅ Backend запущен на http://localhost:3000"));
