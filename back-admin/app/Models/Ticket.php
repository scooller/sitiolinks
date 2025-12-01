<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ticket extends Model
{
    const STATUS_OPEN = 'abierto';

    const STATUS_IN_PROGRESS = 'en_progreso';

    const STATUS_RESOLVED = 'resuelto';

    const STATUS_CLOSED = 'cerrado';

    const STATUS_REOPENED = 'reabierto';

    const PRIORITY_LOW = 'baja';

    const PRIORITY_MEDIUM = 'media';

    const PRIORITY_HIGH = 'alta';

    const PRIORITY_URGENT = 'urgente';

    const CATEGORY_TECHNICAL = 'tecnico';

    const CATEGORY_BILLING = 'facturacion';

    const CATEGORY_ACCOUNT = 'cuenta';

    const CATEGORY_CONTENT = 'contenido';

    const CATEGORY_OTHER = 'otro';

    protected $fillable = [
        'user_id',
        'assigned_to',
        'category',
        'priority',
        'status',
        'subject',
        'description',
        'resolution',
        'first_response_at',
        'resolved_at',
        'closed_at',
    ];

    protected $casts = [
        'first_response_at' => 'datetime',
        'resolved_at' => 'datetime',
        'closed_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function assignedTo(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_to');
    }

    public function comments(): HasMany
    {
        return $this->hasMany(TicketComment::class);
    }

    public static function statuses(): array
    {
        return [
            self::STATUS_OPEN => 'Abierto',
            self::STATUS_IN_PROGRESS => 'En Progreso',
            self::STATUS_RESOLVED => 'Resuelto',
            self::STATUS_CLOSED => 'Cerrado',
            self::STATUS_REOPENED => 'Reabierto',
        ];
    }

    public static function priorities(): array
    {
        return [
            self::PRIORITY_LOW => 'Baja',
            self::PRIORITY_MEDIUM => 'Media',
            self::PRIORITY_HIGH => 'Alta',
            self::PRIORITY_URGENT => 'Urgente',
        ];
    }

    public static function categories(): array
    {
        return [
            self::CATEGORY_TECHNICAL => 'Técnico',
            self::CATEGORY_BILLING => 'Facturación',
            self::CATEGORY_ACCOUNT => 'Cuenta',
            self::CATEGORY_CONTENT => 'Contenido',
            self::CATEGORY_OTHER => 'Otro',
        ];
    }
}
