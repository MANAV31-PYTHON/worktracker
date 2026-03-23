import { createContext, useContext, useState, useCallback } from "react";
import { AlertTriangle, Info, Trash2 } from "lucide-react";

const DialogContext = createContext(null);
export const useDialog = () => useContext(DialogContext);

export function DialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = useCallback((options) =>
    new Promise(resolve => setDialog({ type:"confirm", resolve, ...options })), []);

  const alert = useCallback((options) =>
    new Promise(resolve => setDialog({ type:"alert", resolve, ...options })), []);

  const close = (result) => { dialog?.resolve(result); setDialog(null); };

  return (
    <DialogContext.Provider value={{ confirm, alert }}>
      {children}
      {dialog && <DialogModal dialog={dialog} onClose={close} />}
    </DialogContext.Provider>
  );
}

function DialogModal({ dialog, onClose }) {
  const isConfirm = dialog.type === "confirm";
  const isDanger  = dialog.danger ?? isConfirm;

  const Icon = dialog.icon === "info"
    ? <Info size={26} strokeWidth={2}/>
    : isDanger
      ? <Trash2 size={26} strokeWidth={2}/>
      : <AlertTriangle size={26} strokeWidth={2}/>;

  return (
    <div className="dialog-overlay">
      <div className="dialog-box" onClick={e => e.stopPropagation()}>
        <div className={`dialog-icon-wrap ${isDanger ? "danger" : "info"}`}>
          {Icon}
        </div>
        <div className="dialog-content">
          <h3 className="dialog-title">{dialog.title || (isDanger ? "Are you sure?" : "Notice")}</h3>
          <p className="dialog-message">{dialog.message}</p>
        </div>
        <div className="dialog-actions">
          {isConfirm && (
            <button className="btn btn-ghost" onClick={() => onClose(false)}>Cancel</button>
          )}
          <button
            className={`btn ${isDanger ? "btn-danger-solid" : "btn-primary"}`}
            onClick={() => onClose(true)} autoFocus
          >
            {dialog.confirmLabel || (isDanger ? "Delete" : "OK")}
          </button>
        </div>
      </div>
    </div>
  );
}
