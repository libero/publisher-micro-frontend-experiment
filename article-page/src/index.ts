import Router, { RouterContext } from '@koa/router';
import ParserJsonLd from '@rdfjs/parser-jsonld';
import { schema } from '@tpluscode/rdf-ns-builders';
import Hydra from 'alcaeus';
import atob from 'atob';
import btoa from 'btoa';
import cheerio from 'cheerio';
import Koa, { Next } from 'koa';
import fetch from 'node-fetch';
import dereference from './dereference';
import { isArticle, isCollection, isHydraResource } from './types';

const app = new Koa();
const prefix = process.env.PREFIX || '/';
const router = new Router({ prefix });

Hydra.parsers.set('application/ld+json', new ParserJsonLd());

router.get('homepage', '/', async ({ request, response, router }: RouterContext, next: Next): Promise<void> => {
  const [resource, header, footer] = await Promise.all([
    Hydra.loadResource('http://localhost:8080/'),
    fetch('http://localhost:8889', { headers: { 'Original-Path': request.path } }).then((response): Promise<Buffer> => response.buffer()).then((header): CheerioSelector => cheerio.load(header)),
    fetch('http://localhost:8890', { headers: { 'Original-Path': request.path } }).then((response): Promise<Buffer> => response.buffer()).then((footer): CheerioSelector => cheerio.load(footer)),
  ]);

  if (!isHydraResource(resource.root)) {
    throw new Error('Not an entry point');
  }

  const [collectionLink] = resource.root.getCollections();

  if (!isCollection(collectionLink)) {
    throw new Error('No collections');
  }

  const collection = await dereference(collectionLink);

  response.body = '<!doctype html>';
  response.body += '<title>Articles</title>';
  response.body += header('head').html();
  response.body += footer('head').html();
  response.body += header('body').html();
  response.body += '<h1>Articles</h1>';

  if (collection.members.length) {
    const members = await Promise.all(collection.members.map(dereference));

    response.body += '<ol>';
    for (const member of members) {
      response.body += '<li><a href="' + router.url('article', btoa(member.id.value)) + '">' + (member.getString(schema.name) || 'Unknown article') + '</a></li>';
    }
    response.body += '</ol>';
  } else {
    response.body += '<p>No articles available.</p>';
  }
  response.body += footer('body').html();

  await next();
});

router.get('article', '/:id', async ({ params: { id }, request, response }: RouterContext, next: Next): Promise<void> => {
  const iri = atob(id).trim();

  if (!(iri.startsWith('http://localhost:8080/'))) {
    return;
  }

  const [resource, header, footer] = await Promise.all([
    Hydra.loadResource(iri),
    fetch('http://localhost:8889', { headers: { 'Original-Path': request.path } }).then((response): Promise<Buffer> => response.buffer()).then((header): CheerioSelector => cheerio.load(header)),
    fetch('http://localhost:8890', { headers: { 'Original-Path': request.path } }).then((response): Promise<Buffer> => response.buffer()).then((footer): CheerioSelector => cheerio.load(footer)),
  ]);

  const article = resource.root;
  if (!isArticle(article)) {
    throw new Error('Not an article');
  }

  const title = article.getString(schema.name) || 'Unknown article';

  response.body = '<!doctype html>';
  response.body += `<title>${title}</title>`;
  response.body += header('head').html();
  response.body += footer('head').html();
  response.body += header('body').html();
  response.body += `<h1>${title}</h1>`;
  response.body += footer('body').html();

  await next();
});

app.use(router.middleware());

app.listen(process.env.NODE_PORT);

const api = new Koa();

const apiRouter = new Router();

apiRouter.get('entry-point', '/', async ({ request, response, router }: RouterContext, next: Next): Promise<void> => {
  const resource = await Hydra.loadResource('http://localhost:8080/');

  if (!isHydraResource(resource.root)) {
    throw new Error('Not an entry point');
  }

  const [collectionLink] = resource.root.getCollections();

  if (!isCollection(collectionLink)) {
    throw new Error('No collections');
  }

  const collection = await dereference(collectionLink);

  const entryPoint = {
    '@type': 'http://schema.org/EntryPoint',
    'http://www.w3.org/ns/hydra/core#collection': {
      '@type': 'http://www.w3.org/ns/hydra/core#Collection',
      'http://www.w3.org/ns/hydra/core#manages': {
        'http://www.w3.org/ns/hydra/core#object': {
          '@id': 'http://schema.org/Article'
        },
        'http://www.w3.org/ns/hydra/core#property': {
          '@id': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'
        },
      },
    },
  };

  response.type = 'jsonld';
  response.body = JSON.stringify(entryPoint, null, 4);

  await next();
});

api.use(apiRouter.middleware());

api.listen(8888);
