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

app.post('/gerar-pix', async (req, res) => {
  try {
    const payment = new Payment(client);
    const { valor = 50, email = 'cliente@teste.com' } = req.body;

    const result = await payment.create({
      body: {
        transaction_amount: Number(valor),
        description: 'Aluguel AlugaBox',
        payment_method_id: 'pix',
        payer: { email }
      }
    });
    
    const pix = result.point_of_interaction.transaction_data;
    res.json({
      id: result.id,
      qr_code: pix.qr_code,
      qr_code_base64: pix.qr_code_base64
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Erro ao gerar Pix' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
