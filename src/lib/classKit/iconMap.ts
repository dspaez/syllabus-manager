import sharp from 'sharp';
import { DefaultContext } from 'react-icons';
import type { IconType } from 'react-icons';
import {
    FiUser, FiUsers, FiBookOpen, FiCopy, FiAlertTriangle, FiCode, FiDatabase, FiServer,
    FiTerminal, FiSettings, FiLink, FiLayers, FiGitBranch, FiShield, FiZap, FiFileText,
    FiFolder, FiCpu, FiGlobe, FiLock, FiBox, FiKey, FiClock, FiCheckCircle, FiPackage,
} from 'react-icons/fi';
import { ICON_NAMES, type IconName } from './schema';

const ICON_COMPONENTS: Record<IconName, IconType> = {
    'user': FiUser,
    'users': FiUsers,
    'book-open': FiBookOpen,
    'copy': FiCopy,
    'alert-triangle': FiAlertTriangle,
    'code': FiCode,
    'database': FiDatabase,
    'server': FiServer,
    'terminal': FiTerminal,
    'settings': FiSettings,
    'link': FiLink,
    'layers': FiLayers,
    'git-branch': FiGitBranch,
    'shield': FiShield,
    'zap': FiZap,
    'file-text': FiFileText,
    'folder': FiFolder,
    'cpu': FiCpu,
    'globe': FiGlobe,
    'lock': FiLock,
    'box': FiBox,
    'key': FiKey,
    'clock': FiClock,
    'check-circle': FiCheckCircle,
    'package': FiPackage,
};

const FALLBACK_ICON: IconName = 'box';

// El schema no fuerza "icono" a la lista cerrada a nivel de validación (ver nota en
// schema.ts sobre cómo Claude recibe enums como texto, no como restricción dura) —
// así que un nombre fuera de lista cae a un ícono neutro en vez de romper el render.
export function resolveIconComponent(name: string): IconType {
    const key = ICON_NAMES.includes(name as IconName) ? (name as IconName) : FALLBACK_ICON;
    return ICON_COMPONENTS[key];
}

// ── Serializar un ícono de react-icons a SVG sin react-dom/server ──────────
// Next.js bloquea el import de "react-dom/server" en cualquier ruta de servidor con un
// error de build ("You're importing a component that imports react-dom/server"), incluso
// en un Route Handler donde es perfectamente seguro. En vez de pelear con esa regla, se
// evita la dependencia por completo: IconBase (la función real detrás de cada ícono de
// react-icons, verificada en node_modules/react-icons/lib/iconBase.js de la versión
// instalada) no usa hooks — usa el patrón render-prop de Context.Consumer — así que se
// puede "resolver" llamando las funciones en cadena directamente, sin un renderer de React.

interface AnyElement {
    type: unknown;
    props: Record<string, unknown>;
}

function isElement(x: unknown): x is AnyElement {
    return typeof x === 'object' && x !== null && 'type' in x && 'props' in x;
}

function resolveIconElement(IconComponent: IconType, props: { size: number; color: string }): AnyElement {
    // El árbol que hay que "desenrollar" hasta llegar al <svg> real varía según qué build de
    // react-icons resuelva el bundler: en Node/tsx directo (CJS) es IconBase → Context.Consumer
    // (render-prop) → <svg>; empaquetado por Turbopack (ESM) IconBase devuelve el <svg> directo,
    // sin el nivel de Consumer. En vez de asumir una profundidad fija, se sigue desenrollando
    // hasta que `type` deja de ser una función/Consumer y ya es un tag intrínseco (string).
    let node = IconComponent(props) as unknown as AnyElement;
    for (let i = 0; i < 5 && typeof node.type !== 'string'; i++) {
        if (typeof node.type === 'function') {
            node = (node.type as (p: Record<string, unknown>) => AnyElement)(node.props);
            continue;
        }
        // `type` no es función: es el objeto especial de Context.Consumer — la forma real de
        // renderizar está en el render-prop de props.children.
        const renderProp = node.props.children;
        if (typeof renderProp === 'function') {
            node = (renderProp as (conf: unknown) => AnyElement)(DefaultContext);
            continue;
        }
        break;
    }
    return node;
}

const ATTR_RENAME: Record<string, string> = {
    className: 'class',
    strokeWidth: 'stroke-width',
    strokeLinecap: 'stroke-linecap',
    strokeLinejoin: 'stroke-linejoin',
    strokeDasharray: 'stroke-dasharray',
    strokeMiterlimit: 'stroke-miterlimit',
    fillRule: 'fill-rule',
    clipRule: 'clip-rule',
};

function styleToCss(style: Record<string, unknown>): string {
    return Object.entries(style)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`)
        .join(';');
}

function serialize(node: unknown): string {
    if (node === null || node === undefined || node === false || node === true) return '';
    if (Array.isArray(node)) return node.map(serialize).join('');
    if (typeof node === 'string' || typeof node === 'number') return String(node);
    if (!isElement(node) || typeof node.type !== 'string') return '';

    const { children, style, ...rest } = node.props;
    const attrs = Object.entries(rest)
        .filter(([k, v]) => v !== undefined && v !== null && k !== 'key' && k !== 'ref')
        .map(([k, v]) => `${ATTR_RENAME[k] ?? k}="${String(v)}"`)
        .join(' ');
    const styleAttr = style && typeof style === 'object'
        ? ` style="${styleToCss(style as Record<string, unknown>)}"`
        : '';

    return `<${node.type}${attrs ? ' ' + attrs : ''}${styleAttr}>${serialize(children)}</${node.type}>`;
}

function iconToSvgString(IconComponent: IconType, colorHex: string, pxSize: number): string {
    const element = resolveIconElement(IconComponent, { size: pxSize, color: `#${colorHex}` });
    return serialize(element);
}

// Renderiza un ícono a PNG (data URL sin el prefijo "data:", tal como lo espera pptxgenjs).
export async function iconToPngDataUrl(name: string, colorHex: string, pxSize = 256): Promise<string> {
    const IconComponent = resolveIconComponent(name);
    const svg = iconToSvgString(IconComponent, colorHex, pxSize);
    const pngBuffer = await sharp(Buffer.from(svg)).resize(pxSize, pxSize).png().toBuffer();
    return 'image/png;base64,' + pngBuffer.toString('base64');
}
