import path from 'path';
import { fileURLToPath } from 'url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const uploadsDir = path.resolve(here, '../../uploads');
export const clientDist = path.resolve(here, '../../../client/dist');
