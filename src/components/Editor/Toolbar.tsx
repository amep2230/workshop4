import React from 'react';

const Toolbar: React.FC = () => {
    const handleUndo = () => {
        // Logic for undo action
    };

    const handleRedo = () => {
        // Logic for redo action
    };

    const handleSave = () => {
        // Logic for saving the image
    };

    return (
        <div className="toolbar">
            <button onClick={handleUndo}>Undo</button>
            <button onClick={handleRedo}>Redo</button>
            <button onClick={handleSave}>Save</button>
        </div>
    );
};

export default Toolbar;