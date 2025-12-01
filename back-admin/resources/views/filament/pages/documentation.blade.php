<x-filament-panels::page>
    <style>
        .doc-prose h1{font-size:2rem;line-height:1.25;margin:0 0 1rem;font-weight:700}
        .doc-prose h2{font-size:1.5rem;line-height:1.3;margin:1.25rem 0 .75rem;font-weight:700}
        .doc-prose h3{font-size:1.25rem;line-height:1.35;margin:1rem 0 .5rem;font-weight:600}
        .doc-prose p{margin:.75rem 0;color:var(--gray-700)}
        .doc-prose ul{margin:.5rem 0 .75rem;padding-left:1.25rem;list-style:disc}
        .doc-prose ol{margin:.5rem 0 .75rem;padding-left:1.25rem;list-style:decimal}
        .doc-prose li{margin:.25rem 0}
        .doc-prose code{background-color:rgba(148,163,184,.15);padding:.15rem .35rem;border-radius:.25rem;font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;font-size:.85em}
        .doc-prose pre{background-color:rgba(148,163,184,.15);padding:1rem;border-radius:.5rem;overflow:auto}
        .doc-prose hr{border:0;border-top:1px solid rgba(148,163,184,.25);margin:1rem 0}
        .doc-prose table{width:100%;border-collapse:collapse;margin:1rem 0;border:1px solid rgba(148,163,184,.25);border-radius:.5rem;overflow:hidden}
        .doc-prose th,.doc-prose td{padding:.5rem .75rem;border-bottom:1px solid rgba(148,163,184,.2);text-align:left}
        .doc-prose a{color:var(--primary-600);text-decoration:underline}
        .doc-prose blockquote{border-left:3px solid rgba(148,163,184,.6);padding:.5rem 1rem;margin:.75rem 0;color:var(--gray-700)}
        .doc-container{max-width:72rem;margin-left:auto;margin-right:auto}
        .doc-source{font-size:.8rem;color:rgb(107,114,128);margin-bottom:.75rem}
        :root .dark .doc-prose p,:root .dark .doc-prose blockquote{color:#c9c9c9}
    </style>

    <div class="doc-container">
        @if ($this->sourcePath)
            <div class="doc-source">
                Fuente: {{ str_replace(base_path() . DIRECTORY_SEPARATOR, '', $this->sourcePath) }}
            </div>
        @endif

        <div class="doc-prose">
            {!! $this->html !!}
        </div>
    </div>
</x-filament-panels::page>
