# Integração Firebase - Guia de Configuração

## O que foi feito

✓ **Firebase + SQLite Integrado**: A aplicação agora guarda dados em ambos os lugares:
  - **SQLite**: Armazenamento local rápido e confiável
  - **Firebase Firestore**: Sincronização em tempo real e backup na nuvem

## Configuração

### 1. Credenciais Firebase
O ficheiro de credenciais está localizado na raiz do projeto:
```
studio-7634777517-713ea-firebase-adminsdk-fbsvc-7669723ac0.json
```

Este ficheiro contém as chaves de autenticação necessárias.

### 2. Instalação das Dependências
As dependências foram adicionadas ao `requirements.txt`:
```bash
python3 -m pip install -r requirements.txt
```

Pacotes instalados:
- `firebase-admin==6.2.0` - SDK oficial do Firebase para Python

### 3. Estrutura de Dados no Firebase

Os dados são armazenados em **Firestore** com a seguinte estrutura:

```
Firestore
└── feedback/
    ├── feedback_1/
    │   ├── id: 1
    │   ├── grau_satisfacao: "muito_satisfeito"
    │   ├── data: "2026-02-05"
    │   ├── hora: "14:30:00"
    │   ├── dia_semana: "Quinta-feira"
    │   └── timestamp: "2026-02-05T14:30:00.123456"
    ├── feedback_2/
    │   └── ...
```

## Como Funciona

### Fluxo de Dados

1. **Utilizador submete feedback** → API `/api/feedback`
2. **Dados guardados no SQLite** → Armazenamento local imediato
3. **Dados enviados para Firebase** → Sincronização na nuvem
4. **Se Firebase falhar** → Aplicação continua a funcionar normalmente com SQLite

### Código-chave

**app.py** - Inicialização do Firebase:
```python
firebase_db = None
try:
    if not firebase_admin._apps:
        cred = credentials.Certificate('studio-7634777517-713ea-firebase-adminsdk-fbsvc-7669723ac0.json')
        firebase_admin.initialize_app(cred, {
            'databaseURL': 'https://studio-7634777517-713ea.firebaseio.com'
        })
        firebase_db = firestore.client()
except Exception as e:
    print(f"⚠ Firebase não está disponível: {e}")
```

**Guardar dados em ambos os lugares**:
```python
# SQLite
conn = get_db()
cursor = conn.execute(
    'INSERT INTO feedback (grau_satisfacao, data, hora, dia_semana) VALUES (?, ?, ?, ?)',
    (grau_satisfacao, data_str, hora_str, dia_semana)
)
feedback_id = cursor.lastrowid

# Firebase
if firebase_db:
    firebase_db.collection('feedback').document(f'feedback_{feedback_id}').set(feedback_data)
```

## Variáveis de Ambiente (Opcional)

Para produção, recomenda-se usar variáveis de ambiente:

```bash
export SECRET_KEY="sua_chave_secreta_segura"
export ADMIN_PASSWORD="senha_admin_segura"
export FLASK_ENV="production"
```

## Firebase Web (Admin Login via Authentication)

O login do admin foi migrado para **Firebase Authentication (email + senha)** no browser e o backend valida o **ID Token** (endpoint `POST /api/admin/login/firebase`).

### 1) Ativar Email/Password no Firebase

No Firebase Console:

- **Authentication → Sign-in method → Email/Password → Enable**

Depois cria (ou garante que existe) um utilizador em:

- **Authentication → Users → Add user**

### 2) Configurar o Firebase Web config por variáveis de ambiente

O frontend do login lê a config via `FIREBASE_*` (não usa o ficheiro JSON do Admin SDK). No macOS/zsh podes exportar assim:

```bash
export FIREBASE_API_KEY="AIzaSyAEvUvbhv2vXj8qa1G6r9S8HSr2cFUv_bM"
export FIREBASE_AUTH_DOMAIN="studio-7634777517-713ea.firebaseapp.com"
export FIREBASE_PROJECT_ID="studio-7634777517-713ea"
export FIREBASE_STORAGE_BUCKET="studio-7634777517-713ea.firebasestorage.app"
export FIREBASE_MESSAGING_SENDER_ID="142898689875"
export FIREBASE_APP_ID="1:142898689875:web:726d61b0a2590e7e4c93a6"
export FIREBASE_MEASUREMENT_ID="G-3JZQJD550E"
```

Notas:

- A `apiKey` do Firebase Web **não é segredo** (é identificador do projeto), mas **as regras de acesso** devem ser protegidas via Auth/Regras do Firebase.
- Para o login funcionar, o mínimo costuma ser `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID`.

### 3) (Recomendado) Restringir quem pode ser admin

No backend podes restringir quem entra no dashboard com:

```bash
export ADMIN_EMAILS="admin1@exemplo.com,admin2@exemplo.com"
# ou
export ADMIN_EMAIL_DOMAIN="exemplo.com"
```

## Deploy no Vercel (importante)

### SQLite no Vercel

No Vercel (serverless), o filesystem do código é **read-only**. Por isso o SQLite **não pode** gravar em `feedback.db` na raiz.

Foi ajustado para usar automaticamente:

