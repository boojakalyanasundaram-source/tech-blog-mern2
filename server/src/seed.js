import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from './config/env.js';
import User from './models/User.js';
import Author from './models/Author.js';
import Category from './models/Category.js';
import Tag from './models/Tag.js';
import Post from './models/Post.js';
import { makeSlug, readingTime, stripHtml } from './utils/text.js';

const fresh = process.argv.includes('--fresh');

const categories = [
  ['Software Development', 'Engineering practices, architecture, testing and developer tooling.'],
  ['Artificial Intelligence & Machine Learning', 'Applied AI, machine learning workflows and language models.'],
  ['Web and Mobile App Development', 'Building fast, reliable web and mobile products.'],
  ['Technology & Innovation', 'Emerging technologies and what they mean for businesses.'],
  ['Cybersecurity', 'Practical security guidance for teams and organisations.'],
  ['Cloud Computing', 'Cloud architecture, operations and cost management.'],
  ['Industry Insights', 'Trends, analysis and company news from across the industry.'],
];

const tagNames = ['Node.js', 'React', 'Testing', 'Architecture', 'LLM', 'RAG', 'Security', 'DevOps', 'FinOps', 'Mobile', 'Leadership', 'Zero Trust'];

const authors = [
  { name: 'Anita Raman', bio: 'Principal engineer writing about architecture, testing and developer experience.', linkedin: 'https://www.linkedin.com/' },
  { name: 'Karthik Subramanian', bio: 'Cloud and security lead who helps teams ship safely and spend wisely.', twitter: 'https://x.com/' },
];

