import React, { useState } from 'react';
import { Handle, Position } from 'reactflow';

export default function ToolNode({ data, selected }) {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <div 
      className="relative transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main Card - Compact Size */}
      <div 
        className={`relative rounded-xl min-w-[150px] max-w-[150px] overflow-hidden ${selected ? 'border-2' : 'border-0'}`}
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderColor: selected ? '#13F584' : 'transparent',
          boxShadow: selected 
            ? '0 25px 50px -12px rgba(19, 245, 132, 0.3)'
            : '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}
      >
          {/* Light Green Gradient Effect - Top Right */}
          <div 
            className="absolute top-0 right-0 w-6 h-6 pointer-events-none"
            style={{
              background: 'radial-gradient(circle at top right, rgba(19, 245, 132, 0.2) 0%, rgba(19, 245, 132, 0) 70%)',
            }}
          />
          
          {/* Top Handle */}
          <Handle
            type="target"
            position={Position.Top}
            className="!w-2.5 !h-2.5 !border-2 !bg-white/40 !border-[#141A21] transition-all duration-300"
            style={{ 
              top: -5,
              transform: selected || isHovered ? 'scale(1.2)' : 'scale(1)'
            }}
          />
          
          {/* Header - Compact */}
          <div className="px-2.5 py-1.5 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <h3 className="text-[7px] font-semibold text-white/60 truncate max-w-[80px]">
                {data.title || data.id}
              </h3>
            </div>
            {/* Fast Badge */}
            <div 
              className="px-0.5 py-0.5 rounded border text-[7px] font-bold flex-shrink-0"
              style={{
                background: 'rgba(19, 245, 132, 0.16)',
                color: '#9EFBCD',
                borderColor: 'rgba(19, 245, 132, 0.3)'
              }}
            >
              {data.respond_immediately ? 'Fast' : 'Wait'}
            </div>
          </div>
          
          {/* Content - Compact */}
          <div className="px-2.5 py-1.5 space-y-0.5">
            {/* Functions section */}
            {data.functions && data.functions.length > 0 ? (
              <div className="space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-[7px] font-medium text-white/60 uppercase tracking-wider">
                    Functions
                  </span>
                  <span 
                    className="text-[7px] px-0.5 py-0.5 rounded"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      color: 'rgba(255, 255, 255, 0.5)'
                    }}
                  >
                    {data.functions.length}
                  </span>
                </div>
                <div className="space-y-0.5">
                  {data.functions.slice(0, 2).map((func, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-0.5"
                    >
                      <div className="w-0.5 h-0.5 bg-white/40 rounded-full flex-shrink-0" />
                      <span className="text-[7px] text-white/60 truncate font-mono">
                        {func}
                      </span>
                    </div>
                  ))}
                  {data.functions.length > 2 && (
                    <div className="text-[7px] text-white/40 pl-1 italic">
                      +{data.functions.length - 2} more...
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-0.5">
                <div className="text-[7px] text-white/60">No functions</div>
              </div>
            )}
            
            {/* Prompt preview */}
            {data.prompt && (
              <div className="mt-1 pt-1">
                <div className="text-[7px] text-white/60 mb-0.5 uppercase tracking-wider font-mono truncate">
                  {data.id || 'MSQSSL'}
                </div>
                <div className="text-[7px] text-white/60 line-clamp-2 leading-tight">
                  {data.prompt.length > 40 ? data.prompt.substring(0, 40) + '...' : data.prompt}
                </div>
              </div>
            )}
          </div>
          
          {/* Footer - Compact */}
          <div className="px-2.5 py-1.5 flex items-center justify-between gap-0.5">
            <div 
              className="px-0.5 py-0.5 rounded border text-[7px] font-bold truncate"
              style={{
                background: 'rgba(19, 245, 132, 0.16)',
                color: '#9EFBCD',
                borderColor: 'rgba(19, 245, 132, 0.3)'
              }}
            >
              {data.respond_immediately ? 'Immediate' : 'Wait'}
            </div>
            <div 
              className="px-0.5 py-0.5 rounded border text-[7px] font-bold font-mono truncate max-w-[50px]"
              style={{
                background: 'rgba(19, 245, 132, 0.16)',
                color: '#9EFBCD',
                borderColor: 'rgba(19, 245, 132, 0.3)'
              }}
            >
              {data.id || 'Node_002'}
            </div>
          </div>
          
          {/* Bottom Handle */}
          <Handle
            type="source"
            position={Position.Bottom}
            className="!w-2.5 !h-2.5 !border-2 !bg-white/40 !border-[#141A21] transition-all duration-300"
            style={{ 
              bottom: -5,
              transform: selected || isHovered ? 'scale(1.2)' : 'scale(1)'
            }}
          />
        </div>
    </div>
  );
}