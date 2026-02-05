# Sistema de Feedback de Satisfação

Aplicação web full-stack para coleta e análise de feedback de satisfação de usuários, **agora com Firebase integrado**.

## 🚀 Funcionalidades

### Interface de Feedback
- 3 botões de avaliação: Muito Satisfeito, Satisfeito, Insatisfeito
- Design responsivo (tablet, smartphone, desktop)
- Feedback visual após clique
- Bloqueio de múltiplos cliques consecutivos (timeout de 3 segundos)
- Registro automático de data, hora e dia da semana

### Armazenamento de Dados
**Híbrido (SQLite + Firebase):**
- **SQLite**: Armazenamento local rápido e confiável
- **Firebase Firestore**: Sincronização em nuvem e backup automático
- Criação automática de tabelas/coleções
- Campos: ID, grau de satisfação, data, hora, dia da semana, timestamp
- Persistência automática em ambos os locais

### Área Administrativa
- URL personalizada: `/admin_rocha`
- Proteção por senha (padrão: `admin123`)
- Estatísticas gerais e percentagens
- Gráficos (barras e circular) com Chart.js
- Análise temporal com filtros por dia
- Histórico completo com paginação
- Exportação de dados (CSV e TXT)

## 🛠️ Tecnologias

- **Backend**: Python 3 + Flask
- **Database**: SQLite
- **Frontend**: HTML5 + CSS3 + JavaScript
- **Gráficos**: Chart.js
- **Deploy**: Vercel

## 📦 Instalação

### 1. Clonar o repositório
```bash
git clone <seu-repositorio>
cd testeatd
```

### 2. Criar ambiente virtual
```bash
python3 -m venv venv
source venv/bin/activate  # No Windows: venv\Scripts\activate
```

### 3. Instalar dependências (inclui Firebase)
```bash
pip install -r requirements.txt
```

### 4. Executar localmente
```bash
python app.py
```

A aplicação estará disponível em `http://localhost:8000`

## 🔥 Firebase Integration

A aplicação agora sincroniza dados com Firebase Firestore:

- ✅ **SQLite**: Armazenamento local (sempre funciona)
- ✅ **Firebase**: Sincronização em nuvem
- ✅ **Redundância**: Dados em dois locais para segurança
- ✅ **Offline-first**: Funciona sem internet

**Ficheiros de configuração Firebase:**
- `studio-7634777517-713ea-firebase-adminsdk-fbsvc-7669723ac0.json` - Credenciais

**Documentação:**
- [FIREBASE_RESUMO.md](FIREBASE_RESUMO.md) - Resumo executivo
- [FIREBASE_SETUP.md](FIREBASE_SETUP.md) - Configuração detalhada
- [EXEMPLO_FLUXO.py](EXEMPLO_FLUXO.py) - Exemplos de fluxo

**Testar integração:**
```bash
python3 test_firebase.py
```

## 🔒 Segurança

**IMPORTANTE**: Antes do deploy, altere a senha do admin e Firebase:

```python
# Em app.py ou variáveis de ambiente
ADMIN_PASSWORD = 'sua_senha_segura_aqui'
app.secret_key = 'sua_chave_secreta_aqui'
```

**Firebase:**
- Credenciais estão no arquivo `.json` (não comitar)
- Configurar regras de segurança no Firebase Console
- Usar variáveis de ambiente em produção

## 🌐 Deploy no Vercel

### 1. Instalar Vercel CLI
```bash
npm i -g vercel
```

### 2. Fazer login
```bash
vercel login
```

### 3. Deploy
```bash
vercel
```

### 4. Deploy em produção
```bash
vercel --prod
```

**Nota**: Para produção com Firebase, configure variáveis de ambiente no Vercel:
- Firebase credentials (se necessário)
- Secret key
- Admin password

### Importante (Vercel + SQLite + Firebase)

- **Vercel é serverless**: o filesystem do projeto é **read-only**. O SQLite passa a ser guardado em `/tmp/feedback.db` (ephemeral).
    - Isto mantém o SQLite a funcionar (não removemos), mas os dados não são garantidos entre invocações.
    - Para dados persistentes em produção, o “source of truth” deve ser o **Firestore**.

- Para o Firestore ficar **Online no Preview/Production**, define no Vercel Environment Variables:
    - `FIREBASE_SERVICE_ACCOUNT_JSON` = conteúdo JSON completo do service account
    - (opcional) `FIREBASE_DATABASE_URL`
    - `SECRET_KEY`
    - `ADMIN_EMAILS` e/ou `ADMIN_EMAIL_DOMAIN` (recomendado)

## 🌐 Deploy “pelo Firebase” (Firebase Hosting + Cloud Run)

Se queres publicar o site mantendo o Flask (templates + `/api` + admin), usa:

- **Cloud Run** para correr o backend (container)
- **Firebase Hosting** para SSL/domínio e rewrite para o Cloud Run

O projeto já inclui `Dockerfile`, `firebase.json` e `.firebaserc`.

Passos detalhados: ver [FIREBASE_SETUP.md](FIREBASE_SETUP.md) na secção **Deploy (Firebase Hosting + Cloud Run)**.

## 📱 Acesso

- **Página principal**: `/`
- **Área administrativa**: `/admin_rocha`
- **Senha padrão**: `admin123`

## 📊 Funcionalidades da Área Admin

### Estatísticas
- Total de feedbacks por categoria
- Percentagens relativas
- Visualização em gráficos

### Análise Temporal
- Filtro por dia específico
- Visualização do dia atual
- Comparação entre diferentes dias

### Exportação
- CSV (compatível com Excel)
- TXT (relatório formatado)
- Filtros por intervalo de datas

### Histórico
- Tabela com todos os registros
- Ordenação por data/hora
- Paginação (50 registros por página)

## 🎨 Responsividade

A interface é totalmente responsiva e adaptável a:
- 📱 Smartphones (portrait e landscape)
- 📱 Tablets
- 💻 Desktops

## 📝 Estrutura do Projeto

```
testeatd/
├── app.py                         # Backend Flask (com Firebase)
├── config.py                      # Configurações (novo)
├── requirements.txt               # Dependências Python
├── test_firebase.py               # Testes Firebase (novo)
├── vercel.json                    # Configuração Vercel
├── FIREBASE_RESUMO.md             # Resumo Firebase (novo)
├── FIREBASE_SETUP.md              # Setup Firebase (novo)
├── EXEMPLO_FLUXO.py               # Exemplos de fluxo (novo)
├── studio-7634777517-713ea-firebase-adminsdk-fbsvc-7669723ac0.json  # Credenciais
├── templates/                     # Templates HTML
│   ├── index.html
│   ├── admin_login.html
│   └── admin_dashboard.html
└── static/                        # Arquivos estáticos
    ├── css/
    │   ├── style.css
    │   └── admin.css
    └── js/
        ├── main.js
        └── admin.js
```

## 🔄 Auto-refresh

O dashboard administrativo atualiza automaticamente a cada 30 segundos.

## 📄 Licença

Este projeto foi desenvolvido para fins educacionais.

## 👨‍💻 Autor

Desenvolvido como projeto acadêmico para avaliação de satisfação.
