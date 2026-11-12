/* Dicionário de Dados - KF Imports. Fonte: script DDL v2.2 (22 tabelas, 164 colunas).
   Coluna: [atributo, descrição/regra, tipo (DDL), constraints, privacidade (P=DP, S=DPS, N=N/A), linhagem?, RBAC?] */
const FORMA = "ENUM('DINHEIRO','PIX','CARTAO_DEBITO','CARTAO_CREDITO')";
const TS = 'NN,DEF CURRENT_TIMESTAMP';
const T = [
{n:'usuario',d:'Operador do sistema (Atendente, Técnico, Gerente ou Administrador). Nunca excluído fisicamente; apenas inativado.',
 lin:'Origem: cadastro pelo Administrador (RF14). Destino: FKs operacionais e log_auditoria.',rbac:'At: - | Téc: - | Ger: R | Adm: C R U I',c:[
 ['id_usuario','Identificador do operador.','INT','PK,AI,NN','N'],
 ['nome','Nome do operador.','VARCHAR(100)','NN','P'],
 ['login','Credencial de acesso, única.','VARCHAR(50)','UQ,NN','P'],
 ['senha_hash','Hash Argon2id; senha com no mínimo 12 caracteres (RF14, RNF09).','VARCHAR(255)','NN','P','Origem: aplicação (login). Destino: somente verificação de login.','Nenhum perfil lê; uso exclusivo da rotina de autenticação'],
 ['perfil','Perfil que define o RBAC. Alteração só pelo Administrador e sempre auditada.',"ENUM('ATENDENTE','TECNICO','GERENTE','ADMINISTRADOR')",'NN','N'],
 ['ativo','1 ativo; 0 inativado (exclusão lógica, RN10).','TINYINT(1)','NN,DEF 1','N'],
 ['tentativas_login','Falhas consecutivas de login; 5 bloqueiam a conta (RF14).','TINYINT','NN,DEF 0','N'],
 ['data_bloqueio_ate','Fim do bloqueio (NOW() + 15 min após 5 falhas).','DATETIME','NULL','N'],
 ['data_cadastro','Instante de criação do registro.','DATETIME',TS,'N']]},
{n:'cliente',d:'Pessoa física ou jurídica atendida na loja; titular dos dados pessoais (LGPD). Anonimização irreversível apenas por sp_anonimizar_cliente.',
 lin:'Origem: cadastro no balcão (RF01). Destino: aparelho, venda, endereco, consentimento_cliente, solicitacao_titular.',rbac:'At: C R U I | Téc: R | Ger: C R U I | Adm: C R U I',c:[
 ['id_cliente','Identificador do cliente; preservado após anonimização.','INT','PK,AI,NN','N'],
 ['nome','Nome completo; vira "ANONIMIZADO" na anonimização.','VARCHAR(100)','NN','P'],
 ['cpf_cnpj','Somente dígitos (11 CPF ou 14 CNPJ); dígitos verificadores validados na aplicação; NULL após anonimização.','VARCHAR(14)','UQ,NULL,CK','P'],
 ['whatsapp','Dígitos com DDI; base do link wa.me (RF04); NULL após anonimização.','VARCHAR(13)','NULL','P'],
 ['email','E-mail opcional.','VARCHAR(100)','NULL','P'],
 ['ativo','1 ativo; 0 inativado. Inativo não recebe OS nem venda (RN11).','TINYINT(1)','NN,DEF 1','N'],
 ['anonimizado','1 após anonimização. CHECK (anonimizado = 0 OR ativo = 0).','TINYINT(1)','NN,DEF 0,CK','N'],
 ['data_cadastro','Instante de criação do registro.','DATETIME',TS,'N'],
 ['data_anonimizacao','Instante da anonimização.','DATETIME','NULL','N']]},
{n:'categoria',d:'Agrupamento de produtos (capas, películas, cabos, telas, baterias).',
 lin:'Origem: cadastro por Gerente/Administrador (RF05). Destino: produto.',rbac:'At: R | Téc: R | Ger: C R U I | Adm: C R U I',c:[
 ['id_categoria','Identificador da categoria.','INT','PK,AI,NN','N'],
 ['nome','Nome único da categoria.','VARCHAR(60)','UQ,NN','N'],
 ['ativo','1 ativa; 0 inativada.','TINYINT(1)','NN,DEF 1','N']]},
{n:'fornecedor',d:'Fornecedor das compras presenciais no Brás.',
 lin:'Origem: cadastro por Gerente/Administrador (RF13). Destino: produto, compra.',rbac:'At: - | Téc: - | Ger: C R U I | Adm: C R U I',c:[
 ['id_fornecedor','Identificador do fornecedor.','INT','PK,AI,NN','N'],
 ['nome','Nome ou razão social.','VARCHAR(100)','NN','N'],
 ['cnpj','CNPJ somente dígitos; único; aceita NULL.','CHAR(14)','UQ,NULL','N'],
 ['telefone','Telefone de contato.','VARCHAR(20)','NULL','P'],
 ['ativo','1 ativo; 0 inativado.','TINYINT(1)','NN,DEF 1','N']]},
{n:'produto',d:'Acessórios e peças de reposição. O saldo só muda por movimentações de mov_estoque (RN07).',
 lin:'Origem: cadastro (RF05); saldo mantido por triggers de mov_estoque. Destino: item_venda, item_os, item_compra, mov_estoque, vw_lista_compras_bras.',rbac:'At: R | Téc: R | Ger: C R U I | Adm: C R U I',c:[
 ['id_produto','Identificador do produto.','INT','PK,AI,NN','N'],
 ['id_categoria','Categoria do produto.','INT','FK:categoria,NN','N'],
 ['id_fornecedor','Fornecedor habitual.','INT','FK:fornecedor,NN','N'],
 ['descricao','Descrição comercial.','VARCHAR(150)','NN','N'],
 ['codigo_barras','Código de barras/SKU opcional e único.','VARCHAR(50)','UQ,NULL','N'],
 ['preco_custo','Custo atual; deve ser >= 0; reconciliável com a última item_compra.','DECIMAL(12,2)','NN,CK','N','Origem: compra (item_compra). Destino: cópia congelada em item_*.','Ger/Adm: R U; At e Téc sem acesso (margens, RNF01)'],
 ['preco_venda','Preço de venda atual; deve ser > 0.','DECIMAL(12,2)','NN,CK','N'],
 ['saldo_estoque','Saldo físico; nunca negativo; alterado só por triggers (RN07).','INT UNSIGNED','NN,DEF 0,CK','N','Origem: triggers de mov_estoque. Destino: RF06, RN01.','Leitura: todos; escrita só por trigger'],
 ['estoque_minimo','Limite que dispara a lista de compras (RN04); >= 0.','INT UNSIGNED','NN,CK','N'],
 ['estoque_ideal','Meta de reposição; quantidade sugerida = ideal - saldo.','INT UNSIGNED','NN','N'],
 ['ativo','0 impede uso em novas vendas e OS (RN11).','TINYINT(1)','NN,DEF 1','N'],
 ['data_cadastro','Instante de criação do registro.','DATETIME',TS,'N']]},
{n:'endereco',d:'Endereço do cliente. Removido fisicamente na anonimização (não é tabela financeira).',
 lin:'Origem: cadastro do cliente (RF01). Destino: consulta de atendimento e exportação LGPD (RF16).',rbac:'At: C R U I | Téc: R | Ger: C R U I | Adm: C R U I',c:[
 ['id_endereco','Identificador do endereço.','INT','PK,AI,NN','N'],
 ['id_cliente','Cliente titular.','INT','FK:cliente,NN','N'],
 ['logradouro','Rua ou avenida.','VARCHAR(100)','NN','P'],
 ['numero','Número do imóvel.','VARCHAR(10)','NN','P'],
 ['complemento','Complemento opcional.','VARCHAR(50)','NULL','P'],
 ['bairro','Bairro (depende do CEP; exceção (a) à 3FN).','VARCHAR(60)','NN','P'],
 ['cidade','Cidade.','VARCHAR(60)','NN','P'],
 ['uf','Sigla do estado.','CHAR(2)','NN','P'],
 ['cep','8 dígitos numéricos.','CHAR(8)','NN,CK','P']]},
{n:'consentimento_cliente',d:'Prova de consentimento por finalidade (LGPD, art. 7º, I) e sua revogação. Mantida após anonimização, sem dados pessoais.',
 lin:'Origem: aceite registrado no cadastro (RF01/RF16). Destino: validação do RF04.',rbac:'At: C R U I | Téc: R | Ger: C R U I | Adm: C R U I',c:[
 ['id_consentimento_cliente','Identificador do consentimento.','INT','PK,AI,NN','N'],
 ['id_cliente','Cliente titular.','INT','FK:cliente,NN','N'],
 ['finalidade','Finalidade do tratamento (hoje apenas WHATSAPP).',"ENUM('WHATSAPP')",'NN','N'],
 ['data_consentimento','Data/hora do aceite.','DATETIME','NN','N'],
 ['data_revogacao','Se preenchida, o consentimento está revogado.','DATETIME','NULL','N']]},
{n:'aparelho',d:'Celular deixado para conserto.',
 lin:'Origem: recepção da OS (RF02). Destino: ordem_servico, aparelho_imei, consulta de garantia (RF09).',rbac:'At: C R U | Téc: C R U | Ger: C R U | Adm: C R U',c:[
 ['id_aparelho','Identificador do aparelho.','INT','PK,AI,NN','N'],
 ['id_cliente','Proprietário do aparelho.','INT','FK:cliente,NN','N'],
 ['marca','Marca (texto livre; exceção (g)).','VARCHAR(50)','NN','N'],
 ['modelo','Modelo (texto livre; exceção (g)).','VARCHAR(50)','NN','N'],
 ['numero_serie','Número de série; limpo na anonimização sem garantia vigente.','VARCHAR(50)','NULL','P']]},
{n:'aparelho_imei',d:'IMEIs de cada aparelho (1FN): até dois, um por slot.',
 lin:'Origem: recepção da OS (RF02). Destino: busca de garantia por IMEI (RF09).',rbac:'At: C R U | Téc: C R U | Ger: C R U | Adm: C R U',c:[
 ['id_aparelho_imei','Identificador do registro de IMEI.','INT','PK,AI,NN','N'],
 ['id_aparelho','Aparelho dono do IMEI.','INT','FK:aparelho,NN','N'],
 ['imei','15 dígitos; único; dígito verificador validado na aplicação.','CHAR(15)','UQ,NN,CK','P'],
 ['slot','Posição do chip: 1 ou 2.','TINYINT','NN,CK','N']]},
{n:'solicitacao_titular',d:'Pedidos do titular (LGPD, art. 18): acesso, correção, anonimização e portabilidade; resposta em até 15 dias.',
 lin:'Origem: atendimento ao titular (RF16). Destino: sp_anonimizar_cliente e exportação CSV/JSON.',rbac:'At: C | Téc: - | Ger: C R U | Adm: C R U',c:[
 ['id_solicitacao_titular','Identificador da solicitação.','INT','PK,AI,NN','N'],
 ['id_cliente','Titular solicitante.','INT','FK:cliente,NN','N'],
 ['tipo','Direito exercido.',"ENUM('ACESSO','CORRECAO','ANONIMIZACAO','PORTABILIDADE')",'NN','N'],
 ['data_solicitacao','Instante do pedido.','DATETIME',TS,'N'],
 ['data_atendimento','Instante da resposta ao titular.','DATETIME','NULL','N'],
 ['id_usuario','Operador que registrou/atendeu.','INT','FK:usuario,NN','N']]},
{n:'compra',d:'Compra presencial de estoque (Brás), digitada manualmente.',
 lin:'Origem: digitação do Gerente/Administrador (RF13). Destino: item_compra, mov_estoque (ENTRADA_COMPRA).',rbac:'At: - | Téc: - | Ger: C R | Adm: C R',c:[
 ['id_compra','Identificador da compra.','INT','PK,AI,NN','N'],
 ['id_fornecedor','Fornecedor da compra.','INT','FK:fornecedor,NN','N'],
 ['id_usuario','Operador que registrou (RN02).','INT','FK:usuario,NN','N'],
 ['data_hora','Instante do registro (forçado pelo banco).','DATETIME',TS,'N'],
 ['data_compra','Dia civil da compra.','DATE','NN','N'],
 ['numero_comprovante','Número do comprovante, opcional.','VARCHAR(50)','NULL','N']]},
{n:'item_compra',d:'Item de uma compra; imutável após gravado (RN10).',
 lin:'Origem: digitação da compra (RF13). Destino: mov_estoque e atualização de custo.',rbac:'At: - | Téc: - | Ger: C R | Adm: C R',c:[
 ['id_compra','Compra do item.','INT','PK,FK:compra,NN','N'],
 ['id_produto','Produto comprado (um por compra).','INT','PK,FK:produto,NN','N'],
 ['quantidade','Quantidade comprada.','INT UNSIGNED','NN','N'],
 ['preco_custo_unitario','Custo unitário congelado no ato (RN05).','DECIMAL(12,2)','NN','N']]},
{n:'caixa',d:'Turno de caixa de um operador. Máximo de 1 caixa aberto por operador (RN08).',
 lin:'Origem: abertura (RF11) e fechamento (RF08). Destino: venda, pagamento, mov_caixa, estorno.',rbac:'At: C R (próprio) | Téc: - | Ger: C R (todos) | Adm: R',c:[
 ['id_caixa','Identificador do caixa.','INT','PK,AI,NN','N'],
 ['id_usuario','Operador dono do caixa; UNIQUE (id_caixa, id_usuario) sustenta a FK composta de venda.','INT','FK:usuario,NN','N'],
 ['saldo_inicial','Saldo de abertura; >= 0.','DECIMAL(12,2)','NN,CK','N'],
 ['valor_contado','Valor contado pelo operador no fechamento; >= 0.','DECIMAL(12,2)','NULL,CK','N'],
 ['saldo_apurado','Saldo calculado pelo sistema no fechamento (exceção (c)).','DECIMAL(12,2)','NULL','N'],
 ['data_abertura','Instante de abertura.','DATETIME',TS,'N'],
 ['data_fechamento','Instante de fechamento; >= data_abertura.','DATETIME','NULL,CK','N'],
 ['caixa_aberto_chave','Coluna gerada: id_usuario se aberto, senão NULL; UNIQUE garante 1 caixa aberto.','INT','UQ,GEN STORED','N','Origem: derivada de id_usuario e data_fechamento.','Somente leitura (gerada)']]},
{n:'mov_caixa',d:'Suprimentos e sangrias; imutável (RN10).',
 lin:'Origem: operador no caixa aberto (RF08/RF11). Destino: fechamento e conferência do caixa.',rbac:'At: C R (próprio) | Téc: - | Ger: C R (todos) | Adm: R',c:[
 ['id_mov_caixa','Identificador da movimentação.','INT','PK,AI,NN','N'],
 ['id_caixa','Caixa da movimentação.','INT','FK:caixa,NN','N'],
 ['tipo','Suprimento ou sangria.',"ENUM('SUPRIMENTO','SANGRIA')",'NN','N'],
 ['valor','Valor, > 0.','DECIMAL(12,2)','NN,CK','N'],
 ['motivo','Justificativa.','VARCHAR(255)','NN','N'],
 ['data_hora','Instante do registro.','DATETIME',TS,'N']]},
{n:'venda',d:'Venda direta no balcão; gravada por sp_registrar_venda com baixa de estoque e pagamento na mesma transação.',
 lin:'Origem: balcão (RF07). Destino: item_venda, pagamento, mov_estoque, estorno, RF10.',rbac:'At: C R | Téc: - | Ger: C R | Adm: R',c:[
 ['id_venda','Identificador da venda.','INT','PK,AI,NN','N'],
 ['id_cliente','Cliente da venda (RN02, RN11).','INT','FK:cliente,NN','N'],
 ['id_caixa','Caixa; FK composta (id_caixa, id_usuario).','INT','FK:caixa,NN','N'],
 ['id_usuario','Operador; deve ser o dono do caixa (FK composta).','INT','FK:caixa,NN','N'],
 ['status_venda','CONCLUIDA ou ESTORNADA (derivado, exceção (f)).',"ENUM('CONCLUIDA','ESTORNADA')",'NN','N'],
 ['data_hora','Instante da venda (início da garantia de 90 dias, PR01).','DATETIME',TS,'N']]},
{n:'item_venda',d:'Item de uma venda com preços congelados (RN05); imutável (RN10).',
 lin:'Origem: balcão, preços copiados de produto por trigger. Destino: RF10, garantia (RF09), estorno.',rbac:'At: C R | Téc: - | Ger: C R | Adm: R',c:[
 ['id_venda','Venda do item.','INT','PK,FK:venda,NN','N'],
 ['id_produto','Produto vendido (um por venda).','INT','PK,FK:produto,NN','N'],
 ['quantidade','Quantidade vendida.','INT UNSIGNED','NN','N'],
 ['preco_unitario_venda','Preço no ato da venda; > 0.','DECIMAL(12,2)','NN,CK','N'],
 ['preco_custo_unitario','Custo no ato da venda, base da margem.','DECIMAL(12,2)','NN','N','Origem: produto.preco_custo por trigger. Destino: RF10.','Ger/Adm: R; At sem acesso à margem (RNF01)'],
 ['desconto_item','Desconto do item; >= 0; acima de 10% exige Gerente/Admin (RN12).','DECIMAL(12,2)','NN,DEF 0,CK','N']]},
{n:'ordem_servico',d:'Ordem de serviço de manutenção, com máquina de estados (seção 4.1), orçamento aprovado e garantia legal de 90 dias.',
 lin:'Origem: recepção (RF02) e bancada (RF03). Destino: item_os, pagamento, mov_estoque, estorno, RF09, RF10.',rbac:'At: C R; entrega (U) | Téc: R U (até PRONTO) | Ger: C R U | Adm: C R U',c:[
 ['id_ordem_servico','Número único da OS.','INT','PK,AI,NN','N'],
 ['id_aparelho','Aparelho recebido; o cliente vem por ele (RN02).','INT','FK:aparelho,NN','N'],
 ['id_usuario','Operador que abriu a OS.','INT','FK:usuario,NN','N'],
 ['id_usuario_tecnico','Técnico responsável, opcional.','INT','FK:usuario,NULL','N'],
 ['status_os','Estado da OS; transições conforme RN03.',"ENUM('ABERTO','DIAGNOSTICO','AGUARDANDO_PECA','EM_REPARO','PRONTO','ENTREGUE','CANCELADO')",'NN','N'],
 ['defeito_relatado','Queixa do cliente; substituída por "ANONIMIZADO" na anonimização.','TEXT','NN','P'],
 ['estado_fisico_relatorio','Estado prévio do aparelho, obrigatório (PR04).','TEXT','NN','P'],
 ['acessorio_deixado','Acessórios deixados com o aparelho.','VARCHAR(255)','NULL','N'],
 ['senha_desbloqueio','Senha do aparelho, cifrada AES-256 com chave fora do banco; NULL após ENTREGUE (PR05). Classificada como alto risco.','VARBINARY(255)','NULL','S','Origem: coleta pelo Técnico (se necessária). Destino: descarte (NULL) na entrega.','Técnico via aplicação durante o reparo; demais negado'],
 ['observacao_tecnica','Notas do Técnico.','TEXT','NULL','N'],
 ['valor_mao_obra','Mão de obra; >= 0; travada após aprovação (PR02).','DECIMAL(12,2)','NN,DEF 0,CK','N'],
 ['aprovado_cliente','1 após aprovação do orçamento; exigido para EM_REPARO (RN03).','TINYINT(1)','NN,DEF 0','N'],
 ['data_criacao','Instante de abertura da OS.','DATETIME',TS,'N'],
 ['data_orcamento','Data do orçamento (validade de 10 dias, PR02).','DATETIME','NULL','N'],
 ['data_aprovacao','Data da aprovação pelo cliente.','DATETIME','NULL','N'],
 ['data_entrega','Entrega ao cliente; início da garantia (PR01).','DATETIME','NULL','N'],
 ['data_fim_garantia','data_entrega + 90 dias, congelada por trigger (exceção (d)).','DATE','NULL','N'],
 ['data_cancelamento','Instante do cancelamento.','DATETIME','NULL','N'],
 ['motivo_cancelamento','Justificativa do cancelamento.','VARCHAR(255)','NULL','N']]},
{n:'item_os',d:'Peça aplicada em uma OS, com preços congelados e tipo de peça (PR07). Alterável só enquanto aplicado = 0 e OS não final.',
 lin:'Origem: bancada (RF03), preços copiados de produto. Destino: mov_estoque (SAIDA_OS/RETORNO_OS), total da OS, RF10.',rbac:'At: R | Téc: C R U | Ger: C R U | Adm: C R U',c:[
 ['id_ordem_servico','OS do item.','INT','PK,FK:ordem_servico,NN','N'],
 ['id_produto','Peça utilizada (uma linha por produto).','INT','PK,FK:produto,NN','N'],
 ['quantidade','Quantidade aplicada.','INT UNSIGNED','NN','N'],
 ['preco_unitario_venda','Preço congelado; > 0.','DECIMAL(12,2)','NN,CK','N'],
 ['preco_custo_unitario','Custo congelado, base da margem.','DECIMAL(12,2)','NN','N','Origem: produto.preco_custo por trigger. Destino: RF10.','Téc/Ger/Adm conforme matriz; margem restrita (RNF01)'],
 ['aplicado','1 quando a peça foi efetivamente aplicada (trava edição e remoção).','TINYINT(1)','NN,DEF 0','N'],
 ['tipo_peca','Peça não original exige autorização do cliente (PR07).',"ENUM('NOVA_ORIGINAL','NOVA_EQUIVALENTE','USADA')",'NN','N']]},
{n:'mov_estoque',d:'Histórico imutável de movimentações; arco exclusivo (CHECK) entre compra, venda, OS ou ajuste (exceção (j)).',
 lin:'Origem: compra, venda, OS, estorno e ajuste (RF13, RF07, RF03, RF12, RF15). Destino: produto.saldo_estoque por trigger.',rbac:'At: R | Téc: R | Ger: R | Adm: R (escrita só por triggers e RF15)',c:[
 ['id_mov_estoque','Identificador da movimentação.','BIGINT','PK,AI,NN','N'],
 ['id_produto','Produto movimentado.','INT','FK:produto,NN','N'],
 ['id_usuario','Operador responsável.','INT','FK:usuario,NN','N'],
 ['tipo_mov','Tipo e origem da movimentação.',"ENUM('ENTRADA_COMPRA','SAIDA_VENDA','SAIDA_OS','RETORNO_OS','ESTORNO_VENDA','ESTORNO_OS','AJUSTE_ENTRADA','AJUSTE_SAIDA')",'NN','N'],
 ['quantidade','Quantidade movimentada.','INT UNSIGNED','NN','N'],
 ['id_compra','Origem compra (apenas ENTRADA_COMPRA).','INT','FK:compra,NULL','N'],
 ['id_venda','Origem venda (SAIDA_VENDA, ESTORNO_VENDA).','INT','FK:venda,NULL','N'],
 ['id_ordem_servico','Origem OS (SAIDA_OS, RETORNO_OS, ESTORNO_OS).','INT','FK:ordem_servico,NULL','N'],
 ['motivo','Obrigatório em AJUSTE_*, com no mínimo 10 caracteres sem espaços.','VARCHAR(255)','NULL,CK','N'],
 ['data_hora','Instante da movimentação.','DATETIME',TS,'N']]},
{n:'pagamento',d:'Pagamento de venda ou OS no caixa; imutável. Registro manual, valor líquido sem troco (RN13).',
 lin:'Origem: balcão e entrega de OS (RF07, RF03). Destino: caixa (saldo_apurado), RF10, conciliação.',rbac:'At: C R | Téc: - | Ger: C R | Adm: R',c:[
 ['id_pagamento','Identificador do pagamento.','INT','PK,AI,NN','N'],
 ['id_caixa','Caixa que recebeu.','INT','FK:caixa,NN','N'],
 ['id_venda','Venda paga (exclusivo com OS).','INT','FK:venda,NULL','N'],
 ['id_ordem_servico','OS paga (exclusivo com venda).','INT','FK:ordem_servico,NULL','N'],
 ['forma_pagamento','Forma de recebimento.',FORMA,'NN','N'],
 ['valor','Valor pago, > 0.','DECIMAL(12,2)','NN,CK','N'],
 ['data_hora','Instante do pagamento.','DATETIME',TS,'N']]},
{n:'estorno',d:'Estorno total e único de venda ou OS, por Gerente ou Administrador; imutável.',
 lin:'Origem: Gerente/Administrador (RF12). Destino: mov_estoque (ESTORNO_*), caixa, RF10.',rbac:'At: - | Téc: - | Ger: C R | Adm: C R',c:[
 ['id_estorno','Identificador do estorno.','INT','PK,AI,NN','N'],
 ['id_venda','Venda estornada (exclusivo com OS).','INT','FK:venda,UQ,NULL','N'],
 ['id_ordem_servico','OS estornada (exclusivo com venda).','INT','FK:ordem_servico,UQ,NULL','N'],
 ['id_usuario','Autorizador do estorno.','INT','FK:usuario,NN','N'],
 ['id_caixa','Caixa da devolução.','INT','FK:caixa,NN','N'],
 ['motivo','Justificativa com no mínimo 10 caracteres.','VARCHAR(255)','NN','N'],
 ['forma_pagamento','Forma de devolução.',FORMA,'NN','N'],
 ['valor_devolvido','Valor devolvido, > 0 e <= total pago (RN13).','DECIMAL(12,2)','NN,CK','N'],
 ['data_hora','Instante do estorno.','DATETIME',TS,'N']]},
{n:'log_auditoria',d:'Trilha de auditoria append-only de INSERT/UPDATE; sem dados pessoais em claro (apenas nome do campo e hash SHA-256).',
 lin:'Origem: triggers das tabelas auditadas (RNF01). Destino: consulta do Administrador (RF17).',rbac:'At: - | Téc: - | Ger: - | Adm: R',c:[
 ['id_log_auditoria','Identificador do registro de log.','BIGINT','PK,AI,NN','N'],
 ['tabela_afetada','Tabela auditada.','VARCHAR(64)','NN','N'],
 ['operacao','Operação registrada; DELETE é proibido.',"ENUM('INSERT','UPDATE')",'NN','N'],
 ['chave_registro','Chave do registro afetado, ex.: id_produto=7.','VARCHAR(100)','NN','N'],
 ['valor_antigo','Estado anterior em JSON; dados pessoais apenas como hash.','JSON','NULL','N'],
 ['valor_novo','Estado novo em JSON; dados pessoais apenas como hash.','JSON','NULL','N'],
 ['id_usuario','Operador (de @id_usuario_app); obrigatório.','INT','FK:usuario,NN','N'],
 ['data_hora','Instante do evento.','DATETIME',TS,'N'],
 ['ip_origem','Endereço IP da conexão.','VARCHAR(45)','NN','P']]}
];

