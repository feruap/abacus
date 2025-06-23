
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Lista de rutas públicas que no requieren autenticación
    const publicPaths = ['/auth/signin', '/api/auth', '/api/health'];
    
    // Verificar si la ruta actual es pública
    const isPublicPath = publicPaths.some(path => 
      req.nextUrl.pathname.startsWith(path)
    );
    
    // Si es una ruta pública, permitir acceso
    if (isPublicPath) {
      return NextResponse.next();
    }

    // Si no hay token JWT, redirigir a login
    if (!req.nextauth.token) {
      const url = new URL('/auth/signin', req.url);
      url.searchParams.set('callbackUrl', req.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Si está autenticado, permitir acceso
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Permitir acceso a rutas públicas sin token
        const publicPaths = ['/auth/signin', '/api/auth', '/api/health'];
        const isPublicPath = publicPaths.some(path => 
          req.nextUrl.pathname.startsWith(path)
        );
        
        if (isPublicPath) return true;
        
        // Para todas las demás rutas, requerir token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
