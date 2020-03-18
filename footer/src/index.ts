import Koa, { ExtendableContext, Next } from 'koa';

const app = new Koa();

app.use(async ({ response }: ExtendableContext, next: Next): Promise<void> => {
  response.body = '<!doctype html>';
  response.body += '<style>';
  response.body += '.site-footer {';
  response.body += 'border-top: 2px solid;';
  response.body += '}';
  response.body += '</style>';
  response.body += '<footer class="site-footer">';
  response.body += '<p>Footer</p>';
  response.body += '</footer>';

  await next();
});

app.listen(process.env.NODE_PORT);
