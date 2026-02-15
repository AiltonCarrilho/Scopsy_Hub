/**
 * EMAIL SERVICE
 * Envia emails transacionais usando Resend API
 * https://resend.com/docs/send-with-nodejs
 */

const logger = require('../config/logger');

// Resend SDK (instalar: npm install resend)
const { Resend } = require('resend');

// Inicializar Resend apenas se API key estiver configurada
let resend = null;
if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== 're_placeholder_for_dev') {
    resend = new Resend(process.env.RESEND_API_KEY);
    logger.info('✅ Resend email service initialized');
} else {
    logger.warn('⚠️ Resend API key not configured - emails will be logged only');
}

/**
 * Envia email de boas-vindas para novo assinante
 * @param {Object} user - Dados do usuário
 * @param {string} user.email - Email do usuário
 * @param {string} user.name - Nome do usuário
 * @param {string} temporaryPassword - Senha temporária gerada
 */
async function sendWelcomeEmail(user, temporaryPassword) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Scopsy Lab <noreply@scopsy.com.br>',
            to: [user.email],
            subject: '🎉 Bem-vindo ao Scopsy Lab!',
            html: getWelcomeEmailHTML(user.name, user.email, temporaryPassword)
        });

        if (error) {
            logger.error('[EMAIL] Erro ao enviar email de boas-vindas', {
                error: error.message,
                email: user.email
            });
            return false;
        }

        logger.info('[EMAIL] Email de boas-vindas enviado', {
            emailId: data.id,
            to: user.email
        });

        return true;
    } catch (error) {
        logger.error('[EMAIL] Exceção ao enviar email', {
            error: error.message,
            email: user.email
        });
        return false;
    }
}

/**
 * Envia email de solicitação de suporte
 * @param {Object} user - Dados do usuário (nome, email, id, plan)
 * @param {string} subject - Assunto da mensagem
 * @param {string} message - Corpo da mensagem
 */
async function sendSupportEmail(user, subject, message) {
    try {
        const supportEmail = 'suporte@scopsy.com.br';

        // Fallback para desenvolvimento (sem API Key)
        if (!resend) {
            logger.warn('[EMAIL] Resend não configurado - Simulação de envio de suporte', {
                subject,
                user: user.email,
                message: message.substring(0, 50) + '...'
            });
            return true;
        }

        const { data, error } = await resend.emails.send({
            from: 'Scopsy App <noreply@scopsy.com.br>',
            reply_to: user.email,
            to: [supportEmail],
            subject: `[Suporte] ${subject} - ${user.name}`,
            html: `
                <h2>Solicitação de Suporte</h2>
                <p><strong>Usuário:</strong> ${user.name} (${user.email})</p>
                <p><strong>ID:</strong> ${user.id}</p>
                <p><strong>Plano:</strong> ${user.plan || 'N/A'}</p>
                <hr />
                <h3>${subject}</h3>
                <p style="white-space: pre-wrap;">${message}</p>
            `
        });

        if (error) {
            logger.error('[EMAIL] Erro ao enviar email de suporte', {
                error: error.message,
                userId: user.id
            });
            return false;
        }

        logger.info('[EMAIL] Email de suporte enviado', {
            emailId: data.id,
            from: user.email
        });

        return true;
    } catch (error) {
        logger.error('[EMAIL] Exceção ao enviar email de suporte', {
            error: error.message,
            userId: user.id
        });
        return false;
    }
}

/**
 * Template HTML do email de boas-vindas
 */
