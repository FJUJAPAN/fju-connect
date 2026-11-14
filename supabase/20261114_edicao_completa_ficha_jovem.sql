-- Permite que o jovem envie todos os campos pessoais e complementares da própria ficha.
-- O coordenador do polo (ou Nacional) continua sendo responsável pela aprovação.

create or replace function public.fju_ler_meus_complementos()
returns jsonb language plpgsql stable security definer set search_path to ''
as $$
declare v_j_id uuid; v_dados jsonb;
begin
 if auth.uid() is null then raise exception 'Login necessário'; end if;
 select j.id into v_j_id from public.fju_jovens j
 join public.fju_vinculos_conta_jovem v on v.jovem_id=j.id
 where v.usuario_id=auth.uid() and v.ativo=true and j.excluido_em is null
 order by v.liberado_em desc nulls last limit 1;
 if v_j_id is null then raise exception 'Ficha vinculada não encontrada'; end if;
 select dados into v_dados from public.fju_fichas_complementos where jovem_id=v_j_id;
 return coalesce(v_dados,'{}'::jsonb);
end; $$;

create or replace function public.fju_solicitar_edicao_meu_perfil(p_dados jsonb)
returns uuid language plpgsql security definer set search_path to ''
as $$
declare v_uid uuid:=auth.uid(); v_j public.fju_jovens%rowtype; v_id uuid; v_key text; v_estado text; v_date text;
begin
 if v_uid is null then raise exception 'Login necessário'; end if;
 if p_dados is null or jsonb_typeof(p_dados)<>'object' or p_dados='{}'::jsonb then raise exception 'Dados inválidos'; end if;
 for v_key in select jsonb_object_keys(p_dados) loop
  if v_key not in ('testemunho','nascimento','batismo_aguas','batismo_espirito_santo','projetos','estado_civil','data_casamento','endereco','observacoes','batismo_espirito','inicio_cpo','inicio_colaborador','inicio_obra','inicio_coordenacao_fju') then raise exception 'Campo não permitido: %',v_key; end if;
 end loop;
 if p_dados ? 'projetos' and (jsonb_typeof(p_dados->'projetos')<>'array' or jsonb_array_length(p_dados->'projetos')>5) then raise exception 'Máximo de 5 projetos'; end if;
 if p_dados ? 'testemunho' and length(coalesce(p_dados->>'testemunho',''))>10000 then raise exception 'Testemunho muito longo'; end if;
 if p_dados ? 'estado_civil' then
  v_estado:=p_dados->>'estado_civil';
  if v_estado not in ('nao_informado','solteiro','casado') then raise exception 'Estado civil inválido'; end if;
  if v_estado='casado' and nullif(p_dados->>'data_casamento','') is null then raise exception 'Informe a data do casamento'; end if;
  if v_estado<>'casado' and coalesce(nullif(p_dados->>'data_casamento',''),'')<>'' then raise exception 'Data de casamento só é válida para estado civil casado'; end if;
 end if;
 foreach v_key in array array['nascimento','batismo_aguas','batismo_espirito_santo','data_casamento'] loop
  if p_dados ? v_key then
   v_date:=nullif(btrim(coalesce(p_dados->>v_key,'')),'');
   if v_date is not null and (v_date !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or to_char(v_date::date,'YYYY-MM-DD')<>v_date or v_date::date>current_date or v_date::date<date '1900-01-01') then raise exception 'Data inválida no campo %',v_key; end if;
  end if;
 end loop;
 if length(coalesce(p_dados->>'endereco',''))>350 or length(coalesce(p_dados->>'observacoes',''))>3000 then raise exception 'Texto excede o limite da ficha'; end if;
 if p_dados ?| array['batismo_espirito','inicio_cpo','inicio_colaborador','inicio_obra','inicio_coordenacao_fju'] then
  perform public.fju_validar_dados_ficha_complementar(jsonb_build_object(
   'endereco',coalesce(p_dados->>'endereco',''),'testemunho',coalesce(p_dados->>'testemunho',''),
   'observacoes',coalesce(p_dados->>'observacoes',''),'batismo_aguas',coalesce(p_dados->>'batismo_aguas',''),
   'batismo_espirito',coalesce(p_dados->>'batismo_espirito',''),'inicio_cpo',coalesce(p_dados->>'inicio_cpo',''),
   'inicio_colaborador',coalesce(p_dados->>'inicio_colaborador',''),'inicio_obra',coalesce(p_dados->>'inicio_obra',''),
   'inicio_coordenacao_fju',coalesce(p_dados->>'inicio_coordenacao_fju','')));
 end if;
 select j.* into v_j from public.fju_jovens j join public.fju_vinculos_conta_jovem v
 on v.jovem_id=j.id and v.usuario_id=v_uid and v.ativo where j.excluido_em is null limit 1;
 if not found then raise exception 'Ficha vinculada não encontrada'; end if;
 if exists(select 1 from public.fju_edicoes_perfil_jovem where jovem_id=v_j.id and status='pendente') then raise exception 'Já existe solicitação pendente'; end if;
 insert into public.fju_edicoes_perfil_jovem(jovem_id,usuario_id,polo_id,dados_propostos)
 values(v_j.id,v_uid,v_j.polo_id,p_dados) returning id into v_id;
 return v_id;
