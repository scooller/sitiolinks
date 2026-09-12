<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailCampaign extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'email_template_id',
        'subject',
        'content',
        'target_audience',
        'type',
        'recurring_frequency',
        'recurring_time',
        'recurring_day_of_week',
        'recurring_day_of_month',
        'scheduled_at',
        'last_run_at',
        'next_run_at',
        'status',
        'total_recipients',
        'sent_count',
        'failed_count',
    ];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'last_run_at' => 'datetime',
            'next_run_at' => 'datetime',
            'recurring_day_of_week' => 'integer',
            'recurring_day_of_month' => 'integer',
            'total_recipients' => 'integer',
            'sent_count' => 'integer',
            'failed_count' => 'integer',
        ];
    }

    public function template(): BelongsTo
    {
        return $this->belongsTo(EmailTemplate::class, 'email_template_id');
    }

    public function logs(): HasMany
    {
        return $this->hasMany(EmailLog::class);
    }

    /**
     * Scope campaigns ready to execute.
     */
    public function scopeReadyToRun(Builder $query): Builder
    {
        return $query->whereIn('status', ['scheduled', 'recurring'])
            ->whereNotNull('next_run_at')
            ->where('next_run_at', '<=', Carbon::now());
    }

    /**
     * Resolve target audience query.
     */
    public function getAudienceQuery(): Builder
    {
        $query = User::query()->whereNotNull('email')->where('email', '!=', '');

        return match ($this->target_audience) {
            'creators' => $query->whereHas('roles', fn ($q) => $q->where('name', 'creator')),
            'vip' => $query->whereHas('roles', fn ($q) => $q->where('name', 'vip')),
            'unverified_email' => $query->whereNull('email_verified_at'),
            'verified_only' => $query->whereNotNull('email_verified_at'),
            'privacy_consent_pending' => $query->where(fn ($q) => $q->where('privacy_consent', false)->orWhereNull('privacy_consent')),
            'subscribers_only' => $query->where('email_notifications', true),
            'inactive_30_days' => $query->where('updated_at', '<', Carbon::now()->subDays(30)),
            default => $query,
        };
    }

    /**
     * Calculate and update next run time based on schedule/recurring settings.
     */
    public function updateNextRunTime(): void
    {
        if ($this->type === 'one_time') {
            // For one time, next run is scheduled_at if not yet run
            if ($this->last_run_at) {
                $this->next_run_at = null;
                $this->status = 'completed';
            } else {
                $this->next_run_at = $this->scheduled_at;
            }
            return;
        }

        // For recurring campaigns
        $now = Carbon::now();
        $timeParts = explode(':', $this->recurring_time ?: '09:00:00');
        $hour = (int) ($timeParts[0] ?? 9);
        $minute = (int) ($timeParts[1] ?? 0);

        if ($this->recurring_frequency === 'daily') {
            $candidate = $now->copy()->setTime($hour, $minute, 0);
            if ($candidate->lessThanOrEqualTo($now)) {
                $candidate->addDay();
            }
            $this->next_run_at = $candidate;
        } elseif ($this->recurring_frequency === 'weekly') {
            $targetDay = $this->recurring_day_of_week ?? Carbon::MONDAY;
            $candidate = $now->copy()->next($targetDay)->setTime($hour, $minute, 0);
            $this->next_run_at = $candidate;
        } elseif ($this->recurring_frequency === 'monthly') {
            $targetDay = max(1, min(31, (int) ($this->recurring_day_of_month ?? 1)));
            $candidate = $now->copy()->day($targetDay)->setTime($hour, $minute, 0);
            if ($candidate->lessThanOrEqualTo($now)) {
                $candidate->addMonth();
            }
            $this->next_run_at = $candidate;
        }
    }
}
