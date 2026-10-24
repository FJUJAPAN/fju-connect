-- FJU JAPAN | Referências GPS para futuro check-in (NÃO ativa check-ins).
-- Dados importados da página pública Encontre a FJU; verificar presencialmente
-- as coordenadas de entrada da igreja antes de marcar verificado=true.
BEGIN;
CREATE TABLE IF NOT EXISTS public.fju_checkin_locais (
 slug text PRIMARY KEY,
 nome text NOT NULL,
 endereco text NOT NULL,
 latitude double precision NOT NULL CHECK(latitude BETWEEN -90 AND 90),
 longitude double precision NOT NULL CHECK(longitude BETWEEN -180 AND 180),
 verificado boolean NOT NULL DEFAULT false,
 atualizado_em timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.fju_checkin_locais ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.fju_checkin_locais FROM PUBLIC,anon,authenticated;
GRANT SELECT ON public.fju_checkin_locais TO authenticated;
DROP POLICY IF EXISTS fju_checkin_locais_consultar ON public.fju_checkin_locais;
CREATE POLICY fju_checkin_locais_consultar ON public.fju_checkin_locais
 FOR SELECT TO authenticated USING(verificado=true);
INSERT INTO public.fju_checkin_locais(slug,nome,endereco,latitude,longitude,verificado)
VALUES
('hamamatsu','FJU Hamamatsu','〒430-0923 静岡県浜松市中央区北寺島町211-19',34.7032527,137.7415086,false),
('toyohashi','FJU Toyohashi','〒440-0842 愛知県豊橋市岩屋町字岩屋下108-5',34.7409576,137.4201769,false),
('suzuka','FJU Suzuka','〒513-0805 三重県鈴鹿市算所町837',34.8745552,136.5501453,false),
('iwata','FJU Iwata','〒438-0078 静岡県磐田市中泉246-1',34.7138469,137.8522363,false),
('yaizu','FJU Yaizu','〒425-0057 静岡県焼津市下小田787-2',34.835143,138.3159926,false),
('fuji','FJU Fuji','〒416-0914 静岡県富士市本町12-2',35.1552485,138.6513436,false),
('anjo','FJU Anjo','〒446-0046 愛知県安城市赤松町大北85-2',34.9453173,137.0707976,false),
('shiga','FJU Shiga','〒520-3114 滋賀県湖南市石部口1-10-20',35.0125196,136.0661894,false),
('nagahama','FJU Nagahama','〒526-0033 滋賀県長浜市平方町1294',35.3716179,136.2704121,false),
('kani','FJU Kani','〒509-0206 岐阜県可児市土田2752-4',35.4311105,137.018792,false),
('toyota','FJU Toyota','〒470-0353 愛知県豊田市保見ケ丘5-1 FOXTOWN 3F',35.1469792,137.1371297,false),
('nagoya','FJU Nagoya','〒455-0008 愛知県名古屋市港区九番町3-3-3',35.1161492,136.8849277,false),
('komaki','FJU Komaki','〒485-0023 愛知県小牧市北外山607-8',35.2842589,136.9242332,false),
('takaoka','FJU Takaoka','〒933-0112 富山県高岡市伏木古国府4-7',36.7918024,137.0567975,false),
('kanagawa','FJU Kanagawa','〒252-1132 神奈川県綾瀬市寺尾中1丁目17-24',35.4587159,139.4258426,false),
('yamanashi','FJU Yamanashi','〒409-3842 山梨県中央市東花輪529-4 2F',35.5941609,138.5258859,false),
('nagano','FJU Nagano','〒386-0018 長野県上田市常田2-7-11',36.3948023,138.2560945,false),
('chiba','FJU Chiba','〒260-0018 千葉県千葉市中央区院内1-12-6',35.6121706,140.1227754,false),
('gunma','FJU Gunma','〒370-0514 群馬県邑楽郡大泉町朝日3-17-17',36.2574783,139.4247318,false),
('ibaraki','FJU Ibaraki','〒303-0003 茨城県常総市水海道橋本町3475-9',36.0256049,139.9904856,false),
('isesaki','FJU Isesaki','〒372-0047 群馬県伊勢崎市本町10-16',36.32032,139.199563,false),
('tokyo','FJU Tokyo','〒169-0073 東京都新宿区百人町2-23-43',35.7026572,139.6968977,false),
('ryuzenji','FJU Ryuzenji','〒430-0924 静岡県浜松市中央区龍禅寺町622',34.6932832,137.7411801,false)
ON CONFLICT(slug) DO NOTHING;
-- Conferência administrativa (SQL Editor):
-- SELECT slug,nome,endereco,latitude,longitude,verificado FROM public.fju_checkin_locais ORDER BY nome;
-- Não conceder UPDATE ao cliente. Marcar verificado apenas após conferência física.
COMMIT;