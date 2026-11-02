-- FJU CONNECT JAPAN: notas opcionais na solicitacao de pontos.
-- Executado no Supabase em 2026-11-02. Preserva o identificador obrigatorio do visitante,
-- a unicidade diaria de limpeza/evangelizacao e a aprovacao do coordenador.
ALTER TABLE public.fju_pontos_solicitacoes
  DROP CONSTRAINT IF EXISTS fju_pontos_solicitacoes_detalhe_check;
ALTER TABLE public.fju_pontos_solicitacoes
  ADD CONSTRAINT fju_pontos_solicitacoes_detalhe_check
  CHECK (char_length(btrim(detalhe)) <= 300);

CREATE OR REPLACE FUNCTION public.fju_pontos_solicitar(p_atividade text, p_data_atividade date, p_detalhe text, p_referencia_pessoa text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  v_user uuid := auth.uid();
  v_polo uuid;
  v_pontos integer;
  v_id uuid;
  v_detalhe text := btrim(coalesce(p_detalhe,''));
  v_ref text := nullif(btrim(p_referencia_pessoa),'');
  v_first public.fju_pontos_solicitacoes%rowtype;
  v_is_visit boolean := p_atividade in ('alma_primeira','alma_segunda_mes','alma_terceira_mes');
begin
  if v_user is null then
    raise exception 'login_necessario' using errcode='42501';
  end if;
  if p_atividade is null or p_atividade not in
     ('limpeza_igreja','evangelizacao','alma_primeira') then
    raise exception 'atividade_invalida' using errcode='22023';
  end if;
  if p_data_atividade is null or p_data_atividade > (now() at time zone 'Asia/Tokyo')::date then
    raise exception 'data_atividade_invalida' using errcode='22023';
  end if;
  if char_length(v_detalhe) > 220 then
    raise exception 'detalhe_maximo_220' using errcode='22023';
  end if;
  if v_is_visit and (v_ref is null or char_length(v_ref) not between 2 and 50) then
    raise exception 'identificador_pessoa_obrigatorio' using errcode='22023';
  end if;
  if not v_is_visit then v_ref:=null; end if;

  select j.polo_id into v_polo
  from public.fju_vinculos_conta_jovem v
  join public.fju_jovens j on j.id=v.jovem_id
  join public.fju_polos p on p.id=j.polo_id and p.ativo=true
  where v.usuario_id=v_user and v.ativo=true and j.excluido_em is null
  order by v.liberado_em desc nulls last limit 1;
  if v_polo is null then
    select i.polo_id into v_polo
    from public.fju_inscricoes_jovens i
    join public.fju_polos p on p.id=i.polo_id and p.ativo=true
    where i.usuario_id=v_user and i.status='aprovado'
    order by i.criado_em desc limit 1;
  end if;
  if v_polo is null then
    raise exception 'conta_jovem_nao_vinculada' using errcode='42501';
  end if;

  if v_is_visit then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(v_user::text||':'||lower(v_ref),0));
    if p_atividade='alma_primeira' then
      if exists (
        select 1 from public.fju_pontos_solicitacoes s
        where s.usuario_id=v_user and s.atividade='alma_primeira'
          and s.status <> 'rejeitada' and lower(btrim(s.referencia_pessoa))=lower(v_ref)
          and p_data_atividade < (s.data_atividade + interval '1 month')::date
          and s.data_atividade < (p_data_atividade + interval '1 month')::date
      ) then
        raise exception 'primeira_visita_ja_registrada_no_ciclo' using errcode='22023';
      end if;
    else
      select * into v_first
      from public.fju_pontos_solicitacoes s
      where s.usuario_id=v_user and s.atividade='alma_primeira'
        and s.status='aprovada'
        and lower(btrim(s.referencia_pessoa))=lower(v_ref)
        and s.data_atividade <= p_data_atividade
        and p_data_atividade < (s.data_atividade + interval '1 month')::date
      order by s.data_atividade desc limit 1 for update;
      if not found then
        raise exception 'primeira_visita_aprovada_necessaria_no_ciclo' using errcode='22023';
      end if;
      if p_atividade='alma_terceira_mes' and not exists (
        select 1 from public.fju_pontos_solicitacoes s
        where s.usuario_id=v_user and s.visita_inicial_id=v_first.id
          and s.atividade='alma_segunda_mes' and s.status='aprovada'
          and s.data_atividade <= p_data_atividade
      ) then
        raise exception 'segunda_visita_aprovada_necessaria' using errcode='22023';
      end if;
      if exists (
        select 1 from public.fju_pontos_solicitacoes s
        where s.usuario_id=v_user and s.visita_inicial_id=v_first.id
          and s.atividade=p_atividade and s.status <> 'rejeitada'
      ) then
        raise exception 'visita_ja_solicitada_no_ciclo' using errcode='22023';
      end if;
    end if;
  end if;

  v_pontos:=case p_atividade when 'limpeza_igreja' then 10
    when 'evangelizacao' then 20 when 'alma_primeira' then 30 else 15 end;
  insert into public.fju_pontos_solicitacoes
    (usuario_id,polo_id,atividade,pontos,data_atividade,detalhe,referencia_pessoa,visita_inicial_id)
  values
    (v_user,v_polo,p_atividade,v_pontos,p_data_atividade,
     case when v_is_visit then 'Pessoa: '||v_ref||case when v_detalhe<>'' then ' — '||v_detalhe else '' end else v_detalhe end,
     v_ref,case when p_atividade in ('alma_segunda_mes','alma_terceira_mes') then v_first.id else null end)
  returning id into v_id;
  return v_id;
exception when unique_violation then
  raise exception 'solicitacao_duplicada' using errcode='23505';
end $function$
;
