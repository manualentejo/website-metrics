// Campos de formulário no padrão do AlignUI Input: 36px, canto 10px, anel suave e foco escuro.
export const inputClass =
  "h-9 rounded-10 bg-bg-white-0 px-3 text-paragraph-sm text-text-strong-950 shadow-regular-xs outline-none ring-1 ring-inset ring-stroke-soft-200 transition duration-200 ease-out placeholder:text-text-soft-400 hover:bg-bg-weak-50 hover:ring-transparent focus:shadow-button-important-focus focus:ring-stroke-strong-950 disabled:pointer-events-none disabled:bg-bg-weak-50 disabled:text-text-disabled-300 disabled:shadow-none disabled:ring-transparent";

// Select nativo com seta própria (appearance-none + ícone sobreposto no wrapper).
export const selectClass = `${inputClass} appearance-none pr-9 cursor-pointer`;
