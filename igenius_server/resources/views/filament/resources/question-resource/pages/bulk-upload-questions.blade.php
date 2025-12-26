<x-filament-panels::page>
    <div class="space-y-6">
        <div>
            <h2 class="text-2xl font-bold tracking-tight">Bulk Upload Questions</h2>
            <p class="text-gray-600">Upload multiple questions via CSV file</p>
        </div>
        
        <div class="flex flex-wrap gap-2 mb-6">
            @foreach ($this->getHeaderActions() as $action)
                <div>
                    {{ $action }}
                </div>
            @endforeach
        </div>
        
        <x-filament::section>
            {{ $this->form }}
            
            <x-slot name="footer">
                <div class="flex items-center justify-end gap-4">
                    @foreach ($this->getFormActions() as $action)
                        {{ $action }}
                    @endforeach
                </div>
            </x-slot>
        </x-filament::section>
        
        @if ($isProcessing)
            <div class="text-center py-8">
                <x-filament::loading-indicator class="h-8 w-8 mx-auto" />
                <p class="text-sm text-gray-600 mt-2">Processing CSV file...</p>
            </div>
        @endif
    </div>
    
    @script
    <script>
        Livewire.on('import-finished', () => {
            // Optional: Add any post-import JavaScript here
        });
    </script>
    @endscript
</x-filament-panels::page>