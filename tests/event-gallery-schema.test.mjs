import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const sql = readFileSync(new URL('../supabase/migrations/20261127090000_fju_event_gallery.sql', import.meta.url), 'utf8');

test('galeria limita miniatura e imagem principal a 200 KB', () => {
  assert.match(sql, /tamanho_thumb_bytes integer NOT NULL CHECK \(tamanho_thumb_bytes BETWEEN 1 AND 204800\)/);
  assert.match(sql, /tamanho_full_bytes integer NOT NULL CHECK \(tamanho_full_bytes BETWEEN 1 AND 204800\)/);
});

test('dimensões finais não ultrapassam 1600 px', () => {
  assert.match(sql, /largura integer NOT NULL CHECK \(largura BETWEEN 1 AND 1600\)/);
  assert.match(sql, /altura integer NOT NULL CHECK \(altura BETWEEN 1 AND 1600\)/);
});

test('publicação exige álbum em revisão e publica fotos na mesma transação', () => {
  assert.match(sql, /a\.status = 'pending_review'/);
  assert.match(sql, /UPDATE public\.fju_galeria_fotos SET status = 'published'/);
  assert.match(sql, /UPDATE public\.fju_galeria_albuns[\s\S]*?SET status = 'published'/);
});

test('RPCs de transição só podem ser executadas pelo backend service_role', () => {
  assert.match(sql, /REVOKE ALL ON FUNCTION public\.fju_galeria_aprovar_album\(uuid,uuid\) FROM PUBLIC, anon, authenticated/);
  assert.match(sql, /GRANT EXECUTE ON FUNCTION public\.fju_galeria_aprovar_album\(uuid,uuid\) TO service_role/);
});

test('clientes não recebem INSERT direto em fotografias nem UPDATE de status', () => {
  assert.doesNotMatch(sql, /GRANT[^;]*INSERT[^;]*fju_galeria_fotos TO authenticated/i);
  assert.match(sql, /GRANT UPDATE \(titulo, descricao, categoria, cidade, data_evento\) ON public\.fju_galeria_albuns TO authenticated/);
});