function getWelcomeEmailHTML(name, email, temporaryPassword) {
    return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Scopsy Lab</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f7;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f7; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #8c52ff 0%, #00c2ff 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                Scopsy Lab<span style="font-size: 14px; vertical-align: super;">®</span>
                            </h1>
                            <p style="margin: 10px 0 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">
                                Seu laboratório de prática clínica
                            </p>
                        </td>
                    </tr>

                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin: 0 0 20px 0; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                Olá, ${name}! 👋
                            </h2>
                            
                            <p style="margin: 0 0 20px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                Seja muito bem-vindo(a) ao <strong>Scopsy Lab</strong>! Estamos muito felizes em tê-lo(a) conosco nessa jornada de aprimoramento clínico.
                            </p>

                            <p style="margin: 0 0 30px 0; color: #4a4a4a; font-size: 16px; line-height: 1.6;">
                                Sua conta foi criada com sucesso. Use as credenciais abaixo para fazer seu primeiro acesso:
                            </p>

                            <!-- Credentials Box -->
                            <div style="background-color: #f8f9fa; border-left: 4px solid #8c52ff; padding: 20px; margin: 0 0 30px 0; border-radius: 8px;">
                                <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                                    Suas Credenciais
                                </p>
                                <p style="margin: 0 0 8px 0; color: #1a1a1a; font-size: 15px;">
                                    <strong>Email:</strong> ${email}
                                </p>
                                <p style="margin: 0; color: #1a1a1a; font-size: 15px;">
                                    <strong>Senha temporária:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-family: 'Courier New', monospace;">${temporaryPassword}</code>
                                </p>
                            </div>

                            <!-- CTA Button -->
                            <div style="text-align: center; margin: 0 0 30px 0;">
                                <a href="https://app.scopsy.com.br/login.html" 
                                   style="display: inline-block; background: linear-gradient(135deg, #8c52ff 0%, #00c2ff 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(140, 82, 255, 0.3);">
                                    Acessar Plataforma →
                                </a>
                            </div>

                            <!-- Important Note -->
                            <div style="background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 0 0 30px 0; border-radius: 8px;">
                                <p style="margin: 0; color: #856404; font-size: 14px; line-height: 1.5;">
                                    <strong>⚠️ Importante:</strong> Por segurança, altere sua senha no primeiro acesso. Vá em <strong>Configurações → Alterar Senha</strong> após fazer login.
                                </p>
                            </div>

                            <!-- Next Steps -->
                            <h3 style="margin: 0 0 15px 0; color: #1a1a1a; font-size: 18px; font-weight: 600;">
                                Próximos Passos
                            </h3>
                            <ol style="margin: 0 0 30px 0; padding-left: 20px; color: #4a4a4a; font-size: 15px; line-height: 1.8;">
                                <li>Faça login na plataforma</li>
                                <li>Altere sua senha temporária</li>
                                <li>Explore o Dashboard e escolha seu primeiro módulo</li>
                                <li>Comece a praticar com casos clínicos simulados</li>
                            </ol>

                            <p style="margin: 0; color: #4a4a4a; font-size: 15px; line-height: 1.6;">
                                Se tiver qualquer dúvida, estamos à disposição em <a href="mailto:suporte@scopsy.com.br" style="color: #8c52ff; text-decoration: none;">suporte@scopsy.com.br</a>
                            </p>
                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">
                                Scopsy Lab® - Treinamento Clínico para Psicólogos
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Scopsy Lab. Todos os direitos reservados.
                            </p>
                        </td>
                    </tr>

                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
}

/**
 * Envia email de cancelamento de assinatura
 */
async function sendCancellationEmail(user) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'Scopsy Lab <noreply@scopsy.com.br>',
            to: [user.email],
            subject: 'Assinatura Cancelada - Scopsy Lab',
            html: `
                <h2>Olá, ${user.name}</h2>
                <p>Sua assinatura do Scopsy Lab foi cancelada.</p>
                <p>Você ainda pode acessar a plataforma em modo gratuito com funcionalidades limitadas.</p>
                <p>Se mudou de ideia, pode reativar sua assinatura a qualquer momento!</p>
                <p>Atenciosamente,<br>Equipe Scopsy Lab</p>
            `
        });

        if (error) {
            logger.error('[EMAIL] Erro ao enviar email de cancelamento', {
                error: error.message,
                email: user.email
            });
            return false;
        }

        logger.info('[EMAIL] Email de cancelamento enviado', {
            emailId: data.id,
            to: user.email
        });

        return true;
    } catch (error) {
        logger.error('[EMAIL] Exceção ao enviar email de cancelamento', {
            error: error.message,
            email: user.email
        });
        return false;
    }
}

/**
 * Gera senha temporária segura
 * @returns {string} Senha de 12 caracteres
 */
function generateTemporaryPassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

module.exports = {
    sendWelcomeEmail,
    sendSupportEmail,
    sendCancellationEmail,
    generateTemporaryPassword
};