const p = (t) => `<p>${t}</p>`;
const h2 = (t) => `<h2>${t}</h2>`;
const h3 = (t) => `<h3>${t}</h3>`;
const ul = (items) => `<ul>${items.map((i) => `<li>${i}</li>`).join('')}</ul>`;
const code = (lang, src) => `<pre><code class="language-${lang}">${src.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</code></pre>`;
const table = (head, rows) =>
  `<table><tbody><tr>${head.map((c) => `<th>${c}</th>`).join('')}</tr>${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

const posts = [
  {
    title: 'Structuring a Node.js Service with Clean Architecture',
    cat: 'Software Development', author: 0, tags: ['Node.js', 'Architecture'], featured: true, views: 940,
    excerpt: 'Keep business rules independent of frameworks and databases so your Node.js service stays easy to change.',
    body: [
      p('Most Node.js services start as a handful of route handlers and grow into a tangle where HTTP, database calls and business rules live in the same file. Clean architecture offers a way out without a big rewrite.'),
      h2('Separate what changes often from what rarely does'),
      p('Frameworks, databases and third-party APIs change often. Your pricing rules, validation and workflows change far less. Put the second group in plain modules that know nothing about Express or MongoDB.'),
      h2('A folder layout that works'),
      ul(['<strong>domain</strong>: entities and business rules', '<strong>application</strong>: use cases that coordinate the domain', '<strong>infrastructure</strong>: database, queues and external services', '<strong>http</strong>: routes, controllers and request validation']),
      h2('A use case in practice'),
      p('The use case receives its dependencies as arguments, which makes it trivial to test without a database.'),
      code('js', `export const createOrder = ({ orders, payments }) => async (input) => {
  if (!input.items.length) throw new Error('An order needs at least one item');
  const total = input.items.reduce((sum, i) => sum + i.price * i.qty, 0);
  await payments.authorise(input.customerId, total);
  return orders.save({ ...input, total, status: 'placed' });
};`),
      h2('When not to bother'),
      p('A small internal tool with three endpoints does not need four layers. Introduce structure when the second or third integration arrives and changes start to hurt.'),
    ],
  },
  {
    title: 'A Practical Guide to Retrieval-Augmented Generation',
    cat: 'Artificial Intelligence & Machine Learning', author: 0, tags: ['LLM', 'RAG'], featured: true, views: 1320,
    excerpt: 'How RAG grounds language models in your own documents, and the design decisions that decide whether it works.',
    body: [
      p('Language models know a lot, but they do not know your product documentation, policies or tickets. Retrieval-augmented generation (RAG) fixes this by fetching relevant passages at question time and handing them to the model as context.'),
      h2('How the pipeline fits together'),
      p('Documents are split into chunks, converted to embeddings and stored in a vector index. At query time the question is embedded, the closest chunks are retrieved and the model answers using only that material.'),
      h2('Decisions that matter most'),
      table(['Decision', 'What to consider'], [
        ['Chunk size', 'Too small loses context; too large dilutes relevance. Start around a few hundred words with overlap.'],
        ['Retrieval', 'Combine keyword and vector search for names, codes and acronyms.'],
        ['Re-ranking', 'A second pass over the top results often improves precision noticeably.'],
        ['Evaluation', 'Keep a fixed set of real questions and check answers after every change.'],
      ]),
      h2('Failure modes to plan for'),
      ul(['Retrieved passages that are relevant but outdated', 'Questions the documents cannot answer, where the model should say so', 'Permissions: users must only retrieve what they are allowed to read']),
      p('Treat RAG as a search problem first and a language model problem second. Most quality gains come from better retrieval.'),
    ],
  },
  {
    title: 'Choosing a Cross-Platform Mobile Stack for Your Next App',
    cat: 'Web and Mobile App Development', author: 1, tags: ['Mobile', 'React'], featured: false, views: 610,
    excerpt: 'A framework-neutral checklist for deciding between native, React Native and Flutter.',
    body: [
      p('Few decisions shape a mobile project as much as the stack. Rather than picking a winner, start with the constraints of your product and team.'),
      h2('Questions to answer first'),
      ul(['Which platforms must launch together, and which can follow?', 'How much of the experience depends on platform-specific features?', 'What skills does the team already have?', 'How long will the app be maintained?']),
      h2('Comparing the options'),
      table(['Approach', 'Strengths', 'Watch out for'], [
        ['Native (Swift / Kotlin)', 'Best access to platform features and performance', 'Two codebases and two skill sets'],
        ['React Native', 'Shares skills and logic with web React teams', 'Native modules for advanced features'],
        ['Flutter', 'Consistent custom UI across platforms', 'Smaller pool of existing Dart developers'],
      ]),
      h2('Prototype before you commit'),
      p('Build the single hardest screen in your shortlisted options. A week of prototyping is cheaper than a year of regret.'),
    ],
  },
  {
    title: 'Five Emerging Technologies Worth Watching This Year',
    cat: 'Technology & Innovation', author: 1, tags: ['Leadership'], featured: false, views: 430,
    excerpt: 'A grounded look at the technologies that are moving from demos to real projects.',
    body: [
      p('Every year brings a long list of buzzwords. This list focuses on technologies that teams are actually piloting, with a note on what to test first.'),
      h2('On-device AI'),
      p('Smaller models running on phones and laptops reduce latency and keep sensitive data local. Start with a single feature, such as summarising or classifying text, and measure battery and quality.'),
      h2('Edge computing'),
      p('Processing data close to where it is created cuts bandwidth costs and response times for retail, manufacturing and logistics.'),
      h2('Passkeys'),
      p('Passwordless sign-in is now supported across major platforms and removes a large class of phishing risk.'),
      h2('WebAssembly beyond the browser'),
      p('Portable, sandboxed modules are showing up in plugin systems and serverless runtimes.'),
      h2('Confidential computing'),
      p('Hardware-protected enclaves let organisations process regulated data in shared cloud environments with stronger guarantees.'),
    ],
  },
  {
    title: 'Zero Trust Basics: A Checklist for Small Engineering Teams',
    cat: 'Cybersecurity', author: 1, tags: ['Security', 'Zero Trust'], featured: true, views: 1105,
    excerpt: 'You do not need a large security team to start applying zero trust. Begin with these eight steps.',
    body: [
      p('Zero trust means no user, device or network is trusted by default. Every request is verified. The idea sounds heavy, but small teams can adopt it in stages.'),
      h2('Start with identity'),
      ul(['Enforce multi-factor authentication for every account', 'Prefer passkeys or hardware keys for administrators', 'Remove shared accounts and review access every quarter']),
      h2('Secure devices and networks'),
      ul(['Require disk encryption and automatic updates on laptops', 'Replace flat VPN access with per-application access', 'Segment production from staging and office networks']),
      h2('Limit what attackers can reach'),
      ul(['Give services the minimum permissions they need', 'Rotate secrets and keep them out of source control']),
      h2('Watch and respond'),
      p('Centralise logs for sign-ins and admin actions, and agree who responds when an alert fires. A simple, practised runbook beats an elaborate unused one.'),
    ],
  },
  {
    title: 'Cutting Cloud Costs Without Slowing Your Team Down',
    cat: 'Cloud Computing', author: 1, tags: ['FinOps', 'DevOps'], featured: false, views: 780,
    excerpt: 'Practical FinOps habits that reduce your bill while keeping engineers productive.',
    body: [
      p('Cloud bills grow quietly. The most effective cost programmes make spending visible to the people who control it rather than adding approval steps.'),
      h2('Make costs visible'),
      p('Tag every resource with a team and environment, then share a weekly cost view per team. Visibility alone often trims waste.'),
      h2('Fix the usual suspects'),
      ul(['Idle development environments running overnight', 'Oversized instances that never exceed low utilisation', 'Unattached disks and old snapshots', 'Data transfer between regions that could stay local']),
      h2('Commit where usage is stable'),
      p('Once a workload has run steadily for a few months, discounted commitments can lower the price significantly. Keep spiky workloads on flexible pricing.'),
      h2('Automate guardrails'),
      p('Budget alerts and automatic shutdown of non-production resources catch problems before the invoice does.'),
    ],
  },
  {
    title: 'What Engineering Leaders Are Prioritising This Year',
    cat: 'Industry Insights', author: 0, tags: ['Leadership'], featured: false, views: 350,
    excerpt: 'Developer productivity, security and AI adoption top the agenda for engineering leaders.',
    body: [
      p('Conversations with engineering leaders keep returning to the same three themes.'),
      h2('Developer productivity'),
      p('Teams are investing in faster builds, better local environments and fewer hand-offs. The goal is shorter feedback loops rather than more output metrics.'),
      h2('Security built into delivery'),
      p('Dependency scanning, secrets detection and review of infrastructure changes are moving into the pipeline so issues surface while they are cheap to fix.'),
      h2('Responsible AI adoption'),
      p('Leaders want clear policies on which data can be shared with AI tools, plus measurable results from pilots before wider rollout.'),
    ],
  },
  {
    title: 'Writing Tests That Survive Refactoring',
    cat: 'Software Development', author: 0, tags: ['Testing', 'Node.js'], featured: false, views: 520,
    excerpt: 'Tests should describe behaviour, not implementation. Here is how to keep them stable.',
    body: [
      p('Few things slow a team down like tests that break whenever code is restructured. The fix is to test behaviour that users and callers care about.'),
      h2('Test the public contract'),
      p('Call your code the way real callers do and assert on outputs and visible side effects, not on private functions or internal call counts.'),
      code('js', `test('applies a 10% discount to orders over 100', () => {
  const order = priceOrder({ items: [{ price: 120, qty: 1 }] });
  expect(order.total).toBe(108);
});`),
      h2('Keep tests small and independent'),
      ul(['One behaviour per test', 'No shared mutable state between tests', 'Use real objects where they are cheap; fake only slow or external dependencies']),
      h2('Read failures as documentation'),
      p('A good test name explains what broke without opening the file.'),
    ],
  },
];

async function main() {
  await mongoose.connect(env.mongoUri);

  if (fresh) {
    await Promise.all([Post.deleteMany({}), Category.deleteMany({}), Tag.deleteMany({}), Author.deleteMany({})]);
    console.log('Cleared existing content');
  }

  let admin = await User.findOne({ email: env.admin.email });
  if (!admin) {
    admin = await User.create({
      name: env.admin.name,
      email: env.admin.email,
      role: 'admin',
      passwordHash: await User.hashPassword(env.admin.password),
    });
    console.log(`Admin created: ${env.admin.email}`);
  }

  const catDocs = {};
  for (const [i, [name, description]] of categories.entries()) {
    catDocs[name] = await Category.findOneAndUpdate({ slug: makeSlug(name) }, { name, description, order: i, slug: makeSlug(name) }, { upsert: true, new: true });
  }
  const tagDocs = {};
  for (const name of tagNames) {
    tagDocs[name] = await Tag.findOneAndUpdate({ slug: makeSlug(name) }, { name, slug: makeSlug(name) }, { upsert: true, new: true });
  }
  const authorDocs = [];
  for (const a of authors) {
    authorDocs.push(await Author.findOneAndUpdate({ slug: makeSlug(a.name) }, { ...a, slug: makeSlug(a.name) }, { upsert: true, new: true }));
  }

  if ((await Post.countDocuments()) === 0) {
    const day = 24 * 60 * 60 * 1000;
    const docs = posts.map((post, i) => {
      const content = post.body.join('');
      const text = stripHtml(content);
      return {
        title: post.title,
        slug: makeSlug(post.title),
        excerpt: post.excerpt,
        content,
        contentText: text,
        readingTime: readingTime(text),
        category: catDocs[post.cat]._id,
        tags: post.tags.map((t) => tagDocs[t]._id),
        author: authorDocs[post.author]._id,
        createdBy: admin._id,
        status: 'published',
        publishedAt: new Date(Date.now() - (i * 2 + 1) * day),
        isFeatured: post.featured,
        views: post.views,
        seoTitle: post.title.slice(0, 70),
        metaDescription: post.excerpt.slice(0, 160),
      };
    });

    const draftBody = p('Notes for the next release. Add highlights, screenshots and upgrade steps here.');
    docs.push({
      title: 'Draft: Upcoming Platform Release Notes',
      slug: 'draft-upcoming-platform-release-notes',
      excerpt: 'A draft article that is not visible to visitors yet.',
      content: draftBody, contentText: stripHtml(draftBody), readingTime: 1,
      category: catDocs['Industry Insights']._id, author: authorDocs[0]._id, createdBy: admin._id, status: 'draft',
    });
    const schedBody = p('This article is scheduled and will go live automatically at the chosen time.');
    docs.push({
      title: 'Scheduled: Planning Your Cloud Migration',
      slug: 'scheduled-planning-your-cloud-migration',
      excerpt: 'A scheduled article that publishes itself in the future.',
      content: schedBody, contentText: stripHtml(schedBody), readingTime: 1,
      category: catDocs['Cloud Computing']._id, author: authorDocs[1]._id, createdBy: admin._id,
      status: 'scheduled', publishedAt: new Date(Date.now() + 3 * day),
    });

    await Post.insertMany(docs);
    console.log(`Created ${docs.length} sample posts`);
  } else {
    console.log('Posts already exist, skipped (use "npm run seed -- --fresh" to reset content)');
  }

  console.log('Seed complete');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
