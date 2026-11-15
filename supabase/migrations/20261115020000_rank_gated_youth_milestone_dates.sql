begin;

create or replace function public.fju_ler_meu_perfil()
returns jsonb
language plpgsql
stable
security definer
set search_path to ''
as $function$
declare
  v_result jsonb;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then raise exception 'Login necessário'; end if;

  select jsonb_build_object(
    'ficha',jsonb_build_object(
      'id',j.id,'nome_completo',j.nome_completo,'telefone',j.telefone,
      'nacionalidade_iso2',j.nacionalidade_iso2,'idiomas',j.idiomas,
      'nascimento',j.nascimento,'endereco',j.endereco,
      'batismo_aguas',j.batismo_aguas,'batismo_espirito_santo',j.batismo_espirito_santo,
      'testemunho',j.testemunho,'projetos',j.projetos,'estado_civil',j.estado_civil,
      'data_casamento',j.data_casamento,'deseja_obra_altar',j.deseja_obra_altar,
      'patente',j.patente
    ),
    'complementos',coalesce(c.dados,'{}'::jsonb)||jsonb_build_object('endereco',coalesce(j.endereco,''))
  ) into v_result
  from public.fju_jovens j
  join public.fju_vinculos_conta_jovem v
    on v.jovem_id=j.id and v.usuario_id=v_uid and v.ativo=true
  left join public.fju_fichas_complementos c on c.jovem_id=j.id
  where j.excluido_em is null
  order by v.liberado_em desc nulls last
  limit 1;

  if v_result is null then raise exception 'Ficha vinculada não encontrada'; end if;
  return v_result;
end;
$function$;

-- Enforce the same rank gate in the database, not only in the form UI.
do $patch$
declare
  v_def text;
  v_anchor text := '  if not found then raise exception ''Ficha vinculada não encontrada''; end if;';
  v_guard text := E'  if p_dados ? ''inicio_cpo'' and lower(trim(coalesce(v_j.patente,''''))) <> ''cpo'' then\n    raise exception ''A data de início no CPO só pode ser preenchida após a patente CPO ser definida pelo coordenador.'';\n  end if;\n  if p_dados ? ''inicio_colaborador'' and lower(trim(coalesce(v_j.patente,''''))) <> ''colaborador'' then\n    raise exception ''A data de início como Colaborador só pode ser preenchida após a patente ser definida pelo coordenador.'';\n  end if;\n  if p_dados ? ''inicio_obra'' and lower(trim(coalesce(v_j.patente,''''))) <> ''obreiro'' then\n    raise exception ''A data de início na Obra só pode ser preenchida após a patente Obreiro ser definida pelo coordenador.'';\n  end if;\n  if p_dados ? ''inicio_coordenacao_fju'' and lower(trim(coalesce(v_j.patente,''''))) <> ''coordenador'' then\n    raise exception ''A data de início na coordenação só pode ser preenchida após a patente Coordenador ser definida.'';\n  end if;';
begin
  select pg_get_functiondef('public.fju_salvar_meu_perfil(jsonb)'::regprocedure) into v_def;
  if position(v_anchor in v_def)=0 then
    raise exception 'Could not find safe insertion point in fju_salvar_meu_perfil';
  end if;
  if position('A data de início no CPO só pode ser preenchida' in v_def)>0 then
    raise exception 'Rank gate already exists in fju_salvar_meu_perfil';
  end if;
  v_def:=replace(v_def,v_anchor,v_anchor||E'\n'||v_guard);
  execute v_def;
end
$patch$;

commit;