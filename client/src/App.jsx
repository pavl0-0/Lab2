import { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [authForm, setAuthForm] = useState({ username: "", password: "", isLogin: true });

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  
  const [selectedCategory, setSelectedCategory] = useState("Всі");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [newTitle, setNewTitle] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [commentInputs, setCommentInputs] = useState({});

  const fetchData = () => {
    fetch('http://localhost:3000/api/articles')
      .then(res => res.json())
      .then(data => setArticles(data));
      
    fetch('http://localhost:3000/api/categories')
      .then(res => res.json())
      .then(data => {
          setCategories(data);
          if (data.length > 0) setNewCategory(data[0]);
      });
  };

  useEffect(() => { fetchData(); }, []);

  const handleAuth = (e) => {
    e.preventDefault();
    const endpoint = authForm.isLogin ? '/api/login' : '/api/register';
    
    fetch(`http://localhost:3000${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: authForm.username, password: authForm.password })
    })
    .then(async res => {
      const data = await res.json();
      if (res.ok) {
        if (authForm.isLogin) setCurrentUser(data);
        else alert("Реєстрація успішна! Тепер увійдіть.");
        setAuthForm({ username: "", password: "", isLogin: true });
      } else {
        alert(data.error);
      }
    });
  };

  const handleAddArticle = (e) => {
    e.preventDefault();
    fetch('http://localhost:3000/api/articles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, content: newContent, category: newCategory })
    }).then(() => {
      setNewTitle(""); setNewContent(""); fetchData(); 
    });
  };

  const handleAddComment = (articleId) => {
    const text = commentInputs[articleId];
    if (!text) return;
    fetch(`http://localhost:3000/api/articles/${articleId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    }).then(() => {
      setCommentInputs({ ...commentInputs, [articleId]: "" }); fetchData();
    });
  };

  const filteredArticles = articles.filter(a => {
    const matchesCategory = selectedCategory === "Всі" || a.category === selectedCategory;
    const matchesSearch = a.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="app-container">
      <div className="header">
        <h1>Мій IT Блог</h1>
        {currentUser ? (
          <div>
            <span>Привіт, <b>{currentUser.username}</b>! </span>
            <button onClick={() => setCurrentUser(null)}>Вийти</button>
          </div>
        ) : (
          <form onSubmit={handleAuth} className="auth-form">
            <input type="text" placeholder="Логін" required value={authForm.username} onChange={e => setAuthForm({...authForm, username: e.target.value})} />
            <input type="password" placeholder="Пароль" required value={authForm.password} onChange={e => setAuthForm({...authForm, password: e.target.value})} />
            <button type="submit">{authForm.isLogin ? "Увійти" : "Реєстрація"}</button>
            <button type="button" className="switch-btn" onClick={() => setAuthForm({...authForm, isLogin: !authForm.isLogin})}>
              {authForm.isLogin ? "Створити акаунт" : "Вже є акаунт?"}
            </button>
          </form>
        )}
      </div>
      
      {currentUser && (
        <form className="add-form" onSubmit={handleAddArticle}>
          <h3>Написати нову статтю</h3>
          <div className="form-group">
            <input type="text" placeholder="Заголовок" required value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            <select value={newCategory} onChange={e => setNewCategory(e.target.value)}>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <textarea placeholder="Текст статті..." required value={newContent} onChange={e => setNewContent(e.target.value)} />
          <button type="submit">Опублікувати</button>
        </form>
      )}

      <div className="toolbar">
        <input 
          type="text" className="search-bar" placeholder="Пошук за назвою..." 
          value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
        />
        <div className="category-filter">
          <button onClick={() => setSelectedCategory("Всі")} className={selectedCategory === "Всі" ? "active" : ""}>Всі</button>
          {categories.map(c => (
            <button key={c} onClick={() => setSelectedCategory(c)} className={selectedCategory === c ? "active" : ""}>{c}</button>
          ))}
        </div>
      </div>
      
      <div className="articles-list">
        {filteredArticles.length === 0 ? <p>Статей не знайдено.</p> : filteredArticles.map(article => (
          <div key={article.id} className="article-card">
            <span className="badge">{article.category}</span>
            <h2>{article.title}</h2>
            <p className="article-content">{article.content}</p>
            
            <div className="comments-section">
              <h4>Коментарі ({article.comments?.length || 0}):</h4>
              <ul className="comments-list">
                {article.comments?.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
              {currentUser ? (
                <div className="add-comment">
                  <input type="text" placeholder="Написати коментар..." value={commentInputs[article.id] || ""} onChange={e => setCommentInputs({...commentInputs, [article.id]: e.target.value})} />
                  <button onClick={() => handleAddComment(article.id)}>Надіслати</button>
                </div>
              ) : (
                <p style={{fontSize: '0.8rem', color: '#666'}}>Увійдіть, щоб залишити коментар.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;