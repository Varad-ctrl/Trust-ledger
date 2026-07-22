export default function ConfirmModal({ isOpen, title, message, confirmLabel = 'Confirm', danger = false, onConfirm, onCancel, loading }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600 mt-2">{message}</p>
        <div className="flex gap-3 mt-6 justify-end">
          <button onClick={onCancel} className="btn-secondary" disabled={loading}>Cancel</button>
          <button onClick={onConfirm} disabled={loading}
            className={danger ? 'btn-danger' : 'btn-primary'}>
            {loading ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
