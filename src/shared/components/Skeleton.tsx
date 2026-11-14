import "./Skeleton.css";

interface SkeletonProps {
  ancho?: string;
  alto?: string;
  className?: string;
}

export function Skeleton({
  ancho = "100%",
  alto = "1rem",
  className = "",
}: SkeletonProps) {
  return (
    <span
      className={`skeleton ${className}`.trim()}
      style={{ width: ancho, height: alto }}
      aria-hidden="true"
    />
  );
}
