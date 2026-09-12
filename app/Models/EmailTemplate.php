<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class EmailTemplate extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'slug',
        'subject',
        'content',
        'description',
        'variables',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'variables' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function campaigns(): HasMany
    {
        return $this->hasMany(EmailCampaign::class);
    }

    /**
     * Render subject and content replacing placeholders with data.
     *
     * @param array<string, mixed> $data
     * @return array{subject: string, content: string}
     */
    public function render(array $data = []): array
    {
        $subject = $this->subject;
        $content = $this->content;

        // Flatten data for nested keys like user.name or user.email
        $flatData = self::flattenData($data);

        foreach ($flatData as $key => $value) {
            $valStr = is_scalar($value) ? (string) $value : '';
            $subject = str_replace(['{{ ' . $key . ' }}', '{{' . $key . '}}'], $valStr, $subject);
            $content = str_replace(['{{ ' . $key . ' }}', '{{' . $key . '}}'], $valStr, $content);
        }

        return [
            'subject' => $subject,
            'content' => $content,
        ];
    }

    /**
     * Flatten nested array into dot-notation keys.
     */
    public static function flattenData(array $array, string $prefix = ''): array
    {
        $result = [];
        foreach ($array as $key => $value) {
            $newKey = $prefix === '' ? $key : $prefix . '.' . $key;
            if (is_array($value)) {
                $result = array_merge($result, self::flattenData($value, $newKey));
            } else {
                $result[$newKey] = $value;
            }
        }
        return $result;
    }
}
