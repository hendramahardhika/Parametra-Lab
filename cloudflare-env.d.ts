declare namespace Cloudflare {
  interface Env {
    TEACHER_EMAILS?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
