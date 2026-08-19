export interface Article {
  id: string;
  title: string;
  content?: string;
  imagePath: string; // path relative to /public, e.g. /uploads/uuid.jpg
  publishedAt: string;
}
