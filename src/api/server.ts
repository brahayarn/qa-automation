import { createApp } from './app';

createApp().listen(3000, () => {
  process.stdout.write('http://localhost:3000\n');
});
