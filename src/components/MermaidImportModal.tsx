import React, { useState } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";

interface MermaidImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (mermaidCode: string) => Promise<{ error: string | null }>;
}

// Sample Mermaid diagram for users to try
const EXAMPLE_DIAGRAM = `graph TD
    App[App Component] --> Header[Header]
    App --> Content[Content Area]
    App --> Footer[Footer]
    Content --> ProductList[Product List]
    Content --> ProductDetail[Product Detail]
    ProductList --> ProductCard[Product Card]
    ProductDetail --> useProduct[useProduct Hook]
    ProductDetail --> ProductImage[Product Image]
    ProductDetail --> ProductReviews[Product Reviews]`;

const MermaidImportModal: React.FC<MermaidImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
}) => {
  const [mermaidCode, setMermaidCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleImportClick = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const result = await onImport(mermaidCode);
      setIsLoading(false);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        // Close modal after a short delay on success
        setTimeout(() => {
          handleClose();
        }, 1500);
      }
    } catch (err) {
      setIsLoading(false);
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setMermaidCode("");
    setError(null);
    setIsLoading(false);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[80vh] flex flex-col">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold">Import from Mermaid</h3>
          <button onClick={handleClose} className="hover:bg-muted rounded p-1">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="p-4 flex-1 overflow-auto">
          <p className="text-sm text-muted-foreground mb-4">
            Paste your Mermaid flowchart syntax (e.g., `graph TD; A--&gt;B;`) below. 
            The diagram will be laid out automatically and added to your canvas for editing.
          </p>
          
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Mermaid Diagram Code</label>
            <button
              onClick={() => setMermaidCode(EXAMPLE_DIAGRAM)}
              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              type="button"
            >
              Load Example Diagram
            </button>
          </div>
          
          <textarea
            value={mermaidCode}
            onChange={(e) => setMermaidCode(e.target.value)}
            placeholder={`graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Process 1]
    B -->|No| D[Process 2]
    C --> E[End]
    D --> E`}
            className="w-full min-h-[200px] border rounded p-2 font-mono text-xs resize-none"
            disabled={isLoading || success}
          />
          
          {error && (
            <div className="mt-2 flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          
          {success && (
            <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              <span>Import successful! Closing modal...</span>
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-2">
          <button 
            onClick={handleClose}
            className="px-3 py-2 rounded text-sm bg-muted/50 hover:bg-muted text-foreground"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button 
            onClick={handleImportClick}
            disabled={!mermaidCode.trim() || isLoading || success}
            className="px-3 py-2 rounded text-sm bg-primary/90 hover:bg-primary text-white disabled:opacity-50 disabled:pointer-events-none"
          >
            {isLoading
              ? "Importing..."
              : success
              ? "Success!"
              : "Import Diagram"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MermaidImportModal;