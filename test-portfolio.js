// Test script to verify the portfolio API includes notional values
fetch('http://localhost:3000/api/portfolio')
  .then(res => res.json())
  .then(data => {
    console.log('Portfolio Summary:');
    console.log('- Cash:', data.summary.cash);
    console.log('- Equities:', data.summary.equities);
    console.log('- Crypto:', data.summary.crypto);
    console.log('- Options:', data.summary.options);
    console.log('- Total:', data.summary.total);
    
    console.log('\nFirst few options with notional values:');
    data.options.slice(0, 3).forEach((option, i) => {
      console.log(`${i+1}. ${option.symbol} ${option.type} $${option.strike}`);
      console.log(`   Value: $${option.value}`);
      console.log(`   Notional: $${option.notional}`);
      console.log(`   Qty: ${option.qty}, Underlying: $${option.underlyingPrice}`);
      console.log('');
    });
    
    console.log('✅ Notional values are included in options!');
  })
  .catch(err => console.error('Error:', err));