// components/textflow/components/ConditionTester.js
import React, { useState } from "react";
import jmespath from "jmespath";
import Editor from "@monaco-editor/react";
import { Play, CheckCircle, XCircle } from "lucide-react";

export default function ConditionTester() {
  const [expr, setExpr] = useState("output.status == `200`");
  const [jsonIn, setJsonIn] = useState('{"output":{"status":200,"body":{"ok":true}}}');
  const [result, setResult] = useState("");
  const [error, setError] = useState(false);

  const run = () => {
    try {
      const input = JSON.parse(jsonIn);
      const out = jmespath.search(input, expr);
      setResult(JSON.stringify(out));
      setError(false);
    } catch (e) {
      setResult(String(e?.message || e));
      setError(true);
    }
  };

  return (
    <div className="space-y-3 condition-tester">
      <style dangerouslySetInnerHTML={{__html: `
        .condition-tester .monaco-editor, .condition-tester .monaco-editor .monaco-editor-background {
          background: transparent !important;
        }
        .condition-tester .monaco-editor .margin {
          background: transparent !important;
        }
        .condition-tester .monaco-editor .monaco-scrollable-element {
          background: transparent !important;
        }
      `}} />
      <div 
        className="rounded-xl p-4 backdrop-blur"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
          JMESPath Expression
        </div>
        <div 
          className="rounded-lg overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Editor 
            height="90px" 
            defaultLanguage="javascript" 
            value={expr} 
            onChange={(v)=>setExpr(v || "")} 
            theme="vs-dark"
            options={{ 
              minimap:{enabled:false}, 
              fontSize:12,
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
            }}
            beforeMount={(monaco) => {
              monaco.editor.defineTheme('custom-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                  'editor.background': '#00000000',
                  'editor.foreground': '#FFFFFF',
                }
              });
            }}
            onMount={(editor, monaco) => {
              monaco.editor.setTheme('custom-dark');
            }}
          />
        </div>
      </div>

      <div 
        className="rounded-xl p-4 backdrop-blur"
        style={{
          background: 'rgba(255, 255, 255, 0.04)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        <div className="text-xs font-semibold text-white mb-2 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
          Input JSON
        </div>
        <div 
          className="rounded-lg overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          <Editor 
            height="120px" 
            defaultLanguage="json" 
            value={jsonIn} 
            onChange={(v)=>setJsonIn(v || "{}")} 
            theme="vs-dark"
            options={{ 
              minimap:{enabled:false}, 
              fontSize:12,
              lineNumbers: "off",
              scrollBeyondLastLine: false,
              scrollbar: {
                vertical: 'hidden',
                horizontal: 'hidden',
                useShadows: false,
                verticalHasArrows: false,
                horizontalHasArrows: false,
              },
              overviewRulerLanes: 0,
              hideCursorInOverviewRuler: true,
            }}
            beforeMount={(monaco) => {
              monaco.editor.defineTheme('custom-dark', {
                base: 'vs-dark',
                inherit: true,
                rules: [],
                colors: {
                  'editor.background': '#00000000',
                  'editor.foreground': '#FFFFFF',
                }
              });
            }}
            onMount={(editor, monaco) => {
              monaco.editor.setTheme('custom-dark');
            }}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <button 
          className="px-3 py-1.5 text-xs font-semibold text-white transition-all rounded-lg flex items-center justify-center gap-1.5" 
          onClick={run}
          style={{
            border: '1px solid rgba(255, 255, 255, 0.32)'
          }}
        >
          <Play className="w-3 h-3" />
          Test Condition
        </button>
      </div>

      {result && (
        <div 
          className="rounded-xl p-4 backdrop-blur"
          style={{
            background: error 
              ? 'rgba(220, 38, 38, 0.1)' 
              : 'rgba(16, 185, 129, 0.1)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            border: `1px solid ${error ? 'rgba(220, 38, 38, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            {error ? (
              <>
                <XCircle className="w-4 h-4 text-red-400" />
                <span className="text-xs font-semibold text-red-300">Error</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-300">Result</span>
              </>
            )}
          </div>
          <pre 
            className="text-xs font-mono overflow-auto p-3 rounded-lg text-white"
            style={{
              background: error 
                ? 'rgba(220, 38, 38, 0.15)' 
                : 'rgba(16, 185, 129, 0.15)',
              border: `1px solid ${error ? 'rgba(220, 38, 38, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
            }}
          >
            {result}
          </pre>
        </div>
      )}
    </div>
  );
}