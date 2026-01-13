-- Políticas RLS para o bucket automation-media
-- Permitir que qualquer usuário autenticado visualize arquivos públicos
CREATE POLICY "Arquivos públicos são visualizáveis por todos"
ON storage.objects FOR SELECT
USING (bucket_id = 'automation-media');

-- Permitir que superadmins façam upload de arquivos
CREATE POLICY "Superadmins podem fazer upload de arquivos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'automation-media' 
  AND public.has_role(auth.uid(), 'superadmin')
);

-- Permitir que superadmins atualizem arquivos
CREATE POLICY "Superadmins podem atualizar arquivos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'automation-media' 
  AND public.has_role(auth.uid(), 'superadmin')
);

-- Permitir que superadmins deletem arquivos
CREATE POLICY "Superadmins podem deletar arquivos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'automation-media' 
  AND public.has_role(auth.uid(), 'superadmin')
);