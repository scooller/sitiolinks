@php
    $targetUser = $record instanceof \App\Models\User ? $record : $record->creator;
    $document = $record instanceof \App\Models\User
        ? $record->creatorDocuments()->first()
        : $record->creator?->creatorDocuments()
            ->where('manager_profile_id', $record->manager_profile_id)
            ->first();
    $frontMedia = $document?->getFirstMedia('id_front');
    $backMedia = $document?->getFirstMedia('id_back');
    $selfieMedia = $document?->getFirstMedia('selfie_with_id');
    $birthDate = $targetUser?->birth_date;
    $age = $birthDate ? \Carbon\Carbon::parse($birthDate)->age : null;
@endphp

<div class="space-y-4 text-sm text-gray-700 dark:text-gray-200">
    <div class="grid grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
        <div>
            <span class="text-xs text-gray-500 uppercase tracking-wider">Usuario / Creador</span>
            <p class="font-semibold">{{ $targetUser?->name }} ({{ '@' . $targetUser?->username }})</p>
        </div>
        <div>
            <span class="text-xs text-gray-500 uppercase tracking-wider">Fecha Nacimiento / Edad</span>
            <p class="font-semibold">
                {{ $birthDate ? \Carbon\Carbon::parse($birthDate)->format('d/m/Y') : 'No registrada' }}
                @if($age !== null)
                    <span class="ml-1 px-2 py-0.5 text-xs rounded {{ $age >= 18 ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300' : 'bg-red-100 text-red-800' }}">
                        {{ $age }} años
                    </span>
                @endif
            </p>
        </div>
        <div>
            <span class="text-xs text-gray-500 uppercase tracking-wider">Estado Documentación</span>
            <p class="font-semibold">
                @if($document?->isComplete())
                    <span class="text-green-600 dark:text-green-400">✓ Completa (3/3 fotos)</span>
                @else
                    <span class="text-amber-600 dark:text-amber-400">⚠ Incompleta</span>
                @endif
            </p>
        </div>
        <div>
            <span class="text-xs text-gray-500 uppercase tracking-wider">Verificación Admin</span>
            <p class="font-semibold">
                @if($document?->verified)
                    <span class="text-green-600 dark:text-green-400">Verificado el {{ $document->verified_at?->format('d/m/Y H:i') }}</span>
                @else
                    <span class="text-gray-500">Pendiente de verificación</span>
                @endif
            </p>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        <!-- Foto Frontal -->
        <div class="border rounded-lg p-3 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h4 class="font-medium text-xs uppercase tracking-wider text-gray-500 mb-2">1. ID Frontal</h4>
            @if($frontMedia)
                <a href="{{ route('creator.document.media', $frontMedia->id) }}" target="_blank" class="block group relative">
                    <img src="{{ route('creator.document.media', $frontMedia->id) }}" alt="ID Frontal" class="w-full h-40 object-cover rounded border dark:border-gray-600 group-hover:opacity-90 transition">
                    <span class="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">Ver grande</span>
                </a>
            @else
                <div class="h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded text-gray-400 text-xs">
                    No subido
                </div>
            @endif
        </div>

        <!-- Foto Trasera -->
        <div class="border rounded-lg p-3 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h4 class="font-medium text-xs uppercase tracking-wider text-gray-500 mb-2">2. ID Reverso</h4>
            @if($backMedia)
                <a href="{{ route('creator.document.media', $backMedia->id) }}" target="_blank" class="block group relative">
                    <img src="{{ route('creator.document.media', $backMedia->id) }}" alt="ID Reverso" class="w-full h-40 object-cover rounded border dark:border-gray-600 group-hover:opacity-90 transition">
                    <span class="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">Ver grande</span>
                </a>
            @else
                <div class="h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded text-gray-400 text-xs">
                    No subido
                </div>
            @endif
        </div>

        <!-- Foto Cara con ID -->
        <div class="border rounded-lg p-3 dark:border-gray-700 bg-white dark:bg-gray-800">
            <h4 class="font-medium text-xs uppercase tracking-wider text-gray-500 mb-2">3. Selfie con ID</h4>
            @if($selfieMedia)
                <a href="{{ route('creator.document.media', $selfieMedia->id) }}" target="_blank" class="block group relative">
                    <img src="{{ route('creator.document.media', $selfieMedia->id) }}" alt="Selfie con ID" class="w-full h-40 object-cover rounded border dark:border-gray-600 group-hover:opacity-90 transition">
                    <span class="absolute bottom-1 right-1 text-xs bg-black/70 text-white px-1.5 py-0.5 rounded">Ver grande</span>
                </a>
            @else
                <div class="h-40 flex items-center justify-center bg-gray-100 dark:bg-gray-700/50 rounded text-gray-400 text-xs">
                    No subido
                </div>
            @endif
        </div>
    </div>
</div>
