import React from 'react';

type CanvasProps = {
    imageUrl?: string | null;
};

const Canvas: React.FC<CanvasProps> = ({ imageUrl = null }) => {
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