import type { FieldDef, ItemTypeDef, Section } from './types';

// --- Helpers de construcción de campos -------------------------------------

const LABELS: Record<string, string> = {
  notaMedia: 'Nota media',
  titulo: 'Título',
  universidad: 'Universidad',
  detalle: 'Detalle',
  anio: 'Año',
  categoriaDedicacion: 'Categoría y dedicación',
  creditos: 'Créditos',
  asignatura: 'Asignatura',
  departamentoUniversidad: 'Departamento y universidad',
  descripcion: 'Descripción',
  dedicacion: 'Dedicación',
  empresaInstitucion: 'Empresa o institución',
  curso: 'Curso',
  centro: 'Centro',
  proyecto: 'Proyecto',
  cursoHoras: 'Curso y horas',
  universidadOrganismo: 'Universidad u organismo',
  ambito: 'Ámbito',
  programa: 'Programa',
  organismo: 'Organismo',
  fechas: 'Fechas',
  tituloProyecto: 'Título del proyecto',
  entidad: 'Entidad financiadora',
  investigadorPrincipal: 'Investigador/a principal',
  clave: 'Clave',
  autores: 'Autores',
  editorialReferencia: 'Editorial / referencia',
  paginasAnio: 'Páginas y año',
  indicios: 'Indicios de calidad',
  premio: 'Premio',
  centroDestino: 'Centro de destino',
  nivel: 'Nivel',
  idioma: 'Idioma',
  acreditacion: 'Acreditación',
  fecha: 'Fecha',
  situacion: 'Situación',
};

function label(key: string): string {
  return LABELS[key] ?? key;
}

function text(key: string, opts: { suggest?: boolean; required?: boolean } = {}): FieldDef {
  return { key, label: label(key), type: 'text', ...opts };
}
function textarea(key: string, opts: { required?: boolean } = {}): FieldDef {
  return { key, label: label(key), type: 'textarea', ...opts };
}
function year(key: string, opts: { primary?: boolean; required?: boolean } = {}): FieldDef {
  return {
    key,
    label: label(key),
    type: 'year',
    isPrimaryDate: opts.primary,
    required: opts.required,
  };
}
function date(key: string, opts: { primary?: boolean; required?: boolean } = {}): FieldDef {
  return {
    key,
    label: label(key),
    type: 'date',
    isPrimaryDate: opts.primary,
    required: opts.required,
  };
}
function daterange(key: string, opts: { primary?: boolean; required?: boolean } = {}): FieldDef {
  return {
    key,
    label: label(key),
    type: 'daterange',
    isPrimaryDate: opts.primary,
    required: opts.required,
  };
}
function select(key: string, options: string[], opts: { required?: boolean } = {}): FieldDef {
  return { key, label: label(key), type: 'select', options, ...opts };
}
function authorList(key: string, opts: { required?: boolean } = {}): FieldDef {
  return { key, label: label(key), type: 'authorList', ...opts };
}

// --- Metadatos de sección ---------------------------------------------------

const SECTION_TITLES: Record<Section, string> = {
  '1': 'Formación académica',
  '2': 'Méritos docentes',
  '3': 'Investigación, transferencia e intercambio de conocimiento',
  '4': 'Conocimiento de la lengua propia de la Universitat de València',
  '5': 'Otros méritos',
  '6': 'Mérito preferente',
  '7': 'Medidas de acción positiva para la igualdad de oportunidades',
};

const ARCHIVES: Record<Section, string> = {
  '1': '1. Formación académica',
  '2': '2. Méritos docentes',
  '3': '3. Investigación, transferencia e intercambio de conocimiento',
  '4': '4. Conocimiento de la lengua propia de la UV',
  '5': '5. Otros méritos',
  '6': '6. Mérito preferente',
  '7': '7. Medidas de acción positiva para la igualdad de oportunidades',
};

function def(
  code: string,
  section: Section,
  group: string | undefined,
  itemLabel: string,
  fields: FieldDef[],
): ItemTypeDef {
  return {
    code,
    section,
    sectionTitle: SECTION_TITLES[section],
    archive: ARCHIVES[section],
    group,
    label: itemLabel,
    fields,
  };
}

// Campos compartidos por 2.1.a y 2.1.b
const docenciaTitulosFields = (): FieldDef[] => [
  daterange('fechas', { primary: true }),
  text('categoriaDedicacion'),
  text('creditos'),
  text('asignatura', { suggest: true }),
  text('departamentoUniversidad', { suggest: true }),
];

// --- Catálogo completo ------------------------------------------------------

