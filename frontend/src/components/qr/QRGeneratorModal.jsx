import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { X, Clock, ShieldCheck, RefreshCw, LogIn, LogOut } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

const QRGeneratorModal = ({ session, onClose }) => {
  const [qrType, setQrType] = useState('ENTRY'); // ENTRY or EXIT
  const [qrToken, setQrToken] = useState(null);
  const [qrJson, setQrJson] = useState(null);
  const [timeLeft, setTimeLeft] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchQR = async (typeToFetch = qrType) => {
    if (!session?.id) return;
    setLoading(true);
    setError('');
    try {
      const res = await axiosClient.post('/qr/generate', {
        session_id: session.id,
        type: typeToFetch,
      });
      setQrToken(res.data.qr_token);
      setQrJson(res.data.qr_json);
      setTimeLeft(res.data.expires_in_seconds || 10);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to generate QR token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQR(qrType);
  }, [session?.id, qrType]);

  useEffect(() => {
    if (timeLeft <= 0) {
      fetchQR(qrType);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, qrType]);

  const percentage = (timeLeft / 10) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/85 backdrop-blur-md p-0 sm:p-4">
      <div className="glass-card max-w-sm w-full rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-700/60 relative bg-slate-900">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/80 transition-all touch-manipulation"
        >
          <X className="w-5 h-5" />
        </button>

        {/* QR Type Selector (Entry vs Exit) */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4 mt-2">
          <button
            onClick={() => setQrType('ENTRY')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center transition-all ${
              qrType === 'ENTRY' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 mr-1" /> ENTRY QR
          </button>
          <button
            onClick={() => setQrType('EXIT')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center transition-all ${
              qrType === 'EXIT' ? 'bg-amber-600 text-white shadow' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LogOut className="w-3.5 h-3.5 mr-1" /> EXIT QR
          </button>
        </div>

        {/* Header */}
        <div className="text-center mb-3">
          <span className="inline-flex items-center text-[10px] font-semibold text-blue-400 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20 mb-1">
            <ShieldCheck className="w-3 h-3 mr-1" /> Dynamic {qrType} JSON QR Code
          </span>
          <h3 className="text-base font-bold text-white tracking-tight leading-tight">
            {session?.subject_name || session?.subject_code || 'Class Session'}
          </h3>
        </div>

        {/* QR Code Container */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-950 rounded-2xl border border-slate-800 shadow-inner my-2">
          {loading && !qrToken ? (
            <div className="py-10 flex flex-col items-center">
              <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-2" />
              <p className="text-xs text-slate-400">Generating dynamic QR payload...</p>
            </div>
          ) : error ? (
            <div className="py-6 text-center">
              <p className="text-xs text-rose-400 mb-3">{error}</p>
              <button
                onClick={() => fetchQR(qrType)}
                className="px-4 py-2 text-xs bg-blue-600 text-white rounded-xl font-medium"
              >
                Retry
              </button>
            </div>
          ) : qrToken ? (
            <div className="p-3 bg-white rounded-2xl shadow-xl border-4 border-white">
              <QRCodeSVG value={qrToken} size={180} level="M" includeMargin={true} />
            </div>
          ) : null}
        </div>

        {/* JSON Preview Snippet */}
        {qrJson && (
          <div className="p-2 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-400 my-2 overflow-x-auto">
            <span className="text-blue-400 font-bold block text-[9px] uppercase tracking-wider mb-0.5">Payload Content:</span>
            <code>{JSON.stringify(qrJson, null, 1)}</code>
          </div>
        )}

        {/* Expiration Timer */}
        <div className="mt-3 space-y-1 pb-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="flex items-center text-[11px]">
              <Clock className="w-3.5 h-3.5 mr-1 text-blue-400" /> Refreshes in
            </span>
            <span className="font-extrabold text-white text-xs">{timeLeft}s</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                timeLeft <= 3 ? 'bg-rose-500' : 'bg-blue-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QRGeneratorModal;
