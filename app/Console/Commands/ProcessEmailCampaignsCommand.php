<?php

namespace App\Console\Commands;

use App\Jobs\SendBulkEmailJob;
use App\Models\EmailCampaign;
use Carbon\Carbon;
use Illuminate\Console\Command;

class ProcessEmailCampaignsCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'emails:process-campaigns';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process and dispatch scheduled and recurring email campaigns';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $campaigns = EmailCampaign::readyToRun()->get();

        if ($campaigns->isEmpty()) {
            $this->info('No email campaigns ready to execute.');
            return self::SUCCESS;
        }

        $this->info("Found {$campaigns->count()} campaigns ready to execute.");

        foreach ($campaigns as $campaign) {
            $this->line("Processing campaign: {$campaign->name} (ID: {$campaign->id})");

            $subject = $campaign->subject ?: $campaign->template?->subject;
            $content = $campaign->content ?: $campaign->template?->content;

            if (empty($subject) || empty($content)) {
                $this->warn("Campaign {$campaign->id} skipped: empty subject or content.");
                continue;
            }

            $userIds = $campaign->getAudienceQuery()->pluck('id')->all();
            $total = count($userIds);

            if ($total === 0) {
                $this->warn("Campaign {$campaign->id} has 0 recipients in audience.");
                $campaign->last_run_at = Carbon::now();
                if ($campaign->type === 'one_time') {
                    $campaign->status = 'completed';
                    $campaign->next_run_at = null;
                } else {
                    $campaign->updateNextRunTime();
                }
                $campaign->save();
                continue;
            }

            $campaign->status = 'processing';
            $campaign->total_recipients = $total;
            $campaign->sent_count = 0;
            $campaign->failed_count = 0;
            $campaign->save();

            // Dispatch chunks of 50 users
            $chunks = array_chunk($userIds, 50);
            foreach ($chunks as $chunk) {
                SendBulkEmailJob::dispatch(
                    userIds: $chunk,
                    subject: $subject,
                    content: $content,
                    campaignId: $campaign->id,
                    templateId: $campaign->email_template_id,
                );
            }

            $this->info("Campaign {$campaign->id} dispatched {$total} recipients across " . count($chunks) . " queue jobs.");
        }

        return self::SUCCESS;
    }
}
