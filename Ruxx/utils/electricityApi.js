export const validateMeter = async (meterNumber, disco) => {
  const res = await fetch('http://localhost:5001/api/validate-meter', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ meterNumber, disco }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Validation failed');
  }

  return await res.json();
};

export const payElectricity = async (data) => {
  const res = await fetch('http://localhost:5001/api/pay-electricity', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Payment failed');
  }

  return await res.json();
};
