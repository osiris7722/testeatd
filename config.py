"""
Configuração da aplicação Flask com Firebase
"""
import os
import firebase_admin
from firebase_admin import credentials, firestore

class Config:
    """Configuração base"""
    SECRET_KEY = os.environ.get('SECRET_KEY', 'sua_chave_secreta_aqui_mude_para_producao')
    DATABASE = 'feedback.db'
    ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', 'admin123')
    
    # Caminho para as credenciais do Firebase
    FIREBASE_CREDENTIALS = 'studio-7634777517-713ea-firebase-adminsdk-fbsvc-7669723ac0.json'
    FIREBASE_DB_URL = 'https://studio-7634777517-713ea.firebaseio.com'

class DevelopmentConfig(Config):
    """Configuração para desenvolvimento"""
    DEBUG = True

class ProductionConfig(Config):
    """Configuração para produção"""
    DEBUG = False

# Inicializar Firebase
def init_firebase():
    """Inicializa a conexão com Firebase"""
    try:
        if not firebase_admin._apps:  # Verifica se já foi inicializado
            cred = credentials.Certificate(Config.FIREBASE_CREDENTIALS)
            firebase_admin.initialize_app(cred, {
                'databaseURL': Config.FIREBASE_DB_URL
            })
        return firestore.client()
    except Exception as e:
        print(f"Aviso: Erro ao inicializar Firebase: {e}")
        print("A aplicação continuará funcionando apenas com SQLite")
        return None

# Obtém a configuração baseada no ambiente
config = os.environ.get('FLASK_ENV', 'development').lower()
if config == 'production':
    app_config = ProductionConfig()
else:
    app_config = DevelopmentConfig()
