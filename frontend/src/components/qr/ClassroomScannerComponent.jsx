import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle2, XCircle, RefreshCw, QrCode, ShieldCheck, UserCheck, AlertOctagon } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import axiosClient from '../../api/axiosClient';

const ClassroomScannerComponent = ({ scannerInfo, activeSession }) => {
  const [step, setStep] = useState(1); // 1: QR Scanning, 2: Fetching Student, 2.5: Entry Transition, 3: Face Capture, 4: Verifying, 5: Result
  const [detectedScanType, setDetectedScanType] = useState('ENTRY');
  const [qrToken, setQrToken] = useState('');
  const [manualRoll, setManualRoll] = useState('23AI001');
  const [studentInfo, setStudentInfo] = useState(null);
  const [sessionInfo, setSessionInfo] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [autoResetSeconds, setAutoResetSeconds] = useState(3);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  // Auto-Reset Timer Loop for Step 5
  useEffect(() => {
    let timer;
    if (step === 5) {
      setAutoResetSeconds(3);
      timer = setInterval(() => {
        setAutoResetSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleReset();
            return 3;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step]);

  // Initialize Live HTML5 Camera QR Scanner for Step 1
  useEffect(() => {
    let isMounted = true;
    if (step === 1) {
      const timer = setTimeout(() => {
        if (isMounted) startLiveQRScanner();
      }, 100);
      return () => {
        clearTimeout(timer);
        stopLiveQRScanner();
      };
    }
  }, [step]);

  const startLiveQRScanner = async () => {
    try {
      const qrElement = document.getElementById("qr-reader");
      if (!qrElement) return;

      if (html5QrCodeRef.current) {
        try {
          if (html5QrCodeRef.current.isScanning) {
            await html5QrCodeRef.current.stop();
          }
        } catch (e) {}
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      const qrConfig = { fps: 10, qrbox: { width: 220, height: 220 } };

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          qrConfig,
          (decodedText) => handleAutoQRDetection(decodedText),
          () => {}
        );
      } catch (camErr) {
        await html5QrCode.start(
          { facingMode: "user" },
          qrConfig,
          (decodedText) => handleAutoQRDetection(decodedText),
          () => {}
        );
      }
    } catch (err) {
      console.log("HTML5 QR camera fallback mode:", err);
    }
  };

  const stopLiveQRScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
      } catch (err) {}
    }
  };

  // Smart Unified QR Code Detection Workflow
  const handleAutoQRDetection = async (scannedToken) => {
    await stopLiveQRScanner();
    setQrToken(scannedToken);

    // Robust QR Payload Type Inspection
    let targetType = 'ENTRY';
    if (scannedToken && scannedToken.trim().startsWith('{') && scannedToken.trim().endsWith('}')) {
      try {
        const parsed = JSON.parse(scannedToken);
        if (parsed.type) targetType = parsed.type.toUpperCase();
        else if (parsed.qr_type) targetType = parsed.qr_type.toUpperCase();
        else if (parsed.exit_time && !parsed.entry_time) targetType = 'EXIT';
        else if (parsed.subject_code || parsed.entry_time) targetType = 'ENTRY';
      } catch (e) {}
    }

    setDetectedScanType(targetType);
    setStep(2); // Fetching student enrollment data

    try {
      let stData = null;
      let sessData = null;

      if (scannedToken && scannedToken.length > 15) {
        const res = await axiosClient.post('/qr/decode-student', { qr_token: scannedToken });
        stData = res.data.student;
        sessData = res.data.session;
      } else {
        stData = {
          id: 'stud-1',
          roll_no: scannedToken || manualRoll || '23AI001',
          name: (scannedToken || manualRoll) === '23AI001' ? 'Rahul Sharma' : 'Student Identity',
        };
        sessData = {
          id: activeSession?.id || 'sess-1',
          subject_code: activeSession?.subject_code || 'AI301',
          subject_name: 'Machine Learning & AI',
        };
      }

      setStudentInfo(stData);
      setSessionInfo(sessData);

      if (targetType === 'EXIT') {
        // EXIT SCAN: Directly attempt exit verification (denies if no prior entry exists, bypasses face camera)
        executeDirectExitScan(stData, sessData, scannedToken);
      } else {
        // ENTRY SCAN: Show 2s transition -> Open Face Camera -> Upload photo file to Render Model API
        setStep(2.5);
        setTimeout(() => {
          setStep(3);
          startFaceCameraAndAutoSubmit(stData, sessData, scannedToken);
        }, 2000);
      }

    } catch (err) {
      const detail = err.response?.data?.detail;
      setScanResult({
        success: false,
        error_code: typeof detail === 'object' ? detail.error_code : 'QR_INVALID',
        message: typeof detail === 'object' ? detail.message : (detail || 'Invalid or expired QR code'),
      });
      setStep(5);
    }
  };

  // Direct Exit Scan Execution (No Face Recognition Required, Denies Exit Without Prior Entry)
  const executeDirectExitScan = async (stData, sessData, scannedToken) => {
    setStep(4);
    try {
      const payload = {
        qr_token: scannedToken || 'MOCK_TOKEN',
        roll: stData?.roll_no || manualRoll,
        scanner_id: scannerInfo?.scanner_id || 'LAB204_SCANNER',
        session_id: sessData?.id,
      };

      const res = await axiosClient.post('/attendance/exit', payload);
      setScanResult({
        success: true,
        status: 'EXIT_RECORDED',
        message: `Exit Recorded (${res.data.duration_minutes || 0} mins attended)`,
        attendance_status: res.data.attendance_status,
        time: new Date().toLocaleTimeString(),
      });
      setStep(5);
    } catch (err) {
      const detail = err.response?.data?.detail;
      setScanResult({
        success: false,
        error_code: typeof detail === 'object' ? detail.error_code : 'EXIT_DENIED',
        message: typeof detail === 'object' ? detail.message : (detail || 'Exit denied: You must complete Entry scan before exiting.'),
      });
      setStep(5);
    }
  };

  // Entry Scan Face Camera Capture & Render API Upload
  const startFaceCameraAndAutoSubmit = async (stData, sessData, scannedToken) => {
    let stream = null;
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }
    } catch (err) {
      console.log("Face camera stream fallback");
    }

    setTimeout(async () => {
      let faceBase64 = '';
      if (videoRef.current && canvasRef.current) {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        canvas.width = video.videoWidth || 320;
        canvas.height = video.videoHeight || 240;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        faceBase64 = canvas.toDataURL('image/jpeg', 0.85);
      } else {
        faceBase64 = 'data:image/jpeg;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      }

      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      setStep(4);

      try {
        const payload = {
          qr_token: scannedToken || 'MOCK_TOKEN',
          roll: stData?.roll_no || manualRoll,
          subject_code: sessData?.subject_code || 'AI301',
          date: new Date().toISOString().split('T')[0],
          face_image: faceBase64,
          scanner_id: scannerInfo?.scanner_id || 'LAB204_SCANNER',
        };

        const res = await axiosClient.post('/attendance/entry', payload);
        setScanResult({
          success: true,
          status: 'ENTRY_RECORDED',
          message: 'Face verified & Entry recorded successfully!',
          student: res.data.student,
          time: new Date().toLocaleTimeString(),
        });
        setStep(5);
      } catch (err) {
        const detail = err.response?.data?.detail;
        setScanResult({
          success: false,
          error_code: typeof detail === 'object' ? detail.error_code : 'FACE_MISMATCH',
          message: typeof detail === 'object' ? detail.message : (detail || 'Face verification failed'),
        });
        setStep(5);
      }
    }, 600);
  };

  const handleReset = () => {
    stopLiveQRScanner();
    setStep(1);
    setQrToken('');
    setStudentInfo(null);
    setScanResult(null);
    setDetectedScanType('ENTRY');
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Smart Kiosk Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 glass-card p-4 rounded-2xl border border-slate-800">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-white flex items-center">
            <Camera className="w-5 h-5 text-blue-400 mr-2" />
            Smart Unified Classroom Attendance Kiosk
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Scanner: <span className="font-mono text-white">{scannerInfo?.scanner_id || 'LAB204_SCANNER'}</span> | Room: {scannerInfo?.room_code || 'LAB-204'}
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center">
          <ShieldCheck className="w-4 h-4 mr-1.5" /> AUTO DETECT ENTRY / EXIT
        </div>
      </div>

      {/* Main Kiosk Viewfinder & Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Left Viewfinder */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between relative min-h-[400px] border border-blue-500/20 shadow-2xl">
          
          {/* STEP 1: Live Camera Scanner */}
          {step === 1 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto w-full">
              <div className="w-full max-w-xs bg-slate-950 rounded-2xl overflow-hidden border-2 border-blue-500/50 relative shadow-inner p-2">
                <div id="qr-reader" className="w-full text-xs text-slate-400 overflow-hidden rounded-xl min-h-[200px]" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20 uppercase tracking-wider">
                  Continuous Camera QR Scanner Active
                </span>
                <p className="text-xs text-slate-400 mt-2">Point student Mobile Entry or Exit QR Code to camera</p>
              </div>

              {/* Manual Fallback */}
              <div className="w-full max-w-xs pt-2 space-y-2">
                <div className="flex items-center text-[10px] text-slate-500 uppercase tracking-wider justify-center">
                  <span className="h-px bg-slate-800 flex-1" />
                  <span className="px-2">Or Manual Roll Lookup</span>
                  <span className="h-px bg-slate-800 flex-1" />
                </div>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="Roll No (e.g. 23AI001)"
                    value={manualRoll}
                    onChange={(e) => setManualRoll(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                  />
                  <button
                    onClick={() => handleAutoQRDetection(manualRoll)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl whitespace-nowrap"
                  >
                    Scan
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Fetching Student Record */}
          {step === 2 && (
            <div className="flex flex-col items-center justify-center text-center space-y-3 my-auto py-12">
              <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
              <h4 className="font-bold text-white text-sm">Inspecting QR Code & Fetching Roster...</h4>
              <p className="text-xs text-slate-400">Auto-detecting ENTRY vs EXIT payload</p>
            </div>
          )}

          {/* STEP 2.5: 2-Second Transition Delay Card (ENTRY Mode Only) */}
          {step === 2.5 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto py-10 animate-in fade-in zoom-in-95">
              <UserCheck className="w-16 h-16 text-emerald-400" />
              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Entry QR Verified!
                </span>
                <h3 className="text-lg font-bold text-white mt-2">{studentInfo?.name}</h3>
                <p className="text-xs text-blue-400 font-mono">Roll: {studentInfo?.roll_no}</p>
              </div>

              <div className="p-3 bg-slate-900/80 rounded-2xl border border-slate-800 w-full max-w-xs space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Opening Face Camera...</span>
                  <span className="text-emerald-400 font-bold">2.0s</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 animate-pulse w-full transition-all duration-2000" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Auto Face Capture Frame */}
          {step === 3 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto w-full">
              <div className="w-full max-w-xs h-52 bg-slate-950 rounded-2xl overflow-hidden border-2 border-emerald-500/60 relative shadow-inner flex items-center justify-center">
                <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-4 border-2 border-dashed border-emerald-400/80 rounded-xl pointer-events-none animate-pulse" />
              </div>

              <div>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Capturing Face Photo...
                </span>
                <h4 className="font-bold text-white text-base mt-1">{studentInfo?.name} ({studentInfo?.roll_no})</h4>
                <p className="text-xs text-slate-400">Uploading photo to Render Model API</p>
              </div>
            </div>
          )}

          {/* STEP 4: Processing */}
          {step === 4 && (
            <div className="flex flex-col items-center justify-center text-center space-y-3 my-auto py-12">
              <RefreshCw className="w-10 h-10 text-emerald-400 animate-spin" />
              <h4 className="font-bold text-white text-sm">
                {detectedScanType === 'ENTRY' ? 'Uploading Image to Model API...' : 'Verifying Prior Entry & Recording Exit...'}
              </h4>
              <p className="text-xs text-emerald-400 font-mono">
                {detectedScanType === 'ENTRY' ? 'onrender.com/upload' : 'POST /api/attendance/exit'}
              </p>
            </div>
          )}

          {/* STEP 5: Result Card with Auto Reset Countdown */}
          {step === 5 && (
            <div className="flex flex-col items-center justify-center text-center space-y-4 my-auto py-6">
              {scanResult?.success ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-400 animate-in zoom-in-95" />
              ) : (
                <AlertOctagon className="w-16 h-16 text-rose-500 animate-in zoom-in-95" />
              )}
              <div>
                <p className="text-xs text-slate-300 font-semibold mb-1">
                  Scanning next student in <span className="text-blue-400 font-bold">{autoResetSeconds}s</span>...
                </p>
                <button
                  onClick={handleReset}
                  className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg"
                >
                  Scan Next Immediately
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Status Panel */}
        <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
          <div className="border-b border-slate-800 pb-3 mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Live Kiosk Identity Status</h4>
          </div>

          {step === 1 && (
            <div className="my-auto py-12 text-center text-slate-500 space-y-2">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-700" />
              <p className="text-xs font-medium">Unified Kiosk Active. Auto-detects Entry & Exit QR codes.</p>
            </div>
          )}

          {(step === 2.5 || step === 3 || step === 4) && studentInfo && (
            <div className="my-auto p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm flex items-center justify-center">
                  {studentInfo.name.charAt(0)}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{studentInfo.name}</h4>
                  <p className="text-xs text-blue-400 font-mono">Roll: {studentInfo.roll_no}</p>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-[11px] text-slate-300 space-y-1">
                <p>Subject: <strong className="text-white">{sessionInfo?.subject_code} - {sessionInfo?.subject_name}</strong></p>
                <p>Detected Mode: <span className="font-mono text-emerald-400">{detectedScanType} SCAN</span></p>
              </div>
            </div>
          )}

          {step === 5 && scanResult && (
            <div className={`my-auto p-5 rounded-2xl text-center space-y-3 ${
              scanResult.success ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-rose-500/10 border border-rose-500/30'
            }`}>
              <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                scanResult.success ? 'text-emerald-400 bg-emerald-500/20' : 'text-rose-400 bg-rose-500/20'
              }`}>
                {scanResult.success ? 'RECORDED SUCCESSFULLY' : scanResult.error_code || 'DENIED'}
              </span>
              <h3 className="text-lg font-bold text-white mt-2">
                {scanResult.student?.name || studentInfo?.name || manualRoll}
              </h3>
              <p className="text-xs text-slate-300">{scanResult.message}</p>
              <p className="text-[10px] text-slate-400">Timestamp: {scanResult.time || new Date().toLocaleTimeString()}</p>
            </div>
          )}

          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Scanner Mode: <strong className="text-emerald-400 font-mono">UNIFIED SMART SCANNER</strong></span>
            <span className="text-emerald-400 font-semibold">● ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClassroomScannerComponent;
