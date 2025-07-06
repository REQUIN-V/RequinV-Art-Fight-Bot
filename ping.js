import express from 'express';
const app = express();

app.get('/', (req, res) => res.send('🟢 Profic Art Royal bot is alive'));

app.listen(3000, () => console.log('🌐 Keep-alive server running'));
