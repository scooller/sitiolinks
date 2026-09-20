<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class UserRoleChangedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public const ROLE_LABELS = [
        'user' => 'Normal / Usuario',
        'vip' => 'VIP',
        'creator' => 'Creador / Modelo',
        'moderator' => 'Moderador',
        'admin' => 'Administrador',
        'super_admin' => 'Super Admin',
    ];

    public function __construct(
        public User $user,
        public string $newRole,
        public ?string $oldRole = null
    ) {}

    public function envelope(): Envelope
    {
        $roleLabel = self::ROLE_LABELS[$this->newRole] ?? ucfirst($this->newRole);

        return new Envelope(
            subject: 'Tu tipo de cuenta ahora es '.$roleLabel.' - '.config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.user-role-changed',
            with: [
                'user' => $this->user,
                'newRole' => $this->newRole,
                'oldRole' => $this->oldRole,
                'newRoleLabel' => self::ROLE_LABELS[$this->newRole] ?? ucfirst($this->newRole),
                'oldRoleLabel' => $this->oldRole ? (self::ROLE_LABELS[$this->oldRole] ?? ucfirst($this->oldRole)) : null,
            ],
        );
    }
}
