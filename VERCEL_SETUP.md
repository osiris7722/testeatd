# Configuração Firebase no Vercel

## Passo 1: Vercel Environment Variables

No Vercel Dashboard:
1. Vai a: **Project → Settings → Environment Variables**
2. Adiciona estas 6 variáveis (copia os valores do teu Firebase Console):

```
REACT_APP_FIREBASE_API_KEY=AIzaSyAEvUvbhv2vXj8qa1G6r9S8HSr2cFUv_bM
REACT_APP_FIREBASE_AUTH_DOMAIN=studio-7634777517-713ea.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=studio-7634777517-713ea
REACT_APP_FIREBASE_STORAGE_BUCKET=studio-7634777517-713ea.firebasestorage.app
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=142898689875
REACT_APP_FIREBASE_APP_ID=1:142898689875:web:726d61b0a2590e7e4c93a6
```

**IMPORTANTE**: Cada uma tem de ter **Scope = Production** (não Development).

## Passo 2: Redeploy

Depois de adicionar/alterar env vars:
- Clica em **Deployments → Redeploy** (no deploy mais recente)
- Aguarda o build terminar (2-3 min)

## Passo 3: Verifica se funcionou

Abre no browser:
```
https://<teu-dominio-vercel>/?debug=1
```

Deves ver:
```
config: env            <-- TEM DE SER "env", não "fallback"
persistence: on        <-- Ideal, mas pode ser "off"
firebaseProjectId: studio-7634777517-713ea
```

Se vires `config: fallback`, volta ao Passo 1 (env vars não configuradas).

## Passo 4: Testa o quiosque

1. Abre: `https://<teu-dominio-vercel>/`
2. Clica num botão de feedback
3. Abre admin em: `https://<teu-dominio-vercel>/admin_rocha`
4. Login com utilizador de teste
5. Vai para o dashboard e confirma que o registo aparece em "Histórico"

Se os cliques ficarem "pendentes" ou "permission-denied", lê [README.md](./teste%20em%20react/testeatdreact/README.md) na secção "Firestore Rules".

## Troubleshooting

| Sintoma | Causa | Solução |
|---------|-------|--------|
| `config: fallback` | Env vars não no Vercel | Volta ao Passo 1 |
| `persistence: off` + "offline" | IndexedDB não allowed | Normal em modo privado/incógnito; testa em modo normal |
| `permission-denied` no quiosque | Firestore Rules bloqueando | Atualiza Rules no Firebase Console (copiar [firestore.rules](./teste%20em%20react/testeatdreact/firestore.rules)) |
| Dashboard mostra 0 | Nenhum registo existente | Faz alguns cliques no quiosque |

