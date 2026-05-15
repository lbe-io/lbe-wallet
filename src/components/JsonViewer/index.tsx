import React from 'react';
import './index.css';

interface JsonViewerProps {
  data: object;
}

const JsonViewer: React.FC<JsonViewerProps> = ({ data }) => {
  // Render nested JSON values recursively for inspection output.
  const renderJson = (json: any) => {
    if (Array.isArray(json)) {
      return (
        <div>
          [
          {json.map((item, index) => (
            <div key={index} className="json-viewer-array-item">
              <strong>{index}:</strong> {renderJson(item)}
            </div>
          ))}
          ]
        </div>
      );
    } else if (typeof json === 'object' && json !== null) {
      return (
        <div>
          {Object.entries(json).map(([key, value]) => (
            <div key={key} className="json-viewer-row">
              <strong className="json-viewer-key">{key}:</strong>
              <div className="json-viewer-value">{typeof value === 'object' ? renderJson(value) : String(value)}</div>
            </div>
          ))}
        </div>
      );
    } else {
      return <span>{String(json)}</span>;
    }
  };

  return <div className="json-viewer-root">{renderJson(data)}</div>;
};

export default JsonViewer;
