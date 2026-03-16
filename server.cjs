const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

const distPath = path.join(__dirname, 'dist');

app.use(express.static(distPath));

// SPA fallback: always serve index.html for unknown routes
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  // eslint-disable-next-line no-console
  console.log(`RehearsAI server listening on port ${port}`);
});

