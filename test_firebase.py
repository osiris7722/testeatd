#!/usr/bin/env python3
"""
Script de teste para verificar a integração Firebase + SQLite
"""
import sys
import os
from datetime import datetime

# Adicionar pasta ao path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_imports():
    """Teste 1: Verificar importações"""
    print("=" * 60)
    print("TESTE 1: Verificar Importações")
    print("=" * 60)
    try:
        import firebase_admin
        print("✓ firebase_admin importado")
        
        import app
        print("✓ app importado")
        
        return True
    except Exception as e:
        print(f"✗ Erro na importação: {e}")
        return False

def test_database():
    """Teste 2: Verificar SQLite"""
    print("\n" + "=" * 60)
    print("TESTE 2: Verificar SQLite")
    print("=" * 60)
    try:
        import sqlite3
        conn = sqlite3.connect('feedback.db')
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = cursor.fetchall()
        
        if tables:
            print("✓ Tabelas encontradas:")
            for table in tables:
                print(f"  - {table[0]}")
        
        # Contar registos
        cursor.execute("SELECT COUNT(*) FROM feedback")
        count = cursor.fetchone()[0]
        print(f"✓ Total de feedbacks no SQLite: {count}")
        
        conn.close()
        return True
    except Exception as e:
        print(f"✗ Erro no SQLite: {e}")
        return False

def test_firebase():
    """Teste 3: Verificar Firebase"""
    print("\n" + "=" * 60)
    print("TESTE 3: Verificar Firebase")
    print("=" * 60)
    try:
        import app
        
        if app.firebase_db is None:
            print("⚠ Firebase não está inicializado")
            return False
        
        print("✓ Firebase Firestore conectado")
        
        # Tentar ler dados
        try:
            docs = app.firebase_db.collection('feedback').limit(1).stream()
            count = 0
            for doc in docs:
                count += 1
                print(f"✓ Documento encontrado: {doc.id}")
            
            if count == 0:
                print("ℹ Nenhum documento no Firebase ainda (normal na primeira execução)")
        except Exception as e:
            print(f"⚠ Não foi possível ler dados: {e}")
        
        return True
    except Exception as e:
        print(f"✗ Erro no Firebase: {e}")
        return False

def test_create_feedback():
    """Teste 4: Criar um feedback de teste"""
    print("\n" + "=" * 60)
    print("TESTE 4: Criar Feedback de Teste")
    print("=" * 60)
    try:
        import sqlite3
        from datetime import datetime
        
        # Dados de teste
        grau_satisfacao = "muito_satisfeito"
        now = datetime.now()
        data_str = now.strftime('%Y-%m-%d')
        hora_str = now.strftime('%H:%M:%S')
        dias_semana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 
                       'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
        dia_semana = dias_semana[now.weekday()]
        
        # Guardar no SQLite
        conn = sqlite3.connect('feedback.db')
        cursor = conn.execute(
            'INSERT INTO feedback (grau_satisfacao, data, hora, dia_semana) VALUES (?, ?, ?, ?)',
            (grau_satisfacao, data_str, hora_str, dia_semana)
        )
        conn.commit()
        feedback_id = cursor.lastrowid
        conn.close()
        
        print(f"✓ Feedback criado no SQLite (ID: {feedback_id})")
        
        # Tentar guardar no Firebase
        import app
        if app.firebase_db:
            feedback_data = {
                'grau_satisfacao': grau_satisfacao,
                'data': data_str,
                'hora': hora_str,
                'dia_semana': dia_semana,
                'timestamp': now.isoformat()
            }
            app.firebase_db.collection('feedback').document(f'feedback_{feedback_id}').set(feedback_data)
            print(f"✓ Feedback sincronizado com Firebase")
        else:
            print("⚠ Firebase não está disponível, apenas SQLite foi usado")
        
        return True
    except Exception as e:
        print(f"✗ Erro ao criar feedback: {e}")
        return False

def main():
    """Executar todos os testes"""
    print("\n")
    print("╔" + "=" * 58 + "╗")
    print("║" + " TESTES DE INTEGRAÇÃO FIREBASE + SQLite ".center(58) + "║")
    print("╚" + "=" * 58 + "╝")
    
    results = []
    
    results.append(("Importações", test_imports()))
    results.append(("SQLite", test_database()))
    results.append(("Firebase", test_firebase()))
    results.append(("Criar Feedback", test_create_feedback()))
    
    # Resumo
    print("\n" + "=" * 60)
    print("RESUMO DOS TESTES")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status:8} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} testes passaram")
    
    if passed == total:
        print("\n🎉 Tudo está funcionando perfeitamente!")
        return 0
    else:
        print(f"\n⚠ {total - passed} teste(s) falharam")
        return 1

if __name__ == '__main__':
    sys.exit(main())
