import React from 'react';
import { X, Smartphone, CheckCircle2, Terminal, AlertTriangle, ShieldCheck, Usb } from 'lucide-react';

interface AndroidGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AndroidGuideModal: React.FC<AndroidGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col h-[85vh] max-h-[640px]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Smartphone size={20} className="text-cyan-400" />
            <h3 className="text-base font-bold text-white tracking-tight">
              안드로이드 스마트폰 연결 및 앱 설치 가이드
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 flex-1 min-h-0">
          {/* Step 1 */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">1</span>
              스마트폰 개발자 옵션 활성화
            </div>
            <p className="text-slate-400 pl-7 text-xs leading-relaxed">
              안드로이드 폰의 <b>설정</b> 앱 &gt; <b>휴대전화 정보</b> &gt; <b>소프트웨어 정보</b> &gt; <b>'빌드번호'를 7번 연속 연타</b>합니다.<br />
              (비밀번호 입력 후 "개발자 모드를 켰습니다" 메시지가 뜹니다)
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">2</span>
              USB 디버깅 켜기
            </div>
            <p className="text-slate-400 pl-7 text-xs leading-relaxed">
              다시 <b>설정</b>의 맨 아래에 새로 생긴 <b>'개발자 옵션'</b>으로 들어간 뒤, <b>'USB 디버깅'</b> 스위치를 <b>[켬]</b>으로 설정합니다.
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">3</span>
              PC와 스마트폰을 USB 케이블로 연결
            </div>
            <p className="text-slate-400 pl-7 text-xs leading-relaxed">
              스마트폰 화면에 <b>"USB 디버깅을 허용하시겠습니까?"</b> 팝업이 뜨면 <b>'이 컴퓨터에서 항상 허용'</b> 체크 후 <b>[허용]</b>을 누릅니다.
            </p>
          </div>

          {/* Step 4 */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-300 font-bold">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-xs">4</span>
              터미널에서 원클릭 자동 설치 실행
            </div>
            <div className="pl-7 space-y-1.5">
              <p className="text-slate-400 text-xs">
                현재 컴퓨터에 이미 <b>Android SDK 및 ADB, Java 17</b>이 모두 완벽하게 세팅되어 있습니다. 아래 명령어로 즉시 기기에 설치 및 실행됩니다:
              </p>
              <div className="p-2.5 rounded-lg bg-black/80 font-mono text-xs text-emerald-400 border border-slate-800 select-all">
                adb install -r android/app/build/outputs/apk/debug/app-debug.apk
              </div>
              <p className="text-[11px] text-slate-400">
                또는 <code className="text-cyan-300">npx cap run android</code> 명령어로 빌드 및 기기 자동 실행 가능!
              </p>
            </div>
          </div>

          {/* Step 5 */}
          <div className="p-3.5 rounded-xl bg-sky-950/40 border border-cyan-900/60 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck size={18} />
              마이크 권한 허용 및 드럼 튜닝 시작
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              앱이 실행되면 <b>마이크 사용 권한 [앱 사용 중에만 허용]</b>을 누르고 드럼 가까이에 폰을 둔 뒤 탐의 가장자리(러그)나 중앙을 스틱으로 가볍게 치면 정밀 실시간 튜닝이 진행됩니다!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-cyan-500/25"
          >
            확인 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
