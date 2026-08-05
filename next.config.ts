import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  // pptxgenjs y jspdf (usados en src/lib/classKit/, importados por
  // /api/render-class-kit) son librerías grandes con dependencias transitivas
  // pesadas (jszip, fuentes embebidas). Sin esto, el compilador intenta
  // empaquetarlas enteras para la ruta de servidor y agota el heap de Node en
  // dev. Al marcarlas externas se resuelven con require() normal de Node en
  // tiempo de ejecución.
  // sharp: paquete con bindings nativos (siempre debe ir externo en Next.js).
  serverExternalPackages: ['pptxgenjs', 'jspdf', 'sharp'],
};

export default nextConfig;