const express = require('express');
const path = require('path');

const app = express();
const PORT = 4000;

app.use(express.static('public'));

app.listen(PORT, () => {
  console.log(`SOC Dashboard running on http://localhost:${PORT}`);
  console.log(`Monitoring vulnerable server at http://localhost:3000`);
});
