// Classes compartilhadas dos campos de formulário (Input / Select): 36px, canto 6px.
export const inputClass =
  "h-9 rounded-md border border-input bg-card px-3 text-[13px] text-foreground shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/15 disabled:opacity-50";

// Select nativo com seta própria (appearance-none + ícone sobreposto no wrapper).
export const selectClass = `${inputClass} appearance-none pr-8 cursor-pointer`;
