import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const page=readFileSync(new URL('campeonatos/index.html',root),'utf8');
const script=readFileSync(new URL('campeonatos/campeonatos.js',root),'utf8');
const css=readFileSync(new URL('campeonatos/campeonatos.css',root),'utf8');
const home=readFileSync(new URL('index.html',root),'utf8');
const migration=readFileSync(new URL('supabase/20261119_campeonatos_piloto.sql',root),'utf8');
const completeMigration=readFileSync(new URL('supabase/20261119_campeonatos_criacao_completa.sql',root),'utf8');
const sharedHeaderCss=readFileSync(new URL('fju-header-shared.css',root),'utf8');
const mobileHeader=readFileSync(new URL('unified-mobile-header.js',root),'utf8');

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
 assert.match(script,/form\.elements\.cityWard\.readOnly=false/);
 assert.match(migration,/public\.fju_identidades/);
 assert.match(migration,/fju_campeonato_cadastrar_jogador\(text,text,date,text,text,boolean,bigint\)/);
 assert.match(migration,/jovem_id/);
 assert.match(migration,/campeonato_staff_ler_fju_foto_inscrito/);
 assert.equal((migration.match(/create or replace function public\.fju_campeonato_cadastrar_jogador/g)||[]).length,1);
 assert.equal((migration.match(/commit;/g)||[]).length,1);
 assert.equal((migration.match(/\$\$/g)||[]).length%2,0);
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

test('coordinator championship form includes required cover, schedule and polo',()=>{
 assert.match(page,/name="cover" type="file"[^>]*required/);
 assert.match(page,/name="startTime" type="time" required/);
 assert.match(page,/name="endTime" type="time"/);
 assert.match(page,/name="hostPolo"/);
 assert.match(page,/name="maxTeams"/);
 assert.match(script,/fju_campeonato_criar_v2/);
 assert.match(script,/fju-campeonatos-capas/);
 assert.match(script,/p_hora_inicio:f\.get\('startTime'\)/);
 assert.match(script,/p_hora_fim:f\.get\('endTime'\)/);
 assert.match(script,/p_max_times:f\.get\('maxTeams'\)/);
 assert.match(script,/event-cover/);
});
test('complete championship migration stores metadata and restricts cover uploads to staff',()=>{
 for(const col of ['foto_capa_url','hora_inicio','hora_fim','max_times'])assert.match(completeMigration,new RegExp('add column if not exists '+col));
 assert.match(completeMigration,/fju-campeonatos-capas/);
 assert.match(completeMigration,/fju_campeonato_capa_staff_upload/);
 assert.match(completeMigration,/fju_campeonato_criar_v2/);
 assert.match(completeMigration,/p_hora_inicio time/);
 assert.match(completeMigration,/p_max_times integer/);
 assert.match(completeMigration,/for update/);
 assert.match(completeMigration,/limite de equipes/i);
 assert.equal((completeMigration.match(/commit;/g)||[]).length,1);
 assert.equal((completeMigration.match(/\$\$/g)||[]).length%2,0);
});
test('coordinator access shortcut opens championship staff login/create panel directly',()=>{
 assert.match(script,/q\.has\('staff'\)/);
 assert.match(script,/if\(session\)await checkAdmin\(\);else show\('loginSection'\)/);
});

test('captain is registered during team creation with required profile data',()=>{
 for(const name of ['captainBirth','captainCity','captainPhoto','captainConsent'])assert.match(page,new RegExp('name="'+name+'"'));
 assert.match(page,/name="captainBirth" type="date" required/);
 assert.ok(page.includes('name="captainPhoto" type="file" accept="image/*" required'));
 assert.match(page,/name="captainConsent" type="checkbox" required/);
 assert.match(script,/fju_campeonato_criar_time/);
 assert.match(script,/fju_campeonato_cadastrar_jogador/);
 assert.match(script,/p_invite_hash:inviteHash/);
 assert.match(script,/p_nascimento:fd\.get\('captainBirth'\)/);
 assert.match(script,/p_cidade_bairro:fd\.get\('captainCity'\)/);
 assert.match(script,/p_consent:fd\.get\('captainConsent'\)==='on'/);
 assert.match(script,/captainRegistrationFailed/);
 assert.match(script,/captainLink/);
});

test('championship page uses FJU global header and standard mobile header',()=>{
 assert.match(page,/<header class="site-header">/);
 assert.match(page,/brand-official-logo/);
 assert.match(page,/fju-header-shared\.css/);
 assert.match(page,/unified-mobile-header\.js/);
 assert.match(page,/id="staffAccess"/);
 assert.doesNotMatch(page,/Feito para celular/);
 assert.match(sharedHeaderCss,/body>header \.header-side/);
 assert.match(mobileHeader,/data-action="coord"/);
 assert.match(mobileHeader,/currentLang\(\)/);
});

test('rejecting a pending team deletes its team row and cascades player registrations',()=>{
 assert.match(script,/fju_campeonato_excluir_time_rejeitado/);
 assert.match(script,/deleteRejectedTeam\(tm\.id\)/);
 assert.match(script,/teamDeleted/);
 assert.match(script,/confirmTeamReject/);
 assert.match(script,/db\.rpc\('fju_campeonato_excluir_time_rejeitado'/);
});

test('duplicate team and technical backend errors are translated to user-friendly notices',()=>{\n assert.match(script,/function friendlyError/);\n assert.match(script,/fju_campeonatos_times_campeonato_id_polo_id_nome_time_key/);\n assert.match(script,/Já existe um time com esse nome neste campeonato e polo/);\n assert.match(script,/Não foi possível concluir/);\n});\n
test('public teams directory only uses approved-team RPC and renders shareable team cards',()=>{\n assert.match(script,/fju_campeonato_times_publicos/);\n assert.match(script,/loadPublicTeams/);\n assert.match(script,/Ver ficha do time/);\n assert.match(script,/Compartilhar página/);\n});\n