- `'/tmp/feedback.db'` quando `VERCEL=1`

Podes também forçar com:

```bash
export SQLITE_PATH="/tmp/feedback.db"
```

Nota: `'/tmp'` é **ephemeral** (pode limpar a cada cold start). Para dados persistentes em produção, o ideal é considerar o Firebase/Firestore como fonte principal (a app já sincroniza para lá).

### Persistência total no deploy (Firestore como primário)

Para ter **persistência total no Vercel**, a app foi ajustada para usar **Firestore como fonte de verdade** quando:

- `VERCEL=1` (automático no deploy), ou
- `FIRESTORE_PRIMARY=1`

Neste modo:

- `POST /api/feedback` **cria o registo diretamente no Firestore** e devolve um `id` sequencial.
- O dashboard (`/api/admin/*`) **lê do Firestore**, não do SQLite.
- O SQLite pode existir apenas como cache ephemeral em `/tmp` (opcional).

#### Coleções/Docs usados pelo modo persistente

- Coleção `feedback` (documentos `feedback_<id>`) com campos: `id`, `grau_satisfacao`, `data`, `hora`, `dia_semana`, `timestamp` e `createdAt`.
- Doc `_meta/feedbackStats`: contadores globais (`total`, `muito_satisfeito`, `satisfeito`, `insatisfeito`, `lastId`).
- Coleção `_meta_daily/<YYYY-MM-DD>`: contadores por dia.
- Doc `_meta/counters`: guarda `feedbackNextId` para gerar IDs sequenciais.

Se já tinhas dados antigos na coleção `feedback` antes desta funcionalidade de contadores, os contadores podem começar a 0. Para corrigir:

- Faz login no admin e chama `POST /api/admin/firestore/rebuild-meta`

Isto reconstrói `_meta/feedbackStats`, `_meta_daily/*` e ajusta `feedbackNextId`.

#### Variáveis de ambiente recomendadas (Vercel)

- `SECRET_KEY` (obrigatório para sessões do admin)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (obrigatório para o modo persistente)

Opcionais:

- `FIRESTORE_PRIMARY=1` (força Firestore como primário fora do Vercel)
- `WRITE_SQLITE_SHADOW=1` (escreve também no SQLite como “sombra”, mesmo no modo Firestore)
- `AUTO_REBUILD_FIRESTORE_META=1` (se `_meta/feedbackStats` não existir, tenta reconstruir automaticamente)
- `FIRESTORE_REBUILD_MAX_DOCS` (limite opcional para o auto-rebuild; `0` = sem limite)
- `FIRESTORE_FEEDBACK_COLLECTION`, `FIRESTORE_META_COLLECTION`, `FIRESTORE_DAILY_COLLECTION` (se quiseres renomear)

### Variáveis de ambiente recomendadas no Vercel

- `SECRET_KEY` (obrigatório para sessões de admin)
- `FIREBASE_SERVICE_ACCOUNT_JSON` (recomendado em vez de subir o ficheiro `.json` no repo)
- `ADMIN_EMAILS` ou `ADMIN_EMAIL_DOMAIN` (recomendado)

Também podes (opcional) definir o Firebase Web config via env vars:

- `FIREBASE_API_KEY`, `FIREBASE_AUTH_DOMAIN`, `FIREBASE_PROJECT_ID`, `FIREBASE_APP_ID` (e restantes)

### Endpoint para testar

Depois do deploy, testa:

- `/api/health`

Se isto responder, a função no Vercel está a ser invocada corretamente.

Para confirmar que o modo persistente está ativo, o `/api/health` devolve também:

- `storageMode: "firestore-primary"`

## Verifying Firebase Connection

Para verificar se Firebase está funcionando:

1. Aceda ao [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto: **studio-7634777517-713ea**
3. Vá para **Firestore Database**
4. Procure pela coleção **feedback**
5. Veja os documentos que estão sendo criados em tempo real

## Troubleshooting

### Firebase não inicializa?
- ✓ Verificar se o ficheiro JSON está na pasta correta
- ✓ Verificar as permissões do ficheiro
- ✓ Testar a ligação à internet
- ✓ Consultar logs da aplicação

### Dados não aparecem no Firebase?
- ✓ Verificar se `firebase_db` é `None`
- ✓ Consultar as regras de segurança do Firestore
- ✓ Verificar se as credenciais têm permissões de escrita

### Aplicação está lenta?
- ✓ SQLite continua a funcionar normalmente
- ✓ Firebase roda em thread separada (não bloqueia)
- ✓ Considerar cache ou índices no Firestore

## Próximas Etapas

1. **Configurar regras de segurança** no Firestore
2. **Criar índices** para queries mais rápidas
3. **Implementar backup automático** do SQLite
4. **Sincronizar dados históricos** do SQLite para Firebase

## Ficheiros Modificados

- `requirements.txt` - Adicionado firebase-admin
- `app.py` - Integração Firebase + tratamento de erros
- `config.py` - Novo ficheiro com configurações (optional)

---

**Nota**: A aplicação funciona mesmo se Firebase estiver indisponível. Todos os dados são sempre guardados no SQLite.
