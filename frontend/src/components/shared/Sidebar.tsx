interface SidebarProps {
  onSuggestionClick: (text: string) => void;
}

const SUGGESTIONS = [
  'What are the suitability requirements for variable annuity recommendations?',
  'What is our firm\'s policy on outside business activities?',
  'What are the continuing education requirements for registered representatives?',
  'How should I handle a customer complaint?',
  'What are the rules around gifts and entertainment?',
];

export function Sidebar({ onSuggestionClick }: SidebarProps) {
  return (
    <aside className="w-72 bg-white border-r border-gray-200 p-4 hidden lg:block overflow-y-auto">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
        Conversation Starters
      </h2>
      <div className="space-y-2">
        {SUGGESTIONS.map((suggestion, i) => (
          <button
            key={i}
            onClick={() => onSuggestionClick(suggestion)}
            className="w-full text-left px-3 py-2.5 text-sm text-gray-700 bg-gray-50
                       rounded-lg hover:bg-primary-50 hover:text-primary-700
                       transition-colors border border-gray-100"
          >
            {suggestion}
          </button>
        ))}
      </div>
      <div className="mt-6 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <h3 className="text-xs font-semibold text-blue-800 uppercase mb-1">Tip</h3>
        <p className="text-xs text-blue-700">
          VCA only answers from uploaded compliance documents. For the best results,
          ask specific questions about policies and regulations.
        </p>
      </div>
    </aside>
  );
}
