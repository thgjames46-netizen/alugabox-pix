const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
const { MercadoPagoConfig, Payment } = require('mercadopago');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;
const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });

app.get('/', (req, res) => {
  res.send('AlugaBox PIX Online');
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

