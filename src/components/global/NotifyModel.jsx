import { X } from "lucide-react";
import { useEffect } from "react";
import { useDetails } from "../context/ContextProvider";

const NotifyModel = () => {
  const ctx = useDetails();

  // Context missing
  if (!ctx) {
    console.error("❌ NotifyModel must be inside <ContextProvider>");
    return null;
  }

  const {
    error,
    setErrors,
    success,
    setSuccess,
    warning,
    setWarning,
    update,
    setUpdate,
  } = ctx;

  const clearNoti = () => {
    setErrors("");
    setSuccess("");
    setWarning("");
    setUpdate("");
  };

  useEffect(() => {
    if (error || success || warning || update) {
      const timer = setTimeout(clearNoti, 4000);
      return () => clearTimeout(timer);
    }
    if (error) {
      setSuccess("");
      setWarning("");
      setUpdate("");
    }
    if (success) {
      setErrors("");
      setWarning("");
      setUpdate("");
    }
    if (update) {
      setErrors("");
      setWarning("");
      setSuccess("");
    }
    if (warning) {
      setErrors("");
      setUpdate("");
      setSuccess("");
    }
  }, [error, success, warning, update]);

  if (!error && !success && !warning && !update) return null;

  return (
    <div
      className={`fixed z-50 text-white lg:w-80 w-64 rounded-tl-lg rounded-bl-lg flex flex-col text-wrap text-sm
        gap-y-2 h-fit p-4 shadow-lg right-0 bottom-1
         ${!!error ? "bg-red-600" : ""}
        ${!!success ? "bg-green-600" : ""}
        ${!!warning ? "bg-yellow-600" : ""}
        ${!!update ? "bg-blue-600" : ""}`}
    >
      <X
        className="absolute right-3 top-3 cursor-pointer"
        onClick={clearNoti}
      />
      {error && <h2 className="font-bold text-xs sm:text-md">Error !</h2>}
      {success && <h2 className="font-bold text-xs sm:text-md">Success !</h2>}
      {warning && <h2 className="font-bold text-xs sm:text-md">Warning !</h2>}
      {update && <h2 className="font-bold text-xs sm:text-md">Update !</h2>}

      <div className="pt-1">
        {error && <p>{String(error)}</p>}
        {success && <p>{String(success)}</p>}
        {update && <p>{String(update)}</p>}
        {warning && <p>{String(warning)}</p>}
      </div>
    </div>
  );
};

export default NotifyModel;
