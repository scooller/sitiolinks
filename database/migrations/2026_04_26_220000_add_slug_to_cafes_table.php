<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Str;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('cafes', function (Blueprint $table): void {
            $table->string('slug')->nullable()->after('name');
            $table->unique('slug');
        });

        $cafes = DB::table('cafes')->select('id', 'name')->orderBy('id')->get();
        $usedSlugs = [];

        foreach ($cafes as $cafe) {
            $baseSlug = Str::slug((string) $cafe->name);
            $baseSlug = $baseSlug !== '' ? $baseSlug : 'cafe';
            $slug = $baseSlug;
            $suffix = 2;

            while (isset($usedSlugs[$slug]) || DB::table('cafes')->where('slug', $slug)->where('id', '!=', $cafe->id)->exists()) {
                $slug = $baseSlug.'-'.$suffix;
                $suffix++;
            }

            DB::table('cafes')
                ->where('id', $cafe->id)
                ->update(['slug' => $slug]);

            $usedSlugs[$slug] = true;
        }

        Schema::table('cafes', function (Blueprint $table): void {
            $table->string('slug')->nullable(false)->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cafes', function (Blueprint $table): void {
            $table->dropUnique(['slug']);
            $table->dropColumn('slug');
        });
    }
};
