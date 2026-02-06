# TesteATD (React + Firebase)

Versão SPA (Create React App) do quiosque + admin, usando **apenas Firebase (Auth + Firestore)**.

## Rotas

- `/` — Quiosque (submeter feedback)
- `/admin_rocha` — Login admin
- `/admin_rocha/dashboard` — Dashboard (protegido)
- `/admin_rocha/tv` — Modo TV (protegido)

## Configuração Firebase

1) Copie o ficheiro `.env.example` para `.env` e preencha os valores `REACT_APP_FIREBASE_*`.

Se a app disser que está offline e vires pedidos do Firestore “pendentes”, experimenta definir `REACT_APP_FIRESTORE_FORCE_LONG_POLLING=1` no `.env` e reiniciar `npm start`.

2) No Firebase Console:

- Authentication → ative **Email/Password** e crie utilizadores admin
- Firestore → crie a base (modo produção ou teste)

Coleção usada: `feedback`.

## Acesso Admin (opcional)

Para limitar quem entra no admin, configure UM destes env vars:

- `REACT_APP_ADMIN_EMAILS` (lista separada por vírgulas)
- `REACT_APP_ADMIN_EMAIL_DOMAIN` (ex.: `minhaescola.pt`)

Se não configurar nenhum, qualquer utilizador autenticado no Firebase Auth consegue abrir o admin.

## Scripts

- `npm install`
- `npm start`
- `npm run build`
