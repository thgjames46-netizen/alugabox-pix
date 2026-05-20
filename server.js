const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('AlugaBox PIX Online');
});

app.post('/gerar-pix', async (req, res) => {
  try {
    const { valor = 50 } = req.body;
    
    console.log('Token configurado:', !!process.env.MP_ACCESS_TOKEN);

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Date.now().toString()
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: 'Aluguel AlugaBox',
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@teste.com'
        }
      })
    });

    const data = await response.json();
    console.log('Resposta MP:', data);

    if (data.status === 400 || data.error) {
      return res.status(400).json({ error: data.message || data.cause });
    }

    const pix = data.point_of_interaction.transaction_data;
        res.json({
      id: data.id,
      qr_code: pix.qr_code,
      qr_code_base64: pix.qr_code_base64
    });

  } catch (error) {
    console.log('Erro servidor:', error);
    res.status(500).json({ error: 'Erro ao gerar Pix' });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
