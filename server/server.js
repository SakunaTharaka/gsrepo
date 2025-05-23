// server/server.js
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const { v4: uuidv4 } = require('uuid');
const bucket = require('./firebaseAdmin');

const app = express();
app.use(express.json());

app.post('/api/upload-group-image', async (req, res) => {
  const { inviteCode } = req.body;
  const inviteUrl = `https://chat.whatsapp.com/invite/${inviteCode}`;

  try {
    const response = await axios.get(inviteUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0' }
    });

    const $ = cheerio.load(response.data);
    const imageUrl = $('meta[property="og:image"]').attr('content');
    if (!imageUrl) return res.status(404).json({ error: 'Image not found' });

    const imageRes = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = imageRes.data;

    const filename = `group-icons/${uuidv4()}.jpg`;
    const file = bucket.file(filename);

    await file.save(buffer, {
      contentType: 'image/jpeg',
      metadata: { cacheControl: 'public, max-age=31536000' }
    });

    await file.makePublic();
    res.json({ imageUrl: `https://storage.googleapis.com/${bucket.name}/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
