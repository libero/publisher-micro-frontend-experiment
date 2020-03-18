Libero Publisher micro-frontends experiment
===========================================


Instructions
------------

1. Run `make`
2. Open <http://localhost:8081/> and add an article (click the ⚡️ under the `/articles` link on the bottom right).
3. Open <http://localhost:8000/> to view the homepage and follow the links.

What's here
-----------

Bunch of services showing two forms of micro-frontends:

1. Page-level (`homepage` and `article-page`) composed by Nginx (`web`)
2. Server-side component level (`header` and `footer`) used by the page-level front-ends.

### Page-level

This is useful to be able to replace/extend at the page (group) level, so you don't have to throw _everything_ away to change something.

Hypermedia helps somewhat anyway, but probably isn't enough for customisable areas (eg an About section), or adding different content types (eg podcasts) without it having to understand _everything_ that is possible.

#### Concerns

- **Route generation**

  The homepage will have links to article pages, but how does it know they exist/what the path is? Feels like the same hypermedia approach would solve this, so an article-page service could also expose an API with entries like:

  ```json
  {
    "@context": "http://schema.org/",
    "id": "http://example.com/articles/abcde",
    "type": "ItemPage",
    "mainEntity": "http://article-store.example.com/some/path/to/12345"
  }
  ```
  
  So a hypermedia knows to link to `http://example.com/articles/abcde` on a teaser for article `http://article-store.example.com/some/path/to/12345` by doing a lookup operation.

  This would allow turning off/on of things like subject pages, article type pages etc by running (or not) the relevant page service.
  
  Also means it's easy to customise what routes are (e.g. maybe you want to use a DOI in the path, or some other local identifier).
  
  This is another layer of complexity though, and is probably a step too far...

- **Asset bundling**

  Assets (CSS, JS, fonts etc) can't easily be shared between the services. Means that the assets for the homepage and for the article page, for example, are separate. The shared CSS is small, but things like fonts are a problem.
  
  Deriving assets from a pattern library helps the versioning, but they might be a little out of sync.

- **Performance**

  Hard to share caches between the different services, unless something like Varnish is run locally?

- **Sessions**

  Need a mechanism to share sessions between different services.

### Component-level

The header and footer is shared across all the pages, and duplicating it is hard.

Two approaches:

1. **Expose data that is used in the pattern**

   Means the rendering, and assets, of the pattern is done by the page-service. Would be complicated to make flexible etc.
   
2. **Expose the rendered pattern**

   Means the HTML, CSS, JS etc is rendered by the component service and is then embedded in the page-service. Means that it's easy to make changes without individual page services having to care (Want a custom footer? Just replace the footer service).

   This is method that has been tried. (At the code-level, rather than a simple server-side include.)

#### Concerns

- **Conflicts**

  Potential conflicts in class names, style scoping etc.

- **Security**

  Embedding HTML/JS from outside sounds dangerous.

- **Performance**

  Even more API requests...
  
- **Sessions**

  These might also need to know who's logged in (e.g. header having the log in/out links).
