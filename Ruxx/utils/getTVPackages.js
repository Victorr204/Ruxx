export const getTVPackages = async (provider) => {
  const plans = {
    DSTV: [
      { label: 'DSTV Padi - ₦2500', price: 2500, duration: '30 Days' },
      { label: 'DSTV Yanga - ₦3500', price: 3500, duration: '30 Days' },
      { label: 'DSTV Confam - ₦6200', price: 6200, duration: '30 Days' },
    ],
    GOTV: [
      { label: 'GOTV Smallie - ₦1200', price: 1200, duration: '30 Days' },
      { label: 'GOTV Jolli - ₦2900', price: 2900, duration: '30 Days' },
      { label: 'GOTV Max - ₦4300', price: 4300, duration: '30 Days' },
    ],
    Startimes: [
      { label: 'Startimes Basic - ₦1500', price: 1500, duration: '30 Days' },
      { label: 'Startimes Classic - ₦2500', price: 2500, duration: '30 Days' },
    ],
  };

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(plans[provider] || []);
    }, 500);
  });
};
