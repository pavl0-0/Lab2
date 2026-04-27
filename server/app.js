const express = require("express");
const cors = require("cors");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(cors());
app.use(express.json());

let db;

let cache = {
    articles: null,
    categories: null
};

(async () => {
    db = await open({
        filename: './database.sqlite',
        driver: sqlite3.Database
    });

    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password TEXT);
        CREATE TABLE IF NOT EXISTS categories (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT UNIQUE);
        CREATE TABLE IF NOT EXISTS articles (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, content TEXT, category TEXT);
        CREATE TABLE IF NOT EXISTS comments (id INTEGER PRIMARY KEY AUTOINCREMENT, article_id INTEGER, text TEXT, FOREIGN KEY (article_id) REFERENCES articles (id));
    `);

    const catCheck = await db.get("SELECT COUNT(*) as count FROM categories");
    if (catCheck.count === 0) {
        await db.run("INSERT INTO categories (name) VALUES (?), (?), (?)", ["Технології", "Node.js", "Навчання"]);
    }
    console.log("Database initialized. Ready for requests.");
})();

app.post("/api/register", async (req, res) => {
    const { username, password } = req.body;
    try {
        await db.run("INSERT INTO users (username, password) VALUES (?, ?)", [username, password]);
        res.status(201).json({ message: "Успішна реєстрація!" });
    } catch (err) {
        res.status(400).json({ error: "Користувач з таким ім'ям вже існує." });
    }
});

app.post("/api/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await db.get("SELECT id, username FROM users WHERE username = ? AND password = ?", [username, password]);
    if (user) res.json(user);
    else res.status(401).json({ error: "Невірний логін або пароль." });
});


app.get("/api/categories", async (req, res) => {
    if (cache.categories) {
        console.log("Віддаємо категорії з КЕШУ");
        return res.json(cache.categories);
    }
    
    console.log("Дістаємо категорії з БАЗИ ДАНИХ");
    const categories = await db.all("SELECT name FROM categories");
    const result = categories.map(c => c.name);
    
    cache.categories = result;
    res.json(result);
});

app.get("/api/articles", async (req, res) => {
    if (cache.articles) {
        console.log("Віддаємо статті з КЕШУ");
        return res.json(cache.articles);
    }

    console.log("Дістаємо статті з БАЗИ ДАНИХ");
    const articles = await db.all("SELECT * FROM articles");
    for (let article of articles) {
        const comments = await db.all("SELECT text FROM comments WHERE article_id = ?", [article.id]);
        article.comments = comments.map(c => c.text);
    }
    
    cache.articles = articles;
    res.json(articles);
});

app.post("/api/articles", async (req, res) => {
    const { title, content, category } = req.body;
    const result = await db.run("INSERT INTO articles (title, content, category) VALUES (?, ?, ?)", [title, content, category]);
    
    cache.articles = null; 
    
    res.status(201).json({ id: result.lastID, title, content, category, comments: [] });
});

app.post("/api/articles/:id/comments", async (req, res) => {
    const articleId = req.params.id;
    const { text } = req.body;
    await db.run("INSERT INTO comments (article_id, text) VALUES (?, ?)", [articleId, text]);
    
    cache.articles = null; 
    
    res.status(201).json({ message: "Коментар додано" });
});

app.listen(3000, () => console.log("Server is running on http://localhost:3000"));