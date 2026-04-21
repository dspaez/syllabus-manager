export { middleware as proxy } from '@/utils/supabase/middleware';

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
