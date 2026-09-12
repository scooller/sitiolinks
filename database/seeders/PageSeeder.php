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
                'content' => '<h2>¿Qué es Link Persons y qué puedo hacer en la plataforma?</h2><p>Link Persons es un ecosistema interactivo donde creadores y modelos gestionan sus perfiles, enlaces y galerías fotográficas, y donde los usuarios pueden descubrir cafeterías temáticas, consultar reseñas, seguir a sus creadores favoritos y acceder a contenidos exclusivos.</p><h2>¿Es necesario registrarse para navegar y explorar?</h2><p>No. Puedes navegar libremente por el directorio de creadores, cafeterías y galerías públicas sin costo ni registro. Crear una cuenta es necesario únicamente para dar me gusta, publicar contenido o acceder a soporte por tickets.</p><h2>¿Cómo puedo crear y configurar mi perfil de creador o modelo?</h2><p>Regístrate en la plataforma y verifica tu correo. Luego, accede a "Editar Perfil" para personalizar tu avatar, biografía, enlaces a redes sociales, tarifas y el color/opacidad de tu tarjeta de presentación.</p><h2>¿Cómo funcionan las galerías públicas y VIP?</h2><p>Los creadores pueden subir álbumes completos de fotos con soporte LightGallery. Puedes marcar cada galería como pública (visible para toda la comunidad) o VIP (con acceso reservado según tus configuraciones).</p><h2>¿Qué es el directorio de Cafeterías asociadas?</h2><p>Es una selección cuidada de cafeterías temáticas y de especialidad. En cada ficha encontrarás sucursales, direcciones con enlace directo a Apple Maps / Google Maps, menús QR, creadores asociados y valoraciones verificadas.</p><h2>¿Cómo sugiero una nueva cafetería para incluirla?</h2><p>Dirígete a la sección "Sugerir Café" desde el menú. Completa los datos principales (nombre, ubicación, redes y descripción) y nuestro equipo de moderación evaluará su incorporación al catálogo.</p><h2>¿Mis datos personales y privacidad están protegidos?</h2><p>Absolutamente. Todas las conexiones utilizan cifrado SSL de 256 bits y nunca compartimos ni vendemos tu información o direcciones de correo a terceras partes sin tu consentimiento expreso.</p><h2>¿Cómo abro un ticket de asistencia técnica?</h2><p>Los usuarios con correo verificado pueden acceder a la sección "Tickets" en el menú de usuario. Allí puedes crear un caso, adjuntar detalles y recibir respuestas directas del equipo de soporte.</p>',
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
                'content' => '<h2>What is Link Persons and what can I do on the platform?</h2><p>Link Persons is an interactive platform where creators and models manage their profiles, links, and galleries, while users can discover themed cafes, read reviews, follow their favorite creators, and access exclusive content.</p><h2>Is registration required to browse and explore?</h2><p>No. You can freely explore creators, cafes, and public galleries without cost or registration. Creating an account is only needed to like content, publish galleries, or access ticket support.</p><h2>How do I create and customize my creator or model profile?</h2><p>Register and verify your email. Then, go to "Edit Profile" to customize your avatar, bio, social links, base rates, and card background color/opacity.</p><h2>How do public and VIP galleries work?</h2><p>Creators can upload full photo albums with LightGallery support. Each gallery can be configured as public (visible to everyone) or VIP (exclusive access according to your settings).</p><h2>What is the affiliated Cafes directory?</h2><p>It is a curated guide to specialty and themed cafes. Each page features branch addresses with direct maps links, digital menus, associated creators, and verified user ratings.</p><h2>How do I suggest a new cafe to be listed?</h2><p>Go to "Suggest Cafe" in the navigation menu. Fill out the main details (name, location, links, description) and our team will review it for inclusion.</p><h2>Are my personal data and privacy protected?</h2><p>Absolutely. All connections use 256-bit SSL encryption and we never sell or share your personal information or email addresses with third parties.</p><h2>How do I open a support ticket?</h2><p>Users with a verified email can access "Tickets" from the user menu. There you can create a case, provide details, and receive direct replies from our technical team.</p>',
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
