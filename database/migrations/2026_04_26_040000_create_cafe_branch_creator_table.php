<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (! Schema::hasTable('cafe_branch_creator')) {
            Schema::create('cafe_branch_creator', function (Blueprint $table): void {
                $table->foreignId('cafe_branch_id')->constrained('cafe_branches')->onDelete('cascade');
                $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
                $table->timestamps();

                $table->primary(['cafe_branch_id', 'user_id']);
                $table->index('cafe_branch_id');
                $table->index('user_id');
            });
        }

        // Migrar asociaciones existentes de café->creador hacia sucursal->creador.
        if (Schema::hasTable('cafe_creator') && Schema::hasTable('cafe_branches')) {
            $rows = DB::table('cafe_creator')
                ->join('cafe_branches', 'cafe_branches.cafe_id', '=', 'cafe_creator.cafe_id')
                ->select(
                    'cafe_branches.id as cafe_branch_id',
                    'cafe_creator.user_id',
                    'cafe_creator.created_at',
                    'cafe_creator.updated_at'
                )
                ->get()
                ->map(static fn (object $row): array => [
                    'cafe_branch_id' => $row->cafe_branch_id,
                    'user_id' => $row->user_id,
                    'created_at' => $row->created_at ?? now(),
                    'updated_at' => $row->updated_at ?? now(),
                ])
                ->all();

            if (! empty($rows)) {
                DB::table('cafe_branch_creator')->insertOrIgnore($rows);
            }
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cafe_branch_creator');
    }
};
