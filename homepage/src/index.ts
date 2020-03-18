import Router, { RouterContext } from '@koa/router';
import ParserJsonLd from '@rdfjs/parser-jsonld';
import { schema } from '@tpluscode/rdf-ns-builders';
import Hydra from 'alcaeus';
import btoa from 'btoa';
import cheerio from 'cheerio';
import Koa, { Next } from 'koa';
import fetch from 'node-fetch';
import { RdfaParser } from 'rdfa-streaming-parser';
import dereference from './dereference';
import { isCollection, isHydraResource } from './types';

const app = new Koa();
const prefix = process.env.PREFIX || '/';
const router = new Router({ prefix });

Hydra.parsers.set('application/ld+json', new ParserJsonLd());
Hydra.parsers.set('text/html', new RdfaParser());

router.get('/', async ({ request, response }: RouterContext, next: Next): Promise<void> => {
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
  response.body += '<title>Home</title>';
  response.body += header('head').html();
  response.body += footer('head').html();
  response.body += header('body').html();
  response.body += '<h1>Homepage</h1>';

  if (collection.members.length) {
    const members = await Promise.all(collection.members.map(dereference));

    response.body += '<ol>';
    for (const member of members) {
      response.body += '<li><a href="' + '/articles/' + btoa(member.id.value) + '">' + (member.getString(schema.name) || 'Unknown article') + '</a></li>';
    }
    response.body += '</ol>';
  } else {
    response.body += '<p>No articles available.</p>';
  }
  response.body += footer('body').html();

  await next();
});

app.use(router.middleware());

app.listen(process.env.NODE_PORT);
