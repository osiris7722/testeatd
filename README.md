# Sistema de Feedback de Satisfação

Aplicação web full-stack para coleta e análise de feedback de satisfação de usuários.

## 🚀 Funcionalidades

### Interface de Feedback
- 3 botões de avaliação: Muito Satisfeito, Satisfeito, Insatisfeito
- Design responsivo (tablet, smartphone, desktop)
- Feedback visual após clique
- Bloqueio de múltiplos cliques consecutivos (timeout de 3 segundos)
- Registro automático de data, hora e dia da semana

### Base de Dados
- SQLite com criação automática
- Campos: ID, grau de satisfação, data, hora, dia da semana
- Persistência automática de dados
- Consultas agregadas e filtros

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

### 3. Instalar dependências
```bash
pip install -r requirements.txt
```

### 4. Executar localmente
```bash
python app.py
```

A aplicação estará disponível em `http://localhost:5000`

## 🔒 Segurança

**IMPORTANTE**: Antes do deploy, altere a senha do admin em [app.py](app.py):

```python
ADMIN_PASSWORD = 'sua_senha_segura_aqui'
app.secret_key = 'sua_chave_secreta_aqui'
```

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

**Nota**: O Vercel não é ideal para aplicações com SQLite em produção. Para produção real, considere:
- PostgreSQL ou MySQL para banco de dados
- Heroku, Railway ou PythonAnywhere para hospedagem

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
├── app.py                 # Backend Flask
├── requirements.txt       # Dependências Python
├── vercel.json           # Configuração Vercel
├── templates/            # Templates HTML
│   ├── index.html
│   ├── admin_login.html
│   └── admin_dashboard.html
└── static/               # Arquivos estáticos
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
