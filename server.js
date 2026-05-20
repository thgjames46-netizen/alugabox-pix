const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ROTA POST - PRA APP/CURL CHAMAR
app.post('/gerar-pix', async (req, res) => {
  try {
    const { deviceId, valor } = req.body;

    console.log('Token configurado: ', !!process.env.MP_ACCESS_TOKEN);

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Date.now().toString()
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: `AlugaBox - ${deviceId}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@alugabox.com.br'
        }
      })
    });

    const data = await response.json();
    
    if (data.status === 400 || data.error) {
      return res.status(400).json({ 
        erro: data.message || data.cause,
        detalhes: data
      });
    }

    const pix = data.point_of_interaction.transaction_data;
    
    res.json({
      qr_code: pix.qr_code,
      qr_code_base64: pix.qr_code_base64,
      ticket_url: pix.ticket_url,
      valor: valor,
      deviceId: deviceId
    });

  } catch (error) {
    console.log('Erro servidor:', error);
    res.status(500).json({ erro: 'Erro ao gerar Pix', detalhes: error.message });
  }
});

// ROTA GET - PRA ABRIR NO NAVEGADOR COM QR CODE
app.get('/pagar/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const valor = 10;

    console.log('Token configurado: ', !!process.env.MP_ACCESS_TOKEN);

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': Date.now().toString()
      },
      body: JSON.stringify({
        transaction_amount: Number(valor),
        description: `AlugaBox - ${deviceId}`,
        payment_method_id: 'pix',
        payer: {
          email: 'cliente@alugabox.com.br'
        }
      })
    });

    const data = await response.json();
    
    if (data.status === 400 || data.error) {
      return res.status(400).send(`Erro MP: ${data.message || data.cause}`);
    }

    const pix = data.point_of_interaction.transaction_data;
    
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width,initial-scale=1.0">
        <title>AlugaBox Pix</title>
      </head>
      <body style="font-family:sans-serif;text-align:center;padding:20px;background:#f5f5f5">
        <div style="background:white;max-width:400px;margin:0 auto;padding:30px;border-radius:12px">
          <h2 style="color:#6200EA">AlugaBox</h2>
          <p>Escaneie o QR Code para pagar</p>
          <img src="data:image/png;base64,${pix.qr_code_base64}" width="280" style="margin:20px 0"/>
          <p><strong>Valor: R$ ${valor},00</strong></p>
          <p style="font-size:12px;color:#666">Dispositivo: ${deviceId}</p>
          <p style="font-size:12px;margin-top:20px"><strong>Pix Copia e Cola:</strong></p>
          <input value="${pix.qr_code}" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:8px" readonly onclick="this.select()">
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.log('Erro servidor:', error);
    res.status(500).send('Erro ao gerar Pix: ' + error.message);
  }
});
// WEBHOOK DO MERCADO PAGO - RECEBE CONFIRMAÇÃO DE PAGAMENTO
app.post("/webhook/pix", async (req, res) => {
  console.log("POST /webhook/pix");
  console.log("Webhook MP recebido:", req.body);
  
  const payment_id = req.body.data?.id;
  
  if (!payment_id) {
    console.log("Webhook sem payment_id");
    return res.status(400).send("Sem ID");
  }

  // MODO TESTE: Libera o TESTE123 em qualquer pagamento
  console.log(`✓ TESTE123 liberado. Payment MP: ${payment_id}`);
  
  // AQUI VOCÊ VAI COLOCAR O CÓDIGO PRA LIBERAR A TV BOX
  // Ex: await db.query("UPDATE devices SET status='pago' WHERE id='TESTE123'");
  
  res.status(200).send("OK");
});


app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
