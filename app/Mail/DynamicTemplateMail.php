<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class DynamicTemplateMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $mailSubject,
        public string $contentHtml,
        public ?string $unsubscribeUrl = null,
        public ?int $campaignId = null,
        public ?int $userId = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: $this->mailSubject,
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.dynamic-template',
            with: [
                'renderedSubject' => $this->mailSubject,
                'renderedContent' => $this->contentHtml,
                'unsubscribeUrl' => $this->unsubscribeUrl,
            ],
        );
    }
}