export const ITEM_TYPES: ItemTypeDef[] = [
  // Sección 1 — Formación académica
  def(
    '1.1.a',
    '1',
    '1.1 Expediente',
    'Expediente académico de los títulos utilizados para acceder al doctorado (grado+máster, diplomatura+máster, licenciatura, grado 300 ECTS)',
    [text('notaMedia'), text('titulo', { suggest: true }), text('universidad', { suggest: true })],
  ),
  def('1.1.b', '1', '1.1 Expediente', 'Premio extraordinario de grado o licenciatura', [
    text('detalle'),
    year('anio', { primary: true }),
  ]),
  def('1.1.c', '1', '1.1 Expediente', 'Premio nacional de grado, licenciatura o diplomatura', [
    text('detalle'),
    year('anio', { primary: true }),
  ]),
  def('1.1.d', '1', '1.1 Expediente', 'Premio extraordinario de máster', [
    text('detalle'),
    year('anio', { primary: true }),
  ]),
  def('1.1.e', '1', '1.1 Expediente', 'Premio extraordinario de doctorado', [
    text('detalle'),
    year('anio', { primary: true }),
  ]),
  def(
    '1.1.f',
    '1',
    '1.1 Expediente',
    'Mención Europea/Internacional/Industrial al título de Doctor',
    [text('detalle'), year('anio', { primary: true })],
  ),
  def('1.2.a', '1', '1.2 Otros títulos universitarios', 'Otros títulos de Doctor', [
    text('titulo'),
    text('universidad', { suggest: true }),
    year('anio', { primary: true }),
  ]),
  def(
    '1.2.b',
    '1',
    '1.2 Otros títulos universitarios',
    'Otra mención Europea/Internacional/Industrial al título de Doctor',
    [text('detalle'), year('anio', { primary: true })],
  ),
  def(
    '1.2.c',
    '1',
    '1.2 Otros títulos universitarios',
    'Otros títulos oficiales (máster, licenciatura, grado, diplomatura o segundo ciclo)',
    [text('titulo'), text('universidad', { suggest: true }), year('anio', { primary: true })],
  ),
  def('1.2.d', '1', '1.2 Otros títulos universitarios', 'Títulos postgrados propios', [
    text('titulo'),
    text('universidad', { suggest: true }),
    year('anio', { primary: true }),
  ]),

  // Sección 2 — Méritos docentes
  def(
    '2.1.a',
    '2',
    '2.1 Docencia universitaria',
    'Docencia en títulos oficiales',
    docenciaTitulosFields(),
  ),
  def(
    '2.1.b',
    '2',
    '2.1 Docencia universitaria',
    'Docencia en títulos propios',
    docenciaTitulosFields(),
  ),
  def(
    '2.1.c',
    '2',
    '2.1 Docencia universitaria',
    'Otra docencia universitaria impartida (formación docente, extensión, transversal de doctorado, programas para extranjeros…)',
    [textarea('descripcion'), year('anio', { primary: true })],
  ),
  def(
    '2.1.d',
    '2',
    '2.1 Docencia universitaria',
    'Docencia como profesorado tutor en universidades a distancia',
    [
      daterange('fechas', { primary: true }),
      text('dedicacion'),
      text('asignatura', { suggest: true }),
      text('departamentoUniversidad', { suggest: true }),
    ],
  ),
  def(
    '2.1.e',
    '2',
    '2.1 Docencia universitaria',
    'Tutor/a de empresa o institución de prácticas externas curriculares',
    [daterange('fechas', { primary: true }), text('empresaInstitucion', { suggest: true })],
  ),
  def(
    '2.2.a',
    '2',
    '2.2 Formación docente y docencia no universitaria',
    'Docencia en centros de enseñanzas oficiales no universitarias',
    [text('curso'), text('centro', { suggest: true }), year('anio', { primary: true })],
  ),
  def(
    '2.2.b',
    '2',
    '2.2 Formación docente y docencia no universitaria',
    'Participación en proyectos de innovación educativa para la mejora docente',
    [text('proyecto'), year('anio', { primary: true })],
  ),
  def(
    '2.2.c',
    '2',
    '2.2 Formación docente y docencia no universitaria',
    'Cursos recibidos de formación para la docencia universitaria',
    [
      text('cursoHoras'),
      text('universidadOrganismo', { suggest: true }),
      year('anio', { primary: true }),
    ],
  ),
  def(
    '2.2.d',
    '2',
    '2.2 Formación docente y docencia no universitaria',
    'Cursos recibidos de formación en igualdad, diversidad y/o sostenibilidad',
    [
      text('cursoHoras'),
      text('universidadOrganismo', { suggest: true }),
      year('anio', { primary: true }),
    ],
  ),
  def(
    '2.2.e',
    '2',
    '2.2 Formación docente y docencia no universitaria',
    'Cursos recibidos de formación en competencias digitales',
    [
      text('cursoHoras'),
      text('universidadOrganismo', { suggest: true }),
      year('anio', { primary: true }),
    ],
  ),
  def('2.3.a', '2', '2.3 Otros méritos docentes', 'Miembro de tribunales de TFG o TFM', [
    text('detalle'),
    year('anio', { primary: true }),
  ]),
  def(
    '2.3.b',
    '2',
    '2.3 Otros méritos docentes',
    'Aportaciones a congresos de innovación docente',
    [
      select('ambito', ['Nacional', 'Internacional']),
      text('detalle'),
      year('anio', { primary: true }),
    ],
  ),
  def(
    '2.3.c',
    '2',
    '2.3 Otros méritos docentes',
    'Organización o asistencia a congresos de innovación docente',
    [text('detalle'), year('anio', { primary: true })],
  ),
  def('2.3.d', '2', '2.3 Otros méritos docentes', 'Premios docentes', [
    text('detalle'),
    year('anio', { primary: true }),
  ]),
  def(
    '2.3.e',
    '2',
    '2.3 Otros méritos docentes',
    'Elaboración de material docente con ISBN o en repositorios oficiales',
    [text('detalle'), year('anio', { primary: true })],
  ),

  // Sección 3 — Investigación, transferencia e intercambio de conocimiento
  def(
    '3.1.a',
    '3',
    '3.1 Programas de formación y contratos',
    'Programa de formación pre-doctoral (convocatoria pública competitiva)',
    [
      text('programa'),
      text('organismo', { suggest: true }),
      daterange('fechas', { primary: true }),
    ],
  ),
  def(
    '3.1.b',
    '3',
    '3.1 Programas de formación y contratos',
    'Programa de formación post-doctoral (convocatoria pública competitiva)',
    [
      text('programa'),
      text('organismo', { suggest: true }),
      daterange('fechas', { primary: true }),
    ],
  ),
  def(
    '3.1.c',
    '3',
    '3.1 Programas de formación y contratos',
    'Contratos laborales de investigación y transferencia con universidades/centros públicos',
    [
      text('tituloProyecto'),
      text('entidad', { suggest: true }),
      daterange('fechas', { primary: true }),
      text('investigadorPrincipal', { suggest: true }),
    ],
  ),
  def(
    '3.2.a',
    '3',
    '3.2 Actividad investigadora y transferencia',
    'Artículos en revistas especializadas',
    [
      select('clave', [
        'R - revista indexada',
        'I - revista internacional no indexada',
        'N - revista nacional no indexada',
        'A - otros',
      ]),
      text('titulo', { required: true }),
      authorList('autores'),
      text('editorialReferencia', { suggest: true }),
      text('paginasAnio'),
      year('anio', { primary: true }),
      textarea('indicios'),
    ],
  ),
  def(
    '3.2.b',
    '3',
    '3.2 Actividad investigadora y transferencia',
    'Libros/capítulos de libro con ISBN y/o DOI (incl. traducciones y ediciones críticas)',
    [
      select('clave', [
        'L - libro de investigación con ISBN',
        'C - capítulo de libro con ISBN',
        'A - otros',
      ]),
      text('titulo', { required: true }),
      authorList('autores'),
      text('editorialReferencia', { suggest: true }),
      text('paginasAnio'),
      year('anio', { primary: true }),
      textarea('indicios'),
    ],
  ),
  def(
    '3.2.c',
    '3',
    '3.2 Actividad investigadora y transferencia',
    'IP o miembro en Proyectos I+D (convocatorias públicas competitivas)',
    [
      text('tituloProyecto'),
      text('entidad', { suggest: true }),
      daterange('fechas', { primary: true }),
      text('investigadorPrincipal', { suggest: true }),
    ],
  ),
  def(
    '3.2.d',
    '3',
    '3.2 Actividad investigadora y transferencia',
    'IP o miembro en Proyectos del art. 60 LOSU (art. 83 LOU) u otros I+D',
    [
      text('tituloProyecto'),
      daterange('fechas', { primary: true }),
      text('investigadorPrincipal', { suggest: true }),
    ],
  ),
  def('3.2.e', '3', '3.2 Actividad investigadora y transferencia', 'Aportaciones a congresos', [
    select('ambito', ['Nacional', 'Internacional']),
    text('detalle'),
    year('anio', { primary: true }),
  ]),
  def(
    '3.2.f',
    '3',
    '3.2 Actividad investigadora y transferencia',
    'Licencias de propiedad industrial o intelectual en explotación',
    [text('detalle'), year('anio', { primary: true })],
  ),
  def(
    '3.2.g',
    '3',
    '3.2 Actividad investigadora y transferencia',
    'Premios de investigación y transferencia',
    [text('premio'), year('anio', { primary: true }), text('organismo', { suggest: true })],
  ),
  def(
    '3.2.h',
    '3',
    '3.2 Actividad investigadora y transferencia',
    'Estancias oficiales en otras universidades/centros (mín. 1 mes; máx. computable 24 meses)',
    [daterange('fechas', { primary: true }), text('centroDestino', { suggest: true })],
  ),
  def(
    '3.3.a',
    '3',
    '3.3 Otros méritos de investigación',
    'Becas de colaboración y otras becas de investigación y transferencia',
    [text('detalle'), year('anio', { primary: true })],
  ),
  def(
    '3.3.b',
    '3',
    '3.3 Otros méritos de investigación',
    'Organización o asistencia a congresos científicos',
    [text('detalle'), year('anio', { primary: true })],
  ),
  def(
    '3.3.c',
    '3',
    '3.3 Otros méritos de investigación',
    'Cursos impartidos o recibidos de actualización relacionados con la investigación',
    [text('detalle'), year('anio', { primary: true })],
  ),

  // Sección 4 — Conocimiento de la lengua propia de la UV
  def('4.a', '4', undefined, 'Conocimiento de la lengua propia de la Universitat de València', [
    text('nivel'),
    text('organismo', { suggest: true }),
    year('anio', { primary: true }),
  ]),

  // Sección 5 — Otros méritos
  def(
    '5.1.a',
    '5',
    '5.1 Conocimiento de lenguas extranjeras',
    'Conocimiento de lenguas extranjeras (solo el nivel más alto por idioma)',
    [text('idioma'), text('nivel'), text('organismo', { suggest: true })],
  ),
  def(
    '5.2.a',
    '5',
    '5.2 Gestión y otros méritos',
    'Participación en comisiones de universidad y tareas de gestión',
    [text('detalle'), daterange('fechas', { primary: true })],
  ),
  def(
    '5.2.b',
    '5',
    '5.2 Gestión y otros méritos',
    'Participación en órganos de representación universitaria',
    [text('detalle'), daterange('fechas', { primary: true })],
  ),
  def(
    '5.2.c',
    '5',
    '5.2 Gestión y otros méritos',
    'Otros méritos no valorados en ningún otro apartado',
    [textarea('detalle'), year('anio', { primary: true })],
  ),

  // Sección 6 — Mérito preferente
  def('6.a', '6', undefined, 'Acreditación a ayudante doctor o figura superior', [
    text('acreditacion'),
    date('fecha', { primary: true }),
  ]),

  // Sección 7 — Medidas de acción positiva para la igualdad de oportunidades
  def(
    '7.a',
    '7',
    undefined,
    'Situación (permisos/licencias/excedencias/baja >16 semanas/discapacidad…)',
    [textarea('situacion'), daterange('fechas', { primary: true })],
  ),
];

