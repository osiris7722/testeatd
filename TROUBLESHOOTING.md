🔧 TROUBLESHOOTING - Resolução de Problemas

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: ModuleNotFoundError: No module named 'firebase_admin'

✅ SOLUÇÃO:
   Instalar as dependências:
   
   python3 -m pip install -r requirements.txt

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: FileNotFoundError: studio-7634777517-713ea-...json

✅ SOLUÇÃO:
   O ficheiro de credenciais não foi encontrado. Certifique-se que:
   
   1. Está na raiz da pasta /testeatd
   2. O caminho em app.py está correto
   3. Verifique o nome exato do arquivo

   $ ls -la studio-*.json

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Firebase não inicializa (CredentialError)

✅ SOLUÇÃO:
   As credenciais podem estar inválidas. Verifique:
   
   1. Se o JSON está corrompido
   2. Se tem permissões de leitura
   3. Se a URL do Firestore está correta
   
   Isto é normal em desenvolvimento - a app continua com SQLite!

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Erro de conexão ao Firebase

✅ SOLUÇÃO:
   Verifique a ligação à internet:
   
   ping firebase.google.com
   
   Se não conseguir:
   - App continua funcionando com SQLite apenas
   - Dados sincronizam quando internet volta

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Dados não aparecem no Firebase Console

✅ SOLUÇÃO:
   1. Aguarde um momento (sincronização pode ser lenta)
   2. Atualize o navegador
   3. Verifique se firebase_db não é None:
      
      python3 -c "import app; print(app.firebase_db)"
   
   4. Consulte os logs da aplicação

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Porta 5000 já está em uso

✅ SOLUÇÃO:
   Mude a porta em app.py:
   
   # Adicione ao final do ficheiro:
   if __name__ == '__main__':
       app.run(debug=True, port=8000)

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: SQLite bloqueado (database is locked)

✅ SOLUÇÃO:
   1. Feche outras aplicações que usam feedback.db
   2. Apague a pasta __pycache__
   3. Reinicie a aplicação

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Timeout ao conectar Firebase

✅ SOLUÇÃO:
   Pode ser um problema de rede. Para evitar timeouts:
   
   1. Aumentar timeout em app.py
   2. Adicionar retry logic
   3. Usar configuração de fallback
   
   Exemplo:
   firebase_db = None
   try:
       # tentar conectar com timeout
   except Exception:
       # continuar sem Firebase

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Senhaadmin não funciona

✅ SOLUÇÃO:
   A senha padrão é: admin123
   
   Se quiser alterar, edite em app.py:
   
   ADMIN_PASSWORD = 'sua_nova_senha'

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Admin interface em branco

✅ SOLUÇÃO:
   1. Verifique se está logado (redirect para /admin_rocha)
   2. Verifique o console do navegador (F12) para erros
   3. Limpe cache e cookies
   4. Tente em navegador diferente

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Dados duplicados no Firestore

✅ SOLUÇÃO:
   Verifique a lógica de ID em app.py:
   
   feedback_id = cursor.lastrowid
   firebase_db.collection('feedback')\
              .document(f'feedback_{feedback_id}')\
              .set(data)
   
   Deve usar o mesmo ID do SQLite

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Autorização negada no Firestore

✅ SOLUÇÃO:
   Verifique as regras de segurança no Firebase Console:
   
   1. Console → Firestore Database
   2. Aba: Regras
   3. Adicione:
   
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }

═══════════════════════════════════════════════════════════════════════

❓ PROBLEMA: Aplicação muito lenta

✅ SOLUÇÃO:
   1. Firebase roda em thread separada (não deve atrasar)
   2. Se SQLite lento, considere índices
   3. Verifique conexão à internet
   
   CREATE INDEX idx_feedback_data ON feedback(data);

═══════════════════════════════════════════════════════════════════════

✅ TESTE RÁPIDO:

Executar script de testes:

   python3 test_firebase.py

Resultados esperados:
   ✓ PASS - Importações
   ✓ PASS - SQLite
   ✓ PASS - Firebase
   ✓ PASS - Criar Feedback

═══════════════════════════════════════════════════════════════════════

📞 AINDA COM PROBLEMAS?

1. Verificar logs da aplicação
2. Consultar a documentação:
   - FIREBASE_SETUP.md
   - FIREBASE_RESUMO.md
   - EXEMPLO_FLUXO.py
3. Testar com: python3 test_firebase.py
4. Verificar ficheiros em: ls -la *.py *.db *.json

═══════════════════════════════════════════════════════════════════════

💡 DICA DE DESENVOLVIMENTO:

Para debugging, use:

   python3 -c "import app; print(f'Firebase: {app.firebase_db}')"
   
   python3 -c "import sqlite3; conn = sqlite3.connect('feedback.db'); \
              print(conn.execute('SELECT COUNT(*) FROM feedback').fetchone())"

═══════════════════════════════════════════════════════════════════════
