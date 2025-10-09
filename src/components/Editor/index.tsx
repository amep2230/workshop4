import React from 'react';
import Canvas from './Canvas';
import Toolbar from './Toolbar';

const Editor: React.FC = () => {
    return (
        <div className="editor">
            <Toolbar />
            <Canvas />
        </div>
    );
};

export default Editor;