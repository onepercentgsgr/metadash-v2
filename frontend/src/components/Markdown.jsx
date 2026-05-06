import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Dark-themed markdown renderer with sensible defaults for MetaDash UI.
 * Supports GFM (tables, strikethrough, task lists, autolinks).
 */
export function Markdown({ children, className = '', compact = false }) {
  if (!children) return null;
  return (
    <div className={`md-body ${compact ? 'md-compact' : ''} ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-extrabold text-gray-100 mt-5 mb-3 tracking-tight" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-gray-100 mt-5 mb-2 tracking-tight border-b border-[#27272f] pb-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold text-indigo-300 mt-4 mb-2" {...props} />,
          h4: ({ node, ...props }) => <h4 className="text-sm font-bold text-gray-200 mt-3 mb-1.5 uppercase tracking-wider" {...props} />,
          p:  ({ node, ...props }) => <p className="text-sm text-gray-300 leading-relaxed my-2" {...props} />,
          a:  ({ node, ...props }) => <a className="text-indigo-400 hover:text-indigo-300 underline" target="_blank" rel="noopener noreferrer" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc list-outside ml-5 my-2 space-y-1 text-sm text-gray-300" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal list-outside ml-5 my-2 space-y-1 text-sm text-gray-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-relaxed marker:text-indigo-500" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-indigo-600/50 bg-indigo-950/20 pl-4 pr-3 py-2 my-3 italic text-gray-300 rounded-r" {...props} />
          ),
          strong: ({ node, ...props }) => <strong className="font-bold text-white" {...props} />,
          em:     ({ node, ...props }) => <em className="italic text-gray-200" {...props} />,
          code: ({ node, inline, className, children, ...props }) =>
            inline ? (
              <code className="bg-[#1e1e24] text-amber-300 px-1.5 py-0.5 rounded text-[12px] font-mono border border-[#27272f]" {...props}>
                {children}
              </code>
            ) : (
              <code className="block bg-[#09090b] text-gray-200 p-3 rounded-lg text-[12px] font-mono leading-relaxed overflow-x-auto border border-[#27272f] my-3" {...props}>
                {children}
              </code>
            ),
          pre: ({ node, ...props }) => <pre className="my-3" {...props} />,
          hr: () => <hr className="border-[#27272f] my-4" />,
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-3 border border-[#27272f] rounded-lg">
              <table className="w-full text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-[#1e1e24] text-gray-200" {...props} />,
          th: ({ node, ...props }) => <th className="px-3 py-2 text-left font-semibold text-[12px] uppercase tracking-wide" {...props} />,
          td: ({ node, ...props }) => <td className="px-3 py-2 border-t border-[#27272f] text-gray-300" {...props} />,
        }}
      >
        {String(children)}
      </ReactMarkdown>
    </div>
  );
}

export default Markdown;
