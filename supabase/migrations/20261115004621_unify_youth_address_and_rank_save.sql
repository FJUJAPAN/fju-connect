begin;

-- Preserve addresses that exist only in the legacy complementary JSON.
update public.fju_jovens j
set endereco = nullif(btrim(c.dados->>'endereco'),'')
from public.fju_fichas_complementos c
where c.jovem_id=j.id
  and nullif(btrim(j.endereco),'') is null
  and nullif(btrim(c.dados->>'endereco'),'') is not null;

-- fju_jovens.endereco is the canonical address field.
update public.fju_fichas_complementos
set dados=coalesce(dados,'{}'::jsonb)-'endereco', atualizado_em=now()
where dados ? 'endereco';

-- Keep the existing self-profile RPC but stop writing address into JSON complements.
do $patch$
declare v_def text; v_address_line text;
begin
  select pg_get_functiondef('public.fju_salvar_meu_perfil(jsonb)'::regprocedure) into v_def;
  v_address_line := '    ' || quote_literal('endereco') || ',coalesce(p_dados->>' ||
    quote_literal('endereco') || ',v_j.endereco,' || quote_literal('') || '),' || chr(10);
  v_def := replace(v_def,v_address_line,'');
  v_def := replace(
    v_def,
    'public.fju_validar_dados_ficha_complementar(v_extra),v_uid',
    'public.fju_validar_dados_ficha_complementar(v_extra) - ' || quote_literal('endereco') || ',v_uid'
  );
  if position(v_address_line in v_def)>0 or position('v_extra) - ' || quote_literal('endereco') in v_def)=0 then
    raise exception 'Could not normalize youth self-profile address storage';
  end if;
  execute v_def;
end
$patch$;

create or replace function public.fju_ler_meu_perfil()
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare v_result jsonb; v_uid uuid:=auth.uid();
begin
  if v_uid is null then raise exception 'Login necessário'; end if;
  select jsonb_build_object(
    'ficha',jsonb_build_object(
      'id',j.id,'nome_completo',j.nome_completo,'telefone',j.telefone,
      'nacionalidade_iso2',j.nacionalidade_iso2,'idiomas',j.idiomas,
      'nascimento',j.nascimento,'endereco',j.endereco,
      'batismo_aguas',j.batismo_aguas,'batismo_espirito_santo',j.batismo_espirito_santo,
      'testemunho',j.testemunho,'projetos',j.projetos,'estado_civil',j.estado_civil,
      'data_casamento',j.data_casamento,'deseja_obra_altar',j.deseja_obra_altar
    ),
    'complementos',coalesce(c.dados,'{}'::jsonb)||jsonb_build_object('endereco',coalesce(j.endereco,''))
  ) into v_result
  from public.fju_jovens j
  join public.fju_vinculos_conta_jovem v on v.jovem_id=j.id and v.usuario_id=v_uid and v.ativo=true
  left join public.fju_fichas_complementos c on c.jovem_id=j.id
  where j.excluido_em is null
  order by v.liberado_em desc nulls last limit 1;
  if v_result is null then raise exception 'Ficha vinculada não encontrada'; end if;
  return v_result;
end;
$function$;

create or replace function public.fju_ler_ficha_complementar(p_jovem_id uuid)
returns jsonb language plpgsql stable security definer set search_path to ''
as $function$
declare v_papel text; v_polo uuid; v_jovem public.fju_jovens%rowtype; v_dados jsonb;
begin
  select papel,polo_id into v_papel,v_polo from public.fju_perfis
  where usuario_id=auth.uid() and ativo=true;
  if v_papel not in ('coordenador','nacional') or v_papel is null then raise exception 'Acesso não autorizado'; end if;
  select * into v_jovem from public.fju_jovens where id=p_jovem_id and excluido_em is null;
  if not found or (v_papel='coordenador' and v_jovem.polo_id is distinct from v_polo) then
    raise exception 'Ficha fora do escopo autorizado';
  end if;
  select dados into v_dados from public.fju_fichas_complementos where jovem_id=p_jovem_id;
  return jsonb_build_object(
    'dados',coalesce(v_dados,'{}'::jsonb)||jsonb_build_object('endereco',coalesce(v_jovem.endereco,'')),
    'pedido_pendente',exists(select 1 from public.fju_fichas_complementos_pedidos where jovem_id=p_jovem_id and status='pendente')
  );
