export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'year' // un año (entero), p.ej. 2021
  | 'date' // fecha ISO YYYY-MM-DD
  | 'daterange' // { inicio: string; fin?: string }
  | 'select' // opciones cerradas
  | 'authorList'; // lista de autores con marca de "soy yo"

export interface FieldDef {
  key: string;
  label: string; // español, exactamente como el Anexo III
  type: FieldType;
  options?: string[]; // para 'select'
  required?: boolean;
  suggest?: boolean; // si true, alimenta y consume autocompletado
  isPrimaryDate?: boolean; // de qué campo se deriva la fecha de orden
}

export type Section = '1' | '2' | '3' | '4' | '5' | '6' | '7';

export interface ItemTypeDef {
  code: string; // p.ej. "3.2.a"  (único)
  section: Section;
  sectionTitle: string;
  archive: string; // "Archivo N. …" del Anexo III
  group?: string; // subapartado, p.ej. "3.2 Actividad investigadora…"
  label: string; // descripción del mérito
  fields: FieldDef[];
}

export interface Author {
  nombre: string;
  esSolicitante: boolean;
}

export interface DateRange {
  inicio: string;
  fin?: string;
}

export type PageMode = 'todas' | 'primera_ultima' | 'auto';

export interface MeritItem {
  id: string; // uuid
  typeCode: string; // -> ItemTypeDef.code
  values: Record<string, unknown>;
  fechaOrden: string; // ISO YYYY-MM-DD derivada (o manual) para ordenar
  fechaOrdenManual?: string; // fecha manual opcional cuando no hay campo de fecha
  fileId?: string; // -> store de ficheros
  fileName?: string;
  pageCount?: number; // nº páginas del PDF adjunto
  pageMode?: PageMode; // override; 'auto' = usa global
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  nombreApellidos: string; // "Nombre y apellidos" del solicitante
  variantesAutor: string[]; // formas alternativas para detectar autoría
  dni?: string;
  correo?: string;
  telefono?: string;
  numeroPlaza?: string;
  convocatoria?: string; // por defecto: "Temporales núm. 1 — Curso 2026-2027"
  areaConocimiento?: string;
  departamento?: string;
  centro?: string;
}

export type GlobalPageMode = 'todas' | 'primera_ultima';

export interface BackupData {
  schemaVersion: number;
  profile: Profile;
  items: MeritItem[];
}