const BADGE = {P:['DP','dp'],S:['DPS','dps'],N:['N/A','na']};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const cons = s => s.split(',').map(k => '<b>[' + esc(k.replace(':', ' → ')) + ']</b>').join(' ');

const dict = document.getElementById('dict');
const nav = document.getElementById('nav');
T.forEach(t => {
  nav.insertAdjacentHTML('beforeend', `<li data-t="${t.n}"><a href="#${t.n}">${t.n}</a></li>`);
  const rows = t.c.map(c => {
    const b = BADGE[c[4]];
    return `<tr data-n="${esc(c[0])}"><td class="n">${esc(c[0])}</td><td>${esc(c[1])}</td><td class="c">${esc(c[2])}</td><td class="c">${cons(c[3])}</td>` +
      `<td><span class="badge ${b[1]}">${b[0]}</span></td><td>${esc(c[5] || t.lin)}</td><td>${esc(c[6] || t.rbac)}</td></tr>`;
  }).join('');
  dict.insertAdjacentHTML('beforeend',
    `<section id="${t.n}" class="card tbl" data-t="${t.n}"><h2>${t.n}</h2><p class="desc">${esc(t.d)}</p><div class="wrap"><table>` +
    `<thead><tr><th>Atributo</th><th>Descrição / Regra de Negócio</th><th>Tipo e Tamanho</th><th>Constraints</th><th>Privacidade (LGPD/GDPR)</th><th>Linhagem (Data Lineage)</th><th>Controle de Acesso (RBAC)</th></tr></thead>` +
    `<tbody>${rows}</tbody></table></div></section>`);
});