// --- Acceso indexado --------------------------------------------------------

const BY_CODE = new Map<string, ItemTypeDef>(ITEM_TYPES.map((t) => [t.code, t]));

export function getItemType(code: string): ItemTypeDef | undefined {
  return BY_CODE.get(code);
}

/** Índice (posición) del tipo en el orden canónico; -1 si no existe. */
export function canonicalIndex(code: string): number {
  return ITEM_TYPES.findIndex((t) => t.code === code);
}

export interface SectionGroup {
  section: Section;
  sectionTitle: string;
  groups: { group: string | undefined; types: ItemTypeDef[] }[];
}

/** Tipos agrupados por sección y subapartado, en orden canónico. */
export function groupedItemTypes(): SectionGroup[] {
  const out: SectionGroup[] = [];
  for (const t of ITEM_TYPES) {
    let sec = out.find((s) => s.section === t.section);
    if (!sec) {
      sec = { section: t.section, sectionTitle: t.sectionTitle, groups: [] };
      out.push(sec);
    }
    let grp = sec.groups.find((g) => g.group === t.group);
    if (!grp) {
      grp = { group: t.group, types: [] };
      sec.groups.push(grp);
    }
    grp.types.push(t);
  }
  return out;
}

export const SCHEMA_VERSION = 1;
