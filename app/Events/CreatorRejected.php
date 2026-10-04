<?php

namespace App\Events;

use App\Models\ManagerCreator;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CreatorRejected
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly ManagerCreator $managerCreator,
        public readonly string $reason,
        public readonly int $rejectedBy,
    ) {}
}
