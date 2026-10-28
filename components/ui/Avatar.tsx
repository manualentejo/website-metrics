// Foto do perfil ou, sem foto, a inicial do nome. Único elemento do sistema que é circular.
export default function Avatar({ name, image, size = 32 }: { name: string; image?: string | null; size?: number }) {
  const style = { width: size, height: size, fontSize: Math.round(size * 0.4) };
  if (image) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={image} alt="" style={style} className="flex-shrink-0 rounded-full object-cover" />;
  }
  return (
    <span
      style={style}
      className="flex flex-shrink-0 items-center justify-center rounded-full bg-bg-strong-950 font-medium uppercase text-text-white-0"
    >
      {name[0] ?? "?"}
    </span>
  );
}
