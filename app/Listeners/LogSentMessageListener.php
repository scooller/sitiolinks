<?php

namespace App\Listeners;

use App\Models\EmailLog;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Mail\Events\MessageSent;
use Symfony\Component\Mime\Address;

class LogSentMessageListener
{
    /**
     * Handle the event.
     */
    public function handle(MessageSent $event): void
    {
        try {
            $message = $event->message;

            $toAddresses = collect($message->getTo() ?: [])
                ->map(fn (Address $addr) => $addr->getAddress())
                ->filter()
                ->values();

            $toString = $toAddresses->implode(', ');
            $firstEmail = $toAddresses->first();

            $subject = $message->getSubject() ?: '(Sin Asunto)';
            $html = $message->getHtmlBody();
            if (empty($html)) {
                $text = $message->getTextBody();
                $html = $text ? nl2br(e($text)) : '';
            }

            // Attempt to resolve user if exists
            $userId = null;
            if ($firstEmail) {
                $userId = User::where('email', $firstEmail)->value('id');
            }

            // Read optional campaign id or user id header if present
            $campaignId = null;
            if ($message->getHeaders()->has('X-Campaign-ID')) {
                $campaignId = (int) $message->getHeaders()->get('X-Campaign-ID')?->getBodyAsString();
            }

            EmailLog::create([
                'to' => $toString ?: 'desconocido@local',
                'user_id' => $userId,
                'email_campaign_id' => $campaignId,
                'subject' => $subject,
                'body_html' => (string) $html,
                'status' => 'sent',
                'sent_at' => Carbon::now(),
            ]);
        } catch (\Throwable $e) {
            // Never disrupt mail sending flow if logging encounters an edge case
            report($e);
        }
    }
}
