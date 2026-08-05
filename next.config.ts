import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // jspdf (usado en src/lib/classKit/, importado por /api/render-class-kit) es una
  // librería enorme (~29MB con fuentes embebidas); empaquetarla para la ruta de
  // servidor agotaba el heap de Node en la compilación de dev, así que va externa.
  // Es seguro externalizarla: su `exports` expone la condición "node" con un build
  // CJS válido que cualquier Node carga bien.
  // sharp: paquete con bindings nativos (siempre debe ir externo en Next.js).
  // pptxgenjs NO debe ir en esta lista: su `exports.import` apunta a un .js con
  // sintaxis ESM en un paquete sin `"type": "module"` (empaquetado roto). El build
  // de producción de Turbopack carga los externals con import() real de Node, y un
  // Node sin detección automática de sintaxis (ej. el runtime de Vercel) revienta
  // con "Cannot use import statement outside a module". Empaquetado por Turbopack
  // (que parsea el ESM sin problema) funciona igual en dev y producción.
  serverExternalPackages: ['jspdf', 'sharp'],
};

export default nextConfig;