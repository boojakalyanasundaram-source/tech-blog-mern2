# TechPulse – Technology Blog (MERN Stack)

A content-focused technology blog with a built-in admin panel (CMS). Layout and content arrangement take
inspiration from Zoho Blog: category bar, featured stories, latest posts, popular articles sidebar, clean article pages.

**Stack:** MongoDB · Express · React (Vite) · Node.js

## Features

**Public website**
- Homepage: featured articles, latest posts (thumbnail, title, description, date), category bar, search, popular articles, tags, footer with company details and social links
- Blog listing: filter by category or tag, keyword search, pagination
- Article page: featured image, author, date, reading time, headings / images / videos / links / tables / code (syntax highlighted), auto-generated table of contents, share buttons, author box, related articles, previous / next navigation, reading progress bar
- Responsive layout (desktop, tablet, mobile), lazy-loaded WebP images with `srcset`, accessible markup

**Admin panel (`/admin`)**
- Create, edit, delete articles; drafts, publish, **scheduling** (auto-published by a cron job every minute)
- Rich-text editor (TipTap): headings, lists, quotes, links, code blocks, tables, YouTube embeds, image upload
- Featured image and in-article image uploads (resized, converted to WebP, thumbnail created)
- Categories, tags, authors; featured toggle; published / unpublished management
- SEO fields per article: SEO title, meta description, URL slug (with search-result preview)
- Users with roles (see below)

**SEO**
- Clean URLs (`/blog/your-article-slug`), `sitemap.xml`, `robots.txt`
- Open Graph + Twitter tags, canonical URLs, `BlogPosting` JSON-LD
- Meta tags are injected **on the server** for every page, so crawlers and link previews see them without running JavaScript
- Google Analytics 4 and Search Console verification through environment variables

**Security**
- JWT in an httpOnly cookie, bcrypt password hashing, role-based permissions, login rate limit
- Helmet, API rate limit, HTML sanitising of article content (`sanitize-html`), upload type and size checks

## Roles

| Role | Can do |
|---|---|
| **Admin** | Everything, plus manage users |
| **Editor** | Publish, schedule, unpublish, delete, feature any article; manage categories, tags, authors |
| **Author** | Write and edit their own **drafts** only; an editor publishes them |

## Quick start

Requirements: Node.js 18.17+ and MongoDB (local, or a free MongoDB Atlas cluster).

```bash
# 1. install everything
npm run install:all

# 2. configure the server (the private .env file is intentionally not included)
cp server/.env.example server/.env
#    Edit MONGO_URI, JWT_SECRET, ADMIN_EMAIL and ADMIN_PASSWORD as needed.

# 3. create the admin account, the 7 starter categories and sample articles
npm run seed

# 4. run API (http://localhost:5000) and website (http://localhost:5174)
npm run dev
```

Open http://localhost:5174 for the site and http://localhost:5174/admin to sign in
(default: `admin@example.com` / `ChangeMe@123` – **change this immediately**).

`npm run seed -- --fresh` clears articles, categories, tags and authors, then re-creates the sample content.
Remove the sample articles from the admin panel before going live.

## Deployment (Render + Vercel)

**Single-service Render deployment:** the included `render.yaml` builds the React client and serves it from Express. Set `MONGO_URI`, `CLIENT_URL` and `SITE_URL` in the Render dashboard. `CLIENT_URL` should be the exact public origin(s), comma-separated if needed.

**Split Vercel + Render deployment:** deploy `client/` to Vercel and the Node service to Render. Set `VITE_API_URL` in Vercel to the Render API base URL ending in `/api` (for example `https://your-api.onrender.com/api`). On Render, set `CLIENT_URL` to the Vercel site origin and `COOKIE_SECURE=true`; the API uses secure `SameSite=None` cookies for cross-origin sign-in. Configure `SITE_URL` to the public website URL. The included `client/vercel.json` supports client-side route refreshes.

Do not commit `.env` files or production secrets. Configure environment variables in the hosting dashboards.

## Production

```bash
npm run build      # builds client/dist
npm start          # Express serves the API, uploads and the built site on one port
```

Set these in `server/.env` for production:

```
NODE_ENV=production
MONGO_URI=<your MongoDB connection string>
JWT_SECRET=<long random string>
COOKIE_SECURE=true            # when served over HTTPS
SITE_URL=https://your-domain.com
SITE_NAME=Your Company Blog
GA_MEASUREMENT_ID=G-XXXXXXXXXX
GOOGLE_SITE_VERIFICATION=<token from Search Console>
```

Notes
- Run behind HTTPS (for example Nginx, Caddy, or a platform such as Render / Railway / a VPS). `trust proxy` is enabled.
- Uploaded images are stored in `server/uploads`. Use a persistent disk or volume on your host, or swap the storage code in
  `server/src/routes/admin/upload.js` for S3 / Cloudinary.
- A Content-Security-Policy is not set by default because articles can embed YouTube/Vimeo and GA scripts. Add one at your reverse proxy if your
  security policy requires it.
- After launch, submit `https://your-domain.com/sitemap.xml` in Google Search Console.

## Customising

| What | Where |
|---|---|
| Company name, address, email, social links | `client/src/config.js` |
| Site name and description | `server/.env` (`SITE_NAME`, `SITE_DESCRIPTION`) and `client/.env` (`VITE_SITE_NAME`) |
| Colours, fonts, spacing | CSS variables at the top of `client/src/styles/site.css` |
| Starter categories | `server/src/seed.js` (or edit them any time in the admin panel) |

## Project structure

```
techblog/
├── client/                 React app (Vite)
│   └── src/
│       ├── components/     Header, footer, cards, sidebar, SEO, share buttons
│       ├── pages/          Home, BlogList, PostPage, NotFound
│       ├── admin/          Login, dashboard, articles, editor, managers
│       └── styles/         site.css (public); admin/admin.css (admin)
└── server/                 Express API
    └── src/
        ├── models/         User, Post, Category, Tag, Author
        ├── routes/         public API, auth, SEO (sitemap, robots, meta), admin/*
        ├── middleware/     auth + roles, error handling
        ├── jobs/           scheduled publishing
        └── seed.js
```

## API overview

Public: `GET /api/posts?page&limit&category&tag&q`, `/api/posts/featured|trending|latest`, `/api/posts/:slug`, `/api/categories`, `/api/tags`, `/sitemap.xml`, `/robots.txt`

Auth: `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`

Admin (signed in): `/api/admin/posts` (CRUD, `PATCH /:id/status`, `PATCH /:id/feature`), `/api/admin/categories|tags|authors` (CRUD), `/api/admin/users` (admin only), `POST /api/admin/upload`, `GET /api/admin/stats`
