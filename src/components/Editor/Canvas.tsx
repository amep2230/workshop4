import React from 'react';

const Canvas: React.FC<{ imageUrl: string | null }> = ({ imageUrl }) => {
    return (
        <div className="canvas-container">
            {imageUrl ? (
                <img src={imageUrl} alt="Generated" className="canvas-image" />
            ) : (
                <p className="canvas-placeholder">No image generated yet.</p>
            )}
        </div>
    );
};

export default Canvas;