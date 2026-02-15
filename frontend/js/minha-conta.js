/**
 * Minha Conta - Scopsy Lab
 * Lógica da página de gerenciamento de perfil e assinatura
 */

// API_URL vem do config.js (window.API_URL)

// ========================================
// PROTEÇÃO DE ROTA
// ========================================
(function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return;
    }
    // Carregar dados da conta
    loadAccountData();
})();

// ========================================
// ESTADO GLOBAL
// ========================================
let accountData = null;
let isEditMode = false;

// ========================================
// CARREGAR DADOS DA CONTA
// ========================================
async function loadAccountData() {
    try {
        const token = localStorage.getItem('token');

        const res = await fetch(`${API_URL}/api/account/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!res.ok) {
            if (res.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
                return;
            }
            throw new Error('Erro ao carregar dados');
        }

        accountData = await res.json();
        renderProfile(accountData.user);
        renderSubscription(accountData.subscription, accountData.user.plan, accountData.trial_days_left);

    } catch (error) {
        console.error('[MinhaConta] Erro:', error);
        showToast('Erro ao carregar dados da conta', 'error');
    }
}

// ========================================
// RENDERIZAR PERFIL
// ========================================
function renderProfile(user) {
    const setField = (id, value) => {
        const el = document.getElementById(id);
        if (el) el.textContent = value || '—';
    };

    setField('profileName', user.name);
    setField('profileEmail', user.email);
    setField('profileCRP', user.crp || 'Não informado');
    setField('profileCreatedAt', formatDate(user.created_at));
    setField('profileLastLogin', user.last_login ? formatDateRelative(user.last_login) : 'Nunca');

    // Aplicar classe muted quando CRP não informado
    const crpEl = document.getElementById('profileCRP');
    if (crpEl && !user.crp) crpEl.classList.add('muted');
    else if (crpEl) crpEl.classList.remove('muted');

    // Preencher form de edição
    const editName = document.getElementById('editName');
    const editEmail = document.getElementById('editEmail');
    const editCRP = document.getElementById('editCRP');

    if (editName) editName.value = user.name || '';
    if (editEmail) editEmail.value = user.email || '';
    if (editCRP) editCRP.value = user.crp || '';
}

// ========================================
// RENDERIZAR ASSINATURA
// ========================================
function renderSubscription(subscription, plan, trialDaysLeft) {
    const isPremium = plan === 'premium' || plan === 'pro';
    const status = subscription.status || 'inactive';

    // Badge do plano
    const badgeContainer = document.getElementById('planBadgeContainer');
    if (badgeContainer) {
        let badgeClass = 'free';
        let badgeText = '🔓 Conta Gratuita';

        if (isPremium && status === 'active') {
            badgeClass = 'premium';
            badgeText = '💎 Premium Ativa';
        } else if (isPremium && status === 'canceled') {
            badgeClass = 'canceled';
            badgeText = '❌ Premium Cancelada';
        } else if (isPremium && status === 'overdue') {
            badgeClass = 'overdue';
            badgeText = '⚠️ Pagamento Pendente';
        } else if (!isPremium && trialDaysLeft !== null && trialDaysLeft > 0) {
            badgeClass = 'trial';
            badgeText = `⏱️ Trial — ${trialDaysLeft} dias restantes`;
        } else if (!isPremium && trialDaysLeft !== null && trialDaysLeft === 0) {
            badgeClass = 'free';
            badgeText = '🔒 Trial Expirado';
        }

        badgeContainer.innerHTML = `<div class="plan-badge ${badgeClass}">${badgeText}</div>`;
    }

    // Status
    const statusEl = document.getElementById('subStatus');
    if (statusEl) {
        const statusMap = {
            'active': { text: '✅ Ativa', cssClass: 'success' },
            'inactive': { text: '⏸️ Inativa', cssClass: '' },
            'canceled': { text: '❌ Cancelada', cssClass: 'danger' },
            'overdue': { text: '⚠️ Pagamento atrasado', cssClass: 'warning' },
            'refunded': { text: '↩️ Reembolsada', cssClass: 'danger' }
        };
        const statusInfo = statusMap[status] || { text: status, cssClass: '' };
        statusEl.textContent = statusInfo.text;
        statusEl.className = `detail-value ${statusInfo.cssClass}`;
    }

    // Membro desde
    const startedEl = document.getElementById('subStarted');
    if (startedEl) {
        startedEl.textContent = subscription.started_at
            ? formatDate(subscription.started_at)
            : formatDate(accountData?.user?.created_at);
    }

    // Próxima cobrança (só premium ativa)
    const nextBillingRow = document.getElementById('subNextBillingRow');
    const nextBillingEl = document.getElementById('subNextBilling');
    if (isPremium && status === 'active' && subscription.next_billing) {
        if (nextBillingRow) nextBillingRow.style.display = 'flex';
        if (nextBillingEl) nextBillingEl.textContent = `${formatDate(subscription.next_billing)} — R$ 47,00`;
    }

    // Data de encerramento (se cancelada/refunded)
    const endedRow = document.getElementById('subEndedRow');
    const endedEl = document.getElementById('subEnded');
    if (subscription.ended_at && (status === 'canceled' || status === 'refunded')) {
        if (endedRow) endedRow.style.display = 'flex';
        if (endedEl) endedEl.textContent = formatDate(subscription.ended_at);
    }

    // Trial restante (se free com trial)
    const trialRow = document.getElementById('subTrialRow');
    const trialEl = document.getElementById('subTrialDays');
    if (!isPremium && trialDaysLeft !== null) {
        if (trialRow) trialRow.style.display = 'flex';
        if (trialEl) {
            if (trialDaysLeft > 0) {
                trialEl.textContent = `${trialDaysLeft} dia${trialDaysLeft > 1 ? 's' : ''}`;
            } else {
                trialEl.textContent = 'Expirado';
                trialEl.className = 'detail-value danger';
            }
        }
    }

    // CTA
    const ctaContainer = document.getElementById('subscriptionCTA');
    if (ctaContainer) {
        if (isPremium && status === 'active') {
            // Premium ativa → link para gerenciar no Kiwify
            ctaContainer.innerHTML = `
        <a href="https://dashboard.kiwify.com.br/" target="_blank" rel="noopener" class="btn-kiwify-portal">
          <i data-lucide="external-link" width="16" height="16"></i>
          Gerenciar Pagamento no Kiwify
        </a>
        <p style="font-size: 0.82rem; color: var(--text-light); text-align: center; margin-top: 8px;">
          Gerencie cartão, parcelas e cobrança diretamente na plataforma Kiwify
        </p>
      `;
        } else if (isPremium && (status === 'canceled' || status === 'refunded')) {
            // Premium cancelada → reativar
            ctaContainer.innerHTML = `
        <a href="upgrade.html" class="btn-upgrade-cta">
          🔄 Reativar Assinatura — R$ 47/mês
        </a>
      `;
        } else {
            // Free/Trial → upgrade
            ctaContainer.innerHTML = `
        <a href="upgrade.html" class="btn-upgrade-cta">
          💎 Fazer Upgrade — R$ 47/mês
        </a>
        <p style="font-size: 0.82rem; color: var(--text-light); text-align: center; margin-top: 8px;">
          Desafios ilimitados • Jornada Clínica • Gamificação completa
        </p>
      `;
        }

        // Re-inicializar ícones Lucide no conteúdo injetado
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// ========================================
// EDIÇÃO DE PERFIL
// ========================================
function toggleEditMode() {
    isEditMode = !isEditMode;

    const viewMode = document.getElementById('profileView');
    const editForm = document.getElementById('profileEditForm');
    const btnEdit = document.getElementById('btnEditProfile');

    if (isEditMode) {
        if (viewMode) viewMode.style.display = 'none';
        if (editForm) editForm.classList.add('active');
        if (btnEdit) btnEdit.style.display = 'none';

        // Focus no nome
        setTimeout(() => {
            const editName = document.getElementById('editName');
            if (editName) editName.focus();
        }, 100);
    } else {
        if (viewMode) viewMode.style.display = 'block';
        if (editForm) editForm.classList.remove('active');
        if (btnEdit) btnEdit.style.display = 'inline-flex';
    }
}

async function saveProfile(event) {
    event.preventDefault();

    const btnSave = document.getElementById('btnSaveProfile');
    const originalText = btnSave.textContent;
    btnSave.textContent = 'Salvando...';
    btnSave.disabled = true;

    try {
        const token = localStorage.getItem('token');
        const name = document.getElementById('editName').value.trim();
        const crp = document.getElementById('editCRP').value.trim();

        // Validação client-side
        if (name.length < 2) {
            showToast('Nome deve ter no mínimo 2 caracteres', 'error');
            btnSave.textContent = originalText;
            btnSave.disabled = false;
            return;
        }

        if (crp && !/^\d{2}\/\d{4,6}$/.test(crp)) {
            showToast('CRP deve estar no formato XX/XXXXXX', 'error');
            btnSave.textContent = originalText;
            btnSave.disabled = false;
            return;
        }

        const res = await fetch(`${API_URL}/api/account/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, crp })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Erro ao salvar');
        }

        // Atualizar dados locais
        if (data.user) {
            accountData.user = { ...accountData.user, ...data.user };

            // Atualizar localStorage para que o dashboard reflita as mudanças 
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            storedUser.name = data.user.name;
            storedUser.crp = data.user.crp;
            localStorage.setItem('user', JSON.stringify(storedUser));
        }

        renderProfile(accountData.user);
        toggleEditMode();
        showToast('✅ Perfil atualizado com sucesso!', 'success');

    } catch (error) {
        console.error('[MinhaConta] Erro ao salvar:', error);
        showToast(error.message || 'Erro ao salvar perfil', 'error');
    } finally {
        btnSave.textContent = originalText;
        btnSave.disabled = false;
    }
}

