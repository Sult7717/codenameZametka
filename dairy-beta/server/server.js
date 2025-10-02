import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();
app.use(cors());
app.use(express.json());

const db = new Database("mydiary.sqlite");

// Таблица с уникальностью по subject+title+date_due (если нужно)
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

// Получить все задания
app.get("/homework", (req, res) => {
  const rows = db.prepare("SELECT * FROM homework").all();
  res.json(rows);
});

// Добавить новое задание
app.post("/homework", (req, res) => {
  const { date_due, subject, title, type, description } = req.body;
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO homework (date_created, date_due, subject, title, type, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(now, date_due, subject, title, type, description);
  res.json({ success: true });
});

// Обновить статус completed
app.patch("/homework/:id", (req, res) => {
  const { completed } = req.body;
  const { id } = req.params;
  db.prepare(`UPDATE homework SET completed = ? WHERE id = ?`).run(completed ? 1 : 0, id);
  res.json({ success: true });
});

// 🆕 Удалить задание
app.delete("/homework/:id", (req, res) => {
  const { id } = req.params;
  const result = db.prepare(`DELETE FROM homework WHERE id = ?`).run(id);
  res.json({ success: result.changes > 0 });
});

app.listen(3000, () => console.log("✅ Backend запущен на http://localhost:3000"));
