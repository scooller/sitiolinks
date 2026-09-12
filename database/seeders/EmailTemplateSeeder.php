<?php

namespace Database\Seeders;

use App\Models\EmailTemplate;
use Illuminate\Database\Seeder;

class EmailTemplateSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $templates = [
            [
                'name' => 'Bienvenida a Nuevos Usuarios',
                'slug' => 'bienvenida',
                'subject' => '¡Te damos la bienvenida a {{ site.name }}, {{ user.name }}!',
                'description' => 'Plantilla estándar enviada tras el registro exitoso.',
                'content' => '<p>Hola <strong>{{ user.name }}</strong>,</p><p>¡Gracias por unirte a <strong>{{ site.name }}</strong>! Estamos felices de contar contigo en nuestra comunidad.</p><p>Te invitamos a completar tu perfil, agregar tus enlaces favoritos y explorar las cafeterías y creadores destacados.</p><p><a href="{{ action_url }}">Ir a mi Perfil</a></p><p>Si tienes alguna duda o sugerencia, nuestro equipo de soporte está siempre disponible para ayudarte.</p>',
                'is_active' => true,
            ],
            [
                'name' => 'Recordatorio de Perfil Incompleto',
                'slug' => 'recordatorio_perfil',
                'subject' => '{{ user.name }}, destaca tu presencia completando tu perfil',
                'description' => 'Campaña para usuarios que no han subido biografía, avatar o links.',
                'content' => '<p>Hola <strong>{{ user.name }}</strong>,</p><p>Notamos que tu perfil aún no está completamente personalizado. Los perfiles con foto de avatar y enlaces reciben hasta 5 veces más visitas.</p><p>Tómate 2 minutos para actualizar tu información y permitir que otros miembros te descubran:</p><p><a href="{{ action_url }}">Completar mi Perfil Ahora</a></p>',
                'is_active' => true,
            ],
            [
                'name' => 'Boletín de Novedades y Campañas',
                'slug' => 'boletin_novedades',
                'subject' => 'Novedades de la semana en {{ site.name }}',
                'description' => 'Plantilla para envíos masivos periódicos o anuncios importantes.',
                'content' => '<p>Estimado/a <strong>{{ user.name }}</strong>,</p><p>Queremos compartir contigo las últimas mejoras y nuevos espacios agregados a la plataforma:</p><ul><li>Nuevas cafeterías recomendadas por la comunidad.</li><li>Mejoras de rendimiento y seguridad.</li><li>Nuevas funcionalidades en galerías y perfiles.</li></ul><p><a href="{{ site.url }}">Explorar las Novedades</a></p>',
                'is_active' => true,
            ],
            [
                'name' => 'Aceptación de Nueva Política de Privacidad (Ley N° 21.719)',
                'slug' => 'consentimiento_ley_21719',
                'subject' => 'Actualización importante: Nueva Política de Protección de Datos en {{ site.name }}',
                'description' => 'Solicitud formal para que los usuarios registrados revisen y acepten el tratamiento de datos y derechos ARCOP bajo la Ley N° 21.719.',
                'content' => '<p>Hola <strong>{{ user.name }}</strong>,</p><p>En <strong>{{ site.name }}</strong> nos comprometemos con la seguridad y privacidad de tu información. Conforme a la nueva <strong>Ley N° 21.719</strong> sobre Protección de Datos Personales en Chile, hemos actualizado nuestro marco de privacidad y fortalecido el ejercicio de tus <strong>Derechos ARCOP</strong> (Acceso, Rectificación, Cancelación, Oposición y Portabilidad).</p><p>Para continuar utilizando tu cuenta con total normalidad y validar tus preferencias de privacidad, por favor ingresa a tu perfil para confirmar tu consentimiento:</p><p style="text-align: center; margin: 30px 0;"><a href="{{ action_url }}/perfil/editar" style="background-color: #0284c7; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);">Revisar y Aceptar Políticas</a></p><p>También puedes informarte en profundidad sobre el tratamiento de tus datos visitando nuestro <a href="{{ action_url }}/privacidad-datos">Centro de Privacidad y Derechos ARCOP</a>.</p><p>Muchas gracias por formar parte de nuestra comunidad.</p>',
                'is_active' => true,
            ],
        ];

        foreach ($templates as $data) {
            EmailTemplate::updateOrCreate(
                ['slug' => $data['slug']],
                $data
            );
        }
    }
}
