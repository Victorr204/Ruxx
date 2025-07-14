const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 5001;

// Simulated Disco validation (You can later integrate with VTPass or BillBox)
const validMeters = {
  '1234567890': { disco: 'Ikeja Electric', name: 'John Doe', type: 'Prepaid' },
  '9876543210': { disco: 'Eko Electric', name: 'Jane Smith', type: 'Postpaid' },
};

// Validate meter number
app.post('/api/validate-meter', (req, res) => {
  const { meterNumber, disco } = req.body;

  const record = validMeters[meterNumber];
  if (record && record.disco === disco) {
    return res.json({
      success: true,
      customerName: record.name,
      meterType: record.type,
      disco,
    });
  } else {
    return res.status(404).json({ success: false, message: 'Meter number not found or disco mismatch.' });
  }
});

// Simulate payment endpoint
app.post('/api/pay-electricity', (req, res) => {
  const { meterNumber, disco, meterType, amount } = req.body;

  if (!meterNumber || !disco || !amount || isNaN(amount)) {
    return res.status(400).json({ success: false, message: 'Invalid payment data.' });
  }

  return res.json({
    success: true,
    message: `₦${amount} electricity token sent to ${meterNumber}`,
    token: 'ELECTRIC-ABC123456',
    disco,
    amount,
    meterNumber,
    meterType,
  });
});

app.listen(PORT, () => {
  console.log(`⚡ Mock Electricity API running at http://localhost:${PORT}`);
});
