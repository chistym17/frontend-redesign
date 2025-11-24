import React, { useEffect, useMemo, useState } from "react";
import { toolsService } from "../lib/toolsService";

const STATIC_TOOL_NAMES = ["recall_memory"];

export default function FunctionMultiSelect({
  assistantId,
  value = [],
  onChange,
  className = "text-white",
  refreshTrigger,
}) {
  const [dynNames, setDynNames] = useState([]);
  const [loading, setLoading] = useState(false);

  const allOptions = useMemo(() => {
    const set = new Set([
      ...STATIC_TOOL_NAMES,
      ...dynNames.map((t) => t?.name).filter(Boolean),
    ]);
    return Array.from(set).sort();
  }, [dynNames]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const rows = await toolsService.listTools(assistantId);
        if (!mounted) return;
        setDynNames(Array.isArray(rows) ? rows : []);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [assistantId, refreshTrigger]);

  const toggle = (name) => {
    const exists = value.includes(name);
    const next = exists ? value.filter((n) => n !== name) : [...value, name];
    onChange?.(next);
  };

  const selectAll = () => onChange?.(allOptions);
  const clearAll = () => onChange?.([]);

  const handleCopy = (name) => {
    navigator.clipboard.writeText(name)
      .then(() => console.log(`${name} copied to clipboard`))
      .catch(err => console.error("Failed to copy: ", err));
  };

  const allSelected = allOptions.length > 0 && value.length === allOptions.length;
  const someSelected = value.length > 0 && value.length < allOptions.length;

  return (
    <div className={className} style={{ width: "278px", overflowY: "auto" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "56px",
        background: "rgba(145, 158, 171, 0.16)"
      }}>
        <div style={{
          width: "193px",
          display: "flex",
          alignItems: "center",
          paddingLeft: "8px"
        }}>
         {/* Select All Checkbox */}
          <div className="relative shrink-0 ml-2 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected && allOptions.length > 0}
              onChange={allSelected ? clearAll : selectAll}
              className="absolute opacity-0 w-3.5 h-3.5 cursor-pointer peer"
              id="select-all-header"
            />
            <label htmlFor="select-all-header">
              <div
                className="w-3.5 h-3.5 rounded border-2 border-[#919EAB] bg-transparent transition-all shadow-sm relative hover:border-gray-300"
              >
                {allSelected && allOptions.length > 0 && (
                  <div className="absolute inset-[2px] bg-white rounded-sm" />
                )}
                {someSelected && !allSelected && (
                  <div className="absolute inset-[2px] bg-white/50 rounded-sm" />
                )}
              </div>
            </label>
          </div>

        <span className="ml-2 font-semibold text-xs text-white uppercase">
          Function Name
        </span>

        </div>
        <div style={{
          width: "85px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}>
          <div
            onClick={clearAll} // <-- attach clearAll here
            style={{
              background: "rgba(255, 86, 48, 0.16)",
              borderRadius: "4px",
              padding: "0px 6px",
              cursor: "pointer" // <-- make it look clickable
            }}
          >
            <span style={{
              fontWeight: 700,
              fontSize: "12px",
              color: "#FFAC82"
            }}>Clear</span>
          </div>
        </div>

      </div>

      {/* Data Rows */}
      {loading ? (
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "54px",
          color: "#FFFFFF",
          fontSize: "12px",
          background: 'rgba(255, 255, 255, 0.04)',
        }}>Loading tools…</div>
      ) : (
        allOptions.map((name) => (
          <div key={name} style={{
            display: "flex",
            flexDirection: "row",
            width: "100%",
            height: "54px",
               background: 'rgba(255, 255, 255, 0.04)',
            borderBottom: "1px dashed rgba(145, 158, 171, 0.2)"
            
          }}>
           {/* Main Column */}
            <div
              style={{
                width: "193px",
                display: "flex",
                alignItems: "center",
                paddingLeft: "8px"
              }}
            >
              <div className="relative shrink-0 ml-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.includes(name)}
                  onChange={() => toggle(name)}
                  className="absolute opacity-0 w-3.5 h-3.5 cursor-pointer peer"
                  id={`row-checkbox-${name}`}
                />

                <label htmlFor={`row-checkbox-${name}`}>
                  <div className="w-3.5 h-3.5 rounded border-2 border-[#919EAB] bg-transparent relative transition-all hover:border-gray-300">

                    {value.includes(name) && (
                      <div className="absolute inset-[2px] bg-[#919EAB] rounded-sm" />
                    )}

                  </div>
                </label>
              </div>



             <span className="ml-2 text-xs text-white">
              {name}
            </span>
            </div>

       {/* Action Column */}
          <div
            style={{
              width: "85px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center"
            }}
          >
            {value.includes(name) && (
              <div
                onClick={() => handleCopy(name)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center"
                }}
              >
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path
                    d="M12.7 1.6665L9.455 1.6665C7.985 1.6665 6.82 1.6665 5.90917 1.78984C4.97083 1.9165 4.21167 2.18317 3.61333 2.784C3.01417 3.38484 2.74833 4.14734 2.6225 5.089C2.5 6.004 2.5 7.17317 2.5 8.649V13.514C2.5 14.7707 3.26667 15.8473 4.35583 16.299C4.3 15.5407 4.3 14.4782 4.3 13.5932L4.3 9.41817C4.3 8.35067 4.3 7.42984 4.39833 6.69317C4.50417 5.90317 4.7425 5.1465 5.35417 4.53234C5.96583 3.91817 6.72 3.679 7.50667 3.57234C8.24 3.474 9.15667 3.474 10.2208 3.474L12.7792 3.474C13.8425 3.474 14.7575 3.474 15.4917 3.57234C15.2717 3.01098 14.8877 2.52892 14.3897 2.18897C13.8917 1.84902 13.3029 1.66696 12.7 1.6665Z"
                    fill="#919EAB"
                  />
                  <path
                    d="M5.5 9.49734C5.5 7.22567 5.5 6.08984 6.20333 5.384C6.90583 4.67817 8.03667 4.67817 10.3 4.67817H12.7C14.9625 4.67817 16.0942 4.67817 16.7975 5.384C17.5 6.08984 17.5 7.22567 17.5 9.49734V13.514C17.5 15.7857 17.5 16.9215 16.7975 17.6273C16.0942 18.3332 14.9625 18.3332 12.7 18.3332H10.3C8.0375 18.3332 6.90583 18.3332 6.20333 17.6273C5.5 16.9215 5.5 15.7857 5.5 13.514V9.49734Z"
                    fill="#919EAB"
                  />
                </svg>
              </div>
            )}
          </div>

          </div>
        ))
      )}
    </div>
  );
}
