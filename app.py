from flask import Flask, render_template, request, jsonify, session, redirect, url_for, send_file
from datetime import datetime
import sqlite3
import os
import csv
import io
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill

app = Flask(__name__)
app.secret_key = 'sua_chave_secreta_aqui_mude_para_producao'

# Configurações
DATABASE = 'feedback.db'
ADMIN_PASSWORD = 'admin123'  # Altere esta senha!

def get_db():
    """Conecta ao banco de dados SQLite"""
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Inicializa o banco de dados"""
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS feedback (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            grau_satisfacao TEXT NOT NULL,
            data TEXT NOT NULL,
            hora TEXT NOT NULL,
            dia_semana TEXT NOT NULL,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Inicializar banco de dados ao iniciar a aplicação
init_db()

@app.route('/')
def index():
    """Página principal com os botões de feedback"""
    return render_template('index.html')

@app.route('/api/feedback', methods=['POST'])
def registrar_feedback():
    """Registra o feedback do usuário"""
    try:
        data = request.get_json()
        grau_satisfacao = data.get('grau_satisfacao')
        
        if grau_satisfacao not in ['muito_satisfeito', 'satisfeito', 'insatisfeito']:
            return jsonify({'error': 'Grau de satisfação inválido'}), 400
        
        now = datetime.now()
        data_str = now.strftime('%Y-%m-%d')
        hora_str = now.strftime('%H:%M:%S')
        
        # Dias da semana em português
        dias_semana = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 
                       'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo']
        dia_semana = dias_semana[now.weekday()]
        
        conn = get_db()
        conn.execute(
            'INSERT INTO feedback (grau_satisfacao, data, hora, dia_semana) VALUES (?, ?, ?, ?)',
            (grau_satisfacao, data_str, hora_str, dia_semana)
        )
        conn.commit()
        conn.close()
        
        return jsonify({
            'success': True,
            'message': 'Obrigado pelo seu feedback!'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/admin_rocha', methods=['GET', 'POST'])
def admin_login():
    """Página de login do admin"""
    if request.method == 'POST':
        password = request.form.get('password')
        if password == ADMIN_PASSWORD:
            session['admin_logged_in'] = True
            return redirect(url_for('admin_dashboard'))
        else:
            return render_template('admin_login.html', error='Senha incorreta')
    
    # Se já estiver logado, redireciona para o dashboard
    if session.get('admin_logged_in'):
        return redirect(url_for('admin_dashboard'))
    
    return render_template('admin_login.html')

@app.route('/admin_rocha/dashboard')
def admin_dashboard():
    """Dashboard administrativo"""
    if not session.get('admin_logged_in'):
        return redirect(url_for('admin_login'))
    
    return render_template('admin_dashboard.html')

@app.route('/admin_rocha/logout')
def admin_logout():
    """Logout do admin"""
    session.pop('admin_logged_in', None)
    return redirect(url_for('admin_login'))

@app.route('/api/admin/stats')
def get_stats():
    """Retorna estatísticas gerais"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Não autorizado'}), 401
    
    try:
        conn = get_db()
        
        # Total por tipo de satisfação
        stats = conn.execute('''
            SELECT grau_satisfacao, COUNT(*) as total
            FROM feedback
            GROUP BY grau_satisfacao
        ''').fetchall()
        
        # Total geral
        total_geral = conn.execute('SELECT COUNT(*) as total FROM feedback').fetchone()['total']
        
        conn.close()
        
        # Calcular percentagens
        resultado = {
            'muito_satisfeito': 0,
            'satisfeito': 0,
            'insatisfeito': 0,
            'total': total_geral
        }
        
        percentagens = {
            'muito_satisfeito': 0,
            'satisfeito': 0,
            'insatisfeito': 0
        }
        
        for row in stats:
            grau = row['grau_satisfacao']
            total = row['total']
            resultado[grau] = total
            if total_geral > 0:
                percentagens[grau] = round((total / total_geral) * 100, 2)
        
        resultado['percentagens'] = percentagens
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/stats/daily')
def get_daily_stats():
    """Retorna estatísticas por dia"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Não autorizado'}), 401
    
    try:
        data_filtro = request.args.get('data')
        
        conn = get_db()
        
        if data_filtro:
            stats = conn.execute('''
                SELECT grau_satisfacao, COUNT(*) as total
                FROM feedback
                WHERE data = ?
                GROUP BY grau_satisfacao
            ''', (data_filtro,)).fetchall()
        else:
            # Retorna o dia atual
            hoje = datetime.now().strftime('%Y-%m-%d')
            stats = conn.execute('''
                SELECT grau_satisfacao, COUNT(*) as total
                FROM feedback
                WHERE data = ?
                GROUP BY grau_satisfacao
            ''', (hoje,)).fetchall()
        
        conn.close()
        
        resultado = {
            'muito_satisfeito': 0,
            'satisfeito': 0,
            'insatisfeito': 0
        }
        
        for row in stats:
            resultado[row['grau_satisfacao']] = row['total']
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/historico')
def get_historico():
    """Retorna o histórico de feedbacks"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Não autorizado'}), 401
    
    try:
        page = int(request.args.get('page', 1))
        per_page = int(request.args.get('per_page', 50))
        offset = (page - 1) * per_page
        
        conn = get_db()
        
        # Total de registros
        total = conn.execute('SELECT COUNT(*) as total FROM feedback').fetchone()['total']
        
        # Registros paginados
        registros = conn.execute('''
            SELECT id, grau_satisfacao, data, hora, dia_semana
            FROM feedback
            ORDER BY data DESC, hora DESC
            LIMIT ? OFFSET ?
        ''', (per_page, offset)).fetchall()
        
        conn.close()
        
        resultado = {
            'total': total,
            'page': page,
            'per_page': per_page,
            'total_pages': (total + per_page - 1) // per_page,
            'registros': [dict(row) for row in registros]
        }
        
        return jsonify(resultado)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/export/csv')
