import { useEffect, useState } from "react";
import "./App.css";

// 📅 Функция форматирования даты в человекочитаемый вид: "ДД.ММ.ГГГГ ЧЧ:ММ"
function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getFullYear()} ${d.getHours()
    .toString()
    .padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
}

// 🎨 Определение класса карточки в зависимости от срочности
function getUrgencyClass(h) {
  if (h.completed) return "completed"; // если задание выполнено
  if (!h.date_due) return ""; // если нет даты — без оформления

  const today = new Date();
  const due = new Date(h.date_due);
  const diff = Math.floor((due - today) / (1000 * 60 * 60 * 24)); // разница в днях

  if (diff < 0) return "overdue"; // просрочено
  if (diff <= 1) return "due-soon"; // срочно (сдать сегодня или завтра)
  return "due-later"; // сдать позже
}

// 🏫 Главный компонент приложения
function App() {
  // Состояние со всеми заданиями
  const [homework, setHomework] = useState([]);

  // Состояние модального окна
  const [showModal, setShowModal] = useState(false);

  // Состояние формы добавления нового задания
  const [form, setForm] = useState({
    date_due: "",
    subject: "",
    title: "",
    type: "",
    description: ""
  });

  // 🚀 При первом рендере загружаем все задания
  useEffect(() => {
    fetchHomework();
    // При первом запуске просим разрешение на уведомления
    if ("Notification" in window) {
      Notification.requestPermission().then(permission => {
        console.log("Уведомления:", permission);
      });
    }
  }, []);

  // функция отправки уведомлений
  const sendTestNotification = () => {
    if (!("Notification" in window)) {
      alert("Ваш браузер не поддерживает уведомления.");
      return;
    }

    if (Notification.permission === "granted") {
      new Notification("Новое задание!", {
        body: "Проверьте свой список домашних заданий 📘",
        icon: "https://cdn-icons-png.flaticon.com/512/3135/3135715.png" // можно заменить
      });
    } else if (Notification.permission === "denied") {
      alert("Разрешите уведомления в настройках браузера.");
    } else {
      Notification.requestPermission();
    }
  };

  // 🔄 Получение списка заданий с сервера
  const fetchHomework = async () => {
    const res = await fetch("http://localhost:3000/homework");
    const data = await res.json();
    setHomework(data); // обновляем состояние
  };

  // ✍️ Обработка изменений в полях формы
  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // 💾 Обработка отправки формы (создание нового задания)
  const handleSubmit = async e => {
    e.preventDefault();

    // Проверка обязательных полей
    if (!form.date_due || !form.subject || !form.title) {
      alert("Заполните обязательные поля: срок сдачи, предмет и заголовок!");
      return;
    }

    // Отправляем данные на сервер (POST-запрос)
    await fetch("http://localhost:3000/homework", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form)
    });

    // Очищаем форму и закрываем модалку
    setForm({ date_due: "", subject: "", title: "", type: "", description: "" });
    setShowModal(false);

    // Обновляем список заданий
    fetchHomework();
  };

  // ✅ Изменение статуса задания (выполнено / не выполнено)
  const toggleCompleted = async (id, completed) => {
    // Обновляем состояние локально (мгновенно)
    setHomework(prev =>
      prev.map(h => (h.id === id ? { ...h, completed } : h))
    );

    // Отправляем изменения на сервер (PATCH-запрос)
    await fetch(`http://localhost:3000/homework/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed })
    });
  };

  // 🗑 Удаление задания
  const deleteHomework = async id => {
    const res = await fetch(`http://localhost:3000/homework/${id}`, {
      method: "DELETE"
    });
    const data = await res.json();

    // Если удаление успешно — обновляем список на клиенте
    if (data.success) {
      setHomework(prev => prev.filter(h => h.id !== id));
    }
  };

  // 📋 Сортировка заданий:
  // 1. Сначала по дате сдачи (самые срочные — первыми)
  // 2. Потом по статусу (невыполненные — первыми)
  const sortedHomework = [...homework]
    .sort((a, b) => {
      const da = a.date_due
        ? new Date(a.date_due)
        : new Date(8640000000000000); // если нет даты — в конец списка
      const db = b.date_due
        ? new Date(b.date_due)
        : new Date(8640000000000000);
      return da - db;
    })
    .sort((a, b) => a.completed - b.completed);

  // 🖥️ Отрисовка интерфейса
  return (
    <div className="container">
      <h1>Дневник домашних заданий</h1>

      {/* Кнопка открытия модального окна */}
      <button className="open-modal-btn" onClick={() => setShowModal(true)}>
        Добавить задание
      </button>
      <button onClick={sendTestNotification} className="notify-btn">
        🔔 Отправить уведомление
      </button>

      {/* 🪟 Модальное окно создания нового задания */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>Новое задание</h2>

            {/* Форма добавления задания */}
            <form onSubmit={handleSubmit}>
              {/* Верхняя группа полей */}
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
                  {/* Предустановленный список предметов */}
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
                  {/* Список типов заданий */}
                  <datalist id="types">
                    <option value="Домашнее задание" />
                    <option value="Контрольная" />
                    <option value="Проект" />
                    <option value="Доклад" />
                    <option value="Экзамен" />
                  </datalist>
                </div>
              </div>

              {/* Визуальный разделитель */}
              <div className="group-divider"></div>

              {/* Нижняя группа полей */}
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

              {/* Кнопки управления модалкой */}
              <div className="modal-actions">
                <button type="submit">Сохранить</button>
                <button type="button" onClick={() => setShowModal(false)}>
                  Отмена
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🗂️ Список карточек с заданиями */}
      <div className="cards">
        {sortedHomework.map(h => (
          <div key={h.id} className={`card ${getUrgencyClass(h)}`}>
            {/* Информация о датах */}
            <div className="dates">
              Создано: {formatDate(h.date_created)} | Срок:{" "}
              {h.date_due ? h.date_due.split("-").reverse().join(".") : "—"}
            </div>

            {/* Основная информация */}
            <div className="title">
              {h.subject} — {h.title}
            </div>
            <div className="type">{h.type}</div>
            <div className="desc">{h.description}</div>

            {/* Кнопки действий */}
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
                <button className="delete-btn" onClick={() => deleteHomework(h.id)}>
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
