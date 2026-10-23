/**
 * Manifeste des sources : validation par le JSON Schema publié (data/sources/manifest.schema.json)
 * et par le schéma zod du chargeur, intégrité des fichiers versionnés.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { manifestSchema, sourceObjectSchema } from './sources';

const SOURCES_DIR = path.resolve(__dirname, '../../../../data/sources');
const manifest = JSON.parse(readFileSync(path.join(SOURCES_DIR, 'manifest.json'), 'utf8')) as {
  sources: Array<Record<string, unknown>>;
};
const jsonSchema = JSON.parse(
  readFileSync(path.join(SOURCES_DIR, 'manifest.schema.json'), 'utf8'),
) as JsonSchema;

interface JsonSchema {
  $ref?: string;
  $defs?: Record<string, JsonSchema>;
  type?: string | string[];
  enum?: unknown[];
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  minItems?: number;
  required?: string[];
  properties?: Record<string, JsonSchema>;
  additionalProperties?: boolean | JsonSchema;
  items?: JsonSchema;
}

function typeOf(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (Number.isInteger(value)) return 'integer';
  return typeof value;
}

/** Validateur minimal du sous-ensemble de JSON Schema employé par le manifeste. */
function validate(value: unknown, schema: JsonSchema, root: JsonSchema, at = '$'): string[] {
  if (schema.$ref) {
    const name = schema.$ref.replace('#/$defs/', '');
    const target = root.$defs?.[name];
    return target ? validate(value, target, root, at) : [`${at}: $ref inconnue ${schema.$ref}`];
  }
  const errors: string[] = [];
  const actual = typeOf(value);
  if (schema.type) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type];
    const ok = allowed.some(
      (type) => type === actual || (type === 'number' && actual === 'integer'),
    );
    if (!ok) return [`${at}: type ${actual}, attendu ${allowed.join('|')}`];
  }
  if (schema.enum && !schema.enum.includes(value)) errors.push(`${at}: valeur hors énumération`);
  if (typeof value === 'string') {
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) errors.push(`${at}: motif`);
    if (schema.minLength !== undefined && value.length < schema.minLength)
      errors.push(`${at}: trop court`);
    if (schema.maxLength !== undefined && value.length > schema.maxLength)
      errors.push(`${at}: trop long`);
  }
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < schema.minimum) errors.push(`${at}: < minimum`);
    if (schema.maximum !== undefined && value > schema.maximum) errors.push(`${at}: > maximum`);
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems)
      errors.push(`${at}: trop peu d'éléments`);
    if (schema.items)
      value.forEach((item, i) =>
        errors.push(...validate(item, schema.items as JsonSchema, root, `${at}[${i}]`)),
      );
  }
  if (actual === 'object') {
    const record = value as Record<string, unknown>;
    for (const key of schema.required ?? []) {
      if (!(key in record)) errors.push(`${at}: propriété requise « ${key} » absente`);
    }
    for (const [key, child] of Object.entries(record)) {
      const propertySchema = schema.properties?.[key];
      if (propertySchema) errors.push(...validate(child, propertySchema, root, `${at}.${key}`));
      else if (schema.additionalProperties === false)
        errors.push(`${at}: propriété inattendue « ${key} »`);
      else if (typeof schema.additionalProperties === 'object') {
        errors.push(...validate(child, schema.additionalProperties, root, `${at}.${key}`));
      }
    }
  }
  return errors;
}

describe('manifeste des sources (data/sources/manifest.json)', () => {
  it('est conforme au JSON Schema publié', () => {
    expect(validate(manifest, jsonSchema, jsonSchema)).toEqual([]);
  });

  it('est conforme au schéma zod du chargeur', () => {
    expect(() => manifestSchema.parse(manifest)).not.toThrow();
  });

  it('le JSON Schema et le schéma zod décrivent les mêmes champs', () => {
    const sourceSchema = jsonSchema.$defs?.source as JsonSchema;
    const zodShape = sourceObjectSchema.shape;
    expect(Object.keys(sourceSchema.properties ?? {}).sort()).toEqual(Object.keys(zodShape).sort());
  });

  it('détecte un manifeste invalide (JSON Schema et zod)', () => {
    const broken = { sources: [{ ...manifest.sources[0], binding: 'maybe', extra: true }] };
    expect(validate(broken, jsonSchema, jsonSchema).length).toBeGreaterThanOrEqual(2);
    expect(() => manifestSchema.parse(broken)).toThrow();
  });

  it('a des identifiants (id, docId) uniques', () => {
    const ids = manifest.sources.map((source) => source.id);
    const docIds = manifest.sources.map((source) => source.docId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(docIds).size).toBe(docIds.length);
  });

  it('versionne chaque fichier local déclaré, PDF identiques à l’original (SHA-256)', () => {
    for (const source of manifest.sources) {
      const file = source.file as string | undefined;
      if (!file) continue;
      const fullPath = path.join(SOURCES_DIR, file);
      expect(existsSync(fullPath)).toBe(true);
      if (file.endsWith('.pdf')) {
        const digest = createHash('sha256').update(readFileSync(fullPath)).digest('hex');
        expect({ id: source.id, digest }).toEqual({ id: source.id, digest: source.sha256 });
      }
    }
  });

  it('ne versionne aucun document non redistribuable', () => {
    for (const source of manifest.sources) {
      if (source.redistribution !== 'redistributable') expect(source.file).toBeUndefined();
    }
  });
});
