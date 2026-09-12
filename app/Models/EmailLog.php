<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmailLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'to',
        'user_id',
        'email_campaign_id',
        'subject',
        'body_html',
        'status',
        'error_message',
        'sent_at',
    ];

    protected function casts(): array
    {
        return [
            'sent_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(EmailCampaign::class, 'email_campaign_id');
    }

    /**
     * Categorize email source for admin display.
     */
    public function getSourceLabelAttribute(): string
    {
        if ($this->email_campaign_id) {
            return 'Campaña';
        }

        $subject = mb_strtolower($this->subject);

        if (str_contains($subject, 'contacto') || str_contains($subject, 'recibido tu mensaje')) {
            return 'Formulario de Contacto';
        }

        if (str_contains($subject, 'ticket')) {
            return 'Ticket de Soporte';
        }

        if (str_contains($subject, 'café') || str_contains($subject, 'cafe')) {
            return 'Sugerencia de Café';
        }

        if (str_contains($subject, 'notificación') || str_contains($subject, 'notificacion')) {
            return 'Notificación de Usuario';
        }

        if (str_contains($subject, 'verific') || str_contains($subject, 'verify')) {
            return 'Verificación de Email';
        }

        if (str_contains($subject, 'contraseña') || str_contains($subject, 'password') || str_contains($subject, 'recupera') || str_contains($subject, 'reset')) {
            return 'Recuperación de Contraseña';
        }

        return 'Transaccional / Directo';
    }
}
