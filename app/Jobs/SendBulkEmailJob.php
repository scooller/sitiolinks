<?php

namespace App\Jobs;

use App\Mail\DynamicTemplateMail;
use App\Models\EmailCampaign;
use App\Models\EmailLog;
use App\Models\EmailTemplate;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Mail;

class SendBulkEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @param array<int> $userIds
     */
    public function __construct(
        public array $userIds,
        public string $subject,
        public string $content,
        public ?int $campaignId = null,
        public ?int $templateId = null,
    ) {}

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        $users = User::whereIn('id', $this->userIds)->get();
        $campaign = $this->campaignId ? EmailCampaign::find($this->campaignId) : null;
        $frontendBase = rtrim((string) config('app.frontend_url', config('app.url')), '/');

        $sentCount = 0;
        $failedCount = 0;

        foreach ($users as $user) {
            if (empty($user->email)) {
                continue;
            }

            $placeholders = [
                'user' => [
                    'name' => $user->name ?: $user->username,
                    'username' => $user->username,
                    'email' => $user->email,
                ],
                'site' => [
                    'name' => config('app.name', 'Link Persons'),
                    'url' => $frontendBase,
                ],
                'action_url' => $frontendBase,
            ];

            // Flatten data for replacements
            $flatData = EmailTemplate::flattenData($placeholders);
            $userSubject = $this->subject;
            $userContent = $this->content;

            foreach ($flatData as $k => $v) {
                $valStr = is_scalar($v) ? (string) $v : '';
                $userSubject = str_replace(['{{ ' . $k . ' }}', '{{' . $k . '}}'], $valStr, $userSubject);
                $userContent = str_replace(['{{ ' . $k . ' }}', '{{' . $k . '}}'], $valStr, $userContent);
            }

            try {
                $unsubscribeUrl = $frontendBase . '/perfil/editar';
                $mailable = new DynamicTemplateMail(
                    mailSubject: $userSubject,
                    contentHtml: $userContent,
                    unsubscribeUrl: $unsubscribeUrl,
                    campaignId: $this->campaignId,
                    userId: $user->id,
                );

                Mail::to($user->email)->send($mailable);
                $sentCount++;
            } catch (\Throwable $e) {
                $failedCount++;
                report($e);

                EmailLog::create([
                    'to' => $user->email,
                    'user_id' => $user->id,
                    'email_campaign_id' => $this->campaignId,
                    'subject' => $userSubject,
                    'body_html' => $userContent,
                    'status' => 'failed',
                    'error_message' => $e->getMessage(),
                    'sent_at' => Carbon::now(),
                ]);
            }
        }

        if ($campaign) {
            if ($sentCount > 0) {
                $campaign->increment('sent_count', $sentCount);
            }
            if ($failedCount > 0) {
                $campaign->increment('failed_count', $failedCount);
            }

            // Check if all recipients processed
            $campaign->refresh();
            if ($campaign->sent_count + $campaign->failed_count >= $campaign->total_recipients) {
                $campaign->last_run_at = Carbon::now();
                if ($campaign->type === 'one_time') {
                    $campaign->status = 'completed';
                    $campaign->next_run_at = null;
                } else {
                    $campaign->status = 'scheduled';
                    $campaign->updateNextRunTime();
                }
                $campaign->save();
            }
        }
    }
}
