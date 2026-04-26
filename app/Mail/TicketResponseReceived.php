<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\TicketComment;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TicketResponseReceived extends Mailable
{
    use Queueable, SerializesModels;

    public $ticket;

    public $comment;

    public function __construct(Ticket $ticket, TicketComment $comment)
    {
        $this->ticket = $ticket;
        $this->comment = $comment;
    }

    public function build()
    {
        return $this->subject('Nueva respuesta en Ticket #'.$this->ticket->id)
            ->view('emails.ticket-response-received');
    }
}
