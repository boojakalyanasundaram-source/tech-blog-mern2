import cron from 'node-cron';
import Post from '../models/Post.js';

export async function publishDuePosts() {
  const result = await Post.updateMany(
    { status: 'scheduled', publishedAt: { $lte: new Date() } },
    { $set: { status: 'published' } }
  );
  if (result.modifiedCount) console.log(`Scheduler: published ${result.modifiedCount} post(s)`);
}

export function startScheduler() {
  publishDuePosts().catch((e) => console.error('Scheduler error', e));
  cron.schedule('* * * * *', () => {
    publishDuePosts().catch((e) => console.error('Scheduler error', e));
  });
}
