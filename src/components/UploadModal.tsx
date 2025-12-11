import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, Loader2 } from 'lucide-react';
import { GlowButton } from './ui/HudPanel';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose }) => {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);
    
    // Simulate upload
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('success');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const reset = () => {
    setFile(null);
    setStatus('idle');
    setProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0B1120] border border-cyber-cyan/30 rounded-xl p-6 w-[500px] shadow-[0_0_30px_rgba(0,240,255,0.15)] relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
        
        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Upload size={20} className="text-cyber-cyan" />
          供应链业务算法
        </h3>
        
        {status === 'success' ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} className="text-emerald-500" />
            </div>
            <h4 className="text-lg font-medium text-white mb-2">导入成功</h4>
            <p className="text-gray-400 mb-6">模型文件已成功上传至供应链业务算法</p>
            <div className="flex justify-center gap-3">
              <GlowButton variant="secondary" onClick={() => { reset(); onClose(); }}>关闭</GlowButton>
              <GlowButton onClick={reset}>继续导入</GlowButton>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive ? 'border-cyber-cyan bg-cyber-cyan/10' : 'border-gray-700 hover:border-gray-500 bg-gray-800/50'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input 
                ref={inputRef}
                type="file" 
                className="hidden" 
                onChange={handleChange}
                accept=".py,.onnx,.pb,.h5" 
              />
              
              {file ? (
                <div className="flex flex-col items-center">
                  <FileText size={48} className="text-cyber-cyan mb-4" />
                  <p className="text-white font-medium mb-1">{file.name}</p>
                  <p className="text-gray-400 text-sm mb-4">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  <button onClick={() => setFile(null)} className="text-xs text-red-400 hover:text-red-300 underline">移除文件</button>
                </div>
              ) : (
                <div className="flex flex-col items-center cursor-pointer" onClick={() => inputRef.current?.click()}>
                  <Upload size={48} className="text-gray-500 mb-4" />
                  <p className="text-gray-300 font-medium mb-1">点击或拖拽文件至此处</p>
                  <p className="text-gray-500 text-sm">支持 .py, .onnx, .pb, .h5 格式</p>
                </div>
              )}
            </div>

            {status === 'uploading' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400">
                  <span>上传中...</span>
                  <span>{progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-cyber-cyan transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
              <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">取消</button>
              <GlowButton 
                onClick={handleUpload} 
                disabled={!file || status === 'uploading'}
              >
                {status === 'uploading' ? (
                  <span className="flex items-center gap-2"><Loader2 className="animate-spin" size={16} /> 上传中</span>
                ) : '开始导入'}
              </GlowButton>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
