<?php

namespace App\Observers;

use App\Mail\TicketAssigned;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Support\Facades\Mail;

class TicketObserver
{
    /**
     * Handle the Ticket "updated" event.
     */
    public function updated(Ticket $ticket): void
    {
        // Check if assigned_to has changed
        if ($ticket->isDirty('assigned_to') && $ticket->assigned_to) {
            $assignedUser = User::find($ticket->assigned_to);

            if ($assignedUser && $assignedUser->email) {
                Mail::to($assignedUser->email)->send(
                    new TicketAssigned($ticket->fresh(['user', 'assignedTo']))
                );
            }
        }
    }
}
