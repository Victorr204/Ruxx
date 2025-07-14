export const verifyBetAccount = async (userId, provider) => {
  const res = await fetch('http://localhost:5002/api/verify-bet-account', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, provider }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.message || 'Account verification failed');
  }

  return await res.json();
};

export const payBetAccount = async (data) => {
  const res = await fetch('http://localhost:5002/api/pay-bet', {
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
