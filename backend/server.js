
import app from './src/app.js';
import config from './src/config.js';

app.listen(config.PORT, () => {
  console.log(`Server is running on port ${config.PORT}`);
});