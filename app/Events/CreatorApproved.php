<?php

namespace App\Events;

use App\Models\ManagerCreator;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class CreatorApproved
{
    use Dispatchable, SerializesModels;

    public function __construct(
        public readonly ManagerCreator $managerCreator,
        public readonly int $approvedBy,
    ) {}
}
