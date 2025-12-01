<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Monarobase\CountryList\CountryListFacade as Countries;

class FixCountryCodes extends Command
{
    protected $signature = 'users:fix-country-codes';

    protected $description = 'Convertir nombres de países a códigos ISO en campos nationality y country';

    public function handle()
    {
        $this->info('Iniciando conversión de países a códigos ISO...');

        $countryList = Countries::getList('es', 'php');
        $updated = 0;

        User::whereNotNull('nationality')
            ->orWhereNotNull('country')
            ->chunk(100, function ($users) use ($countryList, &$updated) {
                foreach ($users as $user) {
                    $changed = false;

                    // Convertir nationality si es un nombre
                    if ($user->nationality && ! array_key_exists($user->nationality, $countryList)) {
                        $code = array_search($user->nationality, $countryList, true);
                        if ($code) {
                            $this->line("Usuario {$user->id}: nationality '{$user->nationality}' → '{$code}'");
                            $user->nationality = $code;
                            $changed = true;
                        }
                    }

                    // Convertir country si es un nombre
                    if ($user->country && ! array_key_exists($user->country, $countryList)) {
                        $code = array_search($user->country, $countryList, true);
                        if ($code) {
                            $this->line("Usuario {$user->id}: country '{$user->country}' → '{$code}'");
                            $user->country = $code;
                            $changed = true;
                        }
                    }

                    if ($changed) {
                        $user->save();
                        $updated++;
                    }
                }
            });

        $this->info("✅ Proceso completado. {$updated} usuarios actualizados.");

        return Command::SUCCESS;
    }
}
