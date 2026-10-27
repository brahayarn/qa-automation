import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from './msw/server';

const LOCAL_HOSTS = ['127.0.0.1', 'localhost'];

beforeAll(() =>
  server.listen({
    onUnhandledRequest(request, print) {
      if (LOCAL_HOSTS.includes(new URL(request.url).hostname)) return;
      print.error();
    },
  }),
);
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