end; $$;

create or replace function public.fju_decidir_edicao_perfil(p_id uuid,p_aprovar boolean)
returns void language plpgsql security definer set search_path to ''
as $$
declare v_s public.fju_edicoes_perfil_jovem%rowtype; v_d jsonb; v_projects text[]; v_existing jsonb; v_complement jsonb; v_key text;
begin
 if auth.uid() is null then raise exception 'Login necessário'; end if;
 select * into v_s from public.fju_edicoes_perfil_jovem where id=p_id for update;
 if not found or v_s.status<>'pendente' then raise exception 'Solicitação indisponível'; end if;
 if not exists(select 1 from public.fju_perfis p where p.usuario_id=auth.uid() and p.ativo and (p.papel='nacional' or (p.papel='coordenador' and p.polo_id=v_s.polo_id))) then raise exception 'Sem permissão para este polo'; end if;
 if p_aprovar then
  v_d:=v_s.dados_propostos;
  if v_d ? 'projetos' then select coalesce(array_agg(value),array[]::text[]) into v_projects from jsonb_array_elements_text(v_d->'projetos') t(value); end if;
  update public.fju_jovens set
   endereco=case when v_d ? 'endereco' then v_d->>'endereco' else endereco end,
   testemunho=case when v_d ? 'testemunho' then v_d->>'testemunho' else testemunho end,
   nascimento=case when v_d ? 'nascimento' then nullif(v_d->>'nascimento','')::date else nascimento end,
   batismo_aguas=case when v_d ? 'batismo_aguas' then nullif(v_d->>'batismo_aguas','')::date else batismo_aguas end,
   batismo_espirito_santo=case when v_d ? 'batismo_espirito_santo' then nullif(v_d->>'batismo_espirito_santo','')::date else batismo_espirito_santo end,
   estado_civil=case when v_d ? 'estado_civil' then v_d->>'estado_civil' else estado_civil end,
   data_casamento=case when v_d ? 'data_casamento' then nullif(v_d->>'data_casamento','')::date else data_casamento end,
   projetos=case when v_d ? 'projetos' then v_projects else projetos end
  where id=v_s.jovem_id and polo_id=v_s.polo_id and excluido_em is null;
  if not found then raise exception 'Ficha não encontrada'; end if;
  if v_d ?| array['endereco','testemunho','observacoes','batismo_aguas','batismo_espirito','inicio_cpo','inicio_colaborador','inicio_obra','inicio_coordenacao_fju'] then
   select dados into v_existing from public.fju_fichas_complementos where jovem_id=v_s.jovem_id;
   v_complement:=coalesce(v_existing,'{}'::jsonb);
   foreach v_key in array array['endereco','testemunho','observacoes','batismo_aguas','batismo_espirito','inicio_cpo','inicio_colaborador','inicio_obra','inicio_coordenacao_fju'] loop
    if v_d ? v_key then v_complement:=v_complement||jsonb_build_object(v_key,v_d->v_key); end if;
   end loop;
   insert into public.fju_fichas_complementos(jovem_id,dados,atualizado_por)
   values(v_s.jovem_id,public.fju_validar_dados_ficha_complementar(v_complement),auth.uid())
   on conflict(jovem_id) do update set dados=excluded.dados,atualizado_por=excluded.atualizado_por,atualizado_em=now();
  end if;
 end if;
 update public.fju_edicoes_perfil_jovem set status=case when p_aprovar then 'aprovada' else 'rejeitada' end,analisado_em=now(),analisado_por=auth.uid() where id=p_id;
end; $$;

grant execute on function public.fju_ler_meus_complementos() to authenticated;
grant execute on function public.fju_solicitar_edicao_meu_perfil(jsonb) to authenticated;
grant execute on function public.fju_decidir_edicao_perfil(uuid,boolean) to authenticated;
