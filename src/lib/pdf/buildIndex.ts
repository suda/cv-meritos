import type { Author, DateRange, FieldDef, ItemTypeDef, MeritItem, Profile } from '../types';

export interface IndexEntry {
  item: MeritItem;
  typeDef: ItemTypeDef;
  /** Página de inicio (1-based) de la documentación del item en el combinado. */
  start: number | null;
}

// pdfmake usa una estructura de "content"; la tipamos laxamente.
type PdfContent = any;

function isDateRange(v: unknown): v is DateRange {
  return typeof v === 'object' && v !== null && 'inicio' in (v as Record<string, unknown>);
}

function isAuthorArray(v: unknown): v is Author[] {
  return Array.isArray(v) && v.every((a) => typeof a === 'object' && a !== null && 'nombre' in a);
}

function formatDateRange(r: DateRange): string {
  const inicio = (r.inicio ?? '').trim();
  const fin = (r.fin ?? '').trim();
  if (inicio && fin) return `${inicio} – ${fin}`;
  return inicio || fin || '';
}

/** Renderiza el valor de un campo como texto plano (para campos no-autor). */
export function formatFieldValue(field: FieldDef, value: unknown): string {
  if (value === null || value === undefined) return '';
  switch (field.type) {
    case 'daterange':
      return isDateRange(value) ? formatDateRange(value) : '';
    case 'year':
      return value === '' ? '' : String(value);
    case 'authorList':
      return isAuthorArray(value) ? value.map((a) => a.nombre).join('; ') : '';
    default:
      return String(value);
  }
}

/**
 * Construye los "runs" de texto de una lista de autores, subrayando a los
 * marcados como solicitante (`esSolicitante`).
 */
export function authorRuns(authors: Author[]): PdfContent[] {
  const runs: PdfContent[] = [];
  authors.forEach((a, i) => {
    runs.push({
      text: a.nombre,
      ...(a.esSolicitante ? { decoration: 'underline', bold: true } : {}),
    });
    if (i < authors.length - 1) runs.push({ text: '; ' });
  });
  return runs;
}

/** Genera la línea de contenido (texto enriquecido) de un item. */
function itemLine(entry: IndexEntry): PdfContent {
  const { item, typeDef } = entry;
  const parts: PdfContent[] = [];

  for (const field of typeDef.fields) {
    const value = item.values[field.key];
    if (field.type === 'authorList' && isAuthorArray(value) && value.length > 0) {
      parts.push(...authorRuns(value));
      parts.push({ text: '. ' });
    } else {
      const text = formatFieldValue(field, value);
      if (text) {
        parts.push({ text: `${field.label}: `, italics: true });
        parts.push({ text: `${text}. ` });
      }
    }
  }

  if (parts.length === 0) {
    parts.push({ text: '(Sin datos)', color: '#888' });
  }

  return parts;
}

function pageLabel(start: number | null): string {
  return start === null ? '—' : `Pág. ${start}`;
}

/** Cabecera con los datos del solicitante. */
function headerBlock(profile: Profile): PdfContent[] {
  const rows: [string, string | undefined][] = [
    ['Nombre y apellidos', profile.nombreApellidos],
    ['DNI', profile.dni],
    ['Correo', profile.correo],
    ['Teléfono', profile.telefono],
    ['Número de plaza', profile.numeroPlaza],
    ['Convocatoria', profile.convocatoria],
    ['Área de conocimiento', profile.areaConocimiento],
    ['Departamento', profile.departamento],
    ['Centro', profile.centro],
  ];
  const body = rows
    .filter(([, v]) => v && v.trim())
    .map(([k, v]) => [{ text: `${k}:`, bold: true }, { text: v ?? '' }]);

  return [
    { text: 'Currículum Académico — Anexo III', style: 'title' },
    { text: 'Profesorado Ayudante Doctor — Universitat de València', style: 'subtitle' },
    {
      table: { widths: ['auto', '*'], body },
      layout: 'noBorders',
      margin: [0, 6, 0, 12],
    },
  ];
}

/**
 * Construye la definición de documento pdfmake del índice/CV.
 * Función pura y testeable (expone el árbol para aserciones, p.ej. subrayado).
 *
 * Las entradas deben venir YA en orden canónico (sección→subapartado→fecha).
 */
