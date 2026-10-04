<?php

namespace App\Mail;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class CreatorApprovedMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $manager,
        public readonly User $creator,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: '¡Tu creador ha sido aprobado!');
    }

    public function content(): Content
    {
        return new Content(view: 'emails.creator-approved', with: [
            'managerName' => $this->manager->name,
            'creatorName' => $this->creator->name,
            'creatorUsername' => $this->creator->username,
        ]);
    }
}
