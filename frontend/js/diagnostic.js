const API_URL = 'http://localhost:3000/api';
let currentCase = null;
let caseStartTime = null;
let selectedAnswer = null;

// Carregar stats ao iniciar
document.addEventListener('DOMContentLoaded', () => {
    loadStats();
    generateNewCase();
});

// Carregar estatísticas
async function loadStats() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/diagnostic/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        
        if (data.success) {
            document.getElementById('totalCases').textContent = data.progress.total_diagnoses || 0;
            document.getElementById('accuracy').textContent = 
                (data.progress.accuracy_rate || 0).toFixed(1) + '%';
            document.getElementById('xpPoints').textContent = data.progress.xp_points || 0;
        }
    } catch (error) {
        console.error('Erro ao carregar stats:', error);
    }
}

// Gerar novo caso
async function generateNewCase() {
    try {
        document.getElementById('caseContainer').innerHTML = '<div class="loading">Gerando caso...</div>';
        document.getElementById('feedbackContainer').innerHTML = '';

        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/diagnostic/generate-case`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                level: 'intermediate',
                category: 'anxiety'
            })
        });

        const data = await response.json();

        if (data.success) {
            currentCase = {
                ...data.case,
                case_id: data.case_id,
                from_cache: data.from_cache
            };
            caseStartTime = Date.now();
            selectedAnswer = null;
            renderCase(currentCase);
        } else {
            document.getElementById('caseContainer').innerHTML = 
                `<div class="case-card"><p>Erro ao gerar caso: ${data.error}</p></div>`;
        }
    } catch (error) {
        console.error('Erro ao gerar caso:', error);
        document.getElementById('caseContainer').innerHTML = 
            '<div class="case-card"><p>Erro ao conectar com o servidor</p></div>';
    }
}

// Renderizar caso
function renderCase(caseData) {
    const container = document.getElementById('caseContainer');
    
    const vignette = caseData.clinical_content?.vignette || 'Vinheta não disponível';
    const options = caseData.question_format?.options || [];

    container.innerHTML = `
        <div class="case-card">
            ${caseData.from_cache ? '<p style="color: #4CAF50; font-size: 12px;">✅ Caso do banco (cache)</p>' : '<p style="color: #FF9800; font-size: 12px;">⚠️ Caso novo</p>'}
            
            <h3>📋 Caso Clínico</h3>
            
            <div class="vignette">${vignette}</div>

            <h4>Qual é o diagnóstico mais provável?</h4>

            <div class="options-grid" id="optionsGrid">
                ${options.map((option, index) => `
                    <button class="option-button" data-answer="${option}" onclick="selectOption('${option}', this)">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </button>
                `).join('')}
            </div>

            <button class="submit-btn" id="submitBtn" onclick="submitAnswer()" disabled>
                Enviar Resposta
            </button>
        </div>
    `;
}

// Selecionar opção
function selectOption(answer, button) {
    // Remover seleção anterior
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.classList.remove('selected');
    });

    // Adicionar seleção
    button.classList.add('selected');
    selectedAnswer = answer;

    // Habilitar botão
    document.getElementById('submitBtn').disabled = false;
}

// Enviar resposta
async function submitAnswer() {
    if (!selectedAnswer) return;

    const submitBtn = document.getElementById('submitBtn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Processando...';

    const timeSpent = Math.floor((Date.now() - caseStartTime) / 1000);

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/diagnostic/submit-answer`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                case_id: currentCase.case_id,
                user_answer: selectedAnswer,
                correct_diagnosis: currentCase.diagnostic_structure?.correct_diagnosis,
                time_spent_seconds: timeSpent,
                case_data: currentCase
            })
        });

        const data = await response.json();

        if (data.success) {
            showResult(data.is_correct, data.feedback);
            loadStats(); // Atualizar stats
        } else {
            alert('Erro ao processar resposta');
        }
    } catch (error) {
        console.error('Erro ao enviar resposta:', error);
        alert('Erro ao conectar com o servidor');
    }

    submitBtn.textContent = 'Enviar Resposta';
}

// Mostrar resultado
function showResult(isCorrect, feedback) {
    // Marcar opções
    document.querySelectorAll('.option-button').forEach(btn => {
        btn.disabled = true;
        const answer = btn.dataset.answer;
        
        if (answer === currentCase.diagnostic_structure?.correct_diagnosis) {
            btn.classList.add('correct');
        } else if (answer === selectedAnswer && !isCorrect) {
            btn.classList.add('incorrect');
        }
    });

    // Mostrar feedback
    if (feedback && feedback.feedback_eco) {
        const feedbackContainer = document.getElementById('feedbackContainer');
        
        feedbackContainer.innerHTML = `
            <div class="feedback-card">
                <h3>${isCorrect ? '✅ Correto!' : '❌ Incorreto'}</h3>
                
                <div class="feedback-section">
                    <h4>📝 Explicação</h4>
                    <p>${feedback.feedback_eco.explicar?.what_happened || ''}</p>
                </div>

                <div class="feedback-section">
                    <h4>🔗 Conexão Teórica</h4>
                    <p>${feedback.feedback_eco.conectar?.theory_connection || ''}</p>
                </div>

                <div class="feedback-section">
                    <h4>🎯 Orientação</h4>
                    <p>${feedback.feedback_eco.orientar?.what_to_focus_next || ''}</p>
                </div>

                <button class="next-case-btn" onclick="generateNewCase()">
                    Próximo Caso →
                </button>
            </div>
        `;
    } else {
        document.getElementById('feedbackContainer').innerHTML = `
            <div class="feedback-card">
                <h3>${isCorrect ? '✅ Correto!' : '❌ Incorreto'}</h3>
                <p>Diagnóstico correto: ${currentCase.diagnostic_structure?.correct_diagnosis}</p>
                <button class="next-case-btn" onclick="generateNewCase()">
                    Próximo Caso →
                </button>
            </div>
        `;
    }
}