def export_csv():
    """Exporta dados em formato Excel"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Não autorizado'}), 401
    
    try:
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        conn = get_db()
        
        if data_inicio and data_fim:
            registros = conn.execute('''
                SELECT id, grau_satisfacao, data, hora, dia_semana
                FROM feedback
                WHERE data BETWEEN ? AND ?
                ORDER BY data, hora
            ''', (data_inicio, data_fim)).fetchall()
        else:
            registros = conn.execute('''
                SELECT id, grau_satisfacao, data, hora, dia_semana
                FROM feedback
                ORDER BY data, hora
            ''').fetchall()
        
        conn.close()
        
        # Criar workbook Excel
        wb = Workbook()
        ws = wb.active
        ws.title = "Feedback"
        
        # Cabeçalho com formatação
        header = ['ID', 'Grau de Satisfação', 'Data', 'Hora', 'Dia da Semana']
        ws.append(header)
        
        # Formatar cabeçalho
        header_fill = PatternFill(start_color="4472C4", end_color="4472C4", fill_type="solid")
        header_font = Font(bold=True, color="FFFFFF")
        
        for cell in ws[1]:
            cell.fill = header_fill
            cell.font = header_font
        
        # Adicionar dados
        grau_map = {
            'muito_satisfeito': 'Muito Satisfeito',
            'satisfeito': 'Satisfeito',
            'insatisfeito': 'Insatisfeito'
        }
        
        for row in registros:
            ws.append([
                row['id'],
                grau_map.get(row['grau_satisfacao'], row['grau_satisfacao']),
                row['data'],
                row['hora'],
                row['dia_semana']
            ])
        
        # Ajustar largura das colunas
        ws.column_dimensions['A'].width = 8
        ws.column_dimensions['B'].width = 20
        ws.column_dimensions['C'].width = 12
        ws.column_dimensions['D'].width = 12
        ws.column_dimensions['E'].width = 18
        
        # Salvar em memória
        output = io.BytesIO()
        wb.save(output)
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name=f'feedback_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/export/txt')
def export_txt():
    """Exporta dados em formato TXT"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Não autorizado'}), 401
    
    try:
        data_inicio = request.args.get('data_inicio')
        data_fim = request.args.get('data_fim')
        
        conn = get_db()
        
        if data_inicio and data_fim:
            registros = conn.execute('''
                SELECT id, grau_satisfacao, data, hora, dia_semana
                FROM feedback
                WHERE data BETWEEN ? AND ?
                ORDER BY data, hora
            ''', (data_inicio, data_fim)).fetchall()
        else:
            registros = conn.execute('''
                SELECT id, grau_satisfacao, data, hora, dia_semana
                FROM feedback
                ORDER BY data, hora
            ''').fetchall()
        
        conn.close()
        
        # Criar TXT em memória
        output = io.StringIO()
        output.write('=' * 80 + '\n')
        output.write('RELATÓRIO DE FEEDBACK DE SATISFAÇÃO\n')
        output.write('=' * 80 + '\n\n')
        
        grau_map = {
            'muito_satisfeito': 'Muito Satisfeito',
            'satisfeito': 'Satisfeito',
            'insatisfeito': 'Insatisfeito'
        }
        
        for row in registros:
            output.write(f"ID: {row['id']}\n")
            output.write(f"Grau de Satisfação: {grau_map.get(row['grau_satisfacao'], row['grau_satisfacao'])}\n")
            output.write(f"Data: {row['data']}\n")
            output.write(f"Hora: {row['hora']}\n")
            output.write(f"Dia da Semana: {row['dia_semana']}\n")
            output.write('-' * 80 + '\n\n')
        
        output.write(f"\nTotal de registros: {len(registros)}\n")
        output.write(f"Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}\n")
        
        # Preparar arquivo para download
        output.seek(0)
        return send_file(
            io.BytesIO(output.getvalue().encode('utf-8')),
            mimetype='text/plain',
            as_attachment=True,
            download_name=f'feedback_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.txt'
        )
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/dates')
def get_available_dates():
    """Retorna as datas disponíveis para filtragem"""
    if not session.get('admin_logged_in'):
        return jsonify({'error': 'Não autorizado'}), 401
    
    try:
        conn = get_db()
        dates = conn.execute('''
            SELECT DISTINCT data
            FROM feedback
            ORDER BY data DESC
        ''').fetchall()
        conn.close()
        
        return jsonify([row['data'] for row in dates])
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
