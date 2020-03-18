import Koa, { ExtendableContext, Next } from 'koa';

const app = new Koa();

app.use(async ({ request, response }: ExtendableContext, next: Next): Promise<void> => {
  response.body = '<!doctype html>';
  response.body += '<style>';
  response.body += '.site-header {';
  response.body += 'border-bottom: 2px solid;';
  response.body += '}';
  response.body += '.site-header__name {';
  response.body += 'font-size: 3em;';
  response.body += '}';
  response.body += '</style>';
  response.body += '<header class="site-header">';
  response.body += '<h1 class="site-header__name">Header</h1>';
  response.body += '<ul>';

  const originalPath = request.header['original-path'];
  const links = [
    ['Home', '/'],
    ['Articles', '/articles/'],
  ];

  response.body += links.reduce((carry, link) => {
    if (link[1] === originalPath) {
      return `${carry}<li>${link[0]}</li>`;
    }

    return `${carry}<li><a href="${link[1]}">${link[0]}</a></li>`;
  }, '');

  response.body += '</ul>';
  response.body += '</header>';

  await next();
});

app.listen(process.env.NODE_PORT);
