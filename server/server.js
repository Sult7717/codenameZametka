// 📦 Импортируем необходимые модули
import express from "express";   // фреймворк для создания веб-сервера
import cors from "cors";         // для разрешения запросов с других доменов (CORS)
import Database from "better-sqlite3"; // лёгкая синхронная SQLite-библиотека

// 🚀 Инициализация Express-приложения
const app = express();

// 🔧 Подключаем middleware
app.use(cors());          // разрешаем CORS для всех источников
app.use(express.json());  // автоматический парсинг JSON-тел запросов

// 💾 Подключаем (или создаём) локальную базу данных SQLite
const db = new Database("mydiary.sqlite");

// 🧱 Создаём таблицу "homework", если она ещё не существует
// В таблице хранятся данные о домашних заданиях:
//  - id: уникальный идентификатор
//  - date_created: дата создания
//  - date_due: срок сдачи
//  - subject: предмет
//  - title: заголовок
//  - type: тип задания (контрольная, проект и т.д.)
//  - description: описание
//  - completed: флаг выполнения (0 — не выполнено, 1 — выполнено)
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

// ========================== 📚 API ЭНДПОИНТЫ ==========================

// 📥 1. Получить все задания
app.get("/homework", (req, res) => {
  // Запрашиваем все строки из таблицы homework
  const rows = db.prepare("SELECT * FROM homework").all();
  res.json(rows); // Отправляем клиенту список заданий в формате JSON
});

// ➕ 2. Добавить новое задание
app.post("/homework", (req, res) => {
  // Извлекаем поля из тела запроса
  const { date_due, subject, title, type, description } = req.body;
  // Текущая дата (время создания записи)
  const now = new Date().toISOString();

  // Добавляем запись в базу
  db.prepare(`
    INSERT INTO homework (date_created, date_due, subject, title, type, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(now, date_due, subject, title, type, description);

  // Отправляем успешный ответ
  res.json({ success: true });
});

// ✏️ 3. Обновить статус "выполнено / не выполнено"
app.patch("/homework/:id", (req, res) => {
  const { completed } = req.body; // новое значение completed
  const { id } = req.params;      // id записи, которую нужно обновить

  // Обновляем запись в БД
  db.prepare(`UPDATE homework SET completed = ? WHERE id = ?`)
    .run(completed ? 1 : 0, id);

  res.json({ success: true });
});

// 🗑️ 4. Удалить задание по id
app.delete("/homework/:id", (req, res) => {
  const { id } = req.params;

  // Выполняем удаление
  const result = db.prepare(`DELETE FROM homework WHERE id = ?`).run(id);

  // Возвращаем успех, если хотя бы одна запись была удалена
  res.json({ success: result.changes > 0 });
});

// ========================== ⚙️ ЗАПУСК СЕРВЕРА ==========================

// Сервер будет слушать порт 3000
app.listen(3000, () => console.log("✅ Backend запущен на http://localhost:3000"));
