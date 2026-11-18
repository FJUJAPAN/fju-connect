import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const page=readFileSync(new URL('campeonatos/index.html',root),'utf8');
const script=readFileSync(new URL('campeonatos/campeonatos.js',root),'utf8');
const css=readFileSync(new URL('campeonatos/campeonatos.css',root),'utf8');
const home=readFileSync(new URL('index.html',root),'utf8');
const migration=readFileSync(new URL('supabase/20261119_campeonatos_piloto.sql',root),'utf8');

test('module JavaScript syntax remains valid after removing browser CDN import',()=>{
 const moduleSource=script.replace(/^import[^;]+;\s*/m,'');
 assert.doesNotThrow(()=>new Function(moduleSource));
});

test('homepage links and displays championships in PT, JA and EN',()=>{
 assert.match(home,/href="campeonatos\/" class="fju-championships-nav"/);
 assert.match(home,/id="campeonatos"/);
 assert.match(home,/CAMPEONATOS/);
 assert.match(home,/大会/);
 assert.match(home,/CHAMPIONSHIPS/);
});

test('registration page exposes team, player and staff flows',()=>{
 for(const id of ['teamForm','playerForm','eventForm','loginForm','captainSection','adminSection'])assert.match(page,new RegExp('id="'+id+'"'));
 assert.match(page,/name="photo" type="file"/);
 assert.match(page,/name="consent" type="checkbox" required/);
 assert.match(page,/name="birth" type="date"/);
 assert.match(page,/name="cityWard"/);
});

test('FJU ID lookup autofills player details and reuses private profile photo',()=>{
 assert.match(page,/name="fjuId"/);
 assert.match(page,/id="lookupFjuId"/);
 assert.match(script,/fju_campeonato_buscar_jovem_fju_id/);
 assert.match(script,/form\.elements\.name\.value=found\.nome/);
 assert.match(script,/p_fju_numero:playerIdentity\?\.numero\|\|null/);
 assert.match(script,/bucket=profilePhoto\?'fju-fotos':'fju-campeonato-jogadores'/);
 assert.match(migration,/public\.fju_identidades/);\n assert.match(migration,/fju_campeonato_cadastrar_jogador\(text,text,date,text,text,boolean,bigint\)/);
 assert.match(migration,/jovem_id/);
 assert.match(migration,/campeonato_staff_ler_fju_foto_inscrito/);
 assert.match(migration,/campeonato_staff_ler_fju_foto_inscrito/);
});

test('captain flow creates team tokens, individual invite links and copy/share controls',()=>{
 assert.match(script,/fju_campeonato_criar_time/);
 assert.match(script,/fju_campeonato_criar_convite/);
 assert.match(script,/\?capitao=/);
 assert.match(script,/\?jogador=/);
 assert.match(script,/navigator\.share/);
 assert.match(script,/navigator\.clipboard/);
});

test('player submission uploads a compressed private photo and requires consent',()=>{
 assert.match(script,/fju-campeonato-jogadores/);
 assert.match(script,/p_consent:fd\.get\('consent'\)==='on'/);
 assert.match(script,/compressPhoto/);
 assert.match(script,/fju_campeonato_cadastrar_jogador/);
});

test('staff panel checks active national/coordinator profile and uses approval RPCs',()=>{
 assert.match(script,/fju_campeonato_listar_polos/);
 assert.match(script,/from\('fju_perfis'\)/);
 assert.match(script,/!data\?\.ativo/);
 assert.match(script,/\['nacional','coordenador'\]/);
 assert.match(script,/fju_campeonato_aprovar_time/);
 assert.match(script,/fju_campeonato_aprovar_jogador/);
});

test('migration keeps participant data private and requires invitation token/photo/consent',()=>{
 assert.match(migration,/enable row level security/);
 assert.match(migration,/revoke all on public\.fju_campeonatos, public\.fju_campeonatos_times, public\.fju_campeonatos_jogadores from public, anon, authenticated/);
 assert.match(migration,/fju_campeonato_listar_polos/);
 assert.match(migration,/token_inscricao_hash/);
 assert.match(migration,/consent_confirmed_at/);
 assert.match(migration,/Foto não foi enviada/);
 assert.match(migration,/public=false/);
 assert.match(migration,/to anon,authenticated/);
});
