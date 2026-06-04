"use client";

function IconPencil() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 20h4l10.5-10.5a2.1 2.1 0 0 0-3-3L5 17v3Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="m13.5 6.5 3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v11a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V7h12Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

interface DayCardActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  deleting?: boolean;
  editLabel: string;
  deleteLabel: string;
}

export default function DayCardActions({
  onEdit,
  onDelete,
  deleting,
  editLabel,
  deleteLabel,
}: DayCardActionsProps) {
  return (
    <div
      className="absolute end-3 top-3 z-10 flex gap-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100"
      onClick={(e) => e.preventDefault()}
    >
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
        className="y2k-icon-btn"
        aria-label={editLabel}
        title={editLabel}
      >
        <IconPencil />
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete();
        }}
        disabled={deleting}
        className="y2k-icon-btn y2k-icon-btn-danger disabled:opacity-50"
        aria-label={deleteLabel}
        title={deleteLabel}
      >
        <IconTrash />
      </button>
    </div>
  );
}
