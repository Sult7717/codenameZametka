import { useEffect, useState } from "react";
import "./App.css";

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, "0")}.${(d.getMonth()+1).toString().padStart(2,"0")}.${d.getFullYear()} ${d.getHours().toString().padStart(2,"0")}:${d.getMinutes().toString().padStart(2,"0")}`;
}

function getUrgencyClass(h) {
  if (h.completed) return "completed"; // серый
  if (!h.date_due) return "";
  const today = new Date();
  const due = new Date(h.date_due);
  const diff = Math.floor((due - today) / (1000*60*60*24));

  if (diff < 0) return "overdue";       
  if (diff <= 1) return "due-soon";     
  return "due-later";                    
}

function App() {
  const [homework, setHomework] = useState([]);
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
    setForm({...form, [e.target.name]: e.target.value});
  }

  const handleSubmit = async e => {
    e.preventDefault();
    if (!form.date_due || !form.subject || !form.title) {
      alert("Заполните обязательные поля: срок сдачи, предмет и заголовок!");
      return;
    }
    await fetch("http://localhost:3000/homework", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(form)
    });
    setForm({date_due:"", subject:"", title:"", type:"", description:""});
    fetchHomework();
  }

  const toggleCompleted = async (id, completed) => {
    // Обновляем локально
    setHomework(prev => prev.map(h => h.id === id ? {...h, completed} : h));

    // Отправляем на сервер
    await fetch(`http://localhost:3000/homework/${id}`, {
      method: "PATCH",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ completed })
    });
  };


  // Сортировка по дате и невыполненные вверх
  const sortedHomework = [...homework].sort((a, b) => {
    const da = a.date_due ? new Date(a.date_due) : new Date(8640000000000000); 
    const db = b.date_due ? new Date(b.date_due) : new Date(8640000000000000);
    return da - db;
  }).sort((a, b) => a.completed - b.completed); // невыполненные вверх

  return (
    <div className="container">
      <h1>📚 Дневник домашних заданий</h1>

      <form className="form" onSubmit={handleSubmit}>
        <div>
          <label>Срок сдачи:</label>
          <input type="date" name="date_due" value={form.date_due} onChange={handleChange} />
        </div>
        <div>
          <label>Предмет:</label>
          <input name="subject" placeholder="Предмет" value={form.subject} onChange={handleChange} />
        </div>
        <div className="full">
          <label>Заголовок:</label>
          <input name="title" placeholder="Заголовок" value={form.title} onChange={handleChange} />
        </div>
        <div>
          <label>Тип задания:</label>
          <input name="type" placeholder="Тип задания" value={form.type} onChange={handleChange} />
        </div>
        <div>
          <label>Описание:</label>
          <input name="description" placeholder="Описание" value={form.description} onChange={handleChange} />
        </div>
        <div className="full center">
          <button type="submit">Добавить задание</button>
        </div>
      </form>

      <div className="cards">
        {sortedHomework.map(h => (
          <div key={h.id} className={`card ${getUrgencyClass(h)}`}>
            <div className="dates">
              Создано: {formatDate(h.date_created)} | Срок: {h.date_due ? h.date_due.split("-").reverse().join(".") : "—"}
            </div>
            <div className="title">{h.subject} — {h.title}</div>
            <div className="type">{h.type}</div>
            <div className="desc">{h.description}</div>
            <div style={{marginTop:"10px"}}>
              <label>
                <input 
                  type="checkbox" 
                  checked={h.completed} 
                  onChange={e => toggleCompleted(h.id, e.target.checked)} 
                /> Выполнено
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
