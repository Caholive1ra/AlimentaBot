# Proposta inicial de retenção de dados

Esta é uma proposta técnica, não uma definição de prazo legal. A validação jurídica e
de privacidade é obrigatória antes de uso operacional com dados reais.

| Categoria | Minimização | Proposta técnica inicial |
| --- | --- | --- |
| Identidade e associação organizacional | Armazenar `auth_subject`, nome opcional e papéis; não armazenar senha/token | Manter enquanto houver vínculo ativo; revisar remoção/anonimização após desligamento conforme decisão jurídica |
| Lotes e eventos de custódia | Somente informação operacional e trilha append-only | Retenção definida pelo responsável operacional e jurídico; não excluir eventos durante investigação/auditoria válida |
| Revisão sanitária | Decisão, ator autorizado, data e motivo | Mesmo ciclo dos eventos de custódia; não é certificado sanitário |
| Dados de beneficiários | Não coletar | Não aplicável |
| Logs técnicos | Evitar payloads e dados pessoais | Prazo curto a definir pela operação e segurança |

Antes de definir qualquer prazo: mapear controlador/operador, base legal, canal de
requisições de titulares, política de backup, descarte seguro e obrigações regulatórias
que possam se aplicar à operação real.
