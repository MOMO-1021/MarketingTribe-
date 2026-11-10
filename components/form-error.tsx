export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="text-sm text-clay" role="alert">
      {message}
    </p>
  );
}
