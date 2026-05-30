export function subjectEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('java')) return '☕';
  if (n.includes('python')) return '🐍';
  if (n.includes('web') || n.includes('html')) return '💻';
  if (n.includes('dato') || n.includes('sql') || n.includes('base')) return '🗄️';
  if (n.includes('red') || n.includes('network')) return '🌐';
  if (n.includes('matem') || n.includes('calculo') || n.includes('cálculo')) return '📐';
  if (n.includes('física') || n.includes('fisica')) return '⚛️';
  if (n.includes('diseño')) return '🎨';
  if (n.includes('segur')) return '🔒';
  if (n.includes('intelig') || n.includes('machine')) return '🤖';
  if (n.includes('algoritm')) return '⚙️';
  if (n.includes('sistema')) return '🖥️';
  if (n.includes('proyecto') || n.includes('gestión') || n.includes('gestion')) return '📋';
  if (n.includes('comunic')) return '📡';
  return '📖';
}
