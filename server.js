const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Payment } = require("mercadopago");

const app = express();
app.use(cors());
app.use(express.json());

// CONFIG NOVO DA VERSÃO 2.0
const client = new MercadoPagoConfig({ 
  accessToken: process.env.MP_ACCESS_TOKEN 
});

const dispositivosPagos = {};

// GERA PIX VIA API - VERSÃO 2.0
app.get("/pagar/:deviceId", async (req, res) => {
  const deviceId = req.params.deviceId;
  
  try {
    const payment = new Payment(client);
    const body = {
      transaction_amount: 10,
      description: `Aluguel AlugaBox - ${deviceId}`,
      payment_method_id: "pix",
      external_reference: deviceId,
      payer: { email: "cliente@teste.com" }
    };

    const result = await payment.create({ body });
    const qr_code = result.point_of_interaction.transaction_data.qr_code;
    const qr_code_base64 = result.point_of_interaction.transaction_data.qr_code_base64;

    res.send(`
      <h1>AlugaBox - Pague R$ 10,00</h1>
      <h3>Dispositivo: ${deviceId}</h3>
      <img src="data:image/png;base64,${qr_code_base64}" width="300"/>
      <p><b>Pix Copia e Cola:</b></p>
      <textarea rows="4" cols="50">${qr_code}</textarea>
    `);
  } catch (error) {
    console.log(error);
    res.status(500).send("Erro ao gerar PIX");
  }
});

// WEBHOOK - VERSÃO 2.0
app.post("/webhook/pix", async (req, res) => {
  console.log("POST /webhook/pix");
  const payment_id = req.body.data?.id;
  
  if (!payment_id) return res.status(400).send("Sem ID");

  try {
    const payment = new Payment(client);
    const result = await payment.get({ id: payment_id });
    
    const deviceId = result.external_reference;
    const status = result.status;

    if (status === "approved" && deviceId) {
      dispositivosPagos[deviceId] = {
        pago: true,
        payment_id: payment_id,
        data: new Date()
      };
      console.log(`✓ ${deviceId} liberado. Payment MP: ${payment_id}`);
    }
    res.status(200).send("OK");
  } catch (error) {
    console.log("Erro no webhook:", error);
    res.status(500).send("Erro");
  }
});

// ROTA PRA TV BOX CHECAR SE PAGOU
app.get("/check/:deviceId", (req, res) => {
  const deviceId = req.params.deviceId;
  const liberado = dispositivosPagos[deviceId]?.pago || false;
  res.json({ liberado });
});

app.get("/", (req, res) => {
  res.send("AlugaBox API Online");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
