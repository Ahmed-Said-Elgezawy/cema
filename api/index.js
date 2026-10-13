const express = require('express');
const cors = require('cors');
const movies = require('./_movies');

const app = express();
app.use(express.json());
app.use(cors());

// فهرسة مرة واحدة
const mainMap = new Map();
movies.forEach((m) => {
  if (!mainMap.has(m.movieId)) mainMap.set(m.movieId, m);
});

const relatedMap = new Map();
movies.forEach((m) => {
  (m.relatedMovies || []).forEach((r) => {
    if (!mainMap.has(r.movieId) && !relatedMap.has(r.movieId)) {
      relatedMap.set(r.movieId, r);
    }
  });
});

// فحص سريع
app.get('/api', (req, res) => {
  res.json({ status: 'ok', total: movies.length });
});

// كل الأفلام
app.get('/api/movies', (req, res) => {
  res.json(movies);
});

// فيلم واحد
app.get('/api/movies/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'معرّف غير صالح' });
  }
  const movie = mainMap.get(id) || relatedMap.get(id);
  if (movie) res.json(movie);
  else res.status(404).json({ message: 'الفيلم غير موجود' });
});

// إضافة (في الذاكرة فقط، لا تُحفظ على Vercel)
app.post('/api/movies', (req, res) => {
  const items = Array.isArray(req.body) ? req.body : [req.body];
  items.forEach((m) => {
    movies.push(m);
    mainMap.set(m.movieId, m);
  });
  res.status(201).json(Array.isArray(req.body) ? items : items[0]);
});

// معالج أخطاء يعرض سبب الفشل بدل الصفحة العامة
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: err.message });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
}

module.exports = app;