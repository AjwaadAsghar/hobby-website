"use client";

/** Submit button that asks "Are you sure?" first. */
export function ConfirmSubmit({ message, className, children, name, value }: { message: string; className?: string; children: React.ReactNode; name?: string; value?: string }) {
  return (
    <button
      type="submit"
      name={name}
      value={value}
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}