export function buildIndexDocDefinition(
  profile: Profile,
  entries: IndexEntry[],
  opts: { omitirLetrasVacias?: boolean } = {},
): any {
  const content: PdfContent[] = [...headerBlock(profile)];

  // Agrupar por sección, luego por subapartado (group), luego por tipo.
  const sections = new Map<string, IndexEntry[]>();
  for (const e of entries) {
    const key = e.typeDef.section;
    if (!sections.has(key)) sections.set(key, []);
    sections.get(key)!.push(e);
  }

  for (const [, secEntries] of sections) {
    const first = secEntries[0].typeDef;
    content.push({
      text: `${first.section}. ${first.sectionTitle}`,
      style: 'section',
      margin: [0, 10, 0, 4],
    });

    const groups = new Map<string, IndexEntry[]>();
    for (const e of secEntries) {
      const gk = e.typeDef.group ?? '__none__';
      if (!groups.has(gk)) groups.set(gk, []);
      groups.get(gk)!.push(e);
    }

    for (const [gk, grpEntries] of groups) {
      if (gk !== '__none__') {
        content.push({ text: gk, style: 'group', margin: [0, 6, 0, 2] });
      }

      // Tabla: descripción del mérito | Pág.
      const body: PdfContent[] = [];
      for (const e of grpEntries) {
        body.push([
          {
            stack: [
              { text: `[${e.typeDef.code}] ${e.typeDef.label}`, bold: true, fontSize: 9 },
              { text: itemLine(e), fontSize: 9, margin: [0, 1, 0, 0] },
            ],
          },
          { text: pageLabel(e.start), alignment: 'right', fontSize: 9, noWrap: true },
        ]);
      }
      content.push({
        table: { widths: ['*', 'auto'], body },
        layout: 'lightHorizontalLines',
        margin: [0, 0, 0, 6],
      });
    }
  }

  if (opts.omitirLetrasVacias) {
    // No-op explícito: sólo incluimos tipos con items, por construcción.
  }

  return {
    content,
    defaultStyle: { fontSize: 10, font: 'Roboto' },
    styles: {
      title: { fontSize: 16, bold: true, alignment: 'center' },
      subtitle: { fontSize: 11, alignment: 'center', color: '#555', margin: [0, 2, 0, 0] },
      section: { fontSize: 13, bold: true, color: '#1a3a5c' },
      group: { fontSize: 11, bold: true, color: '#2c5a8c' },
    },
    pageMargins: [40, 40, 40, 40],
    footer: (currentPage: number, pageCount: number) => ({
      text: `${currentPage} / ${pageCount}`,
      alignment: 'center',
      fontSize: 8,
      margin: [0, 8, 0, 0],
    }),
  };
}

let pdfMakeInstance: any = null;

/* v8 ignore start -- orquestación de pdfmake; depende de la forma del bundle */
async function getPdfMake(): Promise<any> {
  if (pdfMakeInstance) return pdfMakeInstance;
  const pdfMakeMod: any = await import('pdfmake/build/pdfmake');
  const vfsMod: any = await import('pdfmake/build/vfs_fonts');
  const pdfMake = pdfMakeMod.default ?? pdfMakeMod;
  const vfs =
    vfsMod.pdfMake?.vfs ?? vfsMod.default?.pdfMake?.vfs ?? vfsMod.vfs ?? vfsMod.default?.vfs;
  if (vfs) pdfMake.vfs = vfs;
  pdfMakeInstance = pdfMake;
  return pdfMake;
}
/* v8 ignore stop */

/** Renderiza una definición de documento pdfmake a Uint8Array. */
export async function renderDocDefinition(docDef: any): Promise<Uint8Array> {
  const pdfMake = await getPdfMake();
  return new Promise<Uint8Array>((resolve, reject) => {
    try {
      pdfMake.createPdf(docDef).getBuffer((buf: Uint8Array) => resolve(new Uint8Array(buf)));
    } catch (err) {
      reject(err);
    }
  });
}

/** Construye y renderiza el índice a Uint8Array. */
export async function buildIndex(
  profile: Profile,
  entries: IndexEntry[],
  opts: { omitirLetrasVacias?: boolean } = {},
): Promise<Uint8Array> {
  const docDef = buildIndexDocDefinition(profile, entries, opts);
  return renderDocDefinition(docDef);
}
