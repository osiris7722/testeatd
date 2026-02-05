"""
EXEMPLO: Como a integração Firebase + SQLite funciona

Este ficheiro demonstra o fluxo de dados na aplicação.
"""

# ============================================================================
# FLUXO 1: Utilizador submete um feedback
# ============================================================================

# Cliente (Frontend - JavaScript)
# ────────────────────────────────────────────────────────────────────────

"""
// Em templates/index.html ou static/js/main.js

fetch('/api/feedback', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify({
        grau_satisfacao: 'muito_satisfeito'
    })
})
.then(response => response.json())
.then(data => {
    console.log('Feedback recebido:', data);
    // Resposta esperada:
    // {
    //     "success": true,
    //     "message": "Obrigado pelo seu feedback!",
    //     "id": 4
    // }
});
"""


# Servidor (Backend - Flask + Firebase)
# ────────────────────────────────────────────────────────────────────────

"""
@app.route('/api/feedback', methods=['POST'])
def registrar_feedback():
    # 1. Recebe dados do cliente
    data = request.get_json()
    grau_satisfacao = data.get('grau_satisfacao')
    
    # 2. Prepara dados com timestamps
    now = datetime.now()
    data_str = now.strftime('%Y-%m-%d')
    hora_str = now.strftime('%H:%M:%S')
    
    feedback_data = {
        'grau_satisfacao': grau_satisfacao,
        'data': data_str,
        'hora': hora_str,
        'timestamp': now.isoformat()
    }
    
    # 3. PRIMEIRA ESCRITA: SQLite (Imediato)
    conn = get_db()
    cursor = conn.execute(
        'INSERT INTO feedback (...) VALUES (...)',
        (grau_satisfacao, data_str, hora_str, dia_semana)
    )
    conn.commit()
    feedback_id = cursor.lastrowid  # ID = 4
    conn.close()
    
    # 4. SEGUNDA ESCRITA: Firebase (Assíncrono)
    if firebase_db:  # Se Firebase está disponível
        firebase_db.collection('feedback')\
                   .document(f'feedback_{feedback_id}')\
                   .set(feedback_data)
        # Documento criado em: feedback/feedback_4
    
    # 5. Responde ao cliente
    return jsonify({
        'success': True,
        'message': 'Obrigado pelo seu feedback!',
        'id': feedback_id
    })
"""


# ============================================================================
# FLUXO 2: Estado da Base de Dados após a submissão
# ============================================================================

# SQLite (feedback.db)
# ────────────────────────────────────────────────────────────────────────
"""
SELECT * FROM feedback WHERE id = 4;

id | grau_satisfacao | data       | hora     | dia_semana    | timestamp
---+----------+-------+----------+----------+----------+
 4 | muito_satisfeito | 2026-02-05 | 14:30:45 | Quinta-feira  | 2026-02-05 14:30:45
"""


# Firebase Firestore (Cloud)
# ────────────────────────────────────────────────────────────────────────
"""
Collection: feedback
Document ID: feedback_4

{
    "grau_satisfacao": "muito_satisfeito",
    "data": "2026-02-05",
    "hora": "14:30:45",
    "dia_semana": "Quinta-feira",
    "timestamp": "2026-02-05T14:30:45.123456"
}
"""


# ============================================================================
# FLUXO 3: Recuperar dados via API
# ============================================================================

"""
GET /api/admin/stats

Resposta (dados do SQLite):
{
    "muito_satisfeito": 2,
    "satisfeito": 1,
    "insatisfeito": 0,
    "total": 3,
    "percentagens": {
        "muito_satisfeito": 66.67,
        "satisfeito": 33.33,
        "insatisfeito": 0
    }
}
"""


# ============================================================================
# FLUXO 4: Se Firebase está indisponível
# ============================================================================

"""
Exemplo: Sem conexão à internet

@app.route('/api/feedback', methods=['POST'])
def registrar_feedback():
    # ... código anterior ...
    
    # 1. SQLite SEMPRE funciona
    conn = get_db()
    cursor = conn.execute(...)  # ✓ Sucesso
    feedback_id = cursor.lastrowid  # Obtem ID = 5
    
    # 2. Firebase falha, mas não para a aplicação
    if firebase_db:  # None se inicialização falhou
        try:
            firebase_db.collection(...).set(...)
        except ConnectionError:
            print("⚠ Firebase indisponível, dados guardados no SQLite")
    
    # 3. Responde ao cliente normalmente
    return jsonify({'success': True, ...})  # ✓ Resposta OK
"""


# ============================================================================
# FLUXO 5: Sincronizar dados históricos (Opcional)
# ============================================================================

"""
Script para enviar dados antigos do SQLite para Firebase:

def sync_existing_data():
    conn = sqlite3.connect('feedback.db')
    cursor = conn.execute('SELECT * FROM feedback')
    
    for row in cursor:
        feedback_data = {
            'grau_satisfacao': row[1],
            'data': row[2],
            'hora': row[3],
            'dia_semana': row[4]
        }
        firebase_db.collection('feedback')\
                   .document(f'feedback_{row[0]}')\
                   .set(feedback_data)
    
    conn.close()
    print("✓ Sincronização concluída")

sync_existing_data()
"""


# ============================================================================
# RESUMO: O melhor dos dois mundos
# ============================================================================

"""
┌─────────────────────────────────────────────────────────────┐
│                    FIREBASE + SQLite                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  SQLITE                          FIREBASE                    │
│  ──────────────────────────      ──────────────────────────  │
│  ✓ Rápido & Local                ✓ Nuvem & Redundante        │
│  ✓ Sem dependência internet       ✓ Acesso remoto            │
│  ✓ Sempre funciona                ✓ Backup automático        │
│  ✓ Sem custos extra               ✓ Análise de dados         │
│  ✗ Sem sincronização              ✗ Requer internet          │
│  ✗ Risco de perda de dados        ✗ Custos adicionais        │
│                                                               │
│  QUANDO FIREBASE FALHA:                                      │
│  • Dados continuam sendo guardados no SQLite                │
│  • Utilizador não vê erro                                   │
│  • Quando internet voltar, dados sincronizam               │
│                                                               │
└─────────────────────────────────────────────────────────────┘
"""


print("""
╔═════════════════════════════════════════════════════════════╗
║              FLUXO COMPLETO DOCUMENTADO                     ║
╚═════════════════════════════════════════════════════════════╝

Este ficheiro contém exemplos práticos de:

1. Como dados são enviados (Cliente → Servidor)
2. Como são guardados (SQLite + Firebase)
3. Como são recuperados (API)
4. Como o sistema se comporta sem internet
5. Como sincronizar dados históricos

Para detalhes completos, consulte:
- FIREBASE_SETUP.md (configuração)
- FIREBASE_RESUMO.md (resumo executivo)
- app.py (código fonte)
""")
