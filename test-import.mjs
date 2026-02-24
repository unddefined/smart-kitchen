console.log('Testing API service import...');
import('./frontend/src/services/index.js')
  .then(services => {
    console.log('Services imported successfully:', Object.keys(services));
  })
  .catch(err => {
    console.error('Import error:', err);
  });