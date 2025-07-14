export const getDataPlans = async (network) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const mockPlans = {
    MTN: [
      { plan_name: 'MTN 500MB Daily', price: 100, validity: '1 day', category: 'Daily' },
      { plan_name: 'MTN 1GB Daily', price: 200, validity: '1 day', category: 'Daily' },
      { plan_name: 'MTN 2GB Weekly', price: 500, validity: '7 days', category: 'Weekly' },
      { plan_name: 'MTN 10GB Monthly', price: 2000, validity: '30 days', category: 'Monthly' },
    ],
    Airtel: [
      { plan_name: 'Airtel 750MB Daily', price: 150, validity: '1 day', category: 'Daily' },
      { plan_name: 'Airtel 1.5GB Weekly', price: 500, validity: '7 days', category: 'Weekly' },
      { plan_name: 'Airtel 5GB Monthly', price: 1000, validity: '30 days', category: 'Monthly' },
    ],
    Glo: [
      { plan_name: 'Glo 1GB Daily', price: 200, validity: '1 day', category: 'Daily' },
      { plan_name: 'Glo 3GB Weekly', price: 700, validity: '7 days', category: 'Weekly' },
      { plan_name: 'Glo 6GB Monthly', price: 1200, validity: '30 days', category: 'Monthly' },
    ],
    '9mobile': [
      { plan_name: '9mobile 1.5GB Daily', price: 250, validity: '1 day', category: 'Daily' },
      { plan_name: '9mobile 2.5GB Weekly', price: 600, validity: '7 days', category: 'Weekly' },
      { plan_name: '9mobile 10GB Monthly', price: 2500, validity: '30 days', category: 'Monthly' },
    ],
  };

  return mockPlans[network] || [];
};