end;
$function$;

create or replace function public.fju_salvar_ficha_complementar_nacional(p_jovem_id uuid,p_dados jsonb)
returns void language plpgsql security definer set search_path to ''
as $function$
declare v_dados jsonb; v_atual jsonb; v_endereco text;
begin
  if not exists(select 1 from public.fju_perfis where usuario_id=auth.uid() and ativo and papel='nacional') then
    raise exception 'Somente o Nacional pode salvar diretamente';
  end if;
  select endereco into v_endereco from public.fju_jovens where id=p_jovem_id and excluido_em is null for update;
  if not found then raise exception 'Ficha não encontrada'; end if;
  if exists(select 1 from public.fju_fichas_complementos_pedidos where jovem_id=p_jovem_id and status='pendente') then
    raise exception 'Decida o pedido pendente antes de editar';
  end if;
  select dados into v_atual from public.fju_fichas_complementos where jovem_id=p_jovem_id;
  v_dados:=public.fju_validar_dados_ficha_complementar(
    coalesce(v_atual,'{}'::jsonb)||coalesce(p_dados,'{}'::jsonb)||
    jsonb_build_object('endereco',coalesce(nullif(btrim(p_dados->>'endereco'),''),v_endereco,''))
  );
  update public.fju_jovens set endereco=coalesce(nullif(btrim(v_dados->>'endereco'),''),endereco),atualizado_em=now()
  where id=p_jovem_id;
  v_dados:=public.fju_validar_dados_ficha_complementar(v_dados)-'endereco';
  insert into public.fju_fichas_complementos(jovem_id,dados,atualizado_por)
  values(p_jovem_id,v_dados,auth.uid())
  on conflict(jovem_id) do update set dados=excluded.dados,atualizado_por=excluded.atualizado_por,atualizado_em=now();
end;
$function$;

create or replace function public.fju_solicitar_ficha_complementar(p_jovem_id uuid,p_dados jsonb)
returns uuid language plpgsql security definer set search_path to ''
as $function$
declare v_papel text; v_polo uuid; v_jovem public.fju_jovens%rowtype; v_id uuid; v_dados jsonb; v_atual jsonb;
begin
  select papel,polo_id into v_papel,v_polo from public.fju_perfis where usuario_id=auth.uid() and ativo=true;
  if v_papel is distinct from 'coordenador' or v_polo is null then raise exception 'Somente o coordenador local pode solicitar a alteração'; end if;
  select * into v_jovem from public.fju_jovens where id=p_jovem_id and excluido_em is null for share;
  if not found or v_jovem.polo_id is distinct from v_polo then raise exception 'Ficha de outro polo'; end if;
  select dados into v_atual from public.fju_fichas_complementos where jovem_id=p_jovem_id;
  v_dados:=public.fju_validar_dados_ficha_complementar(
    coalesce(v_atual,'{}'::jsonb)||coalesce(p_dados,'{}'::jsonb)||
    jsonb_build_object('endereco',coalesce(nullif(btrim(p_dados->>'endereco'),''),v_jovem.endereco,''))
  );
  v_atual:=public.fju_validar_dados_ficha_complementar(
    coalesce(v_atual,'{}'::jsonb)||jsonb_build_object('endereco',coalesce(v_jovem.endereco,''))
  );
  if v_dados=v_atual then raise exception 'Nenhuma mudança na ficha'; end if;
  insert into public.fju_fichas_complementos_pedidos(jovem_id,polo_id,solicitante_id,dados_propostos)
  values(p_jovem_id,v_polo,auth.uid(),v_dados) returning id into v_id;
  return v_id;
end;
$function$;

create or replace function public.fju_decidir_ficha_complementar(p_pedido_id uuid,p_aprovar boolean)
returns void language plpgsql security definer set search_path to ''
as $function$
declare v_pedido public.fju_fichas_complementos_pedidos%rowtype; v_dados jsonb;
begin
  if not exists(select 1 from public.fju_perfis where usuario_id=auth.uid() and ativo and papel='nacional') then
    raise exception 'Somente o Nacional pode decidir pedidos';
  end if;
  if p_aprovar is null then raise exception 'Informe a decisão'; end if;
  select * into v_pedido from public.fju_fichas_complementos_pedidos where id=p_pedido_id for update;
  if not found or v_pedido.status<>'pendente' then raise exception 'Pedido não está pendente'; end if;
  if p_aprovar then
    if not exists(select 1 from public.fju_jovens where id=v_pedido.jovem_id and polo_id=v_pedido.polo_id and excluido_em is null) then
      raise exception 'Ficha já não pertence a este polo';
    end if;
    v_dados:=public.fju_validar_dados_ficha_complementar(v_pedido.dados_propostos);
    update public.fju_jovens
    set endereco=coalesce(nullif(btrim(v_dados->>'endereco'),''),endereco),atualizado_em=now()
    where id=v_pedido.jovem_id and polo_id=v_pedido.polo_id and excluido_em is null;
    v_dados:=public.fju_validar_dados_ficha_complementar(v_dados)-'endereco';
    insert into public.fju_fichas_complementos(jovem_id,dados,atualizado_por)
    values(v_pedido.jovem_id,v_dados,auth.uid())
    on conflict(jovem_id) do update set dados=excluded.dados,atualizado_por=excluded.atualizado_por,atualizado_em=now();
  end if;
  update public.fju_fichas_complementos_pedidos
  set status=case when p_aprovar then 'aprovada' else 'rejeitada' end,decidido_em=now(),decidido_por=auth.uid()
  where id=v_pedido.id;
end;
$function$;

create or replace function public.fju_salvar_patente_complementos(p_jovem_id uuid,p_patente text,p_dados jsonb)
returns jsonb language plpgsql set search_path to ''
as $function$
declare perfil record; jovem record; nova text; antiga text; v_pedido uuid;
begin
  if auth.uid() is null then raise exception 'Login necessário'; end if;
  select papel,polo_id into perfil from public.fju_perfis where usuario_id=auth.uid() and ativo=true;
  if not found or perfil.papel not in ('nacional','coordenador') then raise exception 'Sem autorização'; end if;
  select * into jovem from public.fju_jovens where id=p_jovem_id and excluido_em is null for update;
  if not found then raise exception 'Ficha não encontrada'; end if;
  if perfil.papel='coordenador' and jovem.polo_id is distinct from perfil.polo_id then raise exception 'Jovem fora da sua igreja'; end if;
  nova:=lower(trim(translate(coalesce(p_patente,''),'áãâéêíóôõúç','aaaeeiooouc')));
  if nova='inconstante' then nova:='normal'; end if;
  if nova not in ('normal','eventual','firme','voluntario','cpo','colaborador','obreiro','coordenador') then raise exception 'Patente inválida'; end if;
  antiga:=coalesce(nullif(lower(trim(jovem.patente)),''),case when jovem.categoria='inconstante' then 'normal' else 'firme' end);
  if antiga is distinct from nova then
    if perfil.papel='nacional' then
      update public.fju_jovens set patente=nova,categoria=case when nova in ('normal','eventual') then 'inconstante' else 'firme' end,atualizado_em=now()
      where id=p_jovem_id;
    elsif antiga in ('cpo','colaborador','obreiro','coordenador') or nova in ('cpo','colaborador','obreiro','coordenador') then
      raise exception 'Esta mudança exige aprovação nacional.';
    else
      perform public.fju_alterar_patente_local(p_jovem_id,nova);
    end if;
  end if;
  begin
    if perfil.papel='nacional' then
      perform public.fju_salvar_ficha_complementar_nacional(p_jovem_id,coalesce(p_dados,'{}'::jsonb));
    else
      v_pedido:=public.fju_solicitar_ficha_complementar(p_jovem_id,coalesce(p_dados,'{}'::jsonb));
    end if;
  exception when others then
    if sqlerrm <> 'Nenhuma mudança na ficha' then raise; end if;
  end;
  return jsonb_build_object('patente',nova,'complementos_pendentes',perfil.papel='coordenador','ok',true);
end;
$function$;

commit;