import test from 'node:test';
import assert from 'node:assert/strict';
import { translations } from '../src/i18n/translations.js';

test('El diccionario de idiomas contiene español (es) e inglés (en)', () => {
  assert.ok(translations.es, 'Debe contener diccionario en español');
  assert.ok(translations.en, 'Debe contener diccionario en inglés');
});

test('Simetría de secciones y claves entre español e inglés', () => {
  const esSections = Object.keys(translations.es);
  const enSections = Object.keys(translations.en);

  assert.deepEqual(esSections.sort(), enSections.sort(), 'Las secciones de primer nivel deben coincidir');

  for (const section of esSections) {
    const esKeys = Object.keys(translations.es[section]);
    const enKeys = Object.keys(translations.en[section]);

    for (const key of esKeys) {
      assert.ok(
        key in translations.en[section],
        `La clave "${section}.${key}" presente en español debe existir en inglés`
      );
      assert.equal(
        typeof translations.en[section][key],
        'string',
        `La traducción de "${section}.${key}" en inglés debe ser una cadena no vacía`
      );
    }
  }
});

test('Las traducciones críticas no deben estar vacías', () => {
  assert.ok(translations.es.home.goOnline.length > 0);
  assert.ok(translations.en.home.goOnline.length > 0);
  assert.ok(translations.es.trip.acceptTrip.length > 0);
  assert.ok(translations.en.trip.acceptTrip.length > 0);
  assert.ok(translations.es.earnings.totalBalance.length > 0);
  assert.ok(translations.en.earnings.totalBalance.length > 0);
});
