<?php

namespace Database\Seeders;

use App\Models\Page;
use Illuminate\Database\Seeder;

class PageSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $pages = [
            [
                'title' => 'Inicio',
                'slug' => 'inicio',
                'content' => '<h1>Bienvenido a Link Persons</h1><p>Conecta con personas y comparte tus enlaces.</p>',
                'status' => 'published',
                'order' => 1,
                'is_system' => true,
            ],
            [
                'title' => 'Términos y Condiciones',
                'slug' => 'terminos-y-condiciones',
                'content' => '<h1>Términos y Condiciones</h1><p>Aquí van los términos y condiciones del sitio.</p>',
                'status' => 'published',
                'order' => 2,
                'is_system' => true,
            ],
            [
                'title' => 'Política de Privacidad',
                'slug' => 'politica-de-privacidad',
                'content' => '<h1>Política de Privacidad</h1><p>Aquí va la política de privacidad del sitio.</p>',
                'status' => 'published',
                'order' => 3,
                'is_system' => true,
            ],
            [
                'title' => 'Contacto',
                'slug' => 'contacto',
                'content' => '<h1>Contacto</h1><p>¿Tienes alguna pregunta? Contáctanos.</p>',
                'status' => 'published',
                'order' => 4,
                'is_system' => true,
            ],
            [
                'title' => 'Preguntas Frecuentes (FAQs)',
                'slug' => 'preguntas-frecuentes',
                'content' => '<h1>Preguntas Frecuentes</h1><p>Respuestas a las preguntas más comunes.</p>',
                'status' => 'published',
                'order' => 5,
                'is_system' => true,
            ],
            // English duplicates
            [
                'title' => 'Home',
                'slug' => 'home',
                'content' => '<h1>Welcome to Link Persons</h1><p>Connect with people and share your links.</p>',
                'status' => 'published',
                'order' => 6,
                'is_system' => true,
            ],
            [
                'title' => 'Terms and Conditions',
                'slug' => 'terms-and-conditions',
                'content' => '<h1>Terms and Conditions</h1><p>Here are the terms and conditions of the site.</p>',
                'status' => 'published',
                'order' => 7,
                'is_system' => true,
            ],
            [
                'title' => 'Privacy Policy',
                'slug' => 'privacy-policy',
                'content' => '<h1>Privacy Policy</h1><p>Here is the privacy policy of the site.</p>',
                'status' => 'published',
                'order' => 8,
                'is_system' => true,
            ],
            [
                'title' => 'Contact',
                'slug' => 'contact',
                'content' => '<h1>Contact</h1><p>Do you have any questions? Contact us.</p>',
                'status' => 'published',
                'order' => 9,
                'is_system' => true,
            ],
            [
                'title' => 'Frequently Asked Questions (FAQs)',
                'slug' => 'faqs',
                'content' => '<h1>Frequently Asked Questions</h1><p>Answers to the most common questions.</p>',
                'status' => 'published',
                'order' => 10,
                'is_system' => true,
            ],
        ];

        foreach ($pages as $pageData) {
            Page::updateOrCreate(
                ['slug' => $pageData['slug']],
                $pageData
            );
        }
    }
}