/* Filtro em tempo real por nome de tabela ou coluna */
const search = document.getElementById('search');
search.addEventListener('input', () => {
  const q = search.value.trim().toLowerCase();
  let shown = 0;
  document.querySelectorAll('section.tbl').forEach(sec => {
    const tableHit = !q || sec.dataset.t.includes(q);
    let any = false;
    sec.querySelectorAll('tbody tr').forEach(tr => {
      const hit = tableHit || tr.dataset.n.toLowerCase().includes(q);
      tr.hidden = !hit;
      any = any || hit;
    });
    sec.hidden = !any;
    nav.querySelector(`[data-t="${sec.dataset.t}"]`).hidden = !any;
    if (any) shown++;
  });
  document.getElementById('empty').hidden = shown > 0;
});

/* Tema claro/escuro */
const root = document.documentElement, themeBtn = document.getElementById('themeBtn');
const setTheme = m => { root.dataset.theme = m; themeBtn.textContent = m === 'dark' ? 'Modo claro' : 'Modo escuro'; try { localStorage.setItem('kf-theme', m); } catch (e) {} };
let saved = null; try { saved = localStorage.getItem('kf-theme'); } catch (e) {}
setTheme(saved || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'));
themeBtn.onclick = () => setTheme(root.dataset.theme === 'dark' ? 'light' : 'dark');

/* Sidebar responsiva */
const sidebar = document.getElementById('sidebar');
document.getElementById('menuBtn').onclick = () => sidebar.classList.toggle('open');
nav.addEventListener('click', e => { if (e.target.tagName === 'A') sidebar.classList.remove('open'); });

/* Modal do DER com Panzoom */
const modal = document.getElementById('modal'), img = document.getElementById('der'), stage = document.getElementById('stage');
let pz = null;
const fit = () => {
  const s = Math.min(stage.clientWidth / img.naturalWidth, stage.clientHeight / img.naturalHeight);
  pz.zoom(s, {animate: false}); pz.pan(0, 0, {animate: false});
  return s;
};
function openDer() {
  modal.hidden = false;
  const start = () => {
    if (!pz) {
      pz = Panzoom(img, {maxScale: 10, minScale: 0.02, cursor: 'grab'});
      stage.addEventListener('wheel', pz.zoomWithWheel);
    }
    fit();
  };
  img.complete && img.naturalWidth ? start() : img.addEventListener('load', start, {once: true});
}
document.getElementById('derBtn').onclick = openDer;
document.getElementById('zin').onclick = () => pz && pz.zoomIn();
document.getElementById('zout').onclick = () => pz && pz.zoomOut();
document.getElementById('zreset').onclick = () => pz && fit();
const closeDer = () => { modal.hidden = true; };
document.getElementById('zclose').onclick = closeDer;
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDer(); });
