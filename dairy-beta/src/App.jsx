import { useEffect, useState } from "react";
import "./App.css";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1).toString().padStart(2, "0")}.${d.getFullYear()} ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

function getUrgencyClass(h) {
  if (h.completed) return "completed";
  if (!h.date_due) return "";
  const today = new Date();
  const due = new Date(h.date_due);
  const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24));

  if (diff < 0) return "overdue";
  if (diff <= 1) return "due-soon";
  return "due-later";
}

function App() {
  const [homework, setHomework] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    date_due: "",
    subject: "",
    title: "",
    type: "",
    description: ""
  });

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    const res = await fetch("http://localhost:3000/homework");
    const data = await res.json();
    setHomework(data);
  };

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.date_due || !form.subject || !form.title) {
      alert("Заполните обязательные поля: срок сдачи, предмет и заголовок!");
      return;
    }
    await fetch("http://localhost:3000/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });
    setForm({ date_due: "", subject: "", title: "", type: "", description: "" });
    setShowModal(false); // закрыть модалку
    fetchHomework();
  };

  const toggleCompleted = async (id, completed) => {
    setHomework(prev => prev.map(h => h.id === id ? { ...h, completed } : h));
    await fetch(`http://localhost:3000/homework/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed })
    });
  };

  const deleteHomework = async (id) => {
    const res = await fetch(`http://localhost:3000/homework/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();
    if (data.success) {
      setHomework(prev => prev.filter(h => h.id !== id));
    }
  };


  const sortedHomework = [...homework]
    .sort((a, b) => {
      const da = a.date_due ? new Date(a.date_due) : new Date(8640000000000000);
      const db = b.date_due ? new Date(b.date_due) : new Date(8640000000000000);
      return da - db;
    })
    .sort((a, b) => a.completed - b.completed);

  return (
    <div className="container">
      <h1>Дневник домашних заданий</h1>

      <button className="open-modal-btn" onClick={() => setShowModal(true)}>
        Добавить задание
      </button>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Новое задание</h2>
            <form onSubmit={handleSubmit}>
              {/* Верхний блок: Срок сдачи, Предмет, Тип задания */}
              <div className="top-group">
                <div>
                  <label>Срок сдачи:</label>
                  <input
                    type="date"
                    name="date_due"
                    value={form.date_due}
                    onChange={handleChange}
                  />
                </div>

                <div>
                  <label>Предмет:</label>
                  <input
                    list="subjects"
                    name="subject"
                    placeholder="Предмет"
                    value={form.subject}
                    onChange={handleChange}
                  />
                  <datalist id="subjects">
                    <option value="Математика" />
                    <option value="Физика" />
                    <option value="Информатика" />
                    <option value="История" />
                    <option value="Литература" />
                  </datalist>
                </div>

                <div>
                  <label>Тип задания:</label>
                  <input
                    list="types"
                    name="type"
                    placeholder="Тип задания"
                    value={form.type}
                    onChange={handleChange}
                  />
                  <datalist id="types">
                    <option value="Домашнее задание" />
                    <option value="Контрольная" />
                    <option value="Проект" />
                    <option value="Доклад" />
                    <option value="Экзамен" />
                  </datalist>
                </div>
              </div>

              {/* Разделитель */}
              <div className="group-divider"></div>

              {/* Вторая группа: Заголовок и описание */}
              <div>
                <label>Заголовок:</label>
                <input
                  name="title"
                  placeholder="Заголовок"
                  value={form.title}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Описание:</label>
                <textarea
                  name="description"
                  placeholder="Описание"
                  value={form.description}
                  onChange={handleChange}
                ></textarea>
              </div>

              <div className="modal-actions">
                <button type="submit">Сохранить</button>
                <button type="button" onClick={() => setShowModal(false)}>Отмена</button>
              </div>
            </form>

          </div>
        </div>
      )}

      <div className="cards">
        {sortedHomework.map(h => (
          <div key={h.id} className={`card ${getUrgencyClass(h)}`}>
            <div className="dates">
              Создано: {formatDate(h.date_created)} | Срок: {h.date_due ? h.date_due.split("-").reverse().join(".") : "—"}
            </div>
            <div className="title">{h.subject} — {h.title}</div>
            <div className="type">{h.type}</div>
            <div className="desc">{h.description}</div>
            <div style={{ marginTop: "10px" }}>
              <div className="card-actions">
                {!h.completed && (
                  <button
                    className="done-btn"
                    onClick={() => toggleCompleted(h.id, true)}
                  >
                    Выполнено
                  </button>
                )}
                <button
                  className="delete-btn"
                  onClick={() => deleteHomework(h.id)}
                >
                  Удалить
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
