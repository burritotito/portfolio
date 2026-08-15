export default function Ruler() {
  return (
    <div
      className="w-full h-3"
      style={{
        backgroundImage:
          'repeating-linear-gradient(90deg, black 0, black 1px, transparent 1px, transparent 24px)',
      }}
    />
  );
}