// ========================================
// UTILIDADES
// ========================================
function formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

function formatDateRelative(dateStr) {
    if (!dateStr) return '—';
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Agora mesmo';
        if (diffMins < 60) return `Há ${diffMins} min`;
        if (diffHours < 24) return `Há ${diffHours}h`;
        if (diffDays === 0) return 'Hoje';
        if (diffDays === 1) return 'Ontem';
        if (diffDays < 7) return `Há ${diffDays} dias`;

        return formatDate(dateStr);
    } catch {
        return formatDate(dateStr);
    }
}

function showToast(message, type = 'success') {
    // Remover toast existente
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Auto-remover após 3.5s
    setTimeout(() => {
        toast.classList.add('hide');
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}

// ========================================
// ALTERAR SENHA
// ========================================
function openPasswordModal(e) {
    if (e) e.preventDefault();
    const modal = document.getElementById('passwordModal');
    if (modal) modal.style.display = 'flex';

    // Limpar campos
    const form = document.getElementById('passwordForm');
    if (form) form.reset();
}

function closePasswordModal() {
    const modal = document.getElementById('passwordModal');
    if (modal) modal.style.display = 'none';
}

// Fechar modal ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('passwordModal');
    if (e.target === modal) closePasswordModal();
});

async function changePassword(event) {
    event.preventDefault();

    const btn = document.getElementById('btnChangePassword');
    const originalText = btn.textContent;
    btn.textContent = 'Alterando...';
    btn.disabled = true;

    try {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            showToast('As senhas não conferem', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showToast('Nova senha deve ter no mínimo 8 caracteres', 'error');
            return;
        }

        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/api/account/password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Erro ao alterar senha');
        }

        closePasswordModal();
        showToast('Senha alterada com sucesso!', 'success');

    } catch (error) {
        console.error('[MinhaConta] Erro ao alterar senha:', error);
        showToast(error.message || 'Erro ao alterar senha', 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
// ========================================
// SUPORTE
// ========================================
function openSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) {
        modal.style.display = 'flex';
        // Reset form
        const form = document.getElementById('supportForm');
        if (form) form.reset();
        // Focus no assunto
        setTimeout(() => document.getElementById('supportSubject').focus(), 100);
    }
}

function closeSupportModal() {
    const modal = document.getElementById('supportModal');
    if (modal) modal.style.display = 'none';
}

// Fechar ao clicar fora
document.addEventListener('click', (e) => {
    const modal = document.getElementById('supportModal');
    if (e.target === modal) closeSupportModal();
});

async function submitSupportRequest(event) {
    event.preventDefault();

    const btn = document.getElementById('btnSendSupport');
    const originalText = btn.textContent;
    btn.textContent = 'Enviando...';
    btn.disabled = true;

    try {
        const subject = document.getElementById('supportSubject').value;
        const message = document.getElementById('supportMessage').value;
        const token = localStorage.getItem('token');

        if (!subject || !message) {
            showToast('Preencha todos os campos', 'error');
            return;
        }

        const res = await fetch(`${API_URL}/api/support`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ subject, message })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.error || 'Erro ao enviar mensagem');
        }

        closeSupportModal();
        showToast('✅ Mensagem enviada com sucesso! Responderemos em breve.', 'success');

    } catch (error) {
        console.error('[MinhaConta] Erro ao enviar suporte:', error);
        showToast(error.message || 'Erro ao enviar mensagem', 'error');
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
