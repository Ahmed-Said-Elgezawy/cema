const express = require('express');
const cors = require('cors');
const movies = require('./movies');

const app = express();
app.use(express.json());
app.use(cors());

/* ---------- فهرسة البيانات مرة واحدة عند تشغيل الدالة ---------- */

// الأفلام الرئيسية
const mainMap = new Map();
movies.forEach((m) => {
  if (!mainMap.has(m.movieId)) mainMap.set(m.movieId, m);
});

// الحلقات/الأفلام الموجودة داخل relatedMovies فقط (مثل ids: 221, 227 ...)
const relatedMap = new Map();
movies.forEach((m) => {
  (m.relatedMovies || []).forEach((r) => {
    if (!mainMap.has(r.movieId) && !relatedMap.has(r.movieId)) {
      relatedMap.set(r.movieId, r);
    }
  });
});

/* ---------- الحصول على جميع الأفلام ---------- */
app.get('/api/movies', (req, res) => {
  try {
    const json = JSON.stringify(movies);
    const sizeMB = (json.length / 1024 / 1024).toFixed(2);
    console.log('size MB:', sizeMB);

    // أرجع الحجم أولًا للتشخيص فقط
    if (req.query.debug === '1') {
      return res.json({ total: movies.length, sizeMB });
    }

    res.type('json').send(json);
  } catch (err) {
    console.error('LIST ERROR:', err);
    res.status(500).json({ message: err.message });
  }
});

/* ---------- الحصول على فيلم واحد ---------- */
app.get('/api/movies/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (Number.isNaN(id)) {
    return res.status(400).json({ message: 'معرّف غير صالح' });
  }

  const movie = mainMap.get(id) || relatedMap.get(id);

  if (movie) {
    res.json(movie);
  } else {
    res.status(404).json({ message: 'الفيلم غير موجود' });
  }
});

/* ---------- إضافة فيلم/أفلام (في الذاكرة فقط) ----------
   ملاحظة: Vercel serverless لا يحفظ البيانات بشكل دائم،
   فأي إضافة تضيع عند إعادة تشغيل الدالة. */
app.post('/api/movies', (req, res) => {
  try {
    const data = req.body;
    const items = Array.isArray(data) ? data : [data];

    items.forEach((m) => {
      movies.push(m);
      mainMap.set(m.movieId, m);
    });

    res.status(201).json(Array.isArray(data) ? items : items[0]);
  } catch (err) {
    res.status(400).json({ message: '❌ فشل في حفظ الفيلم' });
  }
});

/* ---------- مسار فحص سريع ---------- */
app.get('/api', (req, res) => {
  res.json({ status: 'ok', total: movies.length });
});

/* ---------- التشغيل ---------- */
// محليًا: node api/index.js  → يعمل على المنفذ 3000
// على Vercel: يتم تصدير app فقط (بدون listen)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
}

module.exports